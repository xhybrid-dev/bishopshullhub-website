
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Loader2, Zap, CalendarDays, MapPin, ChevronLeft, ChevronRight, ExternalLink, ShoppingBag, Ticket, Heart } from 'lucide-react';
import { getLiveCalendarEventsAction, LiveEvent } from '@/app/actions/get-calendar';
import { format, isToday, parseISO, startOfWeek, addDays, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { eventOverlapsDay, isMultiDayEvent } from '@/lib/event-days';

export default function WhatsOnPage() {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  // Calculate the week bounds based on the reference date
  const weekStart = useMemo(() => startOfWeek(referenceDate, { weekStartsOn: 1 }), [referenceDate]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const daysInWeek = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  // Fetch Live iCal Feed
  useEffect(() => {
    async function fetchLive() {
      setIsLiveLoading(true);
      const result = await getLiveCalendarEventsAction();
      if (result.success && result.events) {
        setLiveEvents(result.events);
      }
      setIsLiveLoading(false);
    }
    fetchLive();
  }, []);

  // Filter events for the selected day, including multi-day events that
  // started earlier but are still running on it.
  const dailyLiveEvents = useMemo(() => {
    return liveEvents.filter(event =>
      eventOverlapsDay(parseISO(event.start), parseISO(event.end), selectedDate)
    );
  }, [liveEvents, selectedDate]);

  const handlePrevWeek = () => {
    const newRef = subWeeks(referenceDate, 1);
    setReferenceDate(newRef);
    setSelectedDate(startOfWeek(newRef, { weekStartsOn: 1 }));
  };

  const handleNextWeek = () => {
    const newRef = addWeeks(referenceDate, 1);
    setReferenceDate(newRef);
    setSelectedDate(startOfWeek(newRef, { weekStartsOn: 1 }));
  };

  const handleToday = () => {
    const today = new Date();
    setReferenceDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="container mx-auto px-4 py-16 space-y-12">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm">
          <Zap className="h-5 w-5 text-accent animate-pulse" /> Live Hub Calendar
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">What's On</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Explore the live schedule for the Bishops Hull Hub. Select a week and day to see specific hall bookings and community events.
        </p>
      </div>

      {/* Week & Day Selector */}
      <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-border space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Week Commencing</h2>
            <p className="text-2xl font-headline font-bold text-primary">
              {format(weekStart, 'MMMM do, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-2xl">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="rounded-xl">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={handleToday} className="px-4 font-bold rounded-xl bg-white shadow-sm">
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextWeek} className="rounded-xl">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-4">
          {daysInWeek.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center justify-center py-3 px-1 rounded-2xl transition-all duration-200 border-2 min-w-0",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground shadow-lg scale-105 z-10"
                    : "bg-transparent border-transparent hover:bg-muted text-muted-foreground",
                  !isSelected && isCurrentDay && "border-accent/30 bg-accent/5"
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-tight mb-1 leading-none", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {format(day, 'EEE')}
                </span>
                <span className="text-base md:text-xl font-bold font-headline leading-none">
                  {format(day, 'd')}
                </span>
                {isCurrentDay && !isSelected && (
                  <div className="w-1 h-1 bg-accent rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-3">
              {format(selectedDate, 'EEEE, MMMM do')}
              {isToday(selectedDate) && (
                <Badge className="bg-accent text-primary-foreground hover:bg-accent">TODAY</Badge>
              )}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2 hidden sm:flex">
            <CalendarDays className="h-4 w-4" />
            {dailyLiveEvents.length} events scheduled
          </p>
        </div>
        
        {isLiveLoading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Fetching live Hallmaster data...</p>
          </div>
        ) : dailyLiveEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dailyLiveEvents.map((event) => {
              const eventStart = parseISO(event.start);
              const eventEnd = parseISO(event.end);
              const timeFormat = isMultiDayEvent(eventStart, eventEnd) ? 'EEE HH:mm' : 'HH:mm';
              return (
              <Card key={event.id} className="border-none shadow-lg bg-white overflow-hidden group hover:shadow-xl transition-all duration-300 rounded-[2rem] flex flex-col">
                <div className="p-8 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 font-bold text-xs uppercase">
                      Hall Booking
                    </Badge>
                    <div className="flex items-center gap-1.5 text-primary font-bold text-sm bg-primary/5 px-3 py-1 rounded-full">
                      <Clock className="h-3.5 w-3.5" />
                      {format(eventStart, timeFormat)} - {format(eventEnd, timeFormat)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-headline font-bold text-primary group-hover:text-accent transition-colors">
                      {event.summary}
                    </h3>
                    {event.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 italic">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest pt-4">
                      <MapPin className="h-3 w-3" /> {event.location}
                    </div>
                  )}
                </div>
              </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center space-y-6 bg-muted/20 rounded-[3rem] border-2 border-dashed max-w-4xl mx-auto">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
            <div className="space-y-2 px-4">
              <h3 className="text-xl font-bold text-muted-foreground">No bookings found for this day</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                The hall might be free for a last-minute booking! Check our availability to confirm.
              </p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 rounded-2xl px-8 shadow-lg">
              <a href="/hire#booking-form">Check Availability</a>
            </Button>
          </div>
        )}
      </div>

      <section id="tickets" className="space-y-8 mt-16 scroll-mt-24">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 text-primary font-bold rounded-full text-sm uppercase tracking-wider">
            Tickets & Fundraisers
          </div>
          <h2 className="text-4xl font-headline font-bold text-primary">Special Event Tickets</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Support the Hub and the village community by attending our special events. Purchase your tickets securely through our SumUp store.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] border border-border">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 md:p-12 space-y-8 flex flex-col justify-center">
                  <div className="space-y-4">
                    <h3 className="text-2xl md:text-3xl font-headline font-bold text-primary">Bishops Hull Hub Store</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Visit our dedicated SumUp store to browse tickets for upcoming fundraisers, village events, and commemorative items.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: Ticket, text: "One-off event tickets" },
                      { icon: Heart, text: "Donations & Fundraisers" },
                      { icon: ShoppingBag, text: "Commemorative items" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <div className="p-2 bg-primary/5 rounded-lg text-primary">
                          <item.icon className="h-5 w-5" />
                        </div>
                        {item.text}
                      </div>
                    ))}
                  </div>

                  <Button asChild size="lg" className="w-full sm:w-fit bg-primary hover:bg-primary/90 rounded-2xl h-14 px-8 text-lg shadow-xl">
                    <a href="https://bishopshullhub.sumupstore.com/" target="_blank" rel="noopener noreferrer" className="gap-3">
                      Visit SumUp Store <ExternalLink className="h-5 w-5" />
                    </a>
                  </Button>
                </div>
                <div className="bg-primary/5 p-8 flex items-center justify-center relative min-h-[300px] hidden lg:flex">
                  <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                    <ShoppingBag className="w-64 h-64 -rotate-12 -translate-x-12 translate-y-12" />
                  </div>
                  <div className="text-center space-y-6 relative z-10">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-primary/10 inline-block">
                      <ShoppingBag className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="font-bold text-primary">Secure Payments</p>
                      <p className="text-xs text-muted-foreground">Powered by SumUp</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
