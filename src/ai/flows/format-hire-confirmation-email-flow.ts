'use server';

import { SITE_CONTACT } from '@/lib/site-contact';

const HIRE_CONDITIONS = [
  'I have read, understood and agree with the terms of the Hire Agreement.',
  'I have read, understood and accept the Hub Privacy Statement.',
  'I understand the requirements of the Fire Procedure and actions to take in the event of a fire.',
  'No cameras or photos to be taken within the venue anytime children or parents are in visible distance from the venue.',
  'I have read and understand the health and safety risk assessment including necessary Covid precautions.',
  'I understand my requirements to clear and tidy all equipment and leave the facility all in a clean state. The key is to be returned to the lock box and the lock box secured.',
  'I understand the booking process, payment terms and cancellation process.',
  'I hold the necessary insurances for my activities within The Hub and understand that the Bishops Hull Hub accepts no liability for injury, loss or damage arising from use and hire of the premises to include the outside area, car park and access however caused.',
  'I shall bring my own way of contacting any emergency services or emergency contacts as the Hub does not provide any phone or internet services.',
  'I am 18 years of age or over and understand that I am responsible for paying all the fees and charges for the hire of the hall. I have read the Conditions of Hall Hire and agree to comply with them. I declare that all information supplied by me is true and correct.',
];

export async function formatHireConfirmationInviteEmail(input: {
  enquiryData: any;
  confirmUrl: string;
}) {
  const { enquiryData, confirmUrl } = input;
  const name = enquiryData.name || 'there';
  const eventType = enquiryData.typeOfEvent || 'your event';
  const date = enquiryData.dateRequired || '';
  const startTime = enquiryData.startTime || '';
  const endTime = enquiryData.endTime || '';

  const subject = `Action Required: Confirm Your Hire — ${eventType} on ${date}`;

  const textBody = `Dear ${name},

Thank you for your booking enquiry for the Bishops Hull Hub. Your event has been reviewed by our Security Team and we're now ready to confirm your hire.

Booking summary:
  Event: ${eventType}
  Date:  ${date}
  Time:  ${startTime} – ${endTime}

To complete your booking, please use the secure link below to:
  • Confirm the booking date and time
  • Read and accept the Conditions of Hire
  • Provide your bank details for the refundable deposit return
  • Sign the agreement electronically

Confirm your hire here:
${confirmUrl}

If you have any questions, please reply to this email.

Warm regards,
Bishops Hull Hub Booking Team
bhhubbookings@gmail.com`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#1a4d46;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#a3c9a8;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Bishops Hull Hub</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:normal;">Confirm Your Hire</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;color:#1e293b;line-height:1.7;font-size:16px;">
          <p style="margin:0 0 16px;">Dear ${name},</p>
          <p style="margin:0 0 16px;">Your booking enquiry has been reviewed by our Security Team and we're now ready to confirm your hire.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 24px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;">Your Booking</p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;width:60px;">Event</td><td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#1e293b;font-weight:bold;">${eventType}</td></tr>
                <tr><td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;">Date</td><td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#1e293b;font-weight:bold;">${date}</td></tr>
                <tr><td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#64748b;">Time</td><td style="padding:4px 0;font-family:Arial,sans-serif;font-size:14px;color:#1e293b;font-weight:bold;">${startTime} – ${endTime}</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:0 0 16px;">To complete your booking, please use the secure link below to confirm the booking, read and accept the Conditions of Hire, provide your bank details for the deposit return, and sign the agreement electronically.</p>
          <p style="text-align:center;margin:28px 0;">
            <a href="${confirmUrl}" style="display:inline-block;background-color:#1a4d46;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-family:Arial,sans-serif;font-size:15px;">Confirm Hire &amp; Provide Details</a>
          </p>
          <p style="margin:0 0 4px;font-size:13px;color:#64748b;">If the button doesn't work, copy and paste this link into your browser:<br><span style="word-break:break-all;color:#1a4d46;">${confirmUrl}</span></p>
        </td></tr>
        <tr><td style="padding:0 40px 36px;color:#1e293b;font-size:16px;line-height:1.7;">
          <p style="margin:0;">Warm regards,</p>
          <p style="margin:4px 0 0;font-weight:bold;">The Bishops Hull Hub Team</p>
        </td></tr>
        <tr><td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 40px;text-align:center;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94a3b8;">Bishops Hull Hub &bull; bhhubbookings@gmail.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, htmlBody, textBody };
}

