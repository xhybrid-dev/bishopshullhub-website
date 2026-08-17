
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LayoutDashboard, LogOut, Inbox, Mail, Calendar, CalendarDays, ShieldAlert, FileText, CheckCircle2, MoreVertical, Clock3, LayoutGrid, List, MapPin, Users, ChevronDown, ChevronUp, ShieldCheck, Trash2, Send, AlertTriangle, Info, HelpCircle, Plus, Pencil, Save, FileSignature, Banknote, MinusCircle, RefreshCw, MessageSquare, Eye, Receipt, XCircle } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { cn, formatUKDate, formatUKDateTime } from '@/lib/utils';
import { ukDateTimeToInstant } from '@/lib/uk-time';
import { paymentDocRef, readLegacyPaymentDetails, type PaymentDetails } from '@/lib/payment-details';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { sendSecurityReviewEmailAction, sendHireConfirmationInviteAction, sendDepositReturnEmailAction, sendProvisionalFirstBookingEmailAction, sendProvisionalRepeatHirerEmailAction, sendDateNotAvailableEmailAction } from '@/app/actions/send-email';
import { bucketForEnquiry, BUCKET_LABELS, type BookingBucket } from '@/lib/booking-buckets';
import { getLiveCalendarEventsAction, type LiveEvent } from '@/app/actions/get-calendar';
import type { ClashingEvent } from '@/app/actions/check-availability';
import { EnquiryCalendarView } from '@/components/admin/EnquiryCalendarView';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, startOfToday, parseISO, subDays } from 'date-fns';
import { endsByClosing, CLOSING_RULE_TEXT } from '@/lib/venue-hours';

// Bucket columns mirror the bookings secretary's workflow: the amber/blue/green
// ones are "waiting on us" (create the booking, send the confirmation, send the
// invoice); the others are waiting on the hirer or the management team.
const BUCKET_COLUMNS: Array<{ id: BookingBucket; label: string; color: string; icon: any; needsAction?: boolean }> = [
  { id: 'EnquiryReceived', label: 'Enquiry Received', color: 'bg-amber-500', icon: Clock3, needsAction: true },
  { id: 'AwaitingViewing', label: 'Awaiting Viewing', color: 'bg-purple-500', icon: Eye },
  { id: 'VisitComplete', label: 'Visit Complete', color: 'bg-blue-500', icon: FileText, needsAction: true },
  { id: 'AwaitingAgreement', label: 'Awaiting Hire Agreement', color: 'bg-sky-500', icon: FileSignature },
  { id: 'HireConfirmed', label: 'Hire Confirmed', color: 'bg-green-500', icon: CheckCircle2, needsAction: true },
  { id: 'InvoiceSent', label: 'Invoice Sent', color: 'bg-teal-600', icon: Receipt },
  { id: 'HireComplete', label: 'Hire Complete', color: 'bg-slate-500', icon: Calendar },
];

function getDepositAmount(enquiry: any): number {
  const stored = Number(enquiry?.depositAmount ?? enquiry?.confirmation?.depositAmount);
  if (Number.isFinite(stored) && stored > 0) return stored;
  const end = (enquiry?.endTime || '').match(/^(\d{1,2}):/);
  const hour = end ? Number(end[1]) : NaN;
  return Number.isFinite(hour) && hour >= 20 ? 100 : 50;
}

const PRIMARY_ADMIN_EMAIL = 'bishopshullhub@gmail.com';

const FAQ_CAT_COLORS: Record<string, string> = {
  venue: 'hsl(171,44%,38%)', hire: 'hsl(197,55%,42%)', access: 'hsl(43,65%,48%)',
  safety: 'hsl(0,68%,52%)', rules: 'hsl(133,55%,38%)',
};
const FAQ_CAT_LABELS: Record<string, string> = {
  venue: 'The Venue', hire: 'During Your Hire', access: 'Access & Parking',
  safety: 'Safety', rules: 'Rules & Policies',
};
const DEFAULT_FAQS = [
  { cat: 'hire',   q: "How do I contact someone when there's an issue during my hire?",           a: "For any issues during your hire, please call the Duty Manager on 07864 241376. This number is for on-site enquiries only — please do not use it for new bookings.", order: 1 },
  { cat: 'access', q: 'What is the height of the gate height barrier?',                           a: 'The height barrier is 2m high. If you expect vehicles that will exceed this height, please contact the booking manager. For on-the-day access issues, call the Duty Manager on 07864 241376 (site enquiries only — not for new bookings).', order: 2 },
  { cat: 'hire',   q: 'What do I do with any rubbish generated during my hire?',                  a: 'We ask all hirers to take any rubbish generated during their hire away with them to keep the Hub clean for everyone.', order: 3 },
  { cat: 'venue',  q: 'What is the total number of people allowed in the hall?',                  a: 'The maximum capacity for the hall is 110 people.', order: 4 },
  { cat: 'rules',  q: "Is there a 'Premises' licence for the Hub?",                               a: 'No, the Hub does not hold a general premises licence.', order: 5 },
  { cat: 'rules',  q: 'Are dogs allowed on the premises?',                                        a: 'No dogs are allowed on the premises, with the exception of guide and assistant dogs.', order: 6 },
  { cat: 'venue',  q: 'How many tables and chairs are available?',                               a: 'We have 12 tables and approximately 80 chairs available for use in the hall.', order: 7 },
  { cat: 'venue',  q: 'Are other tables available if needed?',                                    a: 'Yes, it is possible to hire additional tables from the Playing Field Trust. Please contact your Hub contact for more information.', order: 8 },
  { cat: 'safety', q: 'Where is the fire assembly point and who is responsible for evacuations?', a: "In the event of a fire or the fire alarm sounding, guests should assemble outside on the playing field. It is the hirer's responsibility to ensure everyone is safely out and to call the fire brigade.", order: 9 },
  { cat: 'venue',  q: 'What is the size and floor space of the Hub?',                             a: 'The main hall is 14.8m long × 9m wide. It features a vaulted sloping roof with a maximum height of 4m.', order: 10 },
  { cat: 'access', q: 'What parking is available?',                                               a: 'There are 18 dedicated parking spaces at the Hub, with additional parking available within the village.', order: 11 },
  { cat: 'venue',  q: 'What external space is available for use?',                                a: 'We have a front south-facing terrace facing the playing field, directly accessible from the main hall. It measures approximately 23m × 2.5m.', order: 12 },
  { cat: 'rules',  q: 'Can we have a bouncy castle in the Hall?',                                 a: 'Yes, provided the equipment is for internal use (to avoid floor damage) and has a limited height to avoid the ceiling lights and projector.', order: 13 },
  { cat: 'rules',  q: 'Can we use stage smoke or dry ice?',                                       a: 'It is not advisable. In certain circumstances, such as warm temperatures, stage smoke can trigger the smoke alarms.', order: 14 },
];

