"use client";

import { useEffect, useRef, useState, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, CheckCircle2, Calendar, Clock, AlertTriangle, FileSignature, Eraser, Lock, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { submitHireConfirmationAction } from '@/app/actions/send-email';
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

export default function HireConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const enquiryRef = useMemoFirebase(() => doc(firestore, 'booking_enquiries', id), [firestore, id]);
  const { data: enquiry, isLoading, error } = useDoc(enquiryRef);

  const [yourName, setYourName] = useState('');
  const [yourEmail, setYourEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [acceptedAll, setAcceptedAll] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (enquiry && !yourName) {
      setYourName(enquiry.name || '');
      setYourEmail(enquiry.emailAddress || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiry]);

  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match the canvas backing store to its CSS size for a crisp signature.
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ececec';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';
  }, []);

  const getPos = (evt: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !lastPointRef.current) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    if (!hasSignature) setHasSignature(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    lastPointRef.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ececec';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
  };

  const today = new Date().toISOString().substring(0, 10);

  const validate = (): string | null => {
    if (!yourName.trim()) return 'Please enter your name.';
    if (!yourEmail.trim()) return 'Please enter your email.';
    if (!bankName.trim()) return 'Please enter the bank name.';
    if (!/^\d{8}$/.test(accountNumber.trim())) return 'Account number must be 8 digits.';
    if (!/^\d{6}$/.test(sortCode.replace(/[-\s]/g, ''))) return 'Sort code must be 6 digits.';
    if (!accountName.trim()) return 'Please enter the account name.';
    if (!acceptedAll) return 'Please confirm you have read and agree to all conditions.';
    if (!hasSignature) return 'Please sign in the box below.';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast({ variant: 'destructive', title: 'Please complete the form', description: err });
      return;
    }
    if (!enquiry || !enquiryRef) return;

    setSubmitting(true);
    try {
      const signatureDataUrl = canvasRef.current?.toDataURL('image/png') || '';
      const confirmedAt = new Date().toISOString();
      const cleanSortCode = sortCode.replace(/[-\s]/g, '');

      const confirmation = {
        yourName: yourName.trim(),
        yourEmail: yourEmail.trim(),
        organisation: organisation.trim(),
        confirmedAt: today,
        bookingDate: enquiry.dateRequired,
        startTime: enquiry.startTime,
        endTime: enquiry.endTime,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        sortCode: cleanSortCode,
        accountName: accountName.trim(),
      };

      await updateDoc(enquiryRef, {
        confirmationStatus: 'Submitted',
        confirmationSubmittedAt: confirmedAt,
        confirmation: {
          ...confirmation,
          // Signature image kept in Firestore for the admin record.
          signatureDataUrl,
        },
      });

      const result = await submitHireConfirmationAction({
        enquiryData: enquiry,
        confirmation: { ...confirmation, signatureDataUrl },
      });

      if (!result.success) {
        toast({ variant: 'destructive', title: 'Email Send Failed', description: result.error || 'Saved, but email could not be sent.' });
      }

      setSubmitted(true);
      toast({ title: 'Hire Confirmed', description: 'Thank you — your hire agreement has been received.' });
    } catch (e: any) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Submission Failed', description: e.message || 'Please try again or contact us directly.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading your booking…</p>
      </div>
    );
  }

  if (error || !enquiry) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 bg-red-100 text-red-600 rounded-full w-fit mb-4">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <CardTitle>Booking Not Found</CardTitle>
            <CardDescription>We couldn't find this booking. The link may have expired.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline"><Link href="/">Back to Home</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted || enquiry.confirmationStatus === 'Submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <div className="w-full max-w-md space-y-4">
          <Card className="border-none shadow-2xl">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto p-4 bg-green-100 text-green-600 rounded-full w-fit">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <CardTitle className="text-2xl font-headline text-primary">Hire Confirmed</CardTitle>
              <CardDescription>
                Thank you. We've received your signed hire agreement and bank details.
                You'll get a confirmation email shortly, and we'll arrange your invoice for payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-2">
              <Button asChild variant="outline"><Link href="/">Back to Home</Link></Button>
            </CardContent>
          </Card>

          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 flex items-start gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-amber-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Save This Number</p>
              <p className="text-sm text-amber-950 mt-1">
                For any issues <span className="font-bold">during your hire</span>, call {SITE_CONTACT.name}:
              </p>
              <a
                href={SITE_CONTACT.telHref}
                className="inline-block mt-2 text-lg font-bold text-amber-900 hover:underline"
              >
                {SITE_CONTACT.displayPhone}
              </a>
              <p className="text-[11px] text-amber-800 mt-1.5 font-medium">
                {SITE_CONTACT.notForBookings}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (enquiry.confirmationStatus !== 'Sent' && enquiry.confirmationStatus !== 'Submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 bg-amber-100 text-amber-600 rounded-full w-fit mb-4">
              <Lock className="h-10 w-10" />
            </div>
            <CardTitle>Confirmation Not Yet Issued</CardTitle>
            <CardDescription>This confirmation link isn't active yet. Please wait for our booking team to send the confirmation request.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline"><Link href="/">Back to Home</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <Card className="max-w-3xl mx-auto border-none shadow-2xl overflow-hidden">
        <div className="bg-primary p-8 text-primary-foreground flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80">
              <FileSignature className="h-4 w-4" /> Hire Confirmation
            </div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold">Confirm Your Booking</h1>
          </div>
          <Badge className="bg-white/20 text-white border-none px-3 py-1 font-mono text-xs">
            ID: {enquiry.id.substring(0, 8)}
          </Badge>
        </div>

        <CardContent className="p-8 space-y-10">
          {/* Booking summary */}
          <section>
            <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-3">Your Booking</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/40 rounded-2xl p-5 border">
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Event</Label>
                <p className="font-bold text-primary">{enquiry.typeOfEvent}</p>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date</Label>
                <p className="flex items-center gap-1.5 font-medium"><Calendar className="h-4 w-4 text-muted-foreground" />{enquiry.dateRequired}</p>
              </div>
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Time</Label>
                <p className="flex items-center gap-1.5 font-medium"><Clock className="h-4 w-4 text-muted-foreground" />{enquiry.startTime} – {enquiry.endTime}</p>
              </div>
            </div>
          </section>

          {/* Hirer info */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Your Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="yourName">Your Name</Label>
                <Input id="yourName" value={yourName} onChange={e => setYourName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="yourEmail">Your Email</Label>
                <Input id="yourEmail" type="email" value={yourEmail} onChange={e => setYourEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="organisation">Organisation <span className="text-muted-foreground text-xs">(if applicable)</span></Label>
                <Input id="organisation" value={organisation} onChange={e => setOrganisation(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Conditions */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Agreement of Conditions of Hire</h2>
            <p className="text-sm text-muted-foreground">
              If you are in any doubt as to the meaning of any of the Conditions, please seek clarification from us before signing.
              The full <Link href="/hire-agreement" target="_blank" className="text-primary underline">conditions of hire</Link> are available on our website.
            </p>
            <ol className="space-y-2.5 text-sm text-foreground list-decimal pl-5 marker:text-muted-foreground">
              {HIRE_CONDITIONS.map((c, i) => <li key={i}>{c}</li>)}
            </ol>
            <label className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 cursor-pointer">
              <Checkbox
                checked={acceptedAll}
                onCheckedChange={(v) => setAcceptedAll(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                I have read, understood and agree to <strong>all</strong> of the conditions above, and the
                <Link href="/hire-agreement" target="_blank" className="text-primary underline ml-1">full Hire Agreement</Link>.
              </span>
            </label>
          </section>

          {/* Bank details */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Bank Details (for deposit return)</h2>
            <p className="text-xs text-muted-foreground">
              Your bank details are used solely to return your refundable deposit. Please enter your <strong>account number</strong>, not a card number.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accountName">Name on Account</Label>
                <Input id="accountName" value={accountName} onChange={e => setAccountName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accountNumber">Account Number <span className="text-muted-foreground text-xs">(8 digits)</span></Label>
                <Input
                  id="accountNumber"
                  inputMode="numeric"
                  maxLength={8}
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <p className="text-[10px] text-muted-foreground">{8 - accountNumber.length} characters remaining</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sortCode">Sort Code <span className="text-muted-foreground text-xs">(6 digits)</span></Label>
                <Input
                  id="sortCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={sortCode}
                  onChange={e => setSortCode(e.target.value.replace(/[^\d]/g, ''))}
                  required
                />
                <p className="text-[10px] text-muted-foreground">{6 - sortCode.replace(/[-\s]/g, '').length} characters remaining</p>
              </div>
            </div>
          </section>

          {/* Signature */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Signature</h2>
            <p className="text-sm text-muted-foreground">Please sign in the box below using your finger, stylus or mouse.</p>
            <div className="rounded-xl border border-dashed border-primary/30 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="block w-full h-[222px] touch-none cursor-crosshair bg-[#ececec]"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Dated: {today}</span>
              <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={clearSignature}>
                <Eraser className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>
          </section>

          <div className="pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-14 text-lg gap-2"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              Submit Hire Confirmation
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-3">
              By clicking submit you confirm that the information above is correct and you agree to the conditions of hire.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-2xl mx-auto mt-6">
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
            <Phone className="h-5 w-5 text-amber-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Site Contact — During Your Hire</p>
            <p className="text-sm text-amber-950 mt-1">
              If you have any issues on the day of your hire (access, facilities, anything on-site), call {SITE_CONTACT.name}:
            </p>
            <a
              href={SITE_CONTACT.telHref}
              className="inline-block mt-2 text-lg font-bold text-amber-900 hover:underline"
            >
              {SITE_CONTACT.displayPhone}
            </a>
            <p className="text-[11px] text-amber-800 mt-1.5 font-medium">
              {SITE_CONTACT.notForBookings}. For booking enquiries, please email bhhubbookings@gmail.com.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mt-6 text-xs text-muted-foreground">
        Bishops Hull Hub &bull; bhhubbookings@gmail.com
      </div>
    </div>
  );
}
