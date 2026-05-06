
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LayoutDashboard, LogOut, Inbox, User, Mail, Phone, Clock, Calendar, CalendarDays, ShieldAlert, Key, LogIn, FileText, CheckCircle2, MoreVertical, ArrowRight, XCircle, Clock3, LayoutGrid, List, MapPin, Users, ChevronDown, ChevronUp, ShieldCheck, UserPlus, Trash2, Send, AlertCircle, AlertTriangle, Info, HelpCircle, Plus, Pencil, Save, FileSignature, Banknote, MinusCircle, RefreshCw } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, updateDoc, onSnapshot } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendSecurityReviewEmailAction, sendHireConfirmationInviteAction, sendDepositReturnEmailAction } from '@/app/actions/send-email';
import { getLiveCalendarEventsAction, type LiveEvent } from '@/app/actions/get-calendar';
import type { ClashingEvent } from '@/app/actions/check-availability';
import { EnquiryCalendarView } from '@/components/admin/EnquiryCalendarView';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, isWithinInterval, addDays, startOfToday, parseISO, isSameDay } from 'date-fns';

const STATUS_COLUMNS = [
  { id: 'Pending', label: 'Enquiry Received', color: 'bg-amber-500', icon: Clock3 },
  { id: 'Reviewed', label: 'Visit Complete', color: 'bg-blue-500', icon: FileText },
  { id: 'Confirmed', label: 'Hire Confirmed', color: 'bg-green-500', icon: CheckCircle2 },
  { id: 'HireComplete', label: 'Hire Complete', color: 'bg-slate-500', icon: Calendar },
];

