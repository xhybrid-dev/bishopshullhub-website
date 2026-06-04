'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASES = [
  {
    label: 'Your Enquiry',
    steps: [
      { n: 1,  title: 'Check availability',                   desc: 'Confirm your date and time is available on the live calendar.' },
      { n: 2,  title: 'Submit your enquiry form',             desc: 'Fill in your details using the form on the Hire page.' },
    ],
  },
  {
    label: 'Confirming Your Booking',
    steps: [
      { n: 3,  title: 'Booking manager reviews your request', desc: 'Our volunteer bookings secretary will be in touch, usually within 3 working days.' },
      { n: 4,  title: 'Viewing arranged',                     desc: "We'll contact you to arrange a convenient time to visit the Hub." },
      { n: 5,  title: 'Visit the Hub for a viewing',          desc: 'Come and see the space in person before committing.' },
      { n: 6,  title: 'Confirm whether to proceed',           desc: "Let us know if you'd like to go ahead." },
      { n: 7,  title: 'Agree conditions of hire',             desc: 'Review and confirm the standard conditions of hire.' },
      { n: 8,  title: 'Pay your hire charge',                 desc: 'Pay the hire fee to secure your date on the calendar.' },
    ],
  },
  {
    label: 'Your Hire Day & After',
    steps: [
      { n: 9,  title: 'Pay the refundable deposit',           desc: 'Due 2 weeks before your hire date (£50 daytime / £100 evening).' },
      { n: 10, title: 'Our team welcomes you',                desc: 'A member of the team will be there to let you in and lock up.' },
      { n: 11, title: 'Deposit returned',                     desc: 'Returned within 5 working days, subject to the condition of the Hub.' },
    ],
  },
];

const DONE  = new Set([1, 2]);
const NEXT  = 3;

export default function HireJourneyAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(
      'rounded-2xl border border-border bg-card transition-shadow duration-300',
      open ? 'shadow-md' : 'shadow-sm',
    )}>

      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-4 text-left group"
      >
        {/* Icon bubble */}
        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">Hire Journey</p>
          <p className="text-xs text-muted-foreground mt-0.5">What to expect from enquiry to event day</p>
        </div>

        <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full shrink-0">
          11 steps
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300 ml-1',
          open && 'rotate-180',
        )} />
      </button>

      {/* ── Expandable timeline ── */}
      <div className={cn(
        'grid transition-all duration-500 ease-in-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}>
        <div className="overflow-hidden">
          <div className="px-5 pb-7 pt-1">

            <div className="h-px bg-border mb-6" />

            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Submitted your enquiry? Here is exactly what happens next and what to look out for at each stage.
            </p>

            {PHASES.map((phase, pi) => {
              const allDone = phase.steps.every(s => DONE.has(s.n));
              const totalSteps = PHASES.flatMap(p => p.steps).length;
              const globalSteps = PHASES.flatMap(p => p.steps);

              return (
                <div key={phase.label}>

                  {/* "Enquiry submitted" milestone between phase 1 and 2 */}
                  {pi === 1 && (
                    <div className="flex items-center gap-3 my-3 pl-[2px]">
                      <div className="flex flex-col items-center w-5 shrink-0">
                        <div className="w-0.5 h-3 bg-primary/25" />
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/8 border border-primary/20 rounded-full text-[11px] font-semibold text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Enquiry submitted
                      </span>
                    </div>
                  )}

                  {/* Phase label */}
                  <div className="flex items-center gap-2 mb-2 pl-[2px]">
                    <div className="w-5 shrink-0" />
                    <p className={cn(
                      'text-[10px] font-bold uppercase tracking-widest',
                      allDone ? 'text-muted-foreground/40' : pi === 1 ? 'text-primary/70' : 'text-muted-foreground/60',
                    )}>
                      {phase.label}
                    </p>
                  </div>

                  {/* Steps */}
                  {phase.steps.map((step, si) => {
                    const isDone   = DONE.has(step.n);
                    const isNext   = step.n === NEXT;
                    const globalIdx = globalSteps.findIndex(s => s.n === step.n);
                    const isVeryLast = globalIdx === totalSteps - 1;
                    const isLastInPhase = si === phase.steps.length - 1;

                    return (
                      <div key={step.n} className="flex gap-3 pl-[2px]">

                        {/* Circle + connector */}
                        <div className="flex flex-col items-center shrink-0 w-5">
                          {isNext ? (
                            /* Pulsing ring for "next step" */
                            <span className="relative flex h-5 w-5 shrink-0 mt-0.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-25" />
                              <span className="relative inline-flex h-5 w-5 rounded-full bg-primary text-primary-foreground items-center justify-center text-[10px] font-bold">
                                {step.n}
                              </span>
                            </span>
                          ) : (
                            <span className={cn(
                              'h-5 w-5 mt-0.5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0',
                              isDone
                                ? 'bg-primary/15 border-primary/30 text-primary'
                                : 'bg-transparent border-border text-muted-foreground/40',
                            )}>
                              {isDone ? <Check className="h-2.5 w-2.5" /> : step.n}
                            </span>
                          )}

                          {/* Connector line */}
                          {!isVeryLast && (
                            <div className={cn(
                              'w-0.5 flex-1 my-0.5 min-h-[1.75rem]',
                              isDone ? 'bg-primary/20' : 'bg-border/70',
                            )} />
                          )}
                        </div>

                        {/* Text */}
                        <div className={cn(
                          'pb-4 pt-0.5 flex-1 min-w-0',
                          isVeryLast && 'pb-0',
                        )}>
                          {isNext && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold uppercase tracking-wide mb-1.5">
                              Your next step
                            </span>
                          )}
                          <p className={cn(
                            'font-semibold text-sm leading-snug',
                            isDone ? 'text-muted-foreground/45' :
                            isNext ? 'text-foreground' :
                                     'text-muted-foreground/65',
                          )}>
                            {step.title}
                          </p>
                          <p className={cn(
                            'text-xs mt-0.5 leading-relaxed',
                            isDone ? 'text-muted-foreground/35' : 'text-muted-foreground',
                          )}>
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Gap between phases */}
                  {pi < PHASES.length - 1 && <div className="h-2" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
