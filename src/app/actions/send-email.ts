
'use server';

import { formatEnquiryEmail } from '@/ai/flows/format-enquiry-email-flow';
import { formatReviewEmail } from '@/ai/flows/format-review-email-flow';
import { formatCustomerConfirmationEmail } from '@/ai/flows/format-customer-confirmation-email-flow';
import {
  formatHireConfirmationInviteEmail,
  formatHireConfirmationAdminEmail,
  formatHireConfirmationCustomerEmail,
} from '@/ai/flows/format-hire-confirmation-email-flow';
import { Resend } from 'resend';
import { formatUKDate } from '@/lib/utils';
import type { PaymentDetails } from '@/lib/payment-details';

const resend = new Resend(process.env.RESEND_API_KEY);
// Booking process inbox — new enquiries, bookings admin, security review CC.
const ADMIN_EMAIL = 'booking@bishopshullhub.co.uk';
// Post-confirmation / during-hire contact — surfaced to hirers once they're confirmed.
const OPERATIONS_EMAIL = 'operations@bishopshullhub.co.uk';
// Trustees — formal financial decisions (deposit return authorisations).
const TRUSTEES_EMAIL = 'trustees@bishopshullhub.co.uk';

function buildFallbackAdminEmail(enquiryData: any) {
  const displayDate = formatUKDate(enquiryData.dateRequired) || 'TBC';
  const subject = `New Booking Enquiry: ${enquiryData.typeOfEvent || 'Event'} on ${displayDate}`;
  // Every value below comes straight from the public enquiry form, so it has to
  // be escaped before it goes anywhere near the HTML body.
  const h = (v: unknown) => escapeHtml(v == null ? '' : String(v));
  const textBody = `NEW BOOKING ENQUIRY
-------------------
Enquiry ID: ${enquiryData.id}
Submitted:  ${enquiryData.submissionDateTime}

Event:       ${enquiryData.typeOfEvent}
Date:        ${displayDate}
Times:       ${enquiryData.startTime} – ${enquiryData.endTime}
Attendance:  ${enquiryData.estimatedAttendance}

Hirer:             ${enquiryData.name}
Email:             ${enquiryData.emailAddress}
Phone:             ${enquiryData.phoneNumber}
Address:           ${enquiryData.postalAddress}, ${enquiryData.postcode}
Hired before:      ${enquiryData.hiredBefore || 'Not specified'}

Requirements:
${enquiryData.additionalRequirements}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1a4d46; color: #fff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">New Booking Enquiry</h1>
        <p style="margin: 4px 0 0; opacity: 0.85; font-size: 13px;">Enquiry ID: ${h(enquiryData.id)}</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin-top: 0; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Event</h2>
        <p style="margin:4px 0;"><strong>Type:</strong> ${h(enquiryData.typeOfEvent)}</p>
        <p style="margin:4px 0;"><strong>Date:</strong> ${h(displayDate)}</p>
        <p style="margin:4px 0;"><strong>Times:</strong> ${h(enquiryData.startTime)} – ${h(enquiryData.endTime)}</p>
        <p style="margin:4px 0;"><strong>Attendance:</strong> ${h(enquiryData.estimatedAttendance)}</p>

        <h2 style="margin-top: 20px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Hirer</h2>
        <p style="margin:4px 0;"><strong>Name:</strong> ${h(enquiryData.name)}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${h(enquiryData.emailAddress)}</p>
        <p style="margin:4px 0;"><strong>Phone:</strong> ${h(enquiryData.phoneNumber)}</p>
        <p style="margin:4px 0;"><strong>Address:</strong> ${h(enquiryData.postalAddress)}, ${h(enquiryData.postcode)}</p>
        <p style="margin:4px 0;"><strong>Hired before:</strong> ${h(enquiryData.hiredBefore || 'Not specified')}</p>

        <h2 style="margin-top: 20px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Requirements</h2>
        <p style="margin:4px 0; white-space: pre-wrap;">${h(enquiryData.additionalRequirements)}</p>

        <p style="font-size: 12px; color: #64748b; margin-top: 28px; text-align: center;">
          Bishops Hull Hub Automated Booking System
        </p>
      </div>
    </div>`;

  return { subject, htmlBody, textBody };
}

