'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { sendEnquiryEmailAction } from '@/app/actions/send-email';

type MessageRole = 'user' | 'model';
type MessageKind = 'text' | 'system';

interface Message {
  role: MessageRole;
  text: string;
  kind?: MessageKind; // 'system' = stylised confirmation/error pill, not part of LLM history
}

interface PreparedSubmission {
  name: string;
  emailAddress: string;
  phoneNumber: string;
  postalAddress: string;
  postcode: string;
  preferredContact: 'Email' | 'Phone';
  dateRequired: string;
  startTime: string;
  endTime: string;
  typeOfEvent: string;
  estimatedAttendance: number;
  additionalRequirements: string;
  source: 'chat';
}

const WELCOME_MESSAGE: Message = {
  role: 'model',
  text: "Hi! I'm the Hire Assistant for Bishops Hull Hub. I can help with questions about hiring the hall — availability, pricing, facilities, and more. What would you like to know?",
};

const NUDGE_DISMISSED_KEY = 'bhhub-hire-chat-nudge-dismissed';
const NUDGE_DELAY_MS = 4000;

// Tiny inline renderer for the markdown subset Gemini actually emits in
// chat replies (**bold**, *italic*, leading "- " / "* " bullets) plus
// auto-linkification for the things the bot tends to mention: full URLs,
// relative paths (e.g. /hire#booking-form), email addresses, and UK
// mobile phone numbers (e.g. Julie's 07864 241376 — becomes a tel: link
// so mobile users can tap to call). All output is plain React — no
// dangerouslySetInnerHTML — and hrefs are restricted to safe schemes.

function isSafeHref(url: string): boolean {
  if (url.startsWith('/')) return true;
  return /^(https?:|mailto:|tel:)/i.test(url);
}

function phoneToTel(raw: string): string {
  const digits = raw.replace(/\s+/g, '');
  return digits.startsWith('0') ? `tel:+44${digits.slice(1)}` : `tel:${digits}`;
}

function ChatLink({ href, children }: { href: string; children: React.ReactNode }) {
  const opensNewTab = /^https?:/i.test(href) || href.startsWith('/');
  const extraProps = opensNewTab
    ? { target: '_blank' as const, rel: 'noopener noreferrer' as const }
    : {};
  return (
    <a
      href={href}
      {...extraProps}
      className="underline underline-offset-2 font-medium break-words hover:opacity-80"
    >
      {children}
    </a>
  );
}

// Trim trailing sentence punctuation off a captured URL/path so things like
// "see /hire#booking-form." don't pull the full stop into the link.
function splitTrailingPunctuation(raw: string): { core: string; trail: string } {
  const m = /[.,;:!?)]+$/.exec(raw);
  if (!m) return { core: raw, trail: '' };
  return { core: raw.slice(0, -m[0].length), trail: m[0] };
}

function renderRichText(text: string): React.ReactNode[] {
  // Normalise leading bullet markers to a bullet glyph so the indent and
  // visual cue survive without needing a real <ul>.
  const normalised = text.replace(/^([ \t]*)[-*]\s+/gm, '$1• ');

  // Combined pattern, left-to-right alternation. Capture groups:
  //   1+2 = [text](url) markdown link
  //   3   = **bold**
  //   4   = *italic*
  //   5   = http(s):// URL
  //   6   = relative path starting with /
  //   7   = email address
  //   8   = UK mobile phone number (07XXX XXXXXX or 07XXXXXXXXX)
  const pattern =
    /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([\s\S]+?)\*\*|(?<!\*)\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\*)|(https?:\/\/[^\s)\]]+)|(?<![\w/])(\/[a-zA-Z][\w\-./#?=&]*)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|\b(07\d{3}\s?\d{6})\b/g;

  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(normalised)) !== null) {
    if (m.index > lastIndex) {
      out.push(normalised.slice(lastIndex, m.index));
    }
    if (m[1] !== undefined && m[2] !== undefined) {
      if (isSafeHref(m[2])) {
        out.push(
          <ChatLink key={`l${key++}`} href={m[2]}>
            {m[1]}
          </ChatLink>
        );
      } else {
        out.push(m[0]);
      }
    } else if (m[3] !== undefined) {
      out.push(<strong key={`b${key++}`}>{m[3]}</strong>);
    } else if (m[4] !== undefined) {
      out.push(<em key={`i${key++}`}>{m[4]}</em>);
    } else if (m[5] !== undefined) {
      const { core, trail } = splitTrailingPunctuation(m[5]);
      out.push(
        <ChatLink key={`u${key++}`} href={core}>
          {core}
        </ChatLink>
      );
      if (trail) out.push(trail);
    } else if (m[6] !== undefined) {
      const { core, trail } = splitTrailingPunctuation(m[6]);
      out.push(
        <ChatLink key={`p${key++}`} href={core}>
          {core}
        </ChatLink>
      );
      if (trail) out.push(trail);
    } else if (m[7] !== undefined) {
      out.push(
        <ChatLink key={`e${key++}`} href={`mailto:${m[7]}`}>
          {m[7]}
        </ChatLink>
      );
    } else if (m[8] !== undefined) {
      out.push(
        <ChatLink key={`t${key++}`} href={phoneToTel(m[8])}>
          {m[8]}
        </ChatLink>
      );
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < normalised.length) {
    out.push(normalised.slice(lastIndex));
  }
  return out.length > 0 ? out : [normalised];
}