export async function formatHireConfirmationAdminEmail(input: {
  enquiryData: any;
  confirmation: {
    yourName: string;
    yourEmail: string;
    organisation: string;
    confirmedAt: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    bankName: string;
    accountNumber: string;
    sortCode: string;
    accountName: string;
  };
}) {
  const { enquiryData, confirmation } = input;
  const subject = `Hire Agreement Signed: ${confirmation.yourName} — ${confirmation.bookingDate}`;
  const headerLine = `${confirmation.yourName} has confirmed the hire agreement on ${confirmation.confirmedAt}`;

  const conditionsHtml = HIRE_CONDITIONS
    .map(c => `<li style="margin:0 0 8px;">${c}</li>`)
    .join('');

  const conditionsText = HIRE_CONDITIONS.map((c, i) => `${i + 1}. ${c}`).join('\n');

  const textBody = `${headerLine}

AGREEMENT OF CONDITIONS OF HIRE
================================
Booking on ${confirmation.bookingDate} at ${confirmation.startTime} until ${confirmation.endTime}

Confirmed: ${confirmation.confirmedAt}

If you are in any doubt as to the meaning of any of the Conditions, you must seek clarification from us without delay.

${conditionsText}

Name:         ${confirmation.yourName}
Organisation: ${confirmation.organisation || '—'}
Signed:       (see attached signature image)
Dated:        ${confirmation.confirmedAt}

BANK DETAILS (for deposit return)
---------------------------------
Bank:           ${confirmation.bankName}
Account Number: ${confirmation.accountNumber}
Sort Code:      ${confirmation.sortCode}
Account Name:   ${confirmation.accountName}

Enquiry ID: ${enquiryData.id}`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#1a4d46;color:#fff;padding:24px 32px;">
          <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.8;">Hire Agreement Signed</p>
          <h1 style="margin:6px 0 0;font-size:20px;font-weight:600;">${headerLine}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px;color:#1e293b;line-height:1.6;">
          <h2 style="margin:0 0 8px;font-size:22px;color:#1a4d46;">Agreement of Conditions of Hire</h2>
          <p style="margin:0 0 6px;"><strong>Booking on ${confirmation.bookingDate}</strong> at ${confirmation.startTime} until ${confirmation.endTime}</p>
          <h3 style="margin:18px 0 6px;font-size:15px;color:#1a4d46;">${confirmation.confirmedAt}</h3>
          <p style="margin:0 0 14px;font-size:14px;">If you are in any doubt as to the meaning of any of the Conditions, you must seek clarification from us without delay.</p>
          <ol style="margin:0 0 18px 18px;padding:0;font-size:14px;color:#334155;">
            ${conditionsHtml}
          </ol>
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin:0 0 18px;">
            <tr><td style="padding:14px 18px;font-size:14px;">
              <p style="margin:0 0 4px;"><strong>Name:</strong> ${confirmation.yourName}</p>
              ${confirmation.organisation ? `<p style="margin:0 0 4px;"><strong>Organisation:</strong> ${confirmation.organisation}</p>` : ''}
              <p style="margin:0 0 4px;"><strong>Signed:</strong> (signature image attached)</p>
              <p style="margin:0;"><strong>Dated:</strong> ${confirmation.confirmedAt}</p>
            </td></tr>
          </table>
          <h3 style="margin:18px 0 8px;font-size:15px;color:#1a4d46;">Bank Details (for deposit return)</h3>
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;">
            <tr><td style="padding:14px 18px;font-size:14px;">
              <p style="margin:0 0 4px;"><strong>Bank:</strong> ${confirmation.bankName}</p>
              <p style="margin:0 0 4px;"><strong>Account Number:</strong> ${confirmation.accountNumber}</p>
              <p style="margin:0 0 4px;"><strong>Sort Code:</strong> ${confirmation.sortCode}</p>
              <p style="margin:0;"><strong>Account Name:</strong> ${confirmation.accountName}</p>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;">Enquiry ID: ${enquiryData.id} &bull; Bishops Hull Hub</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, htmlBody, textBody };
}

