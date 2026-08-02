/**
 * Bucket-derivation tests: every stage of the bookings secretary's workflow,
 * plus the mapping of enquiries created under the old three-column board.
 * Run with: npm run test:buckets
 */
import { bucketForEnquiry } from '../src/lib/booking-buckets';

const results: Array<[boolean, string, string]> = [];
const check = (name: string, got: unknown, want: unknown) =>
  results.push([got === want, name, `got=${got} want=${want}`]);

// --- the new workflow, in order ---
check('new enquiry lands in Enquiry Received',
  bucketForEnquiry({ status: 'Pending' }, false), 'EnquiryReceived');

check('security review requested does not move it',
  bucketForEnquiry({ status: 'Pending', securityReviewRequestedAt: 'x' }, false), 'EnquiryReceived');

check('security review COMPLETE does not move it either',
  bucketForEnquiry({ status: 'Reviewed' }, false), 'EnquiryReceived');

check('provisional (first booking) → Awaiting Viewing',
  bucketForEnquiry({ status: 'Reviewed', provisionalStatus: 'FirstBooking', provisionalAt: 'x' }, false), 'AwaitingViewing');

check('viewing marked complete → Visit Complete',
  bucketForEnquiry({ status: 'Reviewed', provisionalStatus: 'FirstBooking', viewingCompletedAt: 'x' }, false), 'VisitComplete');

check('agreement sent → Awaiting Hire Agreement',
  bucketForEnquiry({ provisionalStatus: 'FirstBooking', viewingCompletedAt: 'x', confirmationStatus: 'Sent' }, false), 'AwaitingAgreement');

check('repeat hirer goes straight to Awaiting Hire Agreement (no viewing)',
  bucketForEnquiry({ status: 'Pending', provisionalStatus: 'RepeatHirer', confirmationStatus: 'Sent' }, false), 'AwaitingAgreement');

check('hirer signed → Hire Confirmed',
  bucketForEnquiry({ confirmationStatus: 'Submitted' }, false), 'HireConfirmed');

check('invoice sent → Invoice Sent',
  bucketForEnquiry({ confirmationStatus: 'Submitted', invoiceSentAt: 'x' }, false), 'InvoiceSent');

check('signed + past hire date → Hire Complete (even when invoiced)',
  bucketForEnquiry({ confirmationStatus: 'Submitted', invoiceSentAt: 'x' }, true), 'HireComplete');

// --- moving the agreement window shut again ---
check("agreement withdrawn ('NotSent') falls back to Visit Complete",
  bucketForEnquiry({ viewingCompletedAt: 'x', confirmationStatus: 'NotSent' }, false), 'VisitComplete');

// --- closed states never appear on the board ---
check('Date/Time Not Available is off the board',
  bucketForEnquiry({ status: 'NotAvailable', provisionalStatus: 'FirstBooking' }, false), null);

check('Rejected is off the board',
  bucketForEnquiry({ status: 'Rejected' }, false), null);

// --- legacy enquiries from the old three-column board ---
check("legacy 'Confirmed' still shows as Hire Confirmed",
  bucketForEnquiry({ status: 'Confirmed' }, false), 'HireConfirmed');

check("legacy 'Confirmed' + past date → Hire Complete",
  bucketForEnquiry({ status: 'Confirmed' }, true), 'HireComplete');

check("legacy 'Reviewed' returns to Enquiry Received (review is a badge now)",
  bucketForEnquiry({ status: 'Reviewed' }, false), 'EnquiryReceived');

check('legacy agreement-sent enquiry maps to Awaiting Hire Agreement',
  bucketForEnquiry({ status: 'Reviewed', confirmationStatus: 'Sent' }, false), 'AwaitingAgreement');

console.log('');
let failed = 0;
for (const [ok, name, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${!ok ? ` :: ${detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