function buildFallbackCustomerEmail(enquiryData: any, faqUrl: string) {
  const displayDate = formatUKDate(enquiryData.dateRequired) || 'TBC';
  const h = (v: unknown) => escapeHtml(v == null ? '' : String(v));
  const subject = `We've received your enquiry — Bishops Hull Hub (${enquiryData.id})`;

  const textBody = `Hello ${enquiryData.name},

Thank you for your booking enquiry for Bishops Hull Hub. We have received it and our volunteer bookings secretary will be in touch, usually within 3 working days.

Your enquiry
------------
Reference:  ${enquiryData.id}
Event:      ${enquiryData.typeOfEvent}
Date:       ${displayDate}
Times:      ${enquiryData.startTime} – ${enquiryData.endTime}
Attendance: ${enquiryData.estimatedAttendance}

Please note this is an enquiry, not a confirmed booking. Your date is not held until the bookings secretary confirms it.

Frequently asked questions: ${faqUrl}
Any questions? Just reply to this email or contact ${ADMIN_EMAIL}.

Bishops Hull Hub`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1a4d46; color: #fff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">Enquiry Received</h1>
        <p style="margin: 4px 0 0; opacity: 0.85; font-size: 13px;">Reference: ${h(enquiryData.id)}</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="margin-top: 0;">Hello ${h(enquiryData.name)},</p>
        <p>Thank you for your booking enquiry for Bishops Hull Hub. Our volunteer bookings secretary will be in touch, usually within 3 working days.</p>

        <h2 style="font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Your enquiry</h2>
        <p style="margin:4px 0;"><strong>Event:</strong> ${h(enquiryData.typeOfEvent)}</p>
        <p style="margin:4px 0;"><strong>Date:</strong> ${h(displayDate)}</p>
        <p style="margin:4px 0;"><strong>Times:</strong> ${h(enquiryData.startTime)} – ${h(enquiryData.endTime)}</p>
        <p style="margin:4px 0;"><strong>Attendance:</strong> ${h(enquiryData.estimatedAttendance)}</p>

        <p style="background-color:#fefce8; border:1px solid #fde68a; border-radius:8px; padding:12px; margin-top:20px; font-size:14px;">
          This is an enquiry, not a confirmed booking — your date is not held until the bookings secretary confirms it.
        </p>

        <p style="margin-top:20px;">
          You may find our <a href="${h(faqUrl)}" style="color:#1a4d46;">frequently asked questions</a> useful in the meantime.
          Any questions? Just reply to this email.
        </p>

        <p style="font-size: 12px; color: #64748b; margin-top: 28px; text-align: center;">
          Bishops Hull Hub
        </p>
      </div>
    </div>`;

  return { subject, htmlBody, textBody };
}

/**
 * Server Action to handle the logic of sending the enquiry email to administrators
 * and a confirmation email to the enquirer.
 */
export async function sendEnquiryEmailAction(enquiryData: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const faqUrl = `${baseUrl}/faq`;

    // Format both bodies up front. Neither AI call may sink the other — the
    // admin notification is the one that must not be lost, since it is how the
    // bookings secretary learns the enquiry exists at all.
    const [adminEmail, customerEmail] = await Promise.all([
      formatEnquiryEmail({ enquiryData }).catch((aiError: any) => {
        console.error('AI formatting failed for admin enquiry email, using fallback:', aiError);
        return buildFallbackAdminEmail(enquiryData);
      }),
      formatCustomerConfirmationEmail({ enquiryData, faqUrl }).catch((aiError: any) => {
        console.error('AI formatting failed for customer confirmation email, using fallback:', aiError);
        return buildFallbackCustomerEmail(enquiryData, faqUrl);
      }),
    ]);

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_api_key_here') {
      const [adminResult, customerResult] = await Promise.allSettled([
        resend.emails.send({
          from: 'Hub Bookings <bookings@bishopshullhub.co.uk>',
          to: ADMIN_EMAIL,
          subject: adminEmail.subject,
          html: adminEmail.htmlBody,
          text: adminEmail.textBody,
        }),
        resend.emails.send({
          from: 'Bishops Hull Hub <noreply@bishopshullhub.co.uk>',
          to: enquiryData.emailAddress,
          subject: customerEmail.subject,
          html: customerEmail.htmlBody,
          text: customerEmail.textBody,
          replyTo: ADMIN_EMAIL,
        }),
      ]);

      // Resend reports delivery problems in the resolved value, not by throwing.
      const failure = (r: PromiseSettledResult<{ error?: { message?: string } | null }>) =>
        r.status === 'rejected'
          ? r.reason?.message || 'send failed'
          : r.value?.error?.message || null;

      const adminError = failure(adminResult);
      const customerError = failure(customerResult);

      if (adminError) console.error('Failed to send admin enquiry email:', adminError);
      if (customerError) console.error('Failed to send customer confirmation email:', customerError);

      return {
        success: !adminError,
        adminEmailSent: !adminError,
        customerEmailSent: !customerError,
        ...(adminError ? { error: adminError } : {}),
      };
    }

    console.log('--- EMAIL SIMULATION ---');
    console.log('To Admin:', ADMIN_EMAIL);
    console.log('Subject:', adminEmail.subject);
    console.log('---');
    console.log('To Customer:', enquiryData.emailAddress);
    console.log('Subject:', customerEmail.subject);

    return { success: true, adminEmailSent: true, customerEmailSent: true };
  } catch (error: any) {
    console.error('Failed to send emails:', error);
    return {
      success: false,
      adminEmailSent: false,
      customerEmailSent: false,
      error: error.message || 'Failed to process emails',
    };
  }
}

/**
 * Server Action to send review requests to the Security Team.
 */
export async function sendSecurityReviewEmailAction(enquiryData: any, securityContacts: any[], baseUrl: string) {
  try {
    if (!securityContacts || securityContacts.length === 0) {
      return { success: false, error: 'No security contacts found. Please add team members in the Security tab.' };
    }

    const reviewUrl = `${baseUrl}/review/${enquiryData.id}`;
    
    // Attempt AI formatting
    let formattedEmail;
    try {
      formattedEmail = await formatReviewEmail({ enquiryData, reviewUrl });
    } catch (aiError: any) {
      console.error('AI Formatting failed, using fallback:', aiError);
      const displayDate = formatUKDate(enquiryData.dateRequired);
      // Enquiry fields are hirer-supplied — escape before embedding in HTML.
      const h = (v: unknown) => escapeHtml(v == null ? '' : String(v));
      formattedEmail = {
        subject: `Security Review Required: ${enquiryData.typeOfEvent} on ${displayDate}`,
        htmlBody: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #1a4d46; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Security Review Requested</h1>
            </div>
            <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
              <p>A new booking enquiry requires your review for safety and appropriateness.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h2 style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Event Details</h2>
                <p><strong>Type:</strong> ${h(enquiryData.typeOfEvent)}</p>
                <p><strong>Date:</strong> ${h(displayDate)}</p>
                <p><strong>Times:</strong> ${h(enquiryData.startTime)} - ${h(enquiryData.endTime)}</p>
                <p><strong>Attendance:</strong> ${h(enquiryData.estimatedAttendance)} people</p>

                <h2 style="margin-top: 20px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Hirer Info</h2>
                <p><strong>Name:</strong> ${h(enquiryData.name)}</p>
                <p><strong>Contact:</strong> ${h(enquiryData.emailAddress)} / ${h(enquiryData.phoneNumber)}</p>
                <p><strong>Requirements:</strong> ${h(enquiryData.additionalRequirements || 'None specified')}</p>
              </div>

              <div style="text-align: center; margin-top: 32px;">
                <a href="${reviewUrl}" style="background-color: #1a4d46; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Review & Approve Event</a>
              </div>
              
              <p style="font-size: 12px; color: #64748b; margin-top: 32px; text-align: center;">
                Bishops Hull Hub Automated Management System
              </p>
            </div>
          </div>
        `,
        textBody: `
SECURITY REVIEW REQUESTED
-------------------------
Event: ${enquiryData.typeOfEvent}
Date: ${displayDate}
Time: ${enquiryData.startTime} - ${enquiryData.endTime}
Hirer: ${enquiryData.name}
Attendance: ${enquiryData.estimatedAttendance}
Requirements: ${enquiryData.additionalRequirements}

Review here: ${reviewUrl}
        `.trim()
      };
    }

    const securityEmails = securityContacts
      .map((c: any) => (c?.email || '').trim())
      .filter((e: string) => e.length > 0);

    if (securityEmails.length === 0) {
      return { success: false, error: 'No security contacts with valid email addresses found.' };
    }

    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('re_your_api_key')) {
      const { error } = await resend.emails.send({
        from: 'Hub Security <bookings@bishopshullhub.co.uk>',
        to: securityEmails,
        cc: [ADMIN_EMAIL],
        subject: formattedEmail.subject,
        html: formattedEmail.htmlBody,
        text: formattedEmail.textBody,
        replyTo: ADMIN_EMAIL,
      });

      if (error) {
        throw new Error(`Resend Error: ${error.message}`);
      }
    } else {
      console.log('--- SECURITY REVIEW EMAIL SIMULATION ---');
      console.log('To Security Contacts:', securityEmails.join(', '));
      console.log('CC Admin:', ADMIN_EMAIL);
      console.log('Subject:', formattedEmail.subject);
      console.log('Review Link:', reviewUrl);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send security email:', error);
    return { success: false, error: error.message || 'Failed to dispatch security emails' };
  }
}

