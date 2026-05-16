import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { checkAvailabilityAction } from '@/app/actions/check-availability';

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
      status: z.enum(['available', 'clash', 'error']),
      clashes: z
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
    return checkAvailabilityAction(date, startTime, endTime);
  }
);

// Field schema mirrors src/app/hire/page.tsx so chat-submitted enquiries
// are interchangeable with form-submitted ones.
const HireEnquiryFieldsSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  postalAddress: z.string().min(5),
  postcode: z.string().min(5),
  preferredContact: z.enum(['Email', 'Phone']),
  dateRequired: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
  typeOfEvent: z.string().min(2),
  estimatedAttendance: z.number().int().min(1).max(110),
  additionalRequirements: z.string().optional(),
  acknowledgedPolicies: z.boolean(),
  agreedToTerms: z.boolean(),
});

const PreparedEnquiryPayloadSchema = z.object({
  name: z.string(),
  emailAddress: z.string(),
  phoneNumber: z.string(),
  postalAddress: z.string(),
  postcode: z.string(),
  preferredContact: z.enum(['Email', 'Phone']),
  dateRequired: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  typeOfEvent: z.string(),
  estimatedAttendance: z.number(),
  additionalRequirements: z.string(),
  source: z.literal('chat'),
});

const PrepareHireEnquiryOutputSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('ready'),
    enquiryPayload: PreparedEnquiryPayloadSchema,
  }),
  z.object({
    status: z.literal('clash'),
    clashes: z.array(
      z.object({ summary: z.string(), start: z.string(), end: z.string() })
    ),
    message: z.string(),
  }),
  z.object({
    status: z.literal('validation_error'),
    errors: z.array(z.string()),
  }),
  z.object({
    status: z.literal('availability_error'),
    message: z.string(),
  }),
]);

export type PreparedEnquiryPayload = z.infer<typeof PreparedEnquiryPayloadSchema>;

const prepareHireEnquiryTool = ai.defineTool(
  {
    name: 'prepareHireEnquiry',
    description:
      "Validate a complete hire enquiry and re-check availability against the live calendar. Call this ONLY when (a) you have collected EVERY required field, (b) the user has confirmed all the details are correct, and (c) the user has explicitly agreed to acknowledgedPolicies and agreedToTerms. If status is 'ready', the host application will submit the enquiry. If status is 'clash', you MUST NOT retry — tell the user the slot is unavailable and direct them to the schedule. If status is 'validation_error', ask the user to correct the specific fields and call this tool again once fixed.",
    inputSchema: HireEnquiryFieldsSchema,
    outputSchema: PrepareHireEnquiryOutputSchema,
  },
  async (fields) => {
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
      if (requestedDate < minDate) {
        errors.push('Bookings must be at least 14 days in advance. Please choose a later date.');
      }
    } catch {
      errors.push('Date could not be parsed — please reconfirm in YYYY-MM-DD format.');
    }

    // End strictly after start
    if (fields.endTime <= fields.startTime) {
      errors.push('End time must be after start time.');
    }

    if (errors.length > 0) {
      return { status: 'validation_error' as const, errors };
    }

    // Defence in depth — re-check availability immediately before preparing the
    // payload so a race between the earlier check and submission still blocks
    // a colliding booking.
    const availability = await checkAvailabilityAction(
      fields.dateRequired,
      fields.startTime,
      fields.endTime
    );

    if (availability.status === 'clash') {
      return {
        status: 'clash' as const,
        clashes: availability.clashes,
        message:
          'This slot now conflicts with an existing booking. Do NOT submit. Tell the user to check the live schedule at /hire#booking-form and choose another slot.',
      };
    }

    if (availability.status === 'error') {
      return {
        status: 'availability_error' as const,
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
      preferredContact: fields.preferredContact,
      dateRequired: fields.dateRequired,
      startTime: fields.startTime,
      endTime: fields.endTime,
      typeOfEvent: fields.typeOfEvent,
      estimatedAttendance: fields.estimatedAttendance,
      additionalRequirements: fields.additionalRequirements?.trim() || 'None provided',
      source: 'chat',
    };

    return { status: 'ready' as const, enquiryPayload };
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
    const response = await ai.generate({
      system: systemPrompt,
      messages: history,
      prompt: userMessage,
      tools: [checkAvailabilityTool, prepareHireEnquiryTool],
    });

    // Find the latest prepareHireEnquiry tool response in this turn's
    // message history; if it returned status:'ready', we surface the
    // prepared payload so the client can perform the Firestore write
    // using the visitor's existing anonymous auth context (same path
    // the form uses).
    let submission: PreparedEnquiryPayload | undefined;
    for (const msg of response.messages ?? []) {
      for (const part of msg.content ?? []) {
        const toolResponse = (part as { toolResponse?: { name?: string; output?: unknown } })
          .toolResponse;
        if (toolResponse?.name === 'prepareHireEnquiry') {
          const out = toolResponse.output as { status?: string; enquiryPayload?: PreparedEnquiryPayload };
          if (out?.status === 'ready' && out.enquiryPayload) {
            submission = out.enquiryPayload;
          }
        }
      }
    }

    return { response: response.text, submission };
  }
);