export default function HireChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { firestore } = useFirebase();
  const submittingRef = useRef(false);

  // Show a one-off "ask any questions here" nudge to first-time visitors so
  // the chat button is discoverable. Dismissal is persisted, so returning
  // visitors and anyone who already engaged with the chat won't see it again.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.localStorage.getItem(NUDGE_DISMISSED_KEY)) return;
    } catch {
      // localStorage unavailable (private mode etc.) — still safe to show once per page load
    }
    const t = window.setTimeout(() => setShowNudge(true), NUDGE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const dismissNudge = useCallback(() => {
    setShowNudge(false);
    try {
      window.localStorage.setItem(NUDGE_DISMISSED_KEY, '1');
    } catch {
      // Ignore — best effort persistence.
    }
  }, []);

  // Opening the chat counts as engaging with it — hide the nudge for good.
  useEffect(() => {
    if (open && showNudge) dismissNudge();
  }, [open, showNudge, dismissNudge]);

  // Lock body scroll on mobile when the panel is open so the page
  // doesn't scroll behind the chat overlay.
  useEffect(() => {
    if (!open || window.innerWidth >= 768) return;
    const y = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, y);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const submitPreparedEnquiry = useCallback(
    async (payload: PreparedSubmission) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      try {
        const enquiryId = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
        const enquiryData = {
          id: enquiryId,
          ...payload,
          submissionDateTime: new Date().toISOString(),
          status: 'Pending',
        };

        const docRef = doc(firestore, 'booking_enquiries', enquiryId);
        setDocumentNonBlocking(docRef, enquiryData, {});

        try {
          await sendEnquiryEmailAction(enquiryData);
        } catch {
          // Email is non-critical; the enquiry is already saved.
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            kind: 'system',
            text: `Enquiry sent — reference ${enquiryId}. The bookings secretary aims to reply within 3 working days. We'll be in touch on your preferred contact method.`,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            kind: 'system',
            text: "I couldn't save your enquiry to our system. Please try submitting via the website form at /hire#booking-form, or email bhhubbookings@gmail.com.",
          },
        ]);
      } finally {
        submittingRef.current = false;
      }
    },
    [firestore]
  );

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    // Build history for the API: drop the welcome message and any system pills
    // (they're presentational only — the LLM didn't author them).
    const history = nextMessages
      .slice(0, -1)
      .filter((m) => !(m.text === WELCOME_MESSAGE.text && m.role === 'model'))
      .filter((m) => m.kind !== 'system')
      .map((m) => ({
        role: m.role,
        content: [{ text: m.text }],
      }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, userMessage: text }),
      });

      const data = (await res.json()) as {
        response?: string;
        error?: string;
        submission?: PreparedSubmission;
      };

      const responseText =
        data.response ?? data.error ?? 'Sorry, something went wrong. Please try again.';

      setMessages((prev) => [...prev, { role: 'model', text: responseText }]);

      if (data.submission) {
        await submitPreparedEnquiry(data.submission);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Sorry, I could not connect right now. Please try again or contact bhhubbookings@gmail.com.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, submitPreparedEnquiry]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            'fixed z-50 flex flex-col bg-background border border-border rounded-2xl shadow-2xl shadow-black/20',
            // Mobile: full-width panel sitting just above the trigger button
            'inset-x-3 bottom-[72px]',
            'max-h-[70vh]',
            // Desktop: fixed-width panel bottom-right
            'md:inset-x-auto md:right-6 md:w-80 md:bottom-[72px] md:max-h-[520px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border bg-primary text-primary-foreground rounded-t-2xl shrink-0">
            <Bot className="h-5 w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">Hire Assistant</p>
              <p className="text-xs opacity-75 leading-tight truncate">Bishops Hull Hub</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1 hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages — plain div with CSS scroll containment so touch
              events don't leak through to the page behind on mobile */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            <div className="flex flex-col gap-3">
              {messages.map((msg, i) => {
                if (msg.kind === 'system') {
                  const isError = msg.text.toLowerCase().startsWith("i couldn't");
                  return (
                    <div key={i} className="flex justify-center">
                      <div
                        className={cn(
                          'max-w-[92%] rounded-xl border-2 px-3 py-2.5 text-xs leading-relaxed flex items-start gap-2',
                          isError
                            ? 'border-red-300 bg-red-50 text-red-900'
                            : 'border-green-300 bg-green-50 text-green-900'
                        )}
                      >
                        {isError ? (
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        )}
                        <span className="font-medium">{renderRichText(msg.text)}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      )}
                    >
                      {msg.role === 'model' ? renderRichText(msg.text) : msg.text}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={scrollEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-border shrink-0">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about hiring the Hub…"
              disabled={loading}
              className="flex-1 h-9 text-sm rounded-xl border-border focus-visible:ring-primary"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="h-9 w-9 rounded-xl shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Discoverability nudge — small speech bubble pointing at the trigger
          button on first visit. Mobile: appears to the right of the button
          (which is bottom-left). Desktop: appears to the left of the button
          (which is bottom-right). */}
      {showNudge && !open && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed z-50 max-w-[220px] animate-in fade-in slide-in-from-bottom-2 duration-500',
            'bottom-[26px]',
            // Mobile: chat button is at left-4, so place the bubble to its right
            'left-[76px] md:left-auto',
            // Desktop: chat button is at right-6, so place the bubble to its left
            'md:right-[76px]'
          )}
        >
          <div className="relative bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/30 px-3.5 py-2.5 pr-8">
            <p className="text-xs font-semibold leading-tight">Ask any questions here</p>
            <p className="text-[10px] opacity-80 leading-tight mt-0.5">
              I can answer hire questions or take a booking enquiry for you.
            </p>
            <button
              type="button"
              onClick={dismissNudge}
              aria-label="Dismiss"
              className="absolute top-1.5 right-1.5 rounded-full p-0.5 hover:bg-white/20 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
            {/* Tail pointing at the trigger button */}
            <span
              aria-hidden
              className={cn(
                'absolute top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent',
                // Mobile: tail on the left of the bubble (button is to the left)
                '-left-1.5 border-r-[8px] border-r-primary',
                // Desktop: flip — tail on the right of the bubble (button is to the right)
                'md:left-auto md:-right-1.5 md:border-r-0 md:border-l-[8px] md:border-l-primary'
              )}
            />
          </div>
        </div>
      )}

      {/* Trigger button */}
      {/* On mobile: left side to avoid collision with the Book Now FAB (right side) */}
      {/* On desktop (md+): right side */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close hire assistant' : 'Open hire assistant'}
        className={cn(
          'fixed bottom-6 z-50 flex items-center justify-center rounded-full shadow-lg shadow-primary/40 transition-all duration-200 hover:scale-105 active:scale-95',
          'h-14 w-14 bg-gradient-to-br from-primary to-teal-500 text-white',
          // Mobile: left side
          'left-4 md:left-auto',
          // Desktop: right side
          'md:right-6',
          // Gentle attention-grabber when the nudge bubble is visible
          showNudge && !open && 'animate-pulse-ring'
        )}
      >
        {/* Pulsing ring overlay while the nudge is showing */}
        {showNudge && !open && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/40 animate-ping"
            style={{ animationDuration: '1.8s' }}
          />
        )}
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-6 w-6 relative" />
        )}
      </button>
    </>
  );
}