/**
 * Server Action — admin clicks "Send Confirmation": email the hirer a link to /confirm/[id]
 * where they accept the conditions, supply bank details and sign.
 */
export async function sendHireConfirmationInviteAction(enquiryData: any, baseUrl: string) {
  try {
    if (!enquiryData?.emailAddress) {
      return { success: false, error: 'Enquiry has no email address.' };
    }

    const confirmUrl = `${baseUrl}/confirm/${enquiryData.id}`;
    const email = await formatHireConfirmationInviteEmail({ enquiryData, confirmUrl });

    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('re_your_api_key')) {
      const { error } = await resend.emails.send({
        from: 'Bishops Hull Hub <bookings@bishopshullhub.co.uk>',
        to: enquiryData.emailAddress,
        subject: email.subject,
        html: email.htmlBody,
        text: email.textBody,
        replyTo: ADMIN_EMAIL,
      });
      if (error) throw new Error(`Resend Error: ${error.message}`);
    } else {
      console.log('--- HIRE CONFIRMATION INVITE SIMULATION ---');
      console.log('To:', enquiryData.emailAddress);
      console.log('Subject:', email.subject);
      console.log('Confirm Link:', confirmUrl);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send hire confirmation invite:', error);
    return { success: false, error: error.message || 'Failed to send confirmation invite' };
  }
}