export async function formatHireConfirmationCustomerEmail(input: {
  enquiryData: any;
  confirmation: { yourName: string; bookingDate: string; startTime: string; endTime: string };
  hireConditionsUrl: string;
}) {
  const { enquiryData, confirmation, hireConditionsUrl } = input;
  const subject = `Booking Confirmed — ${confirmation.bookingDate} at the Bishops Hull Hub`;

  const conditionsHtml = HIRE_CONDITIONS
    .map(c => `<li style="margin:0 0 8px;">${c}</li>`)
    .join('');
  const conditionsText = HIRE_CONDITIONS.map((c, i) => `${i + 1}. ${c}`).join('\n');

  const textBody = `Dear ${confirmation.yourName},

Thank you for confirming your hire for the Bishops Hull Hub on ${confirmation.bookingDate} at ${confirmation.startTime}. We really hope you enjoy your use of our community facility. We will confirm your booking now and arrange your invoice for payment.

If you are in any doubt as to the meaning of any of the Conditions, you must seek clarification from us without delay.

${conditionsText}

You can read the full conditions of hire here:
${hireConditionsUrl}

If you have any questions or queries please get in contact.

----------------------------------------
SITE CONTACT — DURING YOUR HIRE
${SITE_CONTACT.name}: ${SITE_CONTACT.displayPhone}
For any on-site issues during your hire (access, facilities, anything urgent).
${SITE_CONTACT.notForBookings}.
----------------------------------------

Kind regards,
Bishops Hull Hub
Booking enquiries: bhhubbookings@gmail.com`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#1a4d46;padding:32px 40px;text-align:center;">
          <p style="margin:0;color:#a3c9a8;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;">Bishops Hull Hub</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:normal;">Booking Confirmed</h1>
        </td></tr>
        <tr><td style="padding:36px 40px;color:#1e293b;line-height:1.7;font-size:16px;">
          <p style="margin:0 0 16px;">Dear ${confirmation.yourName},</p>
          <p style="margin:0 0 16px;">Thank you for confirming your hire for the Bishops Hull Hub on <strong>${confirmation.bookingDate}</strong> at <strong>${confirmation.startTime}</strong>. We really hope you enjoy your use of our community facility. We will confirm your booking now and arrange your invoice for payment.</p>
          <p style="margin:0 0 14px;">If you are in any doubt as to the meaning of any of the Conditions, you must seek clarification from us without delay.</p>
          <ol style="margin:0 0 18px 18px;padding:0;font-size:14px;color:#334155;">
            ${conditionsHtml}
          </ol>
          <p style="margin:0 0 18px;">The full <a href="${hireConditionsUrl}" style="color:#1a4d46;font-weight:bold;">conditions of hire</a> can also be found on our website.</p>
          <p style="margin:0 0 4px;">If you have any questions or queries please get in contact.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7;border:2px solid #fcd34d;border-radius:8px;margin:24px 0 0;">
            <tr><td style="padding:18px 22px;font-family:Arial,sans-serif;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#78350f;">Site Contact — During Your Hire</p>
              <p style="margin:0 0 8px;font-size:14px;color:#451a03;">For any issues on the day (access, facilities, anything on-site), call <strong>${SITE_CONTACT.name}</strong>:</p>
              <p style="margin:0;"><a href="${SITE_CONTACT.telHref}" style="display:inline-block;font-size:20px;font-weight:bold;color:#78350f;text-decoration:none;">${SITE_CONTACT.displayPhone}</a></p>
              <p style="margin:8px 0 0;font-size:11px;font-weight:bold;color:#92400e;">${SITE_CONTACT.notForBookings}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px 36px;color:#1e293b;font-size:16px;line-height:1.7;">
          <p style="margin:0;">Kind regards,</p>
          <p style="margin:4px 0 0;font-weight:bold;">Bishops Hull Hub</p>
          <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Booking enquiries: <a href="mailto:bhhubbookings@gmail.com" style="color:#1a4d46;">bhhubbookings@gmail.com</a></p>
        </td></tr>
        <tr><td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 40px;text-align:center;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#94a3b8;">Bishops Hull Hub &bull; Community Village Hall &bull; Taunton, Somerset</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, htmlBody, textBody };
}
