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
      history,
      prompt: userMessage,
      tools: [checkAvailabilityTool],
    });
    return { response: response.text };
  }
);