const STATUS_LABELS: Record<string, string> = {
  Pending: 'Enquiry Received',
  Reviewed: 'Visit Complete',
  Confirmed: 'Hire Confirmed',
  Rejected: 'Rejected',
};

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
  { cat: 'hire',   q: "How do I contact someone when there's an issue during my hire?",           a: "Please call the number displayed above the notice board labelled 'On-Duty Contact number'.", order: 1 },
  { cat: 'access', q: 'What is the height of the gate height barrier?',                           a: 'The height barrier is 2m high. If you expect vehicles that will exceed this height, please contact the booking manager or On-Duty contact number.', order: 2 },
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
    return user && !user.isAnonymous ? doc(firestore, 'admins', user.uid) : null;
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

  const depositEnquiries = useMemo(() => {
    if (!enquiries) return [];
    const today = startOfToday();
    return enquiries.filter(e => {
      if (e.confirmationStatus !== 'Submitted') return false;
      try {
        return parseISO(e.dateRequired) < today;
      } catch {
        return false;
      }
    }).sort((a, b) => b.dateRequired.localeCompare(a.dateRequired));
  }, [enquiries]);

  const upcomingBookings = useMemo(() => {
    if (!enquiries) return [];
    const today = startOfToday();
    const nextWeek = addDays(today, 7);
    return enquiries.filter(e => {
      if (e.status !== 'Confirmed') return false;
      try {
        const eventDate = parseISO(e.dateRequired);
        return isWithinInterval(eventDate, { start: today, end: nextWeek });
      } catch {
        return false;
      }
    }).sort((a, b) => a.dateRequired.localeCompare(b.dateRequired));
  }, [enquiries]);

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
    if (!enquiries) return [];
    const today = startOfToday();
    return enquiries.filter(e => {
      const status = e.status || 'Pending';
      const hirerConfirmed = e.confirmationStatus === 'Submitted';
      let isPast = false;
      try { isPast = parseISO(e.dateRequired) < today; } catch {}
      // Hide HireComplete (logged in Hallmaster already)
      if (hirerConfirmed && isPast) return false;
      if (status === 'Confirmed' && isPast) return false;
      if (status === 'Rejected') return false;
      return true;
    });
  }, [enquiries]);

  // Build a clash map: { enquiryId: ClashingEvent[] } using the same overlap
  // rule as check-availability (requestedStart < eventEnd && requestedEnd > eventStart).
  const clashMap = useMemo(() => {
    const map: Record<string, ClashingEvent[]> = {};
    if (liveEvents.length === 0) return map;
    activeEnquiries.forEach(e => {
      if (!e.dateRequired || !e.startTime || !e.endTime) return;
      let reqStart: Date, reqEnd: Date;
      try {
        reqStart = new Date(`${e.dateRequired}T${e.startTime}:00`);
        reqEnd = new Date(`${e.dateRequired}T${e.endTime}:00`);
      } catch { return; }
      if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) return;
      const clashes: ClashingEvent[] = [];
      liveEvents.forEach(ev => {
        const evStart = parseISO(ev.start);
        const evEnd = parseISO(ev.end);
        if (!isSameDay(evStart, reqStart)) return;
        if (reqStart < evEnd && reqEnd > evStart) {
          clashes.push({ summary: ev.summary, start: ev.start, end: ev.end });
        }
      });
      if (clashes.length > 0) map[e.id] = clashes;
    });
    return map;
  }, [activeEnquiries, liveEvents]);

  const [editingEnquiry, setEditingEnquiry] = useState<any | null>(null);

  const handleUpdateStatus = async (enquiryId: string, newStatus: string) => {
    try {
      const docRef = doc(firestore, 'booking_enquiries', enquiryId);
      await updateDoc(docRef, { status: newStatus });
      toast({ title: "Status Updated", description: `Enquiry set to ${newStatus}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Permissions error." });
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

    try {
      const baseUrl = window.location.origin;
      const result = await sendSecurityReviewEmailAction(enquiry, securityContacts, baseUrl);
      if (result.success) {
        toast({ title: "Review Sent", description: "Security Team has been notified." });
      } else {
        toast({ variant: "destructive", title: "Send Failed", description: result.error || "Could not dispatch emails." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Send Failed", description: err.message || "An unexpected error occurred." });
    }
  };

  const handleSendDepositReturn = async (enquiry: any, amount: number, isFullReturn: boolean, reason?: string) => {
    try {
      const fullDeposit = getDepositAmount(enquiry);
      const result = await sendDepositReturnEmailAction({
        enquiryData: enquiry,
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
    <div className="min-h-screen bg-muted/30 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-lg"><LayoutDashboard className="h-6 w-6" /></div>
            <h1 className="text-3xl font-headline font-bold text-primary">Admin Portal</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2"><LogOut className="h-4 w-4" /> Sign Out</Button>
        </div>

        {/* Upcoming Bookings Summary */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-headline font-bold text-primary">Upcoming Bookings (Next 7 Days)</h2>
          </div>
          {upcomingBookings.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {upcomingBookings.map(e => (
                <Card key={e.id} className="min-w-[280px] bg-white border-none shadow-md">
                  <CardHeader className="p-4 pb-0">
                    <Badge variant="secondary" className="w-fit mb-2">{format(parseISO(e.dateRequired), 'EEEE, MMM do')}</Badge>
                    <CardTitle className="text-sm font-bold truncate">{e.typeOfEvent}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.startTime}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {e.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white/50 border border-dashed rounded-2xl p-6 text-center text-muted-foreground text-sm">
              No confirmed bookings in the next 7 days.
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white border p-1 rounded-2xl h-14 shadow-sm w-fit">
            <TabsTrigger value="enquiries" className="rounded-xl px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white">
              <Inbox className="h-4 w-4 mr-2" /> Booking Enquiries
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white">
              <ShieldCheck className="h-4 w-4 mr-2" /> Security Team
            </TabsTrigger>
            <TabsTrigger value="deposits" className="rounded-xl px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white">
              <Banknote className="h-4 w-4 mr-2" /> Deposit Details
            </TabsTrigger>
            <TabsTrigger value="faqs" className="rounded-xl px-6 h-full data-[state=active]:bg-primary data-[state=active]:text-white">
              <HelpCircle className="h-4 w-4 mr-2" /> FAQs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enquiries" className="space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-headline font-bold text-primary">Workflow Management</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResyncLive}
                  disabled={isLiveLoading}
                  className="gap-2"
                  title="Re-fetch the live Hallmaster feed (bypasses 5-min cache)"
                >
                  <RefreshCw className={cn('h-4 w-4', isLiveLoading && 'animate-spin')} />
                  {isLiveLoading ? 'Syncing…' : 'Re-sync'}
                </Button>
                <div className="bg-white rounded-lg p-1 border shadow-sm flex items-center flex-wrap">
                  <Button variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')}><LayoutGrid className="h-4 w-4 mr-2" /> Kanban</Button>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}><List className="h-4 w-4 mr-2" /> List</Button>
                  <Button variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('calendar')}><CalendarDays className="h-4 w-4 mr-2" /> Calendar</Button>
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
            ) : enquiries && enquiries.length > 0 ? (
              viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                  {STATUS_COLUMNS.map((col) => {
                    const today = startOfToday();
                    const isPastDate = (e: any) => {
                      try { return parseISO(e.dateRequired) < today; } catch { return false; }
                    };
                    const inColumn = (e: any) => {
                      const status = e.status || 'Pending';
                      const hirerConfirmed = e.confirmationStatus === 'Submitted';
                      if (hirerConfirmed) {
                        if (col.id === 'HireComplete') return isPastDate(e);
                        if (col.id === 'Confirmed') return !isPastDate(e);
                        return false;
                      }
                      if (col.id === 'HireComplete') return status === 'Confirmed' && isPastDate(e);
                      if (col.id === 'Confirmed') return status === 'Confirmed' && !isPastDate(e);
                      return status === col.id;
                    };
                    const items = enquiries.filter(inColumn);
                    return (
                      <div key={col.id} className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 px-2">
                          <div className={cn("w-2 h-2 rounded-full", col.color)} />
                          <h3 className="font-bold text-primary">{col.label}</h3>
                          <Badge variant="secondary">{items.length}</Badge>
                        </div>
                        <div className="flex flex-col gap-4 bg-muted/20 p-3 rounded-2xl min-h-[400px] border-2 border-dashed border-muted">
                          {items.map(e => (
                            <KanbanCard key={e.id} enquiry={e} clashes={clashMap[e.id]} onUpdateStatus={handleUpdateStatus} onSendToSecurity={handleSendToSecurity} onSendConfirmation={handleSendConfirmation} onEdit={setEditingEnquiry} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {enquiries.map(e => <KanbanCard key={e.id} enquiry={e} clashes={clashMap[e.id]} onUpdateStatus={handleUpdateStatus} onSendToSecurity={handleSendToSecurity} onSendConfirmation={handleSendConfirmation} onEdit={setEditingEnquiry} isList />)}
                </div>
              )
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-muted-foreground">No enquiries found.</div>
            )}
          </TabsContent>

          <TabsContent value="security" className="animate-in fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl bg-white">
                <CardHeader><CardTitle className="text-primary">Add Contact</CardTitle></CardHeader>
                <CardContent>
                   <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const name = fd.get('name') as string;
                    const email = fd.get('email') as string;
                    const contactId = Math.random().toString(36).substring(7);
                    setDocumentNonBlocking(doc(firestore, 'security_team', contactId), { id: contactId, name, email, addedAt: new Date().toISOString() }, {});
                    (e.target as HTMLFormElement).reset();
                    toast({ title: "Contact Added" });
                  }} className="space-y-4">
                    <Input name="name" placeholder="Name" required />
                    <Input name="email" type="email" placeholder="Email" required />
                    <Button type="submit" className="w-full">Add to Team</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-white">
                <CardHeader><CardTitle className="text-primary">Current Team</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {securityContacts?.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
                      <div><p className="font-bold">{c.name}</p><p className="text-xs opacity-60">{c.email}</p></div>
                      <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(firestore, 'security_team', c.id))} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
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

function KanbanCard({ enquiry, clashes, onUpdateStatus, onSendToSecurity, onSendConfirmation, onEdit, isList }: { enquiry: any, clashes?: ClashingEvent[], onUpdateStatus: (id: string, s: string) => void, onSendToSecurity: (e: any) => void, onSendConfirmation: (e: any) => void, onEdit: (e: any) => void, isList?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingConfirm, setIsSendingConfirm] = useState(false);
  const hasClash = (clashes?.length ?? 0) > 0;

  const handleReviewClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSending(true);
    await onSendToSecurity(enquiry);
    setIsSending(false);
  };

  const handleConfirmClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSendingConfirm(true);
    await onSendConfirmation(enquiry);
    setIsSendingConfirm(false);
  };

  const confirmationStatus = enquiry.confirmationStatus as ('NotSent' | 'Sent' | 'Submitted' | undefined);
  const showConfirmButton = enquiry.status === 'Reviewed' || enquiry.status === 'Confirmed';

  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-all bg-white cursor-pointer overflow-hidden", isExpanded && "ring-2 ring-primary", hasClash && "border-red-400 bg-red-50/40")} onClick={() => setIsExpanded(!isExpanded)}>
      <div className="p-4 space-y-3">
        {hasClash && (
          <div className="flex items-start gap-1.5 text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 rounded-md px-2 py-1.5">
            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>Clashes with live booking{(clashes?.length ?? 0) > 1 ? 's' : ''}</p>
              {isExpanded && clashes!.map((c, i) => (
                <p key={i} className="font-normal opacity-90 mt-0.5">
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
              {['Pending', 'Reviewed', 'Confirmed', 'Rejected'].map(s => (
                <DropdownMenuItem key={s} onClick={(e) => { e.stopPropagation(); onUpdateStatus(enquiry.id, s); }}>Mark as {STATUS_LABELS[s] ?? s}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
           </DropdownMenu>
        </div>
        <div>
          <h4 className="font-bold text-sm text-primary">{enquiry.name}</h4>
          <p className="text-[10px] opacity-60 flex items-center gap-1"><Calendar className="h-3 w-3" /> {enquiry.dateRequired}</p>
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

        {enquiry.status === 'Pending' && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full gap-2 text-[10px] h-8 mt-2"
            onClick={handleReviewClick}
            disabled={isSending}
          >
            {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Request Security Review
          </Button>
        )}

        {showConfirmButton && confirmationStatus !== 'Submitted' && (
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2 text-[10px] h-8 mt-2"
            onClick={handleConfirmClick}
            disabled={isSendingConfirm}
          >
            {isSendingConfirm ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSignature className="h-3 w-3" />}
            {confirmationStatus === 'Sent' ? 'Resend Confirmation' : 'Send Confirmation'}
          </Button>
        )}

        {confirmationStatus === 'Submitted' && (
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-md py-1.5 mt-2">
            <CheckCircle2 className="h-3 w-3" />
            Hire Confirmed by Hirer
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
  onSend: (enquiry: any, amount: number, isFullReturn: boolean, reason?: string) => Promise<boolean>;
}) {
  const [sendingFull, setSendingFull] = useState(false);
  const [deductionOpen, setDeductionOpen] = useState(false);
  const confirmation = enquiry.confirmation || {};
  const fullDeposit = getDepositAmount(enquiry);
  const previousReturn = enquiry.depositReturn as
    | { amount: number; fullDeposit?: number; isFullReturn: boolean; sentAt: string; reason?: string | null }
    | undefined;

  const handleFullReturn = async () => {
    setSendingFull(true);
    await onSend(enquiry, fullDeposit, true);
    setSendingFull(false);
  };

  return (
    <Card className="border shadow-sm bg-white">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-primary text-base">{enquiry.name}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3 w-3" /> {enquiry.dateRequired} · {enquiry.startTime}–{enquiry.endTime}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{enquiry.typeOfEvent}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Deposit</p>
            <p className="text-lg font-bold text-primary">£{fullDeposit.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/30 rounded-xl p-3 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Name</p>
            <p className="font-semibold">{confirmation.accountName || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bank</p>
            <p className="font-semibold">{confirmation.bankName || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Account Number</p>
            <p className="font-mono">{confirmation.accountNumber || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sort Code</p>
            <p className="font-mono">{formatSortCodeDisplay(confirmation.sortCode)}</p>
          </div>
        </div>

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
              <p className="opacity-60 text-[10px] mt-0.5">{format(parseISO(previousReturn.sentAt), 'PPp')}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={handleFullReturn}
            disabled={sendingFull}
          >
            {sendingFull ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            Full Deposit Return
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => setDeductionOpen(true)}
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
          const ok = await onSend(enquiry, amount, false, reason);
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
  { key: 'preferredContact', label: 'Preferred Contact', type: 'select', options: ['Email', 'Phone'] },
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
