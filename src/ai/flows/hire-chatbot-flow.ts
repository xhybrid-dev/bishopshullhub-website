import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { checkAvailabilityAction } from '@/app/actions/check-availability';
import { endsByClosing, CLOSING_RULE_TEXT } from '@/lib/venue-hours';

const checkAvailabilityTool = ai.defineTool(
  {
    name: 'checkAvailability',
    description:
      'Check whether the Bishops Hull Hub is available for hire on a specific date and time range. Call this whenever a user asks about availability for a named date, day, or time slot.',
    inputSchema: z.object({
      date: z
        .string()
        .describe('The requested hire date in YYYY-MM-DD format, e.g. "2025-08-15"'),
      startTime: z
        .string()
        .describe('Start time of the requested hire in HH:mm format, e.g. "10:00"'),
      endTime: z
        .string()
        .describe('End time of the requested hire in HH:mm format, e.g. "14:00"'),
    }),
    outputSchema: z.object({
      status: z.enum(['available', 'buffer-warning', 'clash', 'after-hours', 'error']),
      clashes: z
        .array(
          z.object({
            summary: z.string(),
            start: z.string(),
            end: z.string(),
          })
        )
        .optional(),
      adjacent: z
        .array(
          z.object({
            summary: z.string(),
            start: z.string(),
            end: z.string(),
          })
        )
        .optional(),
      message: z.string().optional(),
    }),
  },
  async ({ date, startTime, endTime }) => {
    try {
      const result = await checkAvailabilityAction(date, startTime, endTime);
      // Flatten the discriminated union into the tool's flat schema so the
      // Gemini-Genkit roundtrip can serialise it cleanly.
      switch (result.status) {
        case 'clash':
          return { status: 'clash' as const, clashes: result.clashes };
        case 'buffer-warning':
          return { status: 'buffer-warning' as const, adjacent: result.adjacent };
        case 'after-hours':
          return { status: 'after-hours' as const, message: result.message };
        case 'error':
          return { status: 'error' as const, message: result.message };
        case 'available':
        default:
          return { status: 'available' as const };
      }
    } catch (err) {
      console.error('[chatbot] checkAvailability tool failure:', err);
      return { status: 'error' as const, message: 'Could not reach the live calendar right now.' };
    }
  }
);

// Gemini's function calling occasionally emits scalars as strings ("50",
// "true", "yes") even when the schema declares them as numbers/booleans.
// These preprocessors absorb those cases so the schema doesn't reject a
// completed enquiry over a JSON serialisation quirk.
const looseBoolean = () =>
  z.preprocess((v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const s = v.toLowerCase().trim();
      if (['true', 'yes', 'y', '1', 'agree', 'agreed', 'accept', 'accepted', 'confirm', 'confirmed'].includes(s)) return true;
      if (['false', 'no', 'n', '0', 'decline', 'declined'].includes(s)) return false;
    }
    return v;
  }, z.boolean());

const looseInt = (min: number, max: number) =>
  z.preprocess((v) => {
    if (typeof v === 'number') return Math.trunc(v);
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^0-9.-]/g, '').trim();
      const n = parseInt(cleaned, 10);
      return Number.isFinite(n) ? n : v;
    }
    return v;
  }, z.number().int().min(min).max(max));

// Field schema mirrors src/app/hire/page.tsx so chat-submitted enquiries
// are interchangeable with form-submitted ones.
const HireEnquiryFieldsSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  postalAddress: z.string().min(5),
  postcode: z.string().min(5),
  hiredBefore: z.enum(['Yes', 'No']),
  dateRequired: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
  typeOfEvent: z.string().min(2),
  estimatedAttendance: looseInt(1, 110),
  additionalRequirements: z.string().optional(),
  acknowledgedPolicies: looseBoolean(),
  agreedToTerms: looseBoolean(),
});

