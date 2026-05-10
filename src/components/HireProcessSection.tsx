'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const PHASES = [
  {
    label: 'Your Enquiry',
    color: 'hsl(171,44%,38%)',
    steps: [
      { n: 1,  title: 'Check availability',                    desc: 'Use the live calendar to confirm your preferred date and time is free.' },
      { n: 2,  title: 'Complete the enquiry form',             desc: 'Fill in your contact details, event type, and date using the form below.' },
    ],
  },
  {
    label: 'Confirming Your Booking',
    color: 'hsl(197,55%,42%)',
    steps: [
      { n: 3,  title: 'Booking manager reviews your request',  desc: 'Our volunteer bookings secretary will process your enquiry, usually within 3 working days.' },
      { n: 4,  title: 'Viewing arranged',                      desc: 'The team will be in touch to arrange a convenient time for you to visit the Hub.' },
      { n: 5,  title: 'Visit the Hub for a viewing',           desc: 'Come and see the space in person before committing to a booking.' },
      { n: 6,  title: 'Confirm whether to proceed',            desc: 'Let us know if you would like to go ahead with the booking.' },
      { n: 7,  title: 'Agree conditions of hire',              desc: 'Review and confirm your agreement with the standard conditions of hire.' },
      { n: 8,  title: 'Pay your hire charge',                  desc: 'Pay the hire fee to secure your booking on the calendar.' },
    ],
  },
  {
    label: 'Your Hire Day & After',
    color: 'hsl(133,55%,38%)',
    steps: [
      { n: 9,  title: 'Pay the refundable deposit',            desc: 'Two weeks before your hire date, pay the deposit (£50 daytime / £100 evening).' },
      { n: 10, title: 'Our team welcomes you',                 desc: 'A member of the team will be there at your hire time to let you in and lock up afterwards.' },
      { n: 11, title: 'Deposit returned',                      desc: 'Your deposit will be returned within 3 days of your hire, subject to the condition of the Hub.' },
    ],
  },
];

const ALL_STEPS = PHASES.flatMap(p => p.steps.map(s => ({ ...s, phase: p.label, color: p.color })));
const SCROLL_PER_STEP = 160;

