'use server';
/**
 * @fileOverview An AI flow to format a review request email for the security team.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { formatUKDate } from '@/lib/utils';

const FormatReviewEmailInputSchema = z.object({
  enquiryData: z.any().describe('The full enquiry data object.'),
  reviewUrl: z.string().describe('The absolute URL for the security team to click and mark as reviewed.'),
  includeViewingRequest: z
    .boolean()
    .optional()
    .describe('True for first bookings, where the caller appends its own "arrange a viewing" section.'),
});

const FormatReviewEmailOutputSchema = z.object({
  subject: z.string().describe('A subject line requesting security review.'),
  htmlBody: z.string().describe('A professional HTML body with clear review instructions and a big button.'),
  textBody: z.string().describe('A plain text version.'),
});

export async function formatReviewEmail(input: {
  enquiryData: any;
  reviewUrl: string;
  includeViewingRequest?: boolean;
}) {
  return formatReviewEmailFlow(input);
}

const formatReviewEmailFlow = ai.defineFlow(
  {
    name: 'formatReviewEmailFlow',
    inputSchema: FormatReviewEmailInputSchema,
    outputSchema: FormatReviewEmailOutputSchema,
  },
  async (input) => {
    const displayData = {
      ...input.enquiryData,
      dateRequired: formatUKDate(input.enquiryData?.dateRequired) || input.enquiryData?.dateRequired,
    };
    const { output } = await ai.generate({
      prompt: `You are an automated administrative assistant for the Bishops Hull Hub.
      Format a "Security Review Requested" email for our Security Team.

      The Security Team needs full visibility into the event details to decide if the booking is safe and appropriate for our community hub.

      Please format an email that includes:
      1. A clear subject line including the event and date.
      2. A professional HTML body that lists EVERY detail from the enquiry below.
      3. A prominent "Review & Approve Event" call-to-action button linking to: ${input.reviewUrl}
      4. A matching plain text version.

      Event Data:
      ${JSON.stringify(displayData, null, 2)}

      Ensure the tone is professional, clear, and emphasizes the importance of their review.

      Important: render every date in UK format DD-MM-YYYY (day-month-year). Do not reorder to YYYY-MM-DD or US MM/DD/YYYY style.
${input.includeViewingRequest ? `
      Important: do NOT mention arranging or booking a viewing, and do not add any
      call to action about contacting the hirer. A separate "Please arrange a viewing"
      section is appended to your output automatically, and repeating it reads as a
      duplicate. Cover the security review only.` : ''}`,
      output: { schema: FormatReviewEmailOutputSchema },
    });
    return output!;
  }
);