const PreparedEnquiryPayloadSchema = z.object({
  name: z.string(),
  emailAddress: z.string(),
  phoneNumber: z.string(),
  postalAddress: z.string(),
  postcode: z.string(),
  hiredBefore: z.enum(['Yes', 'No']),
  dateRequired: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  typeOfEvent: z.string(),
  estimatedAttendance: z.number(),
  additionalRequirements: z.string(),
  source: z.literal('chat'),
});

// Flat output schema (no discriminated union) for maximum compatibility
// with the Gemini-to-Genkit JSON roundtrip. The `status` field tells the
// caller (and the model) which other fields are populated.
const PrepareHireEnquiryOutputSchema = z.object({
  status: z.enum(['ready', 'clash', 'validation_error', 'availability_error', 'internal_error']),
  enquiryPayload: PreparedEnquiryPayloadSchema.optional(),
  clashes: z
    .array(z.object({ summary: z.string(), start: z.string(), end: z.string() }))
    .optional(),
  errors: z.array(z.string()).optional(),
  message: z.string().optional(),
});

export type PreparedEnquiryPayload = z.infer<typeof PreparedEnquiryPayloadSchema>;
type PrepareHireEnquiryOutput = z.infer<typeof PrepareHireEnquiryOutputSchema>;

const prepareHireEnquiryTool = ai.defineTool(
  {
    name: 'prepareHireEnquiry',
    description:
      "Validate a complete hire enquiry and re-check availability against the live calendar. Call this ONLY when (a) you have collected EVERY required field, (b) the user has confirmed all the details are correct, and (c) the user has explicitly agreed to acknowledgedPolicies and agreedToTerms. If status is 'ready', the host application will submit the enquiry. If status is 'clash', you MUST NOT retry — tell the user the slot is unavailable and direct them to the schedule. If status is 'validation_error', ask the user to correct the specific fields and call this tool again once fixed.",
    inputSchema: HireEnquiryFieldsSchema,
    outputSchema: PrepareHireEnquiryOutputSchema,
  },
  async (fields): Promise<PrepareHireEnquiryOutput> => {
    try {
      const errors: string[] = [];

      if (!fields.acknowledgedPolicies) {
        errors.push('User has not confirmed they acknowledge the Hub policies (no fireworks, no dogs, no weddings, bouncy castle rules).');
      }
      if (!fields.agreedToTerms) {
        errors.push('User has not agreed to the Standard Conditions of Hire.');
      }

      // 14-day advance notice rule
      try {
        const requestedDate = new Date(`${fields.dateRequired}T00:00:00`);
        const minDate = new Date();
        minDate.setHours(0, 0, 0, 0);
        minDate.setDate(minDate.getDate() + 14);
        if (Number.isNaN(requestedDate.getTime())) {
          errors.push('Date could not be parsed — please reconfirm in YYYY-MM-DD format.');
        } else if (requestedDate < minDate) {
          errors.push('Bookings must be at least 14 days in advance. Please choose a later date.');
        }
      } catch {
        errors.push('Date could not be parsed — please reconfirm in YYYY-MM-DD format.');
      }

      // End strictly after start
      if (fields.endTime <= fields.startTime) {
        errors.push('End time must be after start time.');
      }

      // Closing-time policy
      if (!endsByClosing(fields.dateRequired, fields.endTime)) {
        errors.push(`The requested end time is past the venue's closing time. ${CLOSING_RULE_TEXT} Please ask for an earlier end time.`);
      }

      if (errors.length > 0) {
        return { status: 'validation_error', errors };
      }

      // Defence in depth — re-check availability immediately before preparing
      // the payload so a race between the earlier check and submission still
      // blocks a colliding booking.
      let availability;
      try {
        availability = await checkAvailabilityAction(
          fields.dateRequired,
          fields.startTime,
          fields.endTime
        );
      } catch (err) {
        console.error('[chatbot] prepareHireEnquiry availability check threw:', err);
        return {
          status: 'availability_error',
          message:
            'The live calendar could not be reached. Ask the user to try again shortly, or submit via the website form at /hire#booking-form.',
        };
      }

      if (availability.status === 'clash') {
        return {
          status: 'clash',
          clashes: availability.clashes,
          message:
            'This slot now conflicts with an existing booking. Do NOT submit. Tell the user to check the live schedule at /hire#booking-form and choose another slot.',
        };
      }

      if (availability.status === 'after-hours') {
        return { status: 'validation_error', errors: [availability.message] };
      }

      if (availability.status === 'error') {
        return {
          status: 'availability_error',
          message:
            'The live calendar could not be reached. Ask the user to try again shortly, or submit via the website form at /hire#booking-form.',
        };
      }

      const enquiryPayload: PreparedEnquiryPayload = {
        name: fields.name,
        emailAddress: fields.email,
        phoneNumber: fields.phone,
        postalAddress: fields.postalAddress,
        postcode: fields.postcode,
        hiredBefore: fields.hiredBefore,
        dateRequired: fields.dateRequired,
        startTime: fields.startTime,
        endTime: fields.endTime,
        typeOfEvent: fields.typeOfEvent,
        estimatedAttendance: fields.estimatedAttendance,
        additionalRequirements: fields.additionalRequirements?.trim() || 'None provided',
        source: 'chat',
      };

      return { status: 'ready', enquiryPayload };
    } catch (err) {
      console.error('[chatbot] prepareHireEnquiry tool threw unexpectedly:', err);
      return {
        status: 'internal_error',
        message:
          'An unexpected error occurred preparing the enquiry. Apologise to the user and ask them to use the website form at /hire#booking-form.',
      };
    }
  }
);