export default function AdminPortal() {
  const { toast } = useToast();
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('enquiries');
  
  const adminDocRef = useMemoFirebase(() => {
    if (!user || user.isAnonymous || !user.email) return null;
    return doc(firestore, 'admins', user.email.toLowerCase());
  }, [firestore, user]);
  
  const { data: adminRecord, isLoading: checkingAdmin } = useDoc(adminDocRef);

  const hasAdminAccess = useMemo(() => {
    if (!user) return false;
    return !!adminRecord || user.email === PRIMARY_ADMIN_EMAIL;
  }, [adminRecord, user]);

  const enquiriesQuery = useMemoFirebase(() => {
    if (!hasAdminAccess) return null;
    return query(collection(firestore, 'booking_enquiries'), orderBy('submissionDateTime', 'desc'));
  }, [firestore, hasAdminAccess]);
  
  const { data: enquiries, isLoading: loadingEnquiries } = useCollection(enquiriesQuery);

  const securityQuery = useMemoFirebase(() => {
    if (!hasAdminAccess) return null;
    return query(collection(firestore, 'security_team'), orderBy('addedAt', 'desc'));
  }, [firestore, hasAdminAccess]);

  const { data: securityContacts, isLoading: loadingSecurity } = useCollection(securityQuery);

  const adminsQuery = useMemoFirebase(() => {
    if (!hasAdminAccess) return null;
    return query(collection(firestore, 'admins'), orderBy('addedAt', 'desc'));
  }, [firestore, hasAdminAccess]);

  const { data: adminUsers, isLoading: loadingAdmins } = useCollection(adminsQuery);

  const [faqItems,    setFaqItems]    = useState<any[] | null>(null);
  const [loadingFaqs, setLoadingFaqs] = useState(false);

  useEffect(() => {
    if (!hasAdminAccess) return;
    setLoadingFaqs(true);
    const q = query(collection(firestore, 'faqs'), orderBy('order', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setFaqItems(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        setLoadingFaqs(false);
      },
      (err) => {
        console.error('FAQs unavailable:', err.message);
        setFaqItems([]);
        setLoadingFaqs(false);
      }
    );
    return () => unsub();
  }, [firestore, hasAdminAccess]);

  // Hide any booking whose event date is more than 2 weeks in the past.
  // The admin dashboard only needs upcoming bookings and recent past hires
  // (e.g. for deposit returns, which are processed within 5 working days).
  const visibleEnquiries = useMemo(() => {
    if (!enquiries) return null;
    const cutoff = subDays(startOfToday(), 14);
    return enquiries.filter(e => {
      if (!e.dateRequired) return true;
      try {
        return parseISO(e.dateRequired) >= cutoff;
      } catch {
        return true;
      }
    });
  }, [enquiries]);

  const depositEnquiries = useMemo(() => {
    if (!visibleEnquiries) return [];
    const today = startOfToday();
    return visibleEnquiries.filter(e => {
      if (e.confirmationStatus !== 'Submitted') return false;
      try {
        return parseISO(e.dateRequired) < today;
      } catch {
        return false;
      }
    }).sort((a, b) => b.dateRequired.localeCompare(a.dateRequired));
  }, [visibleEnquiries]);

  // Pull the live Hallmaster feed once admin access is confirmed,
  // so we can overlay it on the calendar and detect clashes against enquiries.
  // Pass force=true to bypass the 5-minute server cache (used by the manual re-sync button).
  const refreshLiveEvents = async (force = false) => {
    setIsLiveLoading(true);
    const result = await getLiveCalendarEventsAction({ force });
    if (result.success && result.events) {
      setLiveEvents(result.events);
    }
    setIsLiveLoading(false);
    return result;
  };

  useEffect(() => {
    if (!hasAdminAccess) return;
    let cancelled = false;
    setIsLiveLoading(true);
    getLiveCalendarEventsAction().then(result => {
      if (cancelled) return;
      if (result.success && result.events) {
        setLiveEvents(result.events);
      }
      setIsLiveLoading(false);
    });
    return () => { cancelled = true; };
  }, [hasAdminAccess]);

  const handleResyncLive = async () => {
    const result = await refreshLiveEvents(true);
    if (result.success) {
      toast({ title: 'Live calendar synced', description: `Pulled ${result.events?.length ?? 0} event${(result.events?.length ?? 0) === 1 ? '' : 's'} from Hallmaster.` });
    } else {
      toast({ variant: 'destructive', title: 'Sync Failed', description: result.error || 'Could not reach the Hallmaster feed.' });
    }
  };

  // Enquiries that haven't yet been moved into Hallmaster — i.e. everything
  // except the "Hire Complete" column. These are the bookings the manager
  // still needs to track for clashes.
  const activeEnquiries = useMemo(() => {
    if (!visibleEnquiries) return [];
    const today = startOfToday();
    return visibleEnquiries.filter(e => {
      const status = e.status || 'Pending';
      const hirerConfirmed = e.confirmationStatus === 'Submitted';
      let isPast = false;
      try { isPast = parseISO(e.dateRequired) < today; } catch {}
      // Hide HireComplete (logged in Hallmaster already)
      if (hirerConfirmed && isPast) return false;
      if (status === 'Confirmed' && isPast) return false;
      if (status === 'Rejected' || status === 'NotAvailable') return false;
      return true;
    });
  }, [visibleEnquiries]);

  // Build a clash map: { enquiryId: ClashingEvent[] } using the same overlap
  // rule as check-availability (requestedStart < eventEnd && requestedEnd > eventStart).
  const clashMap = useMemo(() => {
    const map: Record<string, ClashingEvent[]> = {};
    if (liveEvents.length === 0) return map;
    activeEnquiries.forEach(e => {
      if (!e.dateRequired || !e.startTime || !e.endTime) return;
      // Resolve in Europe/London rather than the admin's local zone so the
      // clash map matches what check-availability decides on the server.
      const reqStart = ukDateTimeToInstant(e.dateRequired, e.startTime);
      const reqEnd = ukDateTimeToInstant(e.dateRequired, e.endTime);
      if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) return;
      const clashes: ClashingEvent[] = [];
      liveEvents.forEach(ev => {
        const evStart = parseISO(ev.start);
        const evEnd = parseISO(ev.end);
        if (reqStart < evEnd && reqEnd > evStart) {
          clashes.push({ summary: ev.summary, start: ev.start, end: ev.end });
        }
      });
      if (clashes.length > 0) map[e.id] = clashes;
    });
    return map;
  }, [activeEnquiries, liveEvents]);

  const [editingEnquiry, setEditingEnquiry] = useState<any | null>(null);

  // "Provisional Booking Made" — the secretary has created the booking on
  // Hallmaster. First-time hirers get a viewing next; repeat hirers get the
  // hire agreement link straight away.
  const handleProvisionalBooking = async (enquiry: any, kind: 'FirstBooking' | 'RepeatHirer') => {
    const now = new Date().toISOString();
    const docRef = doc(firestore, 'booking_enquiries', enquiry.id);
    // Legacy statuses would otherwise pin the card in the wrong bucket.
    const statusReset = ['Confirmed', 'NotAvailable', 'Rejected'].includes(enquiry.status)
      ? { status: 'Pending' }
      : {};
    try {
      if (kind === 'RepeatHirer') {
        // The emailed agreement link only works once confirmationStatus is
        // 'Sent', so the write has to land before the email goes out.
        await updateDoc(docRef, {
          ...statusReset,
          provisionalStatus: 'RepeatHirer',
          provisionalAt: now,
          confirmationStatus: 'Sent',
          confirmationSentAt: now,
        });
        const result = await sendProvisionalRepeatHirerEmailAction(enquiry, window.location.origin);
        if (result.success) {
          toast({ title: 'Provisional Booking Recorded', description: `${enquiry.name} has been emailed the hire agreement link.` });
        } else {
          toast({ variant: 'destructive', title: 'Email Failed', description: `${result.error || 'Could not send the email.'} The booking has moved to Awaiting Hire Agreement — use Resend Confirmation to retry.` });
        }
        return;
      }

      // First booking: email first, then record — if the email fails nothing
      // has been signed off and the box can simply be ticked again. Ticking
      // does not move the card; requesting the security review does.
      const result = await sendProvisionalFirstBookingEmailAction(enquiry);
      if (!result.success) {
        toast({ variant: 'destructive', title: 'Email Failed', description: result.error || 'Could not send the email. Nothing has been changed — please try again.' });
        return;
      }
      await updateDoc(docRef, {
        ...statusReset,
        provisionalStatus: 'FirstBooking',
        provisionalAt: now,
        viewingCompletedAt: null,
      });
      toast({ title: 'Provisional Booking Signed Off', description: `${enquiry.name} has been emailed. Now request the security review to have the viewing arranged.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message || 'Could not record the provisional booking.' });
    }
  };

  // Unticking the sign-off box — a correction, so no email goes anywhere. Any
  // viewing request already sent is cleared too, or the card would jump
  // straight back to Awaiting Viewing the moment the box was re-ticked.
  const handleClearProvisional = async (enquiry: any) => {
    try {
      await updateDoc(doc(firestore, 'booking_enquiries', enquiry.id), {
        provisionalStatus: null,
        provisionalAt: null,
        viewingRequestedAt: null,
      });
      toast({ title: 'Sign-Off Cleared', description: 'No email was sent. Tick the box again once the booking is on Hallmaster.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message || 'Could not clear the sign-off.' });
    }
  };

  const handleNotAvailable = async (enquiry: any) => {
    try {
      const result = await sendDateNotAvailableEmailAction(enquiry);
      if (!result.success) {
        toast({ variant: 'destructive', title: 'Email Failed', description: result.error || 'Could not send the email. Nothing has been changed — please try again.' });
        return;
      }
      await updateDoc(doc(firestore, 'booking_enquiries', enquiry.id), {
        status: 'NotAvailable',
        notAvailableAt: new Date().toISOString(),
      });
      toast({ title: 'Marked Not Available', description: `${enquiry.name} has been emailed and the enquiry closed. Undo via the card menu in List view if needed.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message || 'Could not close the enquiry.' });
    }
  };

  const handleMarkViewingComplete = async (enquiry: any) => {
    try {
      await updateDoc(doc(firestore, 'booking_enquiries', enquiry.id), {
        viewingCompletedAt: new Date().toISOString(),
      });
      toast({ title: 'Viewing Complete', description: `${enquiry.name} is ready for the hire confirmation.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message || 'Could not update the booking.' });
    }
  };

  const handleMarkInvoiceSent = async (enquiry: any) => {
    try {
      await updateDoc(doc(firestore, 'booking_enquiries', enquiry.id), {
        invoiceSentAt: new Date().toISOString(),
      });
      toast({ title: 'Invoice Marked Sent', description: `${enquiry.name} moved to Invoice Sent.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message || 'Could not update the booking.' });
    }
  };

  // Manual corrections via the card menu — no emails are sent from here.
  const handleMoveBucket = async (enquiry: any, target: string) => {
    const now = new Date().toISOString();
    const updates: Record<string, any> = {};
    const agreementSent = enquiry.confirmationStatus === 'Sent';
    const backward = ['EnquiryReceived', 'AwaitingViewing', 'VisitComplete'].includes(target);

    if (enquiry.confirmationStatus === 'Submitted' && backward) {
      toast({ variant: 'destructive', title: 'Cannot Move', description: 'The hirer has already signed the agreement — use Edit Details to change the booking instead.' });
      return;
    }

    if (['Confirmed', 'NotAvailable', 'Rejected'].includes(enquiry.status) && target !== 'NotAvailable' && target !== 'Rejected') {
      updates.status = 'Pending';
    }

    switch (target) {
      case 'EnquiryReceived':
        Object.assign(updates, {
          provisionalStatus: null,
          provisionalAt: null,
          viewingRequestedAt: null,
          viewingCompletedAt: null,
          invoiceSentAt: null,
          ...(agreementSent ? { confirmationStatus: 'NotSent' } : {}),
        });
        break;
      case 'AwaitingViewing':
        // Both gates have to be set by hand here, since a manual move sends no
        // email — the toast below is explicit that nobody has been told.
        Object.assign(updates, {
          provisionalStatus: 'FirstBooking',
          provisionalAt: enquiry.provisionalAt || now,
          viewingRequestedAt: enquiry.viewingRequestedAt || now,
          viewingCompletedAt: null,
          invoiceSentAt: null,
          ...(agreementSent ? { confirmationStatus: 'NotSent' } : {}),
        });
        break;
      case 'VisitComplete':
        Object.assign(updates, {
          viewingCompletedAt: enquiry.viewingCompletedAt || now,
          invoiceSentAt: null,
          ...(agreementSent ? { confirmationStatus: 'NotSent' } : {}),
        });
        break;
      case 'HireConfirmed': // undo a mistaken "invoice sent"
        updates.invoiceSentAt = null;
        break;
      case 'NotAvailable':
        updates.status = 'NotAvailable';
        break;
      case 'Rejected':
        updates.status = 'Rejected';
        break;
      default:
        return;
    }

    try {
      await updateDoc(doc(firestore, 'booking_enquiries', enquiry.id), updates);
      const label = BUCKET_LABELS[target as BookingBucket] ?? target;
      toast({ title: 'Booking Moved', description: `Moved to ${label}. No email was sent.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message || 'Could not move the booking.' });
    }
  };

  const handleSaveEnquiry = async (enquiryId: string, updates: Record<string, any>) => {
    try {
      const docRef = doc(firestore, 'booking_enquiries', enquiryId);
      await updateDoc(docRef, updates);
      toast({ title: 'Booking Updated', description: 'Details saved successfully.' });
      return true;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message || 'Could not save changes.' });
      return false;
    }
  };

  const handleAcknowledgeSecurityComments = async (enquiryId: string) => {
    try {
      const docRef = doc(firestore, 'booking_enquiries', enquiryId);
      await updateDoc(docRef, {
        securityCommentsAcknowledged: true,
        securityCommentsAcknowledgedAt: new Date().toISOString(),
      });
      toast({ title: 'Comments Acknowledged', description: 'The security note has been marked as actioned.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: err.message || 'Could not acknowledge the security comments.' });
    }
  };

  const handleSendConfirmation = async (enquiry: any) => {
    try {
      const baseUrl = window.location.origin;
      // Mark Sent in Firestore first so the public page can validate the link.
      const docRef = doc(firestore, 'booking_enquiries', enquiry.id);
      await updateDoc(docRef, { confirmationStatus: 'Sent', confirmationSentAt: new Date().toISOString() });

      const result = await sendHireConfirmationInviteAction(enquiry, baseUrl);
      if (result.success) {
        toast({ title: "Confirmation Sent", description: `Hirer ${enquiry.name} has been emailed the confirmation link.` });
      } else {
        toast({ variant: "destructive", title: "Send Failed", description: result.error || "Could not send confirmation email." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Send Failed", description: err.message || "An unexpected error occurred." });
    }
  };

  const handleSendToSecurity = async (enquiry: any) => {
    if (!securityContacts || securityContacts.length === 0) {
      toast({ variant: "destructive", title: "Missing Contacts", description: "Please add security contacts in the Security Team tab first." });
      return;
    }

    // On a first booking this email is also the request to arrange the viewing,
    // so it carries the hirer's contact details and it is what advances the
    // card. Anything else is a plain review that leaves the card where it is.
    const isFirstBooking = enquiry.provisionalStatus === 'FirstBooking';

    try {
      const baseUrl = window.location.origin;
      const result = await sendSecurityReviewEmailAction(enquiry, securityContacts, baseUrl, isFirstBooking);
      if (result.success) {
        const now = new Date().toISOString();
        await updateDoc(doc(firestore, 'booking_enquiries', enquiry.id), {
          // Recorded so the card can show "review requested" — previously there
          // was no way to tell a sent review from an unsent one.
          securityReviewRequestedAt: now,
          ...(isFirstBooking ? { viewingRequestedAt: now } : {}),
        });
        toast({
          title: isFirstBooking ? 'Viewing Requested' : 'Review Sent',
          description: isFirstBooking
            ? 'Security Team has been asked to arrange the viewing. Moved to Awaiting Viewing.'
            : 'Security Team has been notified.',
        });
      } else {
        toast({ variant: "destructive", title: "Send Failed", description: result.error || "Could not dispatch emails." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Send Failed", description: err.message || "An unexpected error occurred." });
    }
  };

  const handleSendDepositReturn = async (
    enquiry: any,
    amount: number,
    isFullReturn: boolean,
    reason: string | undefined,
    payment: PaymentDetails | null
  ) => {
    try {
      const fullDeposit = getDepositAmount(enquiry);
      const result = await sendDepositReturnEmailAction({
        enquiryData: enquiry,
        payment,
        amount,
        fullDeposit,
        isFullReturn,
        reason,
      });
      if (result.success) {
        const docRef = doc(firestore, 'booking_enquiries', enquiry.id);
        await updateDoc(docRef, {
          depositReturn: {
            amount,
            fullDeposit,
            isFullReturn,
            reason: reason || null,
            sentAt: new Date().toISOString(),
          },
        });
        toast({
          title: isFullReturn ? 'Full Deposit Return Sent' : 'Deduction Return Sent',
          description: `Treasurer notified to refund £${amount.toFixed(2)} to ${enquiry.name}.`,
        });
        return true;
      }
      toast({ variant: 'destructive', title: 'Send Failed', description: result.error || 'Could not email the Treasurer.' });
      return false;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Send Failed', description: err.message || 'An unexpected error occurred.' });
      return false;
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleAddFaq = (cat: string, q: string, a: string) => {
    const faqId = Math.random().toString(36).substring(7);
    const order = (faqItems?.length ?? 0) + 1;
    setDocumentNonBlocking(doc(firestore, 'faqs', faqId), {
      id: faqId, cat, q, a, order, createdAt: new Date().toISOString(),
    }, {});
    toast({ title: 'FAQ Added' });
  };

  const handleDeleteFaq = (faqId: string) => {
    deleteDocumentNonBlocking(doc(firestore, 'faqs', faqId));
    toast({ title: 'FAQ Deleted' });
  };

  const handleUpdateFaq = (faqId: string, data: { cat: string; q: string; a: string }) => {
    updateDocumentNonBlocking(doc(firestore, 'faqs', faqId), data);
    toast({ title: 'FAQ Updated' });
  };

  const handleSeedFaqs = () => {
    DEFAULT_FAQS.forEach((faq, i) => {
      const faqId = Math.random().toString(36).substring(7);
      setDocumentNonBlocking(doc(firestore, 'faqs', faqId), {
        id: faqId, ...faq, order: i + 1, createdAt: new Date().toISOString(),
      }, {});
    });
    toast({ title: 'FAQs Seeded', description: '14 default FAQs have been added.' });
  };

  if (isUserLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Verifying Admin Status...</p>
      </div>
    );
  }

  if (!user || user.isAnonymous || !hasAdminAccess) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto p-4 bg-amber-100 text-amber-600 rounded-full w-fit">
              <ShieldAlert className="h-12 w-12" />
            </div>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Login as Admin to access this portal.</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full"><Link href="/login">Go to Login</Link></Button>
            <Button asChild variant="ghost" className="w-full"><Link href="/">Home</Link></Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-20 overflow-x-clip">
      <div className="container mx-auto px-4 py-8 max-w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-lg"><LayoutDashboard className="h-6 w-6" /></div>
            <h1 className="text-3xl font-headline font-bold text-primary">Admin Portal</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" /> Sign Out</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-transparent p-0 rounded-none w-full flex flex-col gap-3 h-auto">
            {/* Primary actions — Workflow Management & Deposit Returns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <TabsTrigger
                value="enquiries"
                className="group flex items-center justify-start gap-4 h-20 px-5 rounded-2xl border bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-primary"
              >
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white shrink-0">
                  <Inbox className="h-6 w-6" />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-bold text-base leading-tight">Workflow Management</div>
                  <div className="text-xs opacity-70 mt-0.5">Booking enquiries</div>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="deposits"
                className="group flex items-center justify-start gap-4 h-20 px-5 rounded-2xl border bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-primary"
              >
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white shrink-0">
                  <Banknote className="h-6 w-6" />
                </div>
                <div className="text-left min-w-0">
                  <div className="font-bold text-base leading-tight">Deposit Returns</div>
                  <div className="text-xs opacity-70 mt-0.5">Process pending refunds</div>
                </div>
              </TabsTrigger>
            </div>
            {/* Secondary actions — Users & FAQs */}
            <div className="flex gap-2 justify-end">
              <TabsTrigger
                value="security"
                className="rounded-xl h-9 px-3.5 text-xs font-medium gap-1.5 bg-white border shadow-sm hover:border-primary/30 transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary"
              >
                <Users className="h-3.5 w-3.5" /> Users
              </TabsTrigger>
              <TabsTrigger
                value="faqs"
                className="rounded-xl h-9 px-3.5 text-xs font-medium gap-1.5 bg-white border shadow-sm hover:border-primary/30 transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary"
              >
                <HelpCircle className="h-3.5 w-3.5" /> FAQs
              </TabsTrigger>
            </div>
          </TabsList>

          <TabsContent value="enquiries" className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-xl font-headline font-bold text-primary">Workflow Management</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResyncLive}
                  disabled={isLiveLoading}
                  className="gap-2 shrink-0"
                  title="Re-fetch the live Hallmaster feed (bypasses 5-min cache)"
                >
                  <RefreshCw className={cn('h-4 w-4', isLiveLoading && 'animate-spin')} />
                  {isLiveLoading ? 'Syncing…' : 'Re-sync'}
                </Button>
                <div className="bg-white rounded-lg p-1 border shadow-sm flex items-center">
                  <Button variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} size="sm" className="px-2 sm:px-3" onClick={() => setViewMode('kanban')}><LayoutGrid className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Kanban</span></Button>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" className="px-2 sm:px-3" onClick={() => setViewMode('list')}><List className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">List</span></Button>
                  <Button variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} size="sm" className="px-2 sm:px-3" onClick={() => setViewMode('calendar')}><CalendarDays className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Calendar</span></Button>
                </div>
              </div>
            </div>

            {loadingEnquiries ? (
              <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
            ) : viewMode === 'calendar' ? (
              <EnquiryCalendarView
                enquiries={activeEnquiries}
                liveEvents={liveEvents}
                clashMap={clashMap}
                isLiveLoading={isLiveLoading}
                onEditEnquiry={setEditingEnquiry}
              />
            ) : visibleEnquiries && visibleEnquiries.length > 0 ? (
              viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                  {BUCKET_COLUMNS.map((col) => {
                    const today = startOfToday();
                    const isPastDate = (e: any) => {
                      try { return parseISO(e.dateRequired) < today; } catch { return false; }
                    };
                    const items = visibleEnquiries.filter(e => bucketForEnquiry(e, isPastDate(e)) === col.id);
                    return (
                      <div key={col.id} className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 px-2">
                          <div className={cn("w-2 h-2 rounded-full", col.color)} />
                          <h3 className="font-bold text-primary text-sm">{col.label}</h3>
                          <Badge variant="secondary">{items.length}</Badge>
                          {col.needsAction && items.length > 0 && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Action</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-4 bg-muted/20 p-3 rounded-2xl min-h-[300px] border-2 border-dashed border-muted">
                          {items.map(e => (
                            <KanbanCard key={e.id} enquiry={e} clashes={clashMap[e.id]} onMoveBucket={handleMoveBucket} onSendToSecurity={handleSendToSecurity} onSendConfirmation={handleSendConfirmation} onProvisionalBooking={handleProvisionalBooking} onClearProvisional={handleClearProvisional} onNotAvailable={handleNotAvailable} onMarkViewingComplete={handleMarkViewingComplete} onMarkInvoiceSent={handleMarkInvoiceSent} onEdit={setEditingEnquiry} onAcknowledgeSecurityComments={handleAcknowledgeSecurityComments} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleEnquiries.map(e => <KanbanCard key={e.id} enquiry={e} clashes={clashMap[e.id]} onMoveBucket={handleMoveBucket} onSendToSecurity={handleSendToSecurity} onSendConfirmation={handleSendConfirmation} onProvisionalBooking={handleProvisionalBooking} onClearProvisional={handleClearProvisional} onNotAvailable={handleNotAvailable} onMarkViewingComplete={handleMarkViewingComplete} onMarkInvoiceSent={handleMarkInvoiceSent} onEdit={setEditingEnquiry} onAcknowledgeSecurityComments={handleAcknowledgeSecurityComments} isList />)}
                </div>
              )
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-muted-foreground">No enquiries found.</div>
            )}
          </TabsContent>

          <TabsContent value="security" className="animate-in fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="text-primary">Add User</CardTitle>
                  <CardDescription>
                    Pre-authorise an email so the user can activate their account on the login page.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = (fd.get('name') as string).trim();
                    const email = (fd.get('email') as string).trim().toLowerCase();
                    const role = fd.get('role') as 'admin' | 'security';
                    if (!email || !name) return;

                    const collectionName = role === 'admin' ? 'admins' : 'security_team';
                    setDocumentNonBlocking(
                      doc(firestore, collectionName, email),
                      {
                        id: email,
                        name,
                        email,
                        role,
                        addedAt: new Date().toISOString(),
                        addedBy: user?.email ?? null,
                      },
                      {},
                    );
                    (e.target as HTMLFormElement).reset();
                    toast({
                      title: role === 'admin' ? 'Admin User Added' : 'Security Contact Added',
                      description: `${name} can now activate their account on the login page.`,
                    });
                  }} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="user-name">Name</Label>
                      <Input id="user-name" name="name" placeholder="Full name" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="user-email">Email</Label>
                      <Input id="user-email" name="email" type="email" placeholder="user@example.com" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="user-role">Role</Label>
                      <select
                        id="user-role"
                        name="role"
                        defaultValue="security"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="security">Security Team — receives review emails</option>
                        <option value="admin">Admin — full access to this portal</option>
                      </select>
                    </div>
                    <Button type="submit" className="w-full">Add User</Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-xl bg-white">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-primary flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> Admin Users
                      </CardTitle>
                      <Badge variant="secondary">{adminUsers?.length ?? 0}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loadingAdmins ? (
                      <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
                    ) : (adminUsers?.length ?? 0) === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">No admin users yet.</p>
                    ) : (
                      adminUsers!.map(a => (
                        <div key={a.id} className="flex justify-between items-center gap-3 p-3 bg-muted/30 rounded-xl min-w-0">
                          <div className="min-w-0">
                            <p className="font-bold text-sm break-words">{a.name || a.email}</p>
                            <p className="text-xs opacity-60 break-words">{a.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={a.email === PRIMARY_ADMIN_EMAIL || a.email === user?.email}
                            title={a.email === PRIMARY_ADMIN_EMAIL ? 'Cannot remove the primary admin' : a.email === user?.email ? "Can't remove yourself" : 'Remove admin'}
                            onClick={() => deleteDocumentNonBlocking(doc(firestore, 'admins', a.id))}
                            className="text-red-500 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-primary flex items-center gap-2">
                        <Users className="h-4 w-4" /> Security Team
                      </CardTitle>
                      <Badge variant="secondary">{securityContacts?.length ?? 0}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {loadingSecurity ? (
                      <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
                    ) : (securityContacts?.length ?? 0) === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-2">No security contacts yet.</p>
                    ) : (
                      securityContacts!.map(c => (
                        <div key={c.id} className="flex justify-between items-center gap-3 p-3 bg-muted/30 rounded-xl min-w-0">
                          <div className="min-w-0">
                            <p className="font-bold text-sm break-words">{c.name}</p>
                            <p className="text-xs opacity-60 break-words">{c.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDocumentNonBlocking(doc(firestore, 'security_team', c.id))}
                            className="text-red-500 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
             </div>
          </TabsContent>

          <TabsContent value="deposits" className="animate-in fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold text-primary">Deposit Returns Due</h2>
              {depositEnquiries.length > 0 && <Badge variant="secondary">{depositEnquiries.length} pending</Badge>}
            </div>

            {loadingEnquiries ? (
              <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
            ) : depositEnquiries.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-muted-foreground">
                No completed hires awaiting deposit return.
              </div>
            ) : (
              <div className="space-y-4">
                {depositEnquiries.map(e => (
                  <DepositRow key={e.id} enquiry={e} onSend={handleSendDepositReturn} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="faqs" className="animate-in fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Add FAQ */}
              <Card className="border-none shadow-xl bg-white">
                <CardHeader>
                  <CardTitle className="text-primary">Add FAQ</CardTitle>
                  <CardDescription>New questions appear on the public FAQ page immediately.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      handleAddFaq(fd.get('cat') as string, fd.get('q') as string, fd.get('a') as string);
                      (e.target as HTMLFormElement).reset();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <select
                        name="cat"
                        required
                        defaultValue="venue"
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {Object.entries(FAQ_CAT_LABELS).map(([id, label]) => (
                          <option key={id} value={id}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Question</Label>
                      <Input name="q" placeholder="Enter the question…" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Answer</Label>
                      <textarea
                        name="a"
                        placeholder="Enter the answer…"
                        required
                        rows={4}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2">
                      <Plus className="h-4 w-4" /> Add FAQ
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* FAQ list */}
              <Card className="border-none shadow-xl bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-primary">All FAQs</CardTitle>
                  {faqItems && <Badge variant="secondary">{faqItems.length} total</Badge>}
                </CardHeader>
                <CardContent className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {loadingFaqs ? (
                    <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                  ) : !faqItems || faqItems.length === 0 ? (
                    <div className="text-center py-10 space-y-4">
                      <p className="text-sm text-muted-foreground">No FAQs yet. Add one using the form, or seed the defaults.</p>
                      <Button variant="outline" onClick={handleSeedFaqs} className="gap-2">
                        <Plus className="h-4 w-4" /> Seed Default FAQs
                      </Button>
                    </div>
                  ) : (
                    faqItems.map((faq: any) => (
                      <FAQAdminItem
                        key={faq.id}
                        faq={faq}
                        onDelete={handleDeleteFaq}
                        onUpdate={handleUpdateFaq}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EditEnquiryDialog
        enquiry={editingEnquiry}
        onOpenChange={(open) => { if (!open) setEditingEnquiry(null); }}
        onSave={handleSaveEnquiry}
      />
    </div>
  );
}

function KanbanCard({ enquiry, clashes, onMoveBucket, onSendToSecurity, onSendConfirmation, onProvisionalBooking, onClearProvisional, onNotAvailable, onMarkViewingComplete, onMarkInvoiceSent, onEdit, onAcknowledgeSecurityComments, isList }: { enquiry: any, clashes?: ClashingEvent[], onMoveBucket: (e: any, target: string) => void, onSendToSecurity: (e: any) => void, onSendConfirmation: (e: any) => void, onProvisionalBooking: (e: any, kind: 'FirstBooking' | 'RepeatHirer') => Promise<void>, onClearProvisional: (e: any) => Promise<void>, onNotAvailable: (e: any) => Promise<void>, onMarkViewingComplete: (e: any) => Promise<void>, onMarkInvoiceSent: (e: any) => Promise<void>, onEdit: (e: any) => void, onAcknowledgeSecurityComments: (id: string) => void, isList?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const hasClash = (clashes?.length ?? 0) > 0;
  const securityComments: string | undefined = enquiry.securityComments;
  const hasPendingSecurityComments = !!(securityComments && securityComments.trim()) && enquiry.securityCommentsAcknowledged !== true;

  const isPastDate = (() => {
    try { return parseISO(enquiry.dateRequired) < startOfToday(); } catch { return false; }
  })();
  const bucket = bucketForEnquiry(enquiry, isPastDate);

  // Wraps an async card action with a busy flag so double-clicks can't fire an
  // email twice. `run` adds the click handling on top for button presses; the
  // checkbox uses `runAction` directly, since it has no mouse event to stop.
  const runAction = (action: string, fn: () => Promise<void> | void) => async () => {
    if (busyAction) return;
    setBusyAction(action);
    try { await fn(); } finally { setBusyAction(null); }
  };

  const run = (action: string, fn: () => Promise<void> | void) => async (e: React.MouseEvent) => {
    e.stopPropagation();
    await runAction(action, fn)();
  };

  const busyIcon = (action: string, Icon: any) =>
    busyAction === action ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />;

  const confirmationStatus = enquiry.confirmationStatus as ('NotSent' | 'Sent' | 'Submitted' | undefined);
  const reviewComplete = enquiry.status === 'Reviewed';
  const reviewRequested = !!enquiry.securityReviewRequestedAt;
  // The two gates out of Enquiry Received on a first booking.
  const provisionalSignedOff = enquiry.provisionalStatus === 'FirstBooking';
  const needsViewingRequest = provisionalSignedOff && !enquiry.viewingRequestedAt;
  // Normally hidden once the review is done — but a signed-off booking whose
  // viewing was never requested still needs the button, or it cannot advance.
  const showSecurityAction = !reviewComplete || needsViewingRequest;

  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-all bg-white cursor-pointer overflow-hidden", isExpanded && "ring-2 ring-primary", hasClash && "border-red-400 bg-red-50/40", hasPendingSecurityComments && "border-amber-500 ring-2 ring-amber-400 bg-amber-50/40")} onClick={() => setIsExpanded(!isExpanded)}>
      <div className="p-4 space-y-3">
        {hasPendingSecurityComments && (
          <div className="rounded-md border-2 border-amber-500 bg-amber-100 p-2.5 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
              <MessageSquare className="h-3.5 w-3.5" />
              Action Required — Security Team Comments
            </div>
            <p className="text-[11px] text-amber-950 leading-relaxed whitespace-pre-wrap break-words">
              {securityComments}
            </p>
            <Button
              variant="default"
              size="sm"
              className="w-full h-7 text-[10px] gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={run('ack', () => onAcknowledgeSecurityComments(enquiry.id))}
              disabled={!!busyAction}
            >
              {busyIcon('ack', CheckCircle2)}
              Mark as Actioned
            </Button>
          </div>
        )}
        {!hasPendingSecurityComments && securityComments && securityComments.trim() && (
          <div className="rounded-md border border-muted bg-muted/40 px-2 py-1.5 flex items-start gap-1.5 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-green-600" />
            <span>Security note actioned. <span className="italic opacity-80">"{securityComments}"</span></span>
          </div>
        )}
        {hasClash && (
          <div className="flex items-start gap-1.5 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 rounded-md px-2 py-1.5">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p>Clashes with live booking{(clashes?.length ?? 0) > 1 ? 's' : ''}</p>
              {isExpanded && clashes!.map((c, i) => (
                <p key={i} className="font-normal opacity-90 mt-0.5 break-words">
                  • {c.summary} ({format(parseISO(c.start), 'HH:mm')}–{format(parseISO(c.end), 'HH:mm')})
                </p>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between items-start">
           <Badge variant="outline" className="text-[10px] font-mono">{enquiry.id.substring(0, 6)}</Badge>
           <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent className="text-xs">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(enquiry); }}>
                <Pencil className="h-3 w-3 mr-2" /> Edit Details
              </DropdownMenuItem>
              {/* Manual corrections — none of these send an email */}
              {bucket !== 'EnquiryReceived' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveBucket(enquiry, 'EnquiryReceived'); }}>Move to Enquiry Received</DropdownMenuItem>
              )}
              {bucket !== 'AwaitingViewing' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveBucket(enquiry, 'AwaitingViewing'); }}>Move to Awaiting Viewing</DropdownMenuItem>
              )}
              {bucket !== 'VisitComplete' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveBucket(enquiry, 'VisitComplete'); }}>Move to Visit Complete</DropdownMenuItem>
              )}
              {enquiry.invoiceSentAt && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveBucket(enquiry, 'HireConfirmed'); }}>Undo Invoice Sent</DropdownMenuItem>
              )}
              {enquiry.status !== 'NotAvailable' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveBucket(enquiry, 'NotAvailable'); }}>Mark Not Available (no email)</DropdownMenuItem>
              )}
              {enquiry.status !== 'Rejected' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveBucket(enquiry, 'Rejected'); }}>Mark as Rejected</DropdownMenuItem>
              )}
            </DropdownMenuContent>
           </DropdownMenu>
        </div>
        <div>
          <h4 className="font-bold text-sm text-primary">{enquiry.name}</h4>
          <p className="text-[10px] opacity-60 flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatUKDate(enquiry.dateRequired)}</p>
        </div>
        
        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
           <span>{enquiry.startTime} - {enquiry.endTime}</span>
           {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </div>

        {isExpanded && (
          <div className="pt-2 border-t mt-2 space-y-2 text-[10px] animate-in fade-in slide-in-from-top-1">
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-primary">{enquiry.typeOfEvent}</p>
                <p className="flex items-center gap-1"><Users className="h-3 w-3" /> Attendance: {enquiry.estimatedAttendance}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Mail className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <p className="truncate">{enquiry.emailAddress}</p>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              <p>{enquiry.postalAddress}, {enquiry.postcode}</p>
            </div>

            <div className="bg-muted/30 p-2 rounded italic mt-2">
              <p className="font-bold mb-1 opacity-60">Requirements:</p>
              {enquiry.additionalRequirements}
            </div>
          </div>
        )}

        {/* Security review state — a badge, not a bucket move */}
        {bucket === 'EnquiryReceived' && (reviewComplete || reviewRequested) && (
          <div className={cn(
            "flex items-center justify-center gap-1.5 text-[10px] font-bold rounded-md py-1 mt-2 border",
            reviewComplete
              ? "text-green-700 bg-green-50 border-green-200"
              : "text-amber-700 bg-amber-50 border-amber-200"
          )}>
            <ShieldCheck className="h-3 w-3" />
            {reviewComplete
              ? 'Security review complete'
              : `Review requested ${formatUKDate(enquiry.securityReviewRequestedAt?.substring(0, 10)) || ''}`}
          </div>
        )}

        {bucket === 'EnquiryReceived' && (
          <div className="space-y-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
            {/* Step 1 — sign-off. Emails the hirer, but leaves the card here:
                the booking only advances once the viewing has been requested. */}
            <label
              className={cn(
                "flex items-start gap-2 rounded-md border p-2 transition-colors",
                provisionalSignedOff ? "border-primary/40 bg-primary/5" : "border-muted bg-muted/30",
                busyAction ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              )}
              title={provisionalSignedOff
                ? "Untick to undo the sign-off — no email is sent"
                : "Tick once the booking is on Hallmaster — emails the hirer that a provisional booking is made and a viewing will be arranged"}
            >
              <Checkbox
                className="mt-0.5 h-3.5 w-3.5"
                checked={provisionalSignedOff}
                disabled={!!busyAction}
                onCheckedChange={(checked) => runAction('prov-first', () =>
                  checked ? onProvisionalBooking(enquiry, 'FirstBooking') : onClearProvisional(enquiry)
                )()}
              />
              <span className="text-[10px] leading-snug flex-1">
                <span className="font-semibold">Provisional booking made</span>
                {provisionalSignedOff ? (
                  <span className="text-muted-foreground"> — signed off {formatUKDate(enquiry.provisionalAt?.substring(0, 10)) || ''}. Hirer emailed.</span>
                ) : (
                  <span className="text-muted-foreground"> — tick once it's on Hallmaster. Emails the hirer.</span>
                )}
              </span>
              {busyAction === 'prov-first' && <Loader2 className="h-3 w-3 animate-spin shrink-0 mt-0.5" />}
            </label>
            {/* Step 2 — the mover. Notifies the security team and advances. */}
            {showSecurityAction && (
              <Button
                variant={provisionalSignedOff ? "default" : "secondary"}
                size="sm"
                className="w-full gap-2 text-[10px] h-8"
                onClick={run('security', () => onSendToSecurity(enquiry))}
                disabled={!!busyAction || !provisionalSignedOff}
                title={provisionalSignedOff
                  ? "Emails the security team the review request and the hirer's details to arrange a viewing — moves this to Awaiting Viewing"
                  : "Sign off the provisional booking first"}
              >
                {busyIcon('security', Send)}
                {reviewRequested ? 'Resend Security Review & Viewing' : 'Request Security Review & Viewing'}
              </Button>
            )}
            {showSecurityAction && !provisionalSignedOff && (
              <p className="text-[9px] text-muted-foreground text-center leading-tight px-1">
                Sign off the provisional booking above to request the review and viewing.
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 text-[10px] h-8 border-primary/40 text-primary"
              onClick={run('prov-repeat', () => onProvisionalBooking(enquiry, 'RepeatHirer'))}
              disabled={!!busyAction}
              title="Emails the hirer the hire agreement link — no viewing needed"
            >
              {busyIcon('prov-repeat', FileSignature)}
              Provisional Made — Repeat Hirer
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 text-[10px] h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={run('not-available', () => onNotAvailable(enquiry))}
              disabled={!!busyAction}
              title="Emails the hirer that the requested date/time is unavailable and closes the enquiry"
            >
              {busyIcon('not-available', XCircle)}
              Date/Time Not Available
            </Button>
          </div>
        )}

        {bucket === 'AwaitingViewing' && (
          <div className="space-y-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md py-1">
              <Eye className="h-3 w-3" />
              Security team asked {formatUKDate(enquiry.viewingRequestedAt?.substring(0, 10)) || ''} — viewing pending
            </div>
            <Button
              size="sm"
              className="w-full gap-2 text-[10px] h-8"
              onClick={run('viewing-done', () => onMarkViewingComplete(enquiry))}
              disabled={!!busyAction}
            >
              {busyIcon('viewing-done', CheckCircle2)}
              Mark Viewing Complete
            </Button>
          </div>
        )}

        {bucket === 'VisitComplete' && (
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2 text-[10px] h-8 mt-2"
            onClick={run('confirm', () => onSendConfirmation(enquiry))}
            disabled={!!busyAction}
          >
            {busyIcon('confirm', FileSignature)}
            Send Hire Confirmation
          </Button>
        )}

        {bucket === 'AwaitingAgreement' && (
          <div className="space-y-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-md py-1">
              <FileSignature className="h-3 w-3" />
              Awaiting hirer signature
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-[10px] h-8"
              onClick={run('confirm', () => onSendConfirmation(enquiry))}
              disabled={!!busyAction}
            >
              {busyIcon('confirm', Send)}
              Resend Confirmation
            </Button>
          </div>
        )}

        {(bucket === 'HireConfirmed' || bucket === 'HireComplete') && confirmationStatus === 'Submitted' && (
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-md py-1.5 mt-2">
            <CheckCircle2 className="h-3 w-3" />
            Hire Confirmed by Hirer
          </div>
        )}

        {bucket === 'HireConfirmed' && (
          <Button
            size="sm"
            className="w-full gap-2 text-[10px] h-8 mt-1.5"
            onClick={run('invoice', () => onMarkInvoiceSent(enquiry))}
            disabled={!!busyAction}
            title="No email is sent — this records that you've sent the invoice"
          >
            {busyIcon('invoice', Receipt)}
            Mark Invoice Sent
          </Button>
        )}

        {bucket === 'InvoiceSent' && (
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-md py-1.5 mt-2">
            <Receipt className="h-3 w-3" />
            Invoice sent {formatUKDate(enquiry.invoiceSentAt?.substring(0, 10)) || ''}
          </div>
        )}
      </div>
    </Card>
  );
}

function FAQAdminItem({
  faq,
  onDelete,
  onUpdate,
}: {
  faq: any;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: { cat: string; q: string; a: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [q,   setQ]   = useState(faq.q);
  const [a,   setA]   = useState(faq.a);
  const [cat, setCat] = useState(faq.cat);

  const handleCancel = () => {
    setEditing(false);
    setQ(faq.q);
    setA(faq.a);
    setCat(faq.cat);
  };

  if (editing) {
    return (
      <div className="p-3 bg-muted/20 rounded-xl border-2 border-primary/20 space-y-2.5">
        <select
          value={cat}
          onChange={e => setCat(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {Object.entries(FAQ_CAT_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Question" className="text-sm h-9" />
        <textarea
          value={a}
          onChange={e => setA(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => { onUpdate(faq.id, { q, a, cat }); setEditing(false); }}
          >
            <Save className="h-3 w-3" /> Save
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-muted/20 rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: FAQ_CAT_COLORS[faq.cat] ?? '#888' }}
          />
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
            {FAQ_CAT_LABELS[faq.cat] ?? faq.cat}
          </span>
        </div>
        <p className="text-sm font-semibold text-primary leading-snug">{faq.q}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{faq.a}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0 mt-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDelete(faq.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function formatSortCodeDisplay(sortCode?: string) {
  if (!sortCode) return '—';
  const digits = sortCode.replace(/\D/g, '');
  if (digits.length !== 6) return sortCode;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
}

function DepositRow({
  enquiry,
  onSend,
}: {
  enquiry: any;
  onSend: (
    enquiry: any,
    amount: number,
    isFullReturn: boolean,
    reason: string | undefined,
    payment: PaymentDetails | null
  ) => Promise<boolean>;
}) {
  const [sendingFull, setSendingFull] = useState(false);
  const [deductionOpen, setDeductionOpen] = useState(false);
  const { firestore } = useFirebase();
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [paymentState, setPaymentState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const fullDeposit = getDepositAmount(enquiry);

  // Bank details are admin-only and live outside the enquiry, so they are
  // fetched per row — they only reach the browser on the Deposits tab.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(paymentDocRef(firestore, enquiry.id));
        if (cancelled) return;
        if (snap.exists()) {
          setPayment(snap.data() as PaymentDetails);
          setPaymentState('ready');
          return;
        }
        // Enquiries confirmed before the split still carry them inline.
        const legacy = readLegacyPaymentDetails(enquiry);
        setPayment(legacy);
        setPaymentState(legacy ? 'ready' : 'missing');
      } catch (err) {
        if (cancelled) return;
        console.error('Could not load payment details:', err);
        setPayment(null);
        setPaymentState('missing');
      }
    })();
    return () => { cancelled = true; };
  }, [firestore, enquiry]);
  const previousReturn = enquiry.depositReturn as
    | { amount: number; fullDeposit?: number; isFullReturn: boolean; sentAt: string; reason?: string | null }
    | undefined;

  const handleFullReturn = async () => {
    setSendingFull(true);
    await onSend(enquiry, fullDeposit, true, undefined, payment);
    setSendingFull(false);
  };

  return (
    <Card className="border shadow-sm bg-white">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-primary text-base">{enquiry.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3 w-3" /> {formatUKDate(enquiry.dateRequired)} · {enquiry.startTime}–{enquiry.endTime}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{enquiry.typeOfEvent}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Deposit</p>
            <p className="text-lg font-bold text-primary">£{fullDeposit.toFixed(2)}</p>
          </div>
        </div>

        {paymentState === 'loading' ? (
          <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading bank details…
          </div>
        ) : paymentState === 'missing' ? (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>No bank details on file for this booking. Contact the hirer for them before authorising a refund.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/30 rounded-xl p-3 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Name</p>
              <p className="font-semibold">{payment?.accountName || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bank</p>
              <p className="font-semibold">{payment?.bankName || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Number</p>
              <p className="font-mono">{payment?.accountNumber || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sort Code</p>
              <p className="font-mono">{formatSortCodeDisplay(payment?.sortCode)}</p>
            </div>
          </div>
        )}

        {previousReturn && (
          <div className="flex items-start gap-2 text-xs bg-green-50 border border-green-200 text-green-800 rounded-lg p-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {previousReturn.isFullReturn
                  ? `Full deposit return (£${previousReturn.amount.toFixed(2)}) sent to Treasurer`
                  : `Deduction return (£${previousReturn.amount.toFixed(2)} of £${previousReturn.fullDeposit?.toFixed?.(2) ?? fullDeposit.toFixed(2)}) sent to Treasurer`}
              </p>
              {previousReturn.reason && <p className="opacity-80 mt-0.5">Reason: {previousReturn.reason}</p>}
              <p className="opacity-60 text-[10px] mt-0.5">{formatUKDateTime(previousReturn.sentAt)}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={handleFullReturn}
            disabled={sendingFull || paymentState !== 'ready'}
          >
            {sendingFull ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            Full Deposit Return
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setDeductionOpen(true)}
            disabled={paymentState !== 'ready'}
          >
            <MinusCircle className="h-4 w-4" />
            Deduction
          </Button>
        </div>
      </CardContent>

      <DeductionDialog
        open={deductionOpen}
        onOpenChange={setDeductionOpen}
        fullDeposit={fullDeposit}
        hirerName={enquiry.name}
        onSubmit={async (amount, reason) => {
          const ok = await onSend(enquiry, amount, false, reason, payment);
          if (ok) setDeductionOpen(false);
        }}
      />
    </Card>
  );
}

function DeductionDialog({
  open,
  onOpenChange,
  fullDeposit,
  hirerName,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullDeposit: number;
  hirerName: string;
  onSubmit: (amount: number, reason: string) => Promise<void> | void;
}) {
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setAmount('');
      setReason('');
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Enter a revised return amount of £0 or more.' });
      return;
    }
    if (parsed > fullDeposit) {
      toast({ variant: 'destructive', title: 'Amount too high', description: `The revised return cannot exceed the original deposit of £${fullDeposit.toFixed(2)}.` });
      return;
    }
    if (!reason.trim()) {
      toast({ variant: 'destructive', title: 'Reason required', description: 'Please provide a reason for the deduction.' });
      return;
    }
    setSubmitting(true);
    await onSubmit(parsed, reason.trim());
    setSubmitting(false);
  };

  const deduction = Math.max(0, fullDeposit - Number(amount || 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Deposit Deduction</DialogTitle>
          <DialogDescription>
            Notify the Treasurer of a partial deposit return for <span className="font-semibold">{hirerName}</span>.
            Original deposit: <span className="font-semibold">£{fullDeposit.toFixed(2)}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="deduction-amount">Revised return amount (£)</Label>
            <Input
              id="deduction-amount"
              type="number"
              inputMode="decimal"
              min={0}
              max={fullDeposit}
              step="0.01"
              placeholder="e.g. 30.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
            {amount !== '' && Number.isFinite(Number(amount)) && (
              <p className="text-xs text-muted-foreground">Deduction: £{deduction.toFixed(2)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deduction-reason">Reason for deduction</Label>
            <textarea
              id="deduction-reason"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Additional cleaning required (2 hours)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to Treasurer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const EDIT_FIELDS: Array<{ key: string; label: string; type?: 'text' | 'email' | 'tel' | 'date' | 'time' | 'number' | 'textarea' | 'select'; options?: string[] }> = [
  { key: 'name', label: 'Hirer Name' },
  { key: 'emailAddress', label: 'Email', type: 'email' },
  { key: 'phoneNumber', label: 'Phone', type: 'tel' },
  { key: 'hiredBefore', label: 'Hired the Hub before', type: 'select', options: ['Yes', 'No'] },
  { key: 'postalAddress', label: 'Postal Address' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'typeOfEvent', label: 'Type of Event' },
  { key: 'estimatedAttendance', label: 'Estimated Attendance', type: 'number' },
  { key: 'dateRequired', label: 'Date Required', type: 'date' },
  { key: 'startTime', label: 'Start Time', type: 'time' },
  { key: 'endTime', label: 'End Time', type: 'time' },
  { key: 'additionalRequirements', label: 'Additional Requirements', type: 'textarea' },
];

function EditEnquiryDialog({
  enquiry,
  onOpenChange,
  onSave,
}: {
  enquiry: any | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Record<string, any>) => Promise<boolean>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (enquiry) {
      const next: Record<string, string> = {};
      for (const f of EDIT_FIELDS) next[f.key] = enquiry[f.key] != null ? String(enquiry[f.key]) : '';
      setValues(next);
    }
  }, [enquiry]);

  if (!enquiry) return null;

  const handleSubmit = async () => {
    if (values.endTime && values.startTime && values.endTime <= values.startTime) {
      toast({ variant: 'destructive', title: 'Invalid Times', description: 'End time must be after start time.' });
      return;
    }
    if (values.endTime && values.dateRequired && !endsByClosing(values.dateRequired, values.endTime)) {
      toast({ variant: 'destructive', title: 'Past Closing Time', description: CLOSING_RULE_TEXT });
      return;
    }
    setSaving(true);
    const updates: Record<string, any> = {};
    for (const f of EDIT_FIELDS) {
      const v = values[f.key] ?? '';
      updates[f.key] = f.type === 'number' ? (v === '' ? null : Number(v)) : v;
    }
    const ok = await onSave(enquiry.id, updates);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={!!enquiry} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking Details</DialogTitle>
          <DialogDescription>
            Update the contact information, date, time, or other details for this enquiry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EDIT_FIELDS.map(f => {
              const id = `edit-${f.key}`;
              const value = values[f.key] ?? '';
              const onChange = (v: string) => setValues(prev => ({ ...prev, [f.key]: v }));
              const fullWidth = f.type === 'textarea' || f.key === 'postalAddress';
              return (
                <div key={f.key} className={cn('space-y-1.5', fullWidth && 'sm:col-span-2')}>
                  <Label htmlFor={id}>{f.label}</Label>
                  {f.type === 'textarea' ? (
                    <textarea
                      id={id}
                      rows={3}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  ) : f.type === 'select' ? (
                    <select
                      id={id}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select…</option>
                      {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <Input
                      id={id}
                      type={f.type ?? 'text'}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
