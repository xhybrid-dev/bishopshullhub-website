'use server';
/**
 * @fileOverview An AI flow to format booking enquiries into a professional email body.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { formatUKDate } from '@/lib/utils';

const FormatEnquiryEmailInputSchema = z.object({
  enquiryData: z.any().describe('The full enquiry data object from the booking form.'),
});

const FormatEnquiryEmailOutputSchema = z.object({
  subject: z.string().describe('A professional subject line for the email.'),
  htmlBody: z.string().describe('A well-formatted HTML body for the email.'),
  textBody: z.string().describe('A plain text version of the email body.'),
});

export async function formatEnquiryEmail(input: { enquiryData: any }) {
  return formatEnquiryEmailFlow(input);
}

const formatEnquiryEmailFlow = ai.defineFlow(
  {
    name: 'formatEnquiryEmailFlow',
    inputSchema: FormatEnquiryEmailInputSchema,
    outputSchema: FormatEnquiryEmailOutputSchema,
  },
  async (input) => {
    // Pre-format the date to DD-MM-YYYY so the LLM emits it in UK order.
    const displayData = {
      ...input.enquiryData,
      dateRequired: formatUKDate(input.enquiryData?.dateRequired) || input.enquiryData?.dateRequired,
    };
    const { output } = await ai.generate({
      prompt: `You are an administrative assistant for the Bishops Hull Hub.
      Format the following booking enquiry into a professional email for the bookings secretary.

      Enquiry Details:
      ${JSON.stringify(displayData, null, 2)}

      Provide:
      1. A clear subject line including the event type and date.
      2. A professional HTML body with clear sections.
      3. A matching plain text body.

      Important: render every date in UK format DD-MM-YYYY (day-month-year). Do not reorder or convert to YYYY-MM-DD or US MM/DD/YYYY style.`,
      output: { schema: FormatEnquiryEmailOutputSchema },
    });
    return output!;
  }
);
