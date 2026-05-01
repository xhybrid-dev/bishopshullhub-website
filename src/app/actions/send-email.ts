
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

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'bhhubbookings@gmail.com';

function buildFallbackAdminEmail(enquiryData: any) {
  const subject = `New Booking Enquiry: ${enquiryData.typeOfEvent || 'Event'} on ${enquiryData.dateRequired || 'TBC'}`;
  const textBody = `NEW BOOKING ENQUIRY
-------------------
Enquiry ID: ${enquiryData.id}
Submitted:  ${enquiryData.submissionDateTime}

Event:       ${enquiryData.typeOfEvent}
Date:        ${enquiryData.dateRequired}
Times:       ${enquiryData.startTime} – ${enquiryData.endTime}
Attendance:  ${enquiryData.estimatedAttendance}

Hirer:             ${enquiryData.name}
Email:             ${enquiryData.emailAddress}
Phone:             ${enquiryData.phoneNumber}
Address:           ${enquiryData.postalAddress}, ${enquiryData.postcode}
Preferred contact: ${enquiryData.preferredContact}

Requirements:
${enquiryData.additionalRequirements}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1a4d46; color: #fff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">New Booking Enquiry</h1>
        <p style="margin: 4px 0 0; opacity: 0.85; font-size: 13px;">Enquiry ID: ${enquiryData.id}</p>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="margin-top: 0; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Event</h2>
        <p style="margin:4px 0;"><strong>Type:</strong> ${enquiryData.typeOfEvent}</p>
        <p style="margin:4px 0;"><strong>Date:</strong> ${enquiryData.dateRequired}</p>
        <p style="margin:4px 0;"><strong>Times:</strong> ${enquiryData.startTime} – ${enquiryData.endTime}</p>
        <p style="margin:4px 0;"><strong>Attendance:</strong> ${enquiryData.estimatedAttendance}</p>

        <h2 style="margin-top: 20px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Hirer</h2>
        <p style="margin:4px 0;"><strong>Name:</strong> ${enquiryData.name}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${enquiryData.emailAddress}</p>
        <p style="margin:4px 0;"><strong>Phone:</strong> ${enquiryData.phoneNumber}</p>
        <p style="margin:4px 0;"><strong>Address:</strong> ${enquiryData.postalAddress}, ${enquiryData.postcode}</p>
        <p style="margin:4px 0;"><strong>Preferred contact:</strong> ${enquiryData.preferredContact}</p>

        <h2 style="margin-top: 20px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Requirements</h2>
        <p style="margin:4px 0; white-space: pre-wrap;">${enquiryData.additionalRequirements}</p>

        <p style="font-size: 12px; color: #64748b; margin-top: 28px; text-align: center;">
          Bishops Hull Hub Automated Booking System
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

    // 1. Format Admin Notification — fall back to a static template if AI is unavailable
    let adminEmail;
    try {
      adminEmail = await formatEnquiryEmail({ enquiryData });
    } catch (aiError: any) {
      console.error('AI formatting failed for admin enquiry email, using fallback:', aiError);
      adminEmail = buildFallbackAdminEmail(enquiryData);
    }

    // 2. Format and send Customer Confirmation
    const customerEmail = await formatCustomerConfirmationEmail({ enquiryData, faqUrl });

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_api_key_here') {
      // Send to Admin
      await resend.emails.send({
        from: 'Hub Bookings <bookings@bishopshullhub.co.uk>',
        to: ADMIN_EMAIL,
        subject: adminEmail.subject,
        html: adminEmail.htmlBody,
        text: adminEmail.textBody,
      });

      // Send to Customer
      await resend.emails.send({
        from: 'Bishops Hull Hub <noreply@bishopshullhub.co.uk>',
        to: enquiryData.emailAddress,
        subject: customerEmail.subject,
        html: customerEmail.htmlBody,
        text: customerEmail.textBody,
      });
    } else {
      console.log('--- EMAIL SIMULATION ---');
      console.log('To Admin:', ADMIN_EMAIL);
      console.log('Subject:', adminEmail.subject);
      console.log('---');
      console.log('To Customer:', enquiryData.emailAddress);
      console.log('Subject:', customerEmail.subject);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send emails:', error);
    return { success: false, error: error.message || 'Failed to process emails' };
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
      formattedEmail = {
        subject: `Security Review Required: ${enquiryData.typeOfEvent} on ${enquiryData.dateRequired}`,
        htmlBody: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #1a4d46; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Security Review Requested</h1>
            </div>
            <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
              <p>A new booking enquiry requires your review for safety and appropriateness.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h2 style="margin-top: 0; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Event Details</h2>
                <p><strong>Type:</strong> ${enquiryData.typeOfEvent}</p>
                <p><strong>Date:</strong> ${enquiryData.dateRequired}</p>
                <p><strong>Times:</strong> ${enquiryData.startTime} - ${enquiryData.endTime}</p>
                <p><strong>Attendance:</strong> ${enquiryData.estimatedAttendance} people</p>
                
                <h2 style="margin-top: 20px; font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Hirer Info</h2>
                <p><strong>Name:</strong> ${enquiryData.name}</p>
                <p><strong>Contact:</strong> ${enquiryData.emailAddress} / ${enquiryData.phoneNumber}</p>
                <p><strong>Requirements:</strong> ${enquiryData.additionalRequirements || 'None specified'}</p>
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
Date: ${enquiryData.dateRequired}
Time: ${enquiryData.startTime} - ${enquiryData.endTime}
Hirer: ${enquiryData.name}
Attendance: ${enquiryData.estimatedAttendance}
Requirements: ${enquiryData.additionalRequirements}

Review here: ${reviewUrl}
        `.trim()
      };
    }

    const recipients = [ADMIN_EMAIL];

    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('re_your_api_key')) {
      const { error } = await resend.emails.send({
        from: 'Hub Security <security@bishopshullhub.co.uk>',
        to: recipients,
        subject: formattedEmail.subject,
        html: formattedEmail.htmlBody,
        text: formattedEmail.textBody,
      });
      
      if (error) {
        throw new Error(`Resend Error: ${error.message}`);
      }
    } else {
      console.log('--- SECURITY REVIEW EMAIL SIMULATION ---');
      console.log('To Recipient (Restricted Mode):', recipients[0]);
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
