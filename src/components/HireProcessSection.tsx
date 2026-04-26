'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const PHASES = [
  {
    label: 'Your Enquiry',
    steps: [
      { n: 1,  title: 'Check availability',               desc: 'Use the live calendar to confirm your preferred date and time is free.' },
      { n: 2,  title: 'Complete the enquiry form',        desc: 'Fill in your contact details, event type, and date using the form below.' },
    ],
  },
  {
    label: 'Confirming Your Booking',
    steps: [
      { n: 3,  title: 'Booking manager reviews your request', desc: 'Our volunteer bookings secretary will process your enquiry, usually within 3 working days.' },
      { n: 4,  title: 'Viewing arranged',                 desc: 'The team will be in touch to arrange a convenient time for you to visit the Hub.' },
      { n: 5,  title: 'Visit the Hub for a viewing',      desc: 'Come and see the space in person before committing to a booking.' },
      { n: 6,  title: 'Confirm whether to proceed',       desc: 'Let us know if you would like to go ahead with the booking.' },
      { n: 7,  title: 'Agree conditions of hire',         desc: 'Review and confirm your agreement with the standard conditions of hire.' },
      { n: 8,  title: 'Pay your hire charge',             desc: 'Pay the hire fee to secure your booking on the calendar.' },
    ],
  },
  {
    label: 'Your Hire Day & After',
    steps: [
      { n: 9,  title: 'Pay the refundable deposit',       desc: 'Two weeks before your hire date, pay the deposit (£50 daytime / £100 evening).' },
      { n: 10, title: 'Our team welcomes you',            desc: 'A member of the team will be there at your hire time to let you in and lock up afterwards.' },
      { n: 11, title: 'Deposit returned',                 desc: 'Your deposit will be returned within 3 days of your hire, subject to the condition of the Hub.' },
    ],
  },
];

const ALL_STEPS = PHASES.flatMap(p => p.steps.map(s => ({ ...s, phase: p.label })));
const SCROLL_PER_STEP = 160; // px of scroll distance allocated to each step

