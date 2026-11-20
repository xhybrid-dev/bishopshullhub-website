'use server';
/**
 * @fileOverview An AI flow to format a booking viewing request email for the hall team.
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
  subject: z.string().describe("A friendly subject line of the form 'Booking Viewing Request: <event> on <date>'. Must not contain the words 'security' or 'review'."),
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
      prompt: `You are the Bishops Hull Hub Administrative Assistant.
      Write a warm, accommodating "Booking Viewing Request" email to the hall team. The team
      forwards it on to the hirer's contact, so it must never sound like a security check,
      vetting or approval of the hirer. Do not use the words "security" or "vetting".

      Use exactly this structure:
      1. Heading: "Booking Viewing Request"
      2. "Dear Team,"
      3. "A new event booking enquiry has been submitted and requires your review to contact the hirer for the Bishops Hull Hub."
      4. An "Event Details" section listing EVERY detail from the enquiry below, ending with
         "Viewing Completed At: " followed by the viewingCompletedAt date, or "Not completed" if empty.
      5. "Please review all details carefully and contact the hirer using the details below."
      6. A prominent "Review & Approve Event" button linking to: ${input.reviewUrl}
      7. Sign-off: "Thank you," then "Bishops Hull Hub Administrative Assistant"
      8. A matching plain text version.

      Event Data:
      ${JSON.stringify(displayData, null, 2)}

      Important: render every date in UK format DD-MM-YYYY (day-month-year). Do not reorder to YYYY-MM-DD or US MM/DD/YYYY style.
${input.includeViewingRequest ? `
      Important: do NOT add a separate "arrange a viewing" section or list the hirer's contact
      details as a call to action. A separate "Please arrange a viewing" section is appended to
      your output automatically, and repeating it reads as a duplicate.` : ''}`,
      output: { schema: FormatReviewEmailOutputSchema },
    });
    return output!;
  }
);
