"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Wifi, Coffee, Users, Car, MapPin, User, Calendar, ClipboardCheck, ArrowRight, ArrowLeft, Info, AlertTriangle, CheckSquare, Mail, Phone as PhoneIcon, Clock, Check, Loader2, Copy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import HireProcessSection from '@/components/HireProcessSection';
import { useFirebase, setDocumentNonBlocking, initiateAnonymousSignIn } from '@/firebase';
import { doc } from 'firebase/firestore';
import { sendEnquiryEmailAction } from '@/app/actions/send-email';
import { checkAvailabilityAction, prefetchAvailabilityCache, type AvailabilityResult } from '@/app/actions/check-availability';

const formSchema = z.object({
  acknowledgedPolicies: z.boolean().refine(v => v === true, "Please acknowledge the policies to continue"),
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(5, "Postal address is required"),
  postcode: z.string().min(5, "Postcode is required"),
  phone: z.string().min(10, "Valid phone number required"),
  preferredContact: z.enum(["Email", "Phone"], {
    required_error: "Please select a preferred contact method",
  }),
  date: z.string().min(1, "Date is required").refine((val) => {
    if (!val) return false;
    const selectedDate = new Date(val);
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() + 14);
    return selectedDate >= minDate;
  }, "Bookings must be at least 14 days in advance"),
  startTime: z.string().min(1, "Start time required"),
  endTime: z.string().min(1, "End time required"),
  attendance: z.string().min(1, "Est. attendance required").refine(
    (v) => parseInt(v) >= 1 && parseInt(v) <= 110,
    "Attendance must be between 1 and 110 (maximum venue capacity)"
  ),
  typeOfEvent: z.string().min(2, "Event type is required"),
  requirements: z.string().optional(),
  agreedToTerms: z.boolean().refine(v => v === true, "You must agree to the terms"),
}).refine((data) => {
  if (!data.startTime || !data.endTime) return true;
  return data.endTime > data.startTime;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type FormValues = z.infer<typeof formSchema>;

export default function HirePage() {
  const { toast } = useToast();
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const [step, setStep] = useState(1);
  const [minDateStr, setMinDateStr] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResult | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const totalSteps = 5;

  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    setMinDateStr(date.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    // Don't kick off anonymous sign-in until the persisted-session check
    // has completed — otherwise we race against the admin's stored token
    // being rehydrated from IndexedDB and end up logging them out.
    if (isUserLoading) return;
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth, isUserLoading]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      postcode: "",
      phone: "",
      preferredContact: "Email",
      date: "",
      startTime: "",
      endTime: "",
      attendance: "",
      typeOfEvent: "",
      requirements: "",
      acknowledgedPolicies: false,
      agreedToTerms: false,
    },
  });

  const startTime = form.watch("startTime");
  const endTime = form.watch("endTime");

  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diff = endMinutes - startMinutes;
    if (diff <= 0) return null;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return { hours: h, minutes: m, totalMinutes: diff };
  };

  const durationInfo = calculateDuration();
  const duration = durationInfo ? `${durationInfo.hours > 0 ? `${durationInfo.hours}h ` : ''}${durationInfo.minutes > 0 ? `${durationInfo.minutes}m` : ''}`.trim() : null;

  const calculateCost = () => {
    if (!durationInfo) return null;
    const totalHours = durationInfo.totalMinutes / 60;
    if (totalHours >= 8) return { cost: 140, isDay: true };
    const cost = Math.ceil(totalHours * 18 * 100) / 100;
    return { cost, isDay: false };
  };

  const costInfo = calculateCost();

  // Quarter-hour time options from 08:00 to 23:45
  const quarterHourOptions = (() => {
    const options: string[] = [];
    for (let h = 8; h < 24; h++) {
      for (const m of [0, 15, 30, 45]) {
        options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return options;
  })();

  // End-time options must be strictly after the chosen start time
  const endTimeOptions = startTime
    ? quarterHourOptions.filter((t) => t > startTime)
    : [];

  // Warm the iCal cache as soon as the page loads so it's ready when the user reaches step 4
  useEffect(() => {
    prefetchAvailabilityCache();
  }, []);

  // Clear end time whenever it would become invalid relative to the new start time
  useEffect(() => {
    if (startTime && endTime && endTime <= startTime) {
      form.setValue('endTime', '', { shouldValidate: false });
    }
  }, [startTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check availability against the live iCal feed whenever date + both times are set
  const date = form.watch("date");
  useEffect(() => {
    if (!date || !startTime || !endTime || endTime <= startTime) {
      setAvailabilityResult(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsCheckingAvailability(true);
      const result = await checkAvailabilityAction(date, startTime, endTime);
      if (!cancelled) {
        setAvailabilityResult(result);
        setIsCheckingAvailability(false);
      }
    }, 600); // debounce — wait for the user to finish adjusting times

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [date, startTime, endTime]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) fieldsToValidate = ['acknowledgedPolicies'];
    if (step === 3) fieldsToValidate = ['name', 'email', 'address', 'postcode', 'phone', 'preferredContact'];
    if (step === 4) fieldsToValidate = ['typeOfEvent', 'date', 'startTime', 'endTime', 'attendance'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const enquiryId = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const enquiryData = {
      id: enquiryId,
      name: values.name,
      emailAddress: values.email,
      phoneNumber: values.phone,
      postalAddress: values.address,
      postcode: values.postcode,
      preferredContact: values.preferredContact,
      dateRequired: values.date,
      startTime: values.startTime,
      endTime: values.endTime,
      typeOfEvent: values.typeOfEvent,
      estimatedAttendance: parseInt(values.attendance),
      additionalRequirements: values.requirements || "None provided",
      submissionDateTime: new Date().toISOString(),
      status: 'Pending'
    };

    try {
      const docRef = doc(firestore, 'booking_enquiries', enquiryId);
      setDocumentNonBlocking(docRef, enquiryData, {});

      await sendEnquiryEmailAction(enquiryData);

      setSubmittedData(enquiryData);
      setIsSubmitted(true);
      
      toast({
        title: "Enquiry Sent",
        description: "We've received your booking enquiry and will be in touch shortly.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit enquiry. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const progress = (step / totalSteps) * 100;

  const formatDate = (isoDate: string) =>
    new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

  const getSummaryText = () => {
    if (!submittedData) return "";
    return `
BOOKING ENQUIRY SUMMARY
------------------------
Enquiry ID: ${submittedData.id}
Submitted: ${new Date(submittedData.submissionDateTime).toLocaleString('en-GB')}

CONTACT INFORMATION:
Name: ${submittedData.name}
Email: ${submittedData.emailAddress}
Phone: ${submittedData.phoneNumber}
Address: ${submittedData.postalAddress}, ${submittedData.postcode}
Preferred Contact: ${submittedData.preferredContact}

EVENT DETAILS:
Date: ${formatDate(submittedData.dateRequired)}
Times: ${submittedData.startTime} - ${submittedData.endTime}
Type: ${submittedData.typeOfEvent}
Attendance: ${submittedData.estimatedAttendance}

REQUIREMENTS:
${submittedData.additionalRequirements}
`.trim();
  };

  const handleCopy = async () => {
    const text = getSummaryText();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: "Enquiry text copied to clipboard." });
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy Unavailable",
        description: "Your browser restricted clipboard access. Please manually select and copy the text.",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-3xl space-y-6">
        <Card className="border-none shadow-2xl overflow-hidden">
          <div className="bg-primary p-6 md:p-8 text-center text-primary-foreground">
            <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 md:h-8 md:w-8" />
            </div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold">Enquiry Received!</h1>
            <p className="opacity-90 mt-2 text-sm md:text-base">Thank you for contacting the Bishops Hull Hub.</p>
          </div>
          <CardContent className="p-6 md:p-8 space-y-6">

            {/* Email confirmation notice */}
            <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex gap-3 items-start">
              <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs md:text-sm text-muted-foreground">
                A confirmation email has been sent to <strong className="text-foreground">{submittedData.emailAddress}</strong> with a copy of your enquiry details.
              </p>
            </div>

            {/* What happens next */}
            <div className="space-y-3">
              <h2 className="text-base md:text-lg font-bold text-primary">What happens next?</h2>
              <ol className="space-y-3">
                {[
                  { step: "1", text: "Our volunteer bookings secretary will review your enquiry, usually within 3 working days." },
                  { step: "2", text: "We will contact you by your preferred method to confirm availability and discuss your event." },
                  { step: "3", text: "Once agreed, you will be asked to pay your deposit to secure the booking." },
                  { step: "4", text: "Your date will be confirmed on our calendar once the deposit is received." },
                ].map((item) => (
                  <li key={item.step} className="flex gap-3 items-start">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">{item.step}</span>
                    <p className="text-xs md:text-sm text-muted-foreground">{item.text}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Enquiry summary */}
            <div className="space-y-3">
              <h2 className="text-base md:text-lg font-bold text-primary border-b pb-2">Your Enquiry Summary</h2>
              <pre className="bg-muted p-4 rounded-xl text-xs md:text-sm font-mono overflow-auto whitespace-pre-wrap border border-border select-all">
                {getSummaryText()}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={handleCopy} className="flex-1 gap-2" variant="outline">
                <Copy className="h-4 w-4" /> Copy Summary
              </Button>
              <Button asChild className="flex-1 bg-primary">
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <section className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-headline font-bold mb-4">Hire the Hub</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Modern facilities for private functions and community groups.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-10 space-y-8 md:space-y-12">
        <div className="max-w-4xl mx-auto">
          {/* Pricing Grid - Optimized for Mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Hourly Hire", value: "£18" },
              { label: "Day Hire", value: "£140.00", description: "8+ hours within a single day" },
              { label: "Daytime Deposit", value: "£50.00", description: "Required to confirm booking" },
              { label: "Evening Deposit", value: "£100.00", description: "Required to confirm booking" },
            ].map((item, idx) => (
              <Card key={idx} className="border-none shadow-md bg-white overflow-hidden">
                <CardContent className="p-3 md:p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</span>
                  <span className="text-xl md:text-3xl font-bold text-primary">{item.value}</span>
                  {'description' in item && <span className="text-xs text-muted-foreground mt-1 leading-tight">{item.description}</span>}
                </CardContent>
              </Card>
            ))}
          </div>

        </div>

        <HireProcessSection />

        <section id="booking-form" className="scroll-mt-24 max-w-7xl mx-auto">
            {/* Form Container - Reduced Mobile Padding */}
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-xl border border-border">
              <div className="mb-6 md:mb-10 space-y-4">
                {/* Step indicator circles with labels */}
                {(() => {
                  const stepLabels = ["Availability", "Policies", "Contact", "Event Details", "Requirements"];
                  return (
                    <div className="flex justify-between items-start mb-2">
                      {stepLabels.map((label, i) => {
                        const stepNum = i + 1;
                        const isActive = stepNum === step;
                        const isComplete = stepNum < step;
                        return (
                          <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
                            {/* Connector line */}
                            <div className="relative w-full flex items-center justify-center">
                              {i > 0 && (
                                <div className={cn(
                                  "absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2",
                                  isComplete || isActive ? "bg-primary/40" : "bg-muted"
                                )} />
                              )}
                              <div className={cn(
                                "relative z-10 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                                isActive
                                  ? "bg-primary text-white border-primary shadow-md shadow-primary/30 scale-110"
                                  : isComplete
                                  ? "bg-primary/20 border-primary/50 text-primary"
                                  : "bg-background border-muted text-muted-foreground"
                              )}>
                                {isComplete ? <Check className="h-3 w-3" /> : stepNum}
                              </div>
                            </div>
                            <span className={cn(
                              "hidden sm:block text-xs text-center font-medium leading-tight transition-colors duration-300",
                              isActive ? "text-primary" : isComplete ? "text-primary/60" : "text-muted-foreground/50"
                            )}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                <Progress value={progress} className="h-1.5 md:h-2" />
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Step {step} of {totalSteps}</span>
                    <h2 className="text-lg md:text-2xl font-headline font-bold text-primary">
                      {step === 1 && "Availability"}
                      {step === 2 && "Policies"}
                      {step === 3 && "Contact"}
                      {step === 4 && "Event Details"}
                      {step === 5 && "Requirements"}
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{Math.round(progress)}%</span>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
                  {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <Calendar className="h-5 w-5" />
                          <h3 className="font-bold">Live Availability</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Check the schedule below for your preferred date.</p>
                        <div className="rounded-xl border border-border overflow-hidden bg-muted/20 w-full">
                          <iframe
                            src="https://v2.hallmaster.co.uk/Scheduler/View/10228?startRoom=0&amp;hideTitle=true&amp;hideTopBar=true&amp;hideButtons=true&amp;disableLinks=true"
                            title="Live booking availability calendar"
                            className="w-full h-[600px] md:h-[800px] border-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="space-y-4">
                        <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
                          <div className="flex items-center gap-2 text-blue-700">
                            <Info className="h-4 w-4" />
                            <h3 className="font-bold">Bouncy Castles</h3>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            See our <Link href="/bouncy-castles" className="text-primary font-semibold hover:underline">guidance page</Link> for requirements.
                          </p>
                        </div>

                        <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                          <div className="flex items-center gap-2 text-amber-700">
                            <AlertTriangle className="h-4 w-4" />
                            <h3 className="font-bold">Fireworks</h3>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Not permitted due to proximity to homes.
                          </p>
                        </div>

                        <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                          <div className="flex items-center gap-2 text-rose-700">
                            <AlertTriangle className="h-4 w-4" />
                            <h3 className="font-bold">Weddings</h3>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            Unfortunately we are unable to accommodate wedding ceremonies or formal receptions.
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="acknowledgedPolicies"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 md:p-6 rounded-xl md:rounded-2xl bg-primary/5 border border-primary/10">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm md:text-base font-bold text-primary cursor-pointer">
                                I acknowledge these policies.
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Email Address</FormLabel>
                            <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferredContact"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Preferred Contact Method</FormLabel>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-1">
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="Email" /></FormControl>
                                  <FormLabel className="font-normal flex items-center gap-1 cursor-pointer"><Mail className="h-4 w-4" /> Email</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="Phone" /></FormControl>
                                  <FormLabel className="font-normal flex items-center gap-1 cursor-pointer"><PhoneIcon className="h-4 w-4" /> Phone</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Postal Address</FormLabel>
                            <FormControl><Textarea placeholder="Full street address" className="min-h-[80px]" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postcode</FormLabel>
                            <FormControl><Input placeholder="e.g. TA1 5EB" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl><Input placeholder="07123 456789" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <FormField
                        control={form.control}
                        name="typeOfEvent"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Type of Event</FormLabel>
                            <FormControl><Input placeholder="e.g. Birthday Party, Community Meeting" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2 p-4 md:p-6 rounded-xl md:rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                          <Info className="h-4 w-4" />
                          Deposit Information
                        </div>
                        <p className="text-xs text-muted-foreground">A deposit is required to confirm your booking. Evening events require a <strong className="text-foreground">£100 deposit</strong>; all other bookings require a <strong className="text-foreground">£50 deposit</strong>. Deposits are payable on confirmation and are refundable subject to the hire conditions.</p>
                      </div>

                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Date Required</FormLabel>
                            <FormControl><Input type="date" min={minDateStr} {...field} /></FormControl>
                            <p className="text-xs text-muted-foreground">Bookings must be made at least 14 days in advance.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select start time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {quarterHourOptions.map((t) => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={!startTime ? "text-muted-foreground" : ""}>
                              End Time
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!startTime}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select end time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {endTimeOptions.map((t) => (
                                  <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!startTime && (
                              <p className="text-xs text-muted-foreground">Select a start time first</p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {duration && costInfo && (
                        <div className="md:col-span-2 p-4 rounded-xl bg-accent/10 border border-accent/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="font-bold text-primary text-xs md:text-sm">Duration: {duration}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-primary text-sm md:text-base">£{costInfo.cost.toFixed(2)}</span>
                              {costInfo.isDay && (
                                <span className="block text-xs text-muted-foreground">Day rate (8h+ cap)</span>
                              )}
                            </div>
                          </div>
                          {!costInfo.isDay && (
                            <p className="text-xs text-muted-foreground">
                              Estimated hire cost at £18/hr. Bookings over 8 hours are capped at £140.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Live availability check */}
                      <div className="md:col-span-2">
                        {isCheckingAvailability && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-muted text-muted-foreground text-xs">
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            Checking live calendar for conflicts…
                          </div>
                        )}

                        {!isCheckingAvailability && availabilityResult?.status === 'available' && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span><strong>This time slot looks free.</strong> No conflicts found on the live calendar.</span>
                          </div>
                        )}

                        {!isCheckingAvailability && availabilityResult?.status === 'clash' && (
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
                            <div className="flex items-center gap-2 text-red-800 text-xs font-bold">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              This time slot conflicts with {availabilityResult.clashes.length} existing booking{availabilityResult.clashes.length > 1 ? 's' : ''}.
                            </div>
                            <ul className="space-y-1 pl-6">
                              {availabilityResult.clashes.map((clash, i) => (
                                <li key={i} className="text-xs text-red-700">
                                  <strong>{clash.summary}</strong> — {new Date(clash.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} to {new Date(clash.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </li>
                              ))}
                            </ul>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pl-6 pt-1">
                              <p className="text-xs text-red-600 flex-1">Please choose a different date or time.</p>
                              <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 shrink-0"
                              >
                                ← View schedule (Step 1)
                              </button>
                            </div>
                          </div>
                        )}

                        {!isCheckingAvailability && availabilityResult?.status === 'error' && (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                            <Info className="h-4 w-4 shrink-0" />
                            {availabilityResult.message}
                          </div>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name="attendance"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Est. Attendance</FormLabel>
                            <FormControl><Input type="number" min="1" max="110" placeholder="e.g. 50" {...field} /></FormControl>
                            <p className="text-xs text-muted-foreground">Maximum venue capacity is 110 people.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                      <FormField
                        control={form.control}
                        name="requirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Requirements</FormLabel>
                            <FormControl><Textarea placeholder="Kitchen access, bar service, etc." className="min-h-[100px]" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="agreedToTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 rounded-xl bg-muted/30">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="cursor-pointer text-xs md:text-sm">
                                I agree to the <Link href="/hire-agreement" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Standard Conditions</Link>.
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="flex justify-between pt-4 md:pt-6 border-t border-muted">
                    <Button type="button" variant="ghost" onClick={prevStep} disabled={step === 1} className={cn(step === 1 && "invisible")}>
                      <ArrowLeft className="mr-1 h-4 w-4" /> Back
                    </Button>

                    {step < totalSteps ? (
                      <Button type="button" onClick={nextStep} className="bg-primary hover:bg-primary/90 px-6 md:px-8">
                        {step === 1 ? "Start" : "Next"} <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit" className="bg-primary hover:bg-primary/90 px-8" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit Enquiry
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </div>
        </section>

        <div className="max-w-4xl mx-auto">
          {/* Overviews - Reduced Mobile Padding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="p-5 md:p-6"><CardTitle className="text-lg md:text-xl text-primary font-headline">Facility Overview</CardTitle></CardHeader>
              <CardContent className="p-5 md:p-6 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Users, label: "Capacity", value: "Up to 110" },
                  { icon: Wifi, label: "Wifi", value: "Free" },
                  { icon: Coffee, label: "Kitchen", value: "Catering spec" },
                  { icon: Car, label: "Parking", value: "18 spaces" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 md:p-3 rounded-lg bg-muted/30">
                    <item.icon className="h-4 w-4 text-primary shrink-0" />
                    <div><p className="text-xs text-muted-foreground uppercase font-bold">{item.label}</p><p className="text-xs md:text-sm font-semibold">{item.value}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white">
              <CardHeader className="p-5 md:p-6"><CardTitle className="text-lg md:text-xl text-primary font-headline">Booking Checklist</CardTitle></CardHeader>
              <CardContent className="p-5 md:p-6 pt-0 space-y-2 md:space-y-3">
                {[
                  "Check live schedule",
                  "Read Bouncy Castle rules",
                  "Capacity max 110",
                  "Agree to Hire Conditions",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-xs md:text-sm">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
