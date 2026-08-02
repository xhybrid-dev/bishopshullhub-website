/**
 * Booking workflow buckets for the admin dashboard.
 *
 * The bookings secretary's workflow is: create the booking on Hallmaster,
 * send the hire confirmation, send the invoice. The buckets exist so that a
 * glance at the board shows which enquiries are waiting on *them* (Enquiry
 * Received, Visit Complete, Hire Confirmed) and which are waiting on someone
 * else (Awaiting Viewing, Awaiting Hire Agreement, Invoice Sent).
 *
 * Two independent dimensions live on the enquiry document:
 *  - `status` carries the security-review state ('Pending' / 'Reviewed') and
 *    the closed states ('NotAvailable' / 'Rejected'). Completing a security
 *    review does NOT move an enquiry between buckets — it shows as a badge.
 *  - The workflow fields below drive bucket placement.
 *
 * Bucket derivation, in priority order:
 *  - confirmationStatus 'Submitted'  → Hire Confirmed / Invoice Sent
 *    (or Hire Complete once the hire date has passed)
 *  - confirmationStatus 'Sent'       → Awaiting Hire Agreement
 *  - viewingCompletedAt              → Visit Complete
 *  - provisionalStatus 'FirstBooking'→ Awaiting Viewing
 *    ('RepeatHirer' never lands here — that action sends the agreement link,
 *    so the enquiry moves straight to Awaiting Hire Agreement)
 *  - otherwise                       → Enquiry Received
 *
 * Legacy note: under the old three-column board, `status` 'Confirmed' meant
 * "hire confirmed", so it still maps there; 'Reviewed' used to *be* the Visit
 * Complete column, but under the new semantics a reviewed-but-not-booked
 * enquiry belongs in Enquiry Received, so it maps there with its badge.
 */

export type BookingBucket =
  | 'EnquiryReceived'
  | 'AwaitingViewing'
  | 'VisitComplete'
  | 'AwaitingAgreement'
  | 'HireConfirmed'
  | 'InvoiceSent'
  | 'HireComplete';

/** null = closed (Rejected or Date/Time Not Available) — not shown on the board. */
export function bucketForEnquiry(e: any, isPastDate: boolean): BookingBucket | null {
  if (!e) return null;
  if (e.status === 'Rejected' || e.status === 'NotAvailable') return null;

  const submitted = e.confirmationStatus === 'Submitted';
  if ((submitted || e.status === 'Confirmed') && isPastDate) return 'HireComplete';
  if (submitted) return e.invoiceSentAt ? 'InvoiceSent' : 'HireConfirmed';
  if (e.confirmationStatus === 'Sent') return 'AwaitingAgreement';
  if (e.viewingCompletedAt) return 'VisitComplete';
  if (e.provisionalStatus === 'FirstBooking') return 'AwaitingViewing';
  if (e.status === 'Confirmed') return 'HireConfirmed';
  return 'EnquiryReceived';
}

export const BUCKET_LABELS: Record<BookingBucket, string> = {
  EnquiryReceived: 'Enquiry Received',
  AwaitingViewing: 'Awaiting Viewing',
  VisitComplete: 'Visit Complete',
  AwaitingAgreement: 'Awaiting Hire Agreement',
  HireConfirmed: 'Hire Confirmed',
  InvoiceSent: 'Invoice Sent',
  HireComplete: 'Hire Complete',
};