/**
 * Server Action — hirer submits the public confirmation form. Sends:
 *  - the signed agreement (with bank details) to the bookings inbox
 *  - a thank-you to the hirer
 * The signature image (data URL) is attached to the admin email as a PNG.
 */
export async function submitHireConfirmationAction(input: {
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
    signatureDataUrl: string;
  };
}) {
  try {
    const { enquiryData, confirmation } = input;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const hireConditionsUrl = `${baseUrl}/hire-agreement`;

    const adminEmail = await formatHireConfirmationAdminEmail({ enquiryData, confirmation });
    const customerEmail = await formatHireConfirmationCustomerEmail({
      enquiryData,
      confirmation: {
        yourName: confirmation.yourName,
        bookingDate: confirmation.bookingDate,
        startTime: confirmation.startTime,
        endTime: confirmation.endTime,
      },
      hireConditionsUrl,
    });

    const signatureBase64 = (confirmation.signatureDataUrl || '').split(',')[1];
    const attachments = signatureBase64
      ? [{ filename: 'signature.png', content: signatureBase64 }]
      : undefined;

    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('re_your_api_key')) {
      const { error: adminErr } = await resend.emails.send({
        from: 'Hub Bookings <bookings@bishopshullhub.co.uk>',
        to: ADMIN_EMAIL,
        subject: adminEmail.subject,
        html: adminEmail.htmlBody,
        text: adminEmail.textBody,
        attachments,
        replyTo: confirmation.yourEmail || enquiryData.emailAddress,
      });
      if (adminErr) throw new Error(`Resend Error (admin): ${adminErr.message}`);

      const { error: custErr } = await resend.emails.send({
        from: 'Bishops Hull Hub <noreply@bishopshullhub.co.uk>',
        to: confirmation.yourEmail || enquiryData.emailAddress,
        subject: customerEmail.subject,
        html: customerEmail.htmlBody,
        text: customerEmail.textBody,
        replyTo: ADMIN_EMAIL,
      });
      if (custErr) throw new Error(`Resend Error (customer): ${custErr.message}`);
    } else {
      console.log('--- HIRE CONFIRMATION SUBMITTED SIMULATION ---');
      console.log('Admin email subject:', adminEmail.subject);
      console.log('Customer email subject:', customerEmail.subject);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send hire confirmation emails:', error);
    return { success: false, error: error.message || 'Failed to send confirmation emails' };
  }
}

