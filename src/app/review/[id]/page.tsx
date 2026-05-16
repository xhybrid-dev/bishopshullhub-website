
"use client";

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, ShieldCheck, CheckCircle2, Clock, Calendar, User, Info, AlertTriangle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SecurityReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUpdated, setHasUpdated] = useState(false);
  const [comments, setComments] = useState('');

  const enquiryRef = useMemoFirebase(() => doc(firestore, 'booking_enquiries', id), [firestore, id]);
  const { data: enquiry, isLoading, error } = useDoc(enquiryRef);

  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      if (!enquiryRef) return;
      const trimmed = comments.trim();
      const update: Record<string, any> = {
        status: 'Reviewed',
        securityReviewedAt: new Date().toISOString(),
      };
      if (trimmed) {
        update.securityComments = trimmed;
        update.securityCommentsAcknowledged = false;
      }
      await updateDoc(enquiryRef, update);
      setHasUpdated(true);
      toast({
        title: "Review Submitted",
        description: trimmed
          ? "Your comments have been sent to the booking manager."
          : "This booking has been marked as Reviewed.",
      });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Action Failed", description: "You may not have permission to perform this update, or the booking is already confirmed." });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Fetching booking details...</p>
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
            <CardTitle>Enquiry Not Found</CardTitle>
            <CardDescription>
              We couldn't find the booking record or you don't have access to view it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasUpdated || enquiry.status === 'Reviewed' || enquiry.status === 'Confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="max-w-md w-full border-none shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto p-4 bg-green-100 text-green-600 rounded-full w-fit">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl font-headline text-primary">Task Complete</CardTitle>
            <CardDescription>
              This booking has been reviewed and logged. No further action is required from the Security Team.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-4">
            <p className="text-sm text-muted-foreground">Thank you for your assistance in maintaining the Hub's safety.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <Card className="max-w-2xl mx-auto border-none shadow-2xl overflow-hidden">
        <div className="bg-primary p-8 text-primary-foreground flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80">
              <ShieldCheck className="h-4 w-4" /> Security Review Required
            </div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold">Booking Triage</h1>
          </div>
          <Badge className="bg-white/20 text-white border-none px-3 py-1 font-mono text-xs">
            ID: {enquiry.id.substring(0, 8)}
          </Badge>
        </div>

        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Event Information</Label>
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                  <Calendar className="h-5 w-5" /> {enquiry.typeOfEvent}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Requested Times</Label>
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="h-5 w-5 text-muted-foreground" /> 
                  {enquiry.dateRequired} | {enquiry.startTime} - {enquiry.endTime}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Hirer Name</Label>
                <div className="flex items-center gap-2 font-medium">
                  <User className="h-5 w-5 text-muted-foreground" /> {enquiry.name}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Estimated Attendance</Label>
                <div className="flex items-center gap-2 font-medium">
                  <Info className="h-5 w-5 text-muted-foreground" /> {enquiry.estimatedAttendance} People
                </div>
              </div>
            </div>
          </div>

          {enquiry.additionalRequirements && (
            <div className="bg-muted/50 p-6 rounded-2xl border border-border">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 block">Hirer Notes & Requirements</Label>
              <p className="text-sm italic text-foreground leading-relaxed">"{enquiry.additionalRequirements}"</p>
            </div>
          )}

          <div className="pt-8 border-t space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Comments for the Booking Manager
                <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">(Optional)</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                If the Booking Manager needs to action anything before the hire is confirmed — for example a change to the time, attendance numbers, or specific requirements — please note it here. These comments will appear prominently against the booking in the admin portal.
              </p>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={4}
                placeholder="e.g. Please ask the hirer to bring the start time forward by 30 minutes, or confirm stewarding arrangements for the expected attendance."
                disabled={isUpdating}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-primary">Security Confirmation</h3>
              <p className="text-sm text-muted-foreground">
                By clicking "Approve Event", you are confirming that the Security Team is happy with the type of event and estimated attendance for this date. Any comments above will be sent to the booking manager.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleApprove}
                className="flex-1 h-14 text-lg bg-primary hover:bg-primary/90 gap-2 shadow-lg"
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                Approve Event
              </Button>
              <Button asChild variant="outline" className="flex-1 h-14 text-lg">
                <a href={`mailto:bhhubbookings@gmail.com?subject=RE: Booking Query ID ${enquiry.id}`}>
                  Email Admin
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center mt-8 text-xs text-muted-foreground">
        Bishops Hull Hub Security Management Portal
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("block", className)}>{children}</span>;
}