export default function HireProcessSection() {
  const outerRef        = useRef<HTMLDivElement>(null);
  const containerTopRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction,   setDirection]   = useState<'down' | 'up'>('down');
  const [animKey,     setAnimKey]     = useState(0);

  /* Cache absolute top of the outer container (recalc on resize) */
  const cacheTop = useCallback(() => {
    if (outerRef.current) {
      containerTopRef.current =
        outerRef.current.getBoundingClientRect().top + window.scrollY;
    }
  }, []);

  useEffect(() => {
    cacheTop();
    window.addEventListener('resize', cacheTop, { passive: true });
    return () => window.removeEventListener('resize', cacheTop);
  }, [cacheTop]);

  /* Scroll-driven step progression (desktop) */
  useEffect(() => {
    const onScroll = () => {
      const scrollInto = window.scrollY - containerTopRef.current;
      const next = Math.max(0, Math.min(ALL_STEPS.length - 1,
        Math.floor(scrollInto / SCROLL_PER_STEP)
      ));
      setActiveIndex(prev => {
        if (prev !== next) {
          setDirection(next > prev ? 'down' : 'up');
          setAnimKey(k => k + 1);
        }
        return next;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Mobile carousel navigation */
  const goTo = useCallback((next: number) => {
    setDirection(next > activeIndex ? 'down' : 'up');
    setAnimKey(k => k + 1);
    setActiveIndex(next);
  }, [activeIndex]);

  const scrollToForm = () => {
    const el = document.getElementById('booking-form');
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const step             = ALL_STEPS[activeIndex];
  const activePhaseIndex = PHASES.findIndex(p => p.label === step.phase);
  const isLast           = activeIndex === ALL_STEPS.length - 1;

  return (
    <section>
      {/* ── Section header (scrolls away normally) ──────────────── */}
      <div className="text-center pt-4 pb-8">
        <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-widest mb-4">
          How it works
        </span>
        <h2 className="text-2xl md:text-3xl font-headline font-bold text-foreground">
          Your Hire Journey
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          11 steps from first enquiry to event day — scroll to explore.
        </p>
      </div>

      {/* ══ DESKTOP — sticky scroll ════════════════════════════════ */}
      <div
        ref={outerRef}
        className="hidden md:block relative"
        style={{ height: `calc(100vh + ${ALL_STEPS.length * SCROLL_PER_STEP}px)` }}
      >
        <div className="sticky top-0 h-screen flex items-center py-6">
          <div className="w-full flex h-full max-h-[640px] rounded-3xl border border-border bg-card shadow-sm overflow-hidden">

            {/* Left sidebar — step list */}
            <div className="w-56 shrink-0 border-r border-border flex flex-col overflow-y-auto p-5 gap-5">
              {PHASES.map((phase, pi) => (
                <div key={phase.label}>
                  <p className={cn(
                    'text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors duration-300',
                    activePhaseIndex === pi ? 'text-primary' : 'text-muted-foreground/40',
                  )}>
                    {phase.label}
                  </p>
                  <div className="space-y-0.5">
                    {phase.steps.map(s => {
                      const idx      = ALL_STEPS.findIndex(x => x.n === s.n);
                      const isActive = idx === activeIndex;
                      const isDone   = idx < activeIndex;
                      return (
                        <div key={s.n} className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-300',
                          isActive ? 'bg-primary/10 text-primary font-semibold' :
                          isDone   ? 'text-muted-foreground/60' :
                                     'text-muted-foreground/30',
                        )}>
                          <span className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border transition-all duration-300',
                            isActive ? 'bg-primary text-primary-foreground border-primary' :
                            isDone   ? 'bg-primary/20 border-primary/30 text-primary' :
                                       'bg-muted/50 border-border text-muted-foreground/30',
                          )}>
                            {isDone ? <Check className="h-2.5 w-2.5" /> : s.n}
                          </span>
                          <span className="leading-tight line-clamp-2">{s.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Right — animated step content */}
            <div className="flex-1 relative flex flex-col items-center justify-center px-12 overflow-hidden">

              {/* Watermark step number */}
              <span
                aria-hidden
                className="absolute text-[200px] font-black text-primary/[0.04] select-none pointer-events-none leading-none"
                style={{ top: '50%', left: '50%', transform: 'translate(-38%, -50%)' }}
              >
                {String(step.n).padStart(2, '0')}
              </span>

              {/* Animated step card — key swap triggers animate-in */}
              <div
                key={animKey}
                className={cn(
                  'relative z-10 max-w-lg w-full text-center',
                  'animate-in fade-in duration-500',
                  direction === 'down' ? 'slide-in-from-bottom-8' : 'slide-in-from-top-8',
                )}
              >
                <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold mb-5">
                  {step.phase}
                </span>
                <h3 className="text-2xl lg:text-3xl font-headline font-bold text-foreground mb-4 leading-tight">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {step.desc}
                </p>

                {isLast && (
                  <button
                    onClick={scrollToForm}
                    className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md"
                  >
                    Start your enquiry
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Step counter */}
              <div className="absolute top-5 right-6 text-xs font-medium text-muted-foreground tabular-nums">
                {activeIndex + 1} / {ALL_STEPS.length}
              </div>

              {/* Dot progress */}
              <div className="absolute bottom-6 flex items-center gap-1.5">
                {ALL_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'rounded-full transition-all duration-300',
                      i === activeIndex ? 'w-6 h-2 bg-primary' :
                      i < activeIndex   ? 'w-2 h-2 bg-primary/40' :
                                          'w-2 h-2 bg-border',
                    )}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ══ MOBILE — tap carousel ══════════════════════════════════ */}
      <div className="md:hidden rounded-2xl border border-border bg-card overflow-hidden shadow-sm">

        {/* Top progress bar */}
        <div className="h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((activeIndex + 1) / ALL_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step content */}
        <div className="px-6 pt-8 pb-4 text-center min-h-[260px] flex flex-col justify-center">
          <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold mb-4 mx-auto">
            {step.phase}
          </span>
          <div
            key={animKey}
            className={cn(
              'animate-in fade-in duration-400',
              direction === 'down' ? 'slide-in-from-right-4' : 'slide-in-from-left-4',
            )}
          >
            <div className="text-6xl font-black text-primary/10 leading-none mb-3 select-none">
              {String(step.n).padStart(2, '0')}
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
          </div>
        </div>

        {/* Prev / dots / next */}
        <div className="flex items-center justify-between px-4 pb-6 gap-3">
          <button
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous step"
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 flex-wrap justify-center">
            {ALL_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === activeIndex ? 'w-4 h-1.5 bg-primary' :
                  i < activeIndex   ? 'w-1.5 h-1.5 bg-primary/40' :
                                      'w-1.5 h-1.5 bg-border',
                )}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={scrollToForm}
              aria-label="Start enquiry"
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next step"
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