const HireChatbotInputSchema = z.object({
  systemPrompt: z.string(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.array(z.object({ text: z.string() })),
    })
  ),
  userMessage: z.string(),
});

const HireChatbotOutputSchema = z.object({
  response: z.string(),
  submission: PreparedEnquiryPayloadSchema.optional(),
});

export type HireChatbotInput = z.infer<typeof HireChatbotInputSchema>;
export type HireChatbotOutput = z.infer<typeof HireChatbotOutputSchema>;

export const hireChatbotFlow = ai.defineFlow(
  {
    name: 'hireChatbotFlow',
    inputSchema: HireChatbotInputSchema,
    outputSchema: HireChatbotOutputSchema,
  },
  async ({ systemPrompt, history, userMessage }) => {
    let response;
    try {
      response = await ai.generate({
        system: systemPrompt,
        messages: history,
        prompt: userMessage,
        tools: [checkAvailabilityTool, prepareHireEnquiryTool],
      });
    } catch (err) {
      console.error('[chatbot] ai.generate failed:', err);
      return {
        response:
          "I'm having trouble reaching the booking assistant right now. Please try again in a moment, or email booking@bishopshullhub.co.uk for booking enquiries.",
      };
    }

    // Find the latest prepareHireEnquiry tool response in this turn's
    // message history; if it returned status:'ready', we surface the
    // prepared payload so the client can perform the Firestore write
    // using the visitor's existing anonymous auth context (same path
    // the form uses).
    let submission: PreparedEnquiryPayload | undefined;
    try {
      for (const msg of response.messages ?? []) {
        for (const part of msg.content ?? []) {
          const toolResponse = (part as { toolResponse?: { name?: string; output?: unknown } })
            .toolResponse;
          if (toolResponse?.name === 'prepareHireEnquiry') {
            const out = toolResponse.output as
              | { status?: string; enquiryPayload?: PreparedEnquiryPayload }
              | undefined;
            if (out?.status === 'ready' && out.enquiryPayload) {
              submission = out.enquiryPayload;
            }
          }
        }
      }
    } catch (err) {
      console.error('[chatbot] failed to extract submission from tool messages:', err);
    }

    const text = response.text?.trim();
    return {
      response:
        text ||
        (submission
          ? 'Submitting your enquiry now…'
          : "Sorry, I didn't catch that — could you rephrase?"),
      submission,
    };
  }
);
