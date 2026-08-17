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

// --- leaving Enquiry Received takes BOTH actions ---
check('provisional sign-off ALONE stays in Enquiry Received',
  bucketForEnquiry({ status: 'Pending', provisionalStatus: 'FirstBooking', provisionalAt: 'x' }, false), 'EnquiryReceived');

check('viewing requested without the sign-off stays put too',
  bucketForEnquiry({ status: 'Pending', viewingRequestedAt: 'x' }, false), 'EnquiryReceived');

check('sign-off + viewing requested → Awaiting Viewing',
  bucketForEnquiry({ status: 'Pending', provisionalStatus: 'FirstBooking', provisionalAt: 'x', viewingRequestedAt: 'x' }, false), 'AwaitingViewing');

check('a completed review still is not enough on its own',
  bucketForEnquiry({ status: 'Reviewed', provisionalStatus: 'FirstBooking', provisionalAt: 'x' }, false), 'EnquiryReceived');

check('viewing marked complete → Visit Complete',
  bucketForEnquiry({ status: 'Reviewed', provisionalStatus: 'FirstBooking', viewingRequestedAt: 'x', viewingCompletedAt: 'x' }, false), 'VisitComplete');

check('agreement sent → Awaiting Hire Agreement',
  bucketForEnquiry({ provisionalStatus: 'FirstBooking', viewingRequestedAt: 'x', viewingCompletedAt: 'x', confirmationStatus: 'Sent' }, false), 'AwaitingAgreement');

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
  bucketForEnquiry({ status: 'NotAvailable', provisionalStatus: 'FirstBooking', viewingRequestedAt: 'x' }, false), null);

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

// Moved to Awaiting Viewing before viewingRequestedAt existed: the security
// team was never emailed, so it returns to Enquiry Received (sign-off intact)
// for the secretary to request the review and viewing.
check('legacy Awaiting Viewing without a viewing request returns to Enquiry Received',
  bucketForEnquiry({ status: 'Pending', provisionalStatus: 'FirstBooking', provisionalAt: 'x' }, false), 'EnquiryReceived');

check('legacy repeat hirer is unaffected by the new gate',
  bucketForEnquiry({ status: 'Pending', provisionalStatus: 'RepeatHirer', confirmationStatus: 'Sent' }, false), 'AwaitingAgreement');

console.log('');
let failed = 0;
for (const [ok, name, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${!ok ? ` :: ${detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