export default function HireProcessSection() {
  /* ── Desktop sticky-scroll state ── */
  const outerRef        = useRef<HTMLDivElement>(null);
  const containerTopRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  /* ── Mobile carousel ref ── */
  const carouselRef = useRef<HTMLDivElement>(null);

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

  /* Desktop scroll-driven step progression */
  useEffect(() => {
    const onScroll = () => {
      const scrollInto = window.scrollY - containerTopRef.current;
      const next = Math.max(0, Math.min(ALL_STEPS.length - 1,
        Math.floor(scrollInto / SCROLL_PER_STEP),
      ));
      setActiveIndex(next);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Mobile: update active index from carousel scroll position */
  const onCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const cardSlotWidth = el.scrollWidth / ALL_STEPS.length;
    const idx = Math.round(el.scrollLeft / cardSlotWidth);
    setActiveIndex(Math.max(0, Math.min(ALL_STEPS.length - 1, idx)));
  }, []);

  /* Mobile prev/next buttons — programmatic scroll-snap */
  const scrollToCard = useCallback((i: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const cardSlotWidth = el.scrollWidth / ALL_STEPS.length;
    el.scrollTo({ left: i * cardSlotWidth, behavior: 'smooth' });
  }, []);

  const scrollToForm = () => {
    const el = document.getElementById('booking-form');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  };

  const step             = ALL_STEPS[activeIndex];
  const activePhaseIndex = PHASES.findIndex(p => p.label === step.phase);
  const isLast           = activeIndex === ALL_STEPS.length - 1;

  return (
    <section>
      {/* Section header */}
      <div className="text-center pt-4 pb-4 md:pb-1">
        <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold uppercase tracking-widest mb-3">
          How it works
        </span>
        <h2 className="text-2xl md:text-3xl font-headline font-bold text-foreground">
          Your Hire Journey
        </h2>
        <p className="text-sm text-muted-foreground mt-2 hidden md:block">
          11 steps from first enquiry to event day — scroll to explore.
        </p>
        <p className="text-sm text-muted-foreground mt-2 md:hidden">
          Swipe through 11 steps from enquiry to event day.
        </p>
      </div>

      {/* ══ DESKTOP — sticky scroll, liquid glass ═══════════════════ */}
      <div
        ref={outerRef}
        className="hidden md:block relative"
        style={{ height: `calc(100vh + ${ALL_STEPS.length * SCROLL_PER_STEP}px)` }}
      >
        <div className="sticky top-20 h-[calc(100vh-5rem)] flex items-center">
          <div className="relative w-full">

            {/* Coloured blobs sit *behind* the glass to give it something to refract.
                Wrapped in a softly-masked container so the colour fades into the page at the slab edges. */}
            <div
              aria-hidden
              className="absolute inset-0 -m-10 overflow-hidden rounded-[2.5rem] pointer-events-none"
              style={{
                WebkitMaskImage:
                  'radial-gradient(ellipse 75% 80% at 50% 50%, black 45%, transparent 100%)',
                maskImage:
                  'radial-gradient(ellipse 75% 80% at 50% 50%, black 45%, transparent 100%)',
              }}
            >
              <div
                className="absolute w-[20rem] h-[20rem] rounded-full blur-3xl opacity-40 transition-all duration-1000 ease-out"
                style={{
                  background: PHASES[0].color,
                  top:  `${10 + activeIndex * 4}%`,
                  left: `${-10 + activeIndex * 2}%`,
                }}
              />
              <div
                className="absolute w-[26rem] h-[26rem] rounded-full blur-3xl opacity-35 transition-all duration-1000 ease-out"
                style={{
                  background: PHASES[1].color,
                  top:   `${30 - activeIndex * 2}%`,
                  right: `${5 + activeIndex * 3}%`,
                }}
              />
              <div
                className="absolute w-[24rem] h-[24rem] rounded-full blur-3xl opacity-30 transition-all duration-1000 ease-out"
                style={{
                  background: PHASES[2].color,
                  bottom: `${-5 + activeIndex * 2}%`,
                  left:   `${30 + activeIndex * 1.5}%`,
                }}
              />
            </div>

            {/* The liquid-glass slab — soft top specular, diffuse glow, edges fade into the page */}
            <div
              className="relative w-full flex h-[480px] rounded-[2rem] bg-white/20 backdrop-blur-2xl overflow-hidden"
              style={{
                boxShadow:
                  '0 50px 100px -50px rgba(20,80,70,0.14), ' +    // softer, more diffuse ground shadow
                  'inset 0 1px 0 rgba(255,255,255,0.5), ' +       // top specular highlight
                  'inset 0 -1px 0 rgba(255,255,255,0.12)',        // faint bottom rim catch
                WebkitMaskImage:
                  'radial-gradient(ellipse 100% 100% at 50% 50%, black 70%, transparent 100%)',
                maskImage:
                  'radial-gradient(ellipse 100% 100% at 50% 50%, black 70%, transparent 100%)',
              }}
            >

              {/* Sidebar — step list (subtle column tint, no hard divider, hidden scrollbar) */}
              <div
                className="w-52 shrink-0 bg-white/15 flex flex-col overflow-y-auto px-3 py-4 gap-3 relative z-10 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none' } as React.CSSProperties}
              >
                {PHASES.map((phase, pi) => (
                  <div key={phase.label}>
                    <p className={cn(
                      'text-[10px] font-bold uppercase tracking-widest mb-1 transition-colors duration-300',
                      activePhaseIndex === pi ? 'text-primary' : 'text-muted-foreground/50',
                    )}>
                      {phase.label}
                    </p>
                    <div className="space-y-px">
                      {phase.steps.map(s => {
                        const idx      = ALL_STEPS.findIndex(x => x.n === s.n);
                        const isActive = idx === activeIndex;
                        const isDone   = idx < activeIndex;
                        return (
                          <div key={s.n} className={cn(
                            'flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-all duration-300',
                            isActive ? 'bg-white/70 text-primary font-semibold shadow-sm backdrop-blur-sm' :
                            isDone   ? 'text-foreground/60' :
                                       'text-muted-foreground/40',
                          )}>
                            <span className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border transition-all duration-300',
                              isActive ? 'bg-primary text-primary-foreground border-primary' :
                              isDone   ? 'bg-primary/20 border-primary/30 text-primary' :
                                         'bg-white/40 border-white/50 text-muted-foreground/40',
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

              {/* Animated content — steps slide vertically through the glass */}
              <div className="flex-1 relative overflow-hidden">

                {/* Big watermark numeral, drifts as you scroll */}
                <span
                  aria-hidden
                  className="absolute text-[220px] font-black text-primary/[0.06] select-none pointer-events-none leading-none transition-all duration-700 ease-out"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, calc(-50% + ${(activeIndex % 2 === 0 ? 1 : -1) * 8}px))`,
                  }}
                >
                  {String(step.n).padStart(2, '0')}
                </span>

                {/* Sliding stack — each step is a full-height pane that scrolls through the window */}
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{ transform: `translateY(-${activeIndex * 100}%)` }}
                >
                  {ALL_STEPS.map((s, i) => (
                    <div
                      key={s.n}
                      className="absolute left-0 right-0 h-full flex flex-col items-center justify-center px-12 text-center"
                      style={{ top: `${i * 100}%` }}
                    >
                      <div className={cn(
                        'max-w-lg w-full transition-all duration-700 ease-out',
                        i === activeIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
                      )}>
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm border"
                          style={{
                            background: s.color.replace('hsl(', 'hsla(').replace(')', ' / 0.08)'),
                            color: s.color,
                            borderColor: s.color.replace('hsl(', 'hsla(').replace(')', ' / 0.2)'),
                          }}
                        >
                          {s.phase}
                        </span>
                        <h3 className="text-2xl lg:text-3xl font-headline font-bold text-foreground mb-3 leading-tight">
                          {s.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto text-sm">
                          {s.desc}
                        </p>
                        {i === ALL_STEPS.length - 1 && (
                          <button
                            onClick={scrollToForm}
                            className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md"
                          >
                            Start your enquiry <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top + bottom fade masks — reinforce the "scrolling through a window" feel */}
                <div aria-hidden className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-white/60 to-transparent pointer-events-none z-10" />
                <div aria-hidden className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white/60 to-transparent pointer-events-none z-10" />

                {/* Step counter */}
                <div className="absolute top-4 right-5 text-xs font-medium text-muted-foreground tabular-nums z-20 px-2 py-1 rounded-md bg-white/40 backdrop-blur-sm border border-white/40">
                  {activeIndex + 1} / {ALL_STEPS.length}
                </div>

                {/* Dot progress */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 px-3 py-1.5 rounded-full bg-white/40 backdrop-blur-sm border border-white/40">
                  {ALL_STEPS.map((_, i) => (
                    <span key={i} className={cn(
                      'rounded-full transition-all duration-300',
                      i === activeIndex ? 'w-5 h-1.5 bg-primary' :
                      i < activeIndex   ? 'w-1.5 h-1.5 bg-primary/40' :
                                          'w-1.5 h-1.5 bg-foreground/15',
                    )} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MOBILE — swipeable card carousel ══════════════════════ */}
      <div className="md:hidden">

        {/* Scroll-snap track — bleeds to screen edges so cards peek */}
        <div
          ref={carouselRef}
          onScroll={onCarouselScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-4 -mx-4"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {ALL_STEPS.map((s, i) => (
            <div
              key={s.n}
              className="snap-center shrink-0 w-[82%] first:pl-0 last:pr-0"
            >
              {/* Physical card */}
              <div className="relative bg-card rounded-3xl border border-border shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col min-h-[260px]">

                {/* Coloured top strip */}
                <div className="h-1 w-full" style={{ background: s.color }} />

                {/* Card body */}
                <div className="flex-1 flex flex-col px-6 pt-6 pb-5">
                  {/* Phase + step counter */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: s.color }}
                    >
                      {s.phase}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {i + 1} / {ALL_STEPS.length}
                    </span>
                  </div>

                  {/* Step number watermark + content */}
                  <div className="relative flex-1 flex flex-col justify-center">
                    <span
                      aria-hidden
                      className="absolute -right-2 -bottom-2 text-[96px] font-black leading-none select-none pointer-events-none"
                      style={{ color: s.color, opacity: 0.06 }}
                    >
                      {String(s.n).padStart(2, '0')}
                    </span>

                    {/* Step circle */}
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white mb-4 shrink-0"
                      style={{ background: s.color }}
                    >
                      {s.n}
                    </span>

                    <h3 className="text-base font-bold text-foreground mb-2 leading-snug pr-8">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
                  </div>

                  {/* CTA on last card */}
                  {i === ALL_STEPS.length - 1 && (
                    <button
                      onClick={scrollToForm}
                      className="mt-5 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                      Start your enquiry <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Trailing spacer so last card can centre */}
          <div className="shrink-0 w-4" aria-hidden />
        </div>

        {/* Dot progress + prev/next */}
        <div className="flex items-center justify-between px-4 mt-3">
          <button
            onClick={() => scrollToCard(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous step"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {ALL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToCard(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === activeIndex ? 'w-4 h-2 bg-primary' :
                  i < activeIndex   ? 'w-2 h-2 bg-primary/40' :
                                      'w-2 h-2 bg-border',
                )}
              />
            ))}
          </div>

          <button
            onClick={() => isLast ? scrollToForm() : scrollToCard(activeIndex + 1)}
            aria-label={isLast ? 'Start enquiry' : 'Next step'}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              isLast
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border border-border text-muted-foreground hover:text-primary hover:border-primary',
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
