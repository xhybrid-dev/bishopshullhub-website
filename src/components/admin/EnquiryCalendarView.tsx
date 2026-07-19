"use client";

import { useState, useMemo } from 'react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, MapPin, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { eachEventDay, isMultiDayEvent } from '@/lib/event-days';
import type { LiveEvent } from '@/app/actions/get-calendar';
import type { ClashingEvent } from '@/app/actions/check-availability';

const STATUS_PILL_COLORS: Record<string, string> = {
  Pending: 'bg-amber-500',
  Reviewed: 'bg-blue-500',
  Confirmed: 'bg-green-500',
  Rejected: 'bg-red-500',
};

const STATUS_PILL_LABELS: Record<string, string> = {
  Pending: 'Enquiry',
  Reviewed: 'Visit Done',
  Confirmed: 'Confirmed',
  Rejected: 'Rejected',
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  enquiries: any[];
  liveEvents: LiveEvent[];
  clashMap: Record<string, ClashingEvent[]>;
  isLiveLoading: boolean;
  onEditEnquiry: (enquiry: any) => void;
};

export function EnquiryCalendarView({
  enquiries,
  liveEvents,
  clashMap,
  isLiveLoading,
  onEditEnquiry,
}: Props) {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = useMemo(() => startOfMonth(referenceDate), [referenceDate]);
  const monthEnd = useMemo(() => endOfMonth(referenceDate), [referenceDate]);
  const gridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart]);
  const gridEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd]);
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const enquiriesByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    enquiries.forEach(e => {
      if (!e.dateRequired) return;
      try {
        const d = parseISO(e.dateRequired);
        const key = format(d, 'yyyy-MM-dd');
        const existing = map.get(key) ?? [];
        existing.push(e);
        map.set(key, existing);
      } catch {
        // skip invalid dates
      }
    });
    return map;
  }, [enquiries]);

  const liveByDay = useMemo(() => {
    const map = new Map<string, LiveEvent[]>();
    liveEvents.forEach(ev => {
      // Multi-day events appear on every day they cover.
      eachEventDay(parseISO(ev.start), parseISO(ev.end)).forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        const existing = map.get(key) ?? [];
        existing.push(ev);
        map.set(key, existing);
      });
    });
    return map;
  }, [liveEvents]);

  const goPrev = () => setReferenceDate(d => subMonths(d, 1));
  const goNext = () => setReferenceDate(d => addMonths(d, 1));
  const goToday = () => {
    const t = new Date();
    setReferenceDate(t);
    setSelectedDate(t);
  };

  const selectedKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayEnquiries = enquiriesByDay.get(selectedKey) ?? [];
  const selectedDayLive = liveByDay.get(selectedKey) ?? [];

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Month nav — on mobile: title above controls; on desktop: nav | title | legend */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border shadow-sm">
        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center justify-center md:justify-start gap-2 shrink-0">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="text-base md:text-xl font-headline font-bold text-primary text-center md:text-left truncate">
            {format(referenceDate, 'MMMM yyyy')}
          </h3>
          <div className="hidden md:flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Enquiry</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Visit Done</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Confirmed</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Hallmaster</span>
          </div>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 px-1">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEnquiries = enquiriesByDay.get(key) ?? [];
          const dayLive = liveByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, referenceDate);
          const today = isToday(day);
          const selected = isSameDay(day, selectedDate);
          const hasClash = dayEnquiries.some(e => (clashMap[e.id]?.length ?? 0) > 0);

          return (
            <button
              key={key}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'relative bg-white rounded-lg md:rounded-xl border text-left transition-all',
                'min-w-0 overflow-hidden',
                'min-h-[64px] md:min-h-[120px] p-1.5 md:p-2',
                'flex flex-col gap-1',
                inMonth ? 'border-border' : 'border-transparent bg-muted/30 opacity-60',
                today && 'ring-2 ring-primary ring-offset-1',
                selected && 'border-primary md:border-2',
                hasClash && 'bg-red-50/60 border-red-300',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-xs md:text-sm font-bold',
                  today ? 'text-primary' : inMonth ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {format(day, 'd')}
                </span>
                {hasClash && (
                  <AlertTriangle className="h-3 w-3 md:h-3.5 md:w-3.5 text-red-600 shrink-0" />
                )}
              </div>

              {/* Mobile: dot indicators */}
              <div className="md:hidden flex flex-wrap gap-0.5 mt-auto">
                {dayEnquiries.slice(0, 4).map(e => (
                  <span
                    key={e.id}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      STATUS_PILL_COLORS[e.status as string] ?? 'bg-slate-400'
                    )}
                  />
                ))}
                {dayLive.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                )}
              </div>

              {/* Desktop: pills */}
              <div className="hidden md:flex flex-col gap-1 mt-1 overflow-hidden">
                {dayEnquiries.slice(0, 3).map(e => {
                  const isClash = (clashMap[e.id]?.length ?? 0) > 0;
                  return (
                    <span
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); onEditEnquiry(e); }}
                      className={cn(
                        'block text-[10px] leading-tight px-1.5 py-1 rounded-md text-white truncate cursor-pointer hover:opacity-90 transition-opacity',
                        STATUS_PILL_COLORS[e.status as string] ?? 'bg-slate-400',
                        isClash && 'ring-1 ring-red-600 ring-offset-1'
                      )}
                      title={`${e.startTime}–${e.endTime} · ${e.name}`}
                    >
                      {isClash && '⚠ '}{e.startTime} {e.name}
                    </span>
                  );
                })}
                {dayLive.slice(0, Math.max(0, 3 - dayEnquiries.length)).map(ev => (
                  <LiveEventPill key={ev.id} event={ev} day={day} />
                ))}
                {(dayEnquiries.length + dayLive.length) > 3 && (
                  <span className="text-[10px] text-muted-foreground font-semibold px-1">
                    +{(dayEnquiries.length + dayLive.length) - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day schedule */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 md:p-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="min-w-0">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {format(selectedDate, 'EEEE')}
            </h4>
            <p className="text-lg md:text-2xl font-headline font-bold text-primary break-words">
              {format(selectedDate, 'do MMMM yyyy')}
            </p>
          </div>
          {isLiveLoading && (
            <Badge variant="outline" className="text-[10px] shrink-0">Syncing live feed…</Badge>
          )}
        </div>

        {selectedDayEnquiries.length === 0 && selectedDayLive.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-6 text-center">
            No enquiries or live bookings on this day.
          </p>
        ) : (
          <div className="space-y-3">
            {selectedDayEnquiries.map(e => {
              const clashes = clashMap[e.id] ?? [];
              return (
                <EnquirySchedRow
                  key={e.id}
                  enquiry={e}
                  clashes={clashes}
                  onEdit={() => onEditEnquiry(e)}
                />
              );
            })}
            {selectedDayLive.map(ev => (
              <LiveSchedRow key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveEventPill({ event, day }: { event: LiveEvent; day?: Date }) {
  const start = parseISO(event.start);
  const end = parseISO(event.end);
  const multiDay = isMultiDayEvent(start, end);
  const timeFormat = multiDay ? 'EEE HH:mm' : 'HH:mm';
  // On continuation days of a multi-day event, the start time would mislead.
  const pillTime = day && !isSameDay(start, day) ? 'cont.' : format(start, 'HH:mm');
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          onClick={(e) => e.stopPropagation()}
          className="block text-[10px] leading-tight px-1.5 py-1 rounded-md bg-slate-200 text-slate-800 truncate cursor-pointer hover:bg-slate-300 transition-colors"
          title={event.summary}
        >
          {pillTime} {event.summary}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-[calc(100vw-2rem)] text-xs" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2 min-w-0">
          <div className="flex items-start gap-2 min-w-0">
            <Info className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-primary break-words">{event.summary}</p>
              <p className="text-muted-foreground">From Hallmaster</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>
              {format(start, timeFormat)} – {format(end, timeFormat)}
            </span>
          </div>
          {event.location && (
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="break-words min-w-0">{event.location}</span>
            </div>
          )}
          {event.description && (
            <p className="text-muted-foreground italic pt-2 border-t break-words">{event.description}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function EnquirySchedRow({
  enquiry,
  clashes,
  onEdit,
}: {
  enquiry: any;
  clashes: ClashingEvent[];
  onEdit: () => void;
}) {
  const status = (enquiry.status as string) || 'Pending';
  const dotColor = STATUS_PILL_COLORS[status] ?? 'bg-slate-400';
  const statusLabel = STATUS_PILL_LABELS[status] ?? status;
  const hasClash = clashes.length > 0;

  return (
    <button
      onClick={onEdit}
      className={cn(
        'w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm',
        hasClash ? 'bg-red-50 border-red-300' : 'bg-muted/20 border-transparent hover:border-border'
      )}
    >
      <div className={cn('w-1 self-stretch rounded-full shrink-0', dotColor)} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-primary text-sm break-words min-w-0">{enquiry.name}</span>
          <Badge variant="outline" className="text-[9px] uppercase tracking-wider shrink-0">{statusLabel}</Badge>
          {hasClash && (
            <Badge className="text-[9px] uppercase tracking-wider bg-red-600 hover:bg-red-600 shrink-0">
              <AlertTriangle className="h-2.5 w-2.5 mr-1" /> Clash
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-x-3 gap-y-1 flex-wrap">
          <span className="flex items-center gap-1 shrink-0"><Clock className="h-3 w-3" /> {enquiry.startTime}–{enquiry.endTime}</span>
          <span className="break-words min-w-0">{enquiry.typeOfEvent}</span>
        </p>
        {hasClash && (
          <div className="mt-2 text-[11px] bg-white rounded-md p-2 border border-red-200 space-y-1">
            <p className="font-bold text-red-700">Clashes with live booking{clashes.length > 1 ? 's' : ''}:</p>
            {clashes.map((c, i) => {
              const clashStart = parseISO(c.start);
              const clashEnd = parseISO(c.end);
              const clashTimeFormat = isMultiDayEvent(clashStart, clashEnd) ? 'EEE HH:mm' : 'HH:mm';
              return (
                <p key={i} className="text-red-700 break-words">
                  • {c.summary} ({format(clashStart, clashTimeFormat)}–{format(clashEnd, clashTimeFormat)})
                </p>
              );
            })}
          </div>
        )}
      </div>
    </button>
  );
}

function LiveSchedRow({ event }: { event: LiveEvent }) {
  const start = parseISO(event.start);
  const end = parseISO(event.end);
  const timeFormat = isMultiDayEvent(start, end) ? 'EEE HH:mm' : 'HH:mm';
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
      <div className="w-1 self-stretch rounded-full shrink-0 bg-slate-400" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-primary text-sm break-words min-w-0">{event.summary}</span>
          <Badge variant="outline" className="text-[9px] uppercase tracking-wider shrink-0">Hallmaster</Badge>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-x-3 gap-y-1 flex-wrap">
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {format(start, timeFormat)}–{format(end, timeFormat)}
          </span>
          {event.location && (
            <span className="flex items-start gap-1 min-w-0"><MapPin className="h-3 w-3 shrink-0 mt-0.5" /> <span className="break-words">{event.location}</span></span>
          )}
        </p>
        {event.description && (
          <p className="text-[11px] text-muted-foreground italic break-words">{event.description}</p>
        )}
      </div>
    </div>
  );
}