/**
 * Server Action — admin clicks "Full Deposit Return" or "Deduction" on the
 * Deposit Details panel. Emails the Treasurer with the hirer's bank details
 * and the amount to refund (full or partial, with reason for any deduction).
 */
export async function sendDepositReturnEmailAction(input: {
  enquiryData: any;
  /**
   * Read by the admin client from the enquiry's admin-only `private/payment`
   * doc — it is deliberately absent from `enquiryData`, which is publicly
   * readable by id.
   */
  payment: PaymentDetails | null;
  amount: number;
  fullDeposit: number;
  isFullReturn: boolean;
  reason?: string;
}) {
  try {
    const { enquiryData, payment, amount, fullDeposit, isFullReturn, reason } = input;
    const confirmation: Partial<PaymentDetails> = payment ?? {};
    const deduction = Math.max(0, fullDeposit - amount);
    const hireDate = formatUKDate(enquiryData.dateRequired);

    const subject = isFullReturn
      ? `Deposit Return Authorised: ${enquiryData.name} (£${amount.toFixed(2)})`
      : `Deposit Return with Deduction: ${enquiryData.name} (£${amount.toFixed(2)} of £${fullDeposit.toFixed(2)})`;

    const textBody = `DEPOSIT RETURN AUTHORISATION
----------------------------
Hirer:         ${enquiryData.name}
Event:         ${enquiryData.typeOfEvent}
Hire Date:     ${hireDate}
Times:         ${enquiryData.startTime} – ${enquiryData.endTime}
Enquiry ID:    ${enquiryData.id}

Original Deposit:   £${fullDeposit.toFixed(2)}
Amount to Return:   £${amount.toFixed(2)}
${isFullReturn ? '' : `Deduction:          £${deduction.toFixed(2)}\nReason:             ${reason || 'Not provided'}\n`}
Bank Details
------------
Account Name:    ${confirmation.accountName || 'Not provided'}
Bank Name:       ${confirmation.bankName || 'Not provided'}
Account Number:  ${confirmation.accountNumber || 'Not provided'}
Sort Code:       ${formatSortCode(confirmation.sortCode)}

Hirer Contact:   ${enquiryData.emailAddress} / ${enquiryData.phoneNumber}
`.trim();

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #1a4d46; color: #fff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">Deposit Return Authorisation</h1>
          <p style="margin: 4px 0 0; opacity: 0.85; font-size: 13px;">Enquiry ID: ${enquiryData.id}</p>
        </div>
        <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
          <h2 style="margin-top: 0; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Hire Summary</h2>
          <p style="margin:4px 0;"><strong>Hirer:</strong> ${enquiryData.name}</p>
          <p style="margin:4px 0;"><strong>Event:</strong> ${enquiryData.typeOfEvent}</p>
          <p style="margin:4px 0;"><strong>Hire Date:</strong> ${hireDate}</p>
          <p style="margin:4px 0;"><strong>Times:</strong> ${enquiryData.startTime} – ${enquiryData.endTime}</p>

          <h2 style="margin-top: 20px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Refund</h2>
          <p style="margin:4px 0;"><strong>Original Deposit:</strong> £${fullDeposit.toFixed(2)}</p>
          <p style="margin:4px 0;"><strong>Amount to Return:</strong> <span style="color:#15803d; font-weight:bold;">£${amount.toFixed(2)}</span></p>
          ${isFullReturn ? '' : `
            <p style="margin:4px 0;"><strong>Deduction:</strong> £${deduction.toFixed(2)}</p>
            <p style="margin:4px 0;"><strong>Reason:</strong> ${escapeHtml(reason || 'Not provided')}</p>
          `}

          <h2 style="margin-top: 20px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Bank Details</h2>
          <p style="margin:4px 0;"><strong>Account Name:</strong> ${escapeHtml(confirmation.accountName || 'Not provided')}</p>
          <p style="margin:4px 0;"><strong>Bank Name:</strong> ${escapeHtml(confirmation.bankName || 'Not provided')}</p>
          <p style="margin:4px 0;"><strong>Account Number:</strong> ${escapeHtml(confirmation.accountNumber || 'Not provided')}</p>
          <p style="margin:4px 0;"><strong>Sort Code:</strong> ${escapeHtml(formatSortCode(confirmation.sortCode))}</p>

          <h2 style="margin-top: 20px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Hirer Contact</h2>
          <p style="margin:4px 0;">${escapeHtml(enquiryData.emailAddress || '')} / ${escapeHtml(enquiryData.phoneNumber || '')}</p>

          <p style="font-size: 12px; color: #64748b; margin-top: 28px; text-align: center;">
            Bishops Hull Hub Automated Booking System
          </p>
        </div>
      </div>`;

    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('re_your_api_key')) {
      const { error } = await resend.emails.send({
        from: 'Hub Bookings <bookings@bishopshullhub.co.uk>',
        to: TRUSTEES_EMAIL,
        subject,
        html: htmlBody,
        text: textBody,
        replyTo: ADMIN_EMAIL,
      });
      if (error) throw new Error(`Resend Error: ${error.message}`);
    } else {
      console.log('--- DEPOSIT RETURN EMAIL SIMULATION ---');
      console.log('To Trustees:', TRUSTEES_EMAIL);
      console.log('Subject:', subject);
      console.log(textBody);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send deposit return email:', error);
    return { success: false, error: error.message || 'Failed to send deposit return email' };
  }
}

function formatSortCode(sortCode?: string) {
  if (!sortCode) return 'Not provided';
  const digits = sortCode.replace(/\D/g, '');
  if (digits.length !== 6) return sortCode;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
