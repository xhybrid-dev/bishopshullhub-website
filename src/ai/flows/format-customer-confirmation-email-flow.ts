
'use server';

import { formatUKDate } from '@/lib/utils';

export async function formatCustomerConfirmationEmail(input: { enquiryData: any; faqUrl: string }) {
  const { enquiryData, faqUrl } = input;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const hireConditionsUrl = `${baseUrl}/hire-agreement`;

  const name      = enquiryData.name          || 'there';
  const eventType = enquiryData.typeOfEvent   || 'your event';
  const date      = formatUKDate(enquiryData.dateRequired);
  const startTime = enquiryData.startTime     || '';
  const endTime   = enquiryData.endTime       || '';

  const subject = `Booking Enquiry Received — ${eventType}`;

  const textBody = `Dear ${name},

Thank you for your interest in hiring the Bishops Hull Hub for your event!

We've received your booking request and our booking secretary will be in touch within 3 working days to arrange a visit to the Hub and confirm all arrangements with you.

Here's a summary of the details you submitted:

  Event: ${eventType}
  Date:  ${date}
  Time:  ${startTime} – ${endTime}

In the meantime, you might find our FAQ page helpful for common questions about hiring the Hub:
${faqUrl}

The conditions of hire can be found here:
${hireConditionsUrl}

We look forward to helping you host a successful event at the Bishops Hull Hub!

Warm regards,
The Bishops Hull Hub Team`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background-color:#1a4d46;padding:32px 40px;text-align:center;">
            <p style="margin:0;color:#a3c9a8;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Bishops Hull Hub</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:normal;">Booking Enquiry Received</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;color:#1e293b;line-height:1.7;font-size:16px;">
            <p style="margin:0 0 16px;">Dear ${name},</p>
            <p style="margin:0 0 16px;">Thank you for your interest in hiring the Bishops Hull Hub for your event!</p>
            <p style="margin:0 0 24px;">We've received your booking request and our booking secretary will be in touch within <strong>3 working days</strong> to arrange a visit to the Hub and confirm all arrangements with you.</p>

            <!-- Summary box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;">Your Submission</p>
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;width:60px;">Event</td>
                    <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#1e293b;font-weight:bold;">${eventType}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;">Date</td>
                    <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#1e293b;font-weight:bold;">${date}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;">Time</td>
                    <td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#1e293b;font-weight:bold;">${startTime} – ${endTime}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <p style="margin:0 0 8px;">In the meantime, you might find our <a href="${faqUrl}" style="color:#1a4d46;font-weight:bold;">FAQ page</a> helpful for common questions about hiring the Hub.</p>
            <p style="margin:0 0 24px;">The <a href="${hireConditionsUrl}" style="color:#1a4d46;font-weight:bold;">conditions of hire</a> can also be found on our website.</p>

            <p style="margin:0 0 4px;">We look forward to helping you host a successful event at the Bishops Hull Hub!</p>
          </td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td style="padding:0 40px 36px;color:#1e293b;font-size:16px;line-height:1.7;">
            <p style="margin:0;">Warm regards,</p>
            <p style="margin:4px 0 0;font-weight:bold;">The Bishops Hull Hub Team</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 40px;text-align:center;">
            <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94a3b8;">Bishops Hull Hub &bull; Community Village Hall &bull; Taunton, Somerset</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, htmlBody, textBody };
}
