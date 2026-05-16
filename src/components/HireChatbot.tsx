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

export default function HireChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { firestore } = useFirebase();
  const submittingRef = useRef(false);

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
                        <span className="font-medium">{msg.text}</span>
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
                      {msg.text}
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
          'md:right-6'
        )}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
