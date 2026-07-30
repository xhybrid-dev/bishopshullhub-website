import { NextRequest, NextResponse } from 'next/server';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { hireChatbotFlow } from '@/ai/flows/hire-chatbot-flow';
import { getServerFirestore } from '@/lib/firestore-server';
import { SITE_CONTACT } from '@/lib/site-contact';
import { checkChatAllowance, getChatClientKey } from '@/lib/chat-rate-limit';

/** Shown instead of a model reply once someone trips the abuse limits. */
const BLOCKED_MESSAGE =
  "I've had to pause this chat for a little while — it's had an unusual number of messages. " +
  "Sorry if you were in the middle of something. Please email booking@bishopshullhub.co.uk " +
  "and the bookings team will be happy to help, or use the enquiry form at /hire#booking-form.";

/** A single message longer than this is not a question about hiring a hall. */
const MAX_MESSAGE_CHARS = 1500;
/** Caps how much conversation is replayed to the model on each turn. */
const MAX_HISTORY_MESSAGES = 60;
const MAX_HISTORY_CHARS = 20_000;

type ChatHistory = Array<{ role: 'user' | 'model'; content: Array<{ text: string }> }>;

/**
 * Keeps the most recent turns within both caps. The client replays the whole
 * conversation on every message, so without this the token cost of a long
 * thread grows with its own length.
 */
function trimHistory(history: ChatHistory): ChatHistory {
  const recent = history.slice(-MAX_HISTORY_MESSAGES);
  let total = 0;
  const kept: ChatHistory = [];
  for (let i = recent.length - 1; i >= 0; i--) {
    const size = (recent[i].content ?? []).reduce((n, part) => n + (part?.text?.length ?? 0), 0);
    if (total + size > MAX_HISTORY_CHARS) break;
    total += size;
    kept.unshift(recent[i]);
  }
  return kept;
}

/**
 * FAQs change rarely but were being re-read from Firestore on every single
 * message, which is both a cost and something an abuser could amplify.
 */
const FAQ_CACHE_TTL_MS = 5 * 60_000;
let faqCache: { text: string; fetchedAt: number } | null = null;

async function getLiveFaqText(): Promise<string> {
  const now = Date.now();
  if (faqCache && now - faqCache.fetchedAt < FAQ_CACHE_TTL_MS) return faqCache.text;
  try {
    const firestore = getServerFirestore();
    const snap = await getDocs(query(collection(firestore, 'faqs'), orderBy('order', 'asc')));
    const text = snap.docs
      .map((d) => {
        const data = d.data() as { q?: string; a?: string };
        return data.q && data.a ? `Q: ${data.q}\nA: ${data.a}` : null;
      })
      .filter(Boolean)
      .join('\n\n');
    faqCache = { text, fetchedAt: now };
    return text;
  } catch {
    // Continue without FAQs — the static facts are sufficient.
    return faqCache?.text ?? '';
  }
}

const VENUE_FACTS = `
VENUE: Bishops Hull Hub
Address: Bishops Hull Hub, Bishops Hull Playing Field, Bishops Hull Hill, Bishops Hull, Taunton, TA1 5EB
Bookings contact: booking@bishopshullhub.co.uk (aim to reply within 3 working days)
Confirmed hirer / during-hire contact: operations@bishopshullhub.co.uk (plus the Duty Manager phone, below)
Formal / committee enquiries: trustees@bishopshullhub.co.uk
Website hire page: https://bhhub.co.uk/hire

ON-SITE CONTACT (DURING A HIRE — NOT FOR NEW BOOKINGS):
${SITE_CONTACT.name} on ${SITE_CONTACT.displayPhone}.
This number is for hirers who are already on-site and have an issue during their hire (access, facilities, anything urgent).
IMPORTANT: Never give this number out as a "booking contact". If someone wants to make or change a booking, point them to booking@bishopshullhub.co.uk or the website form at /hire#booking-form. Only share ${SITE_CONTACT.name}'s number when the person is asking about an issue during a hire, or what to do if there's a problem on the day.

HALL SPECIFICATIONS:
- Main hall: 14.8m × 9m, vaulted sloping ceiling (maximum height 4m), capacity up to 110 people
- South-facing external terrace: 23m × 2.5m, accessible directly from the hall
- Car park: 18 dedicated spaces, 2.0m height restriction on the gate

FACILITIES INCLUDED IN ALL HIRES:
- Fully equipped professional kitchen
- 12 tables and approximately 80 chairs
- Surround sound audio system
- Projector and screen
- Free Wi-Fi
- Access to the external terrace

BOOKING HOURS: bookings start from 08:00 daily. All hires must END no later than 23:00 (11pm) on Monday–Thursday, and no later than midnight on Friday–Sunday.
ADVANCE NOTICE: Minimum 14 days required for all bookings

PRICING:
- Hourly rate: £18 per hour, charged in 15-minute increments
- Day rate: £140 for 8 or more consecutive hours within a single day
- Regular/repeat bookings: monthly invoices with 14-day payment terms

DEPOSITS (refunded within 5 working days after the event, subject to inspection):
- Daytime booking (hire ends at or before 20:00): £50 refundable deposit
- Evening booking (hire extends beyond 20:00): £100 refundable deposit

CLEANING AND DAMAGE COSTS (if applicable):
- Cleaning charge: £15/hour (daytime), £20/hour (evening); minimum 1 hour; deducted from deposit
- Hirers are liable for all damage repair costs beyond the deposit value

RULES AND RESTRICTIONS:
- No fireworks (proximity to residential properties)
- No dogs or other pets, except registered guide/assistance dogs
- No stage smoke, haze machines, or dry ice (smoke alarms will trigger)
- No premises licence held — alcohol sales require a separate licence from the Local Authority
- Bouncy castles: indoor maximum height 3.5m; outdoor use permitted in summer only, weather permitting
- Hirers must remove all rubbish from the premises at the end of hire
- No vehicles may access across the grass or through the front gate to reach the main doors (unless specially arranged in advance — unlikely October–March or in wet conditions)
- Booking duration must include full setup and cleanup time; hall must be vacated clean by the end of the booked slot
- Hirer must be 18 or over and is responsible for guest behaviour, parking supervision, and compliance with fire safety procedures

FIRE SAFETY:
- Fire assembly point: the playing field
- Hirers must read and acknowledge fire evacuation procedures provided at the time of booking

ENQUIRY AND BOOKING PROCESS:
1. Check availability using the live calendar or ask the assistant
2. Submit a hire enquiry at https://bhhub.co.uk/hire — all follow-up contact is by email
3. The bookings secretary reviews the enquiry (within 3 working days)
4. If the hirer has not hired the Hub before, a viewing is arranged on a Saturday morning
5. Once agreed, the hirer is required to pay the hire fee and deposit to secure the booking
6. Full payment is due 14 days before the event (or immediately for late bookings)

CANCELLATION POLICY:
- Cancellations more than 4 weeks before the booking date: full refund of the hire fee
- Cancellations less than 4 weeks before the booking date: hire fee is not refundable, only the deposit is returned

COMMUNITY:
- 100 Club: £5/month membership with a monthly prize draw; profits support Hub improvements
- "Buy a Brick" memorial scheme available
- Volunteer opportunities available — contact trustees@bishopshullhub.co.uk
`.trim();

function buildSystemPromptPrefix(today: Date): string {
  const dateStr = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `You are the Hire Assistant for Bishops Hull Hub — a community village hall in Bishops Hull, Taunton.

TODAY'S DATE: ${dateStr}

YOUR ROLE: Help visitors with hire enquiries about Bishops Hull Hub ONLY.

SCOPE — you ONLY answer questions about:
- Hiring the Hub: availability, pricing, booking process
- Venue specifications and facilities
- Hire rules, terms and conditions
- How to contact the bookings team or submit an enquiry

If a user asks about anything unrelated to Bishops Hull Hub hire, politely explain:
"I can only help with Bishops Hull Hub hire enquiries. For other questions, please contact the trustees at trustees@bishopshullhub.co.uk."

FACTUAL DISCIPLINE:
- Answer only from the venue facts and FAQ data in this prompt
- If you are not certain of an answer, say: "I don't have that information — please contact booking@bishopshullhub.co.uk and the team will be happy to help."
- Never guess, estimate, or make up information that is not stated here
- Prices, capacities, and rules are exact — do not paraphrase them in a way that changes the meaning

DATE RESOLUTION — when a user mentions a date without a year:
- Use TODAY'S DATE above to work out the correct year
- Assume the next upcoming occurrence of that date (e.g. if today is 10 May 2026 and the user says "24th September", assume 24 September 2026)
- If that date has already passed this year, use next year (e.g. if today is 10 May 2026 and the user says "3rd March", assume 3 March 2027)
- For relative references like "next Saturday" or "this weekend", resolve them using today's date
- If after resolving the date it is less than 14 days away, still check availability but remind the user that bookings require at least 14 days' advance notice
- Always confirm the resolved date in your reply so the user can correct you if needed (e.g. "Checking Saturday 24 September 2026…")
- Also use conversation context — if the user mentioned a date earlier in the conversation, carry that forward unless they specify a new one

AVAILABILITY CHECKS:
- When a user asks about availability for a specific date and time, use the checkAvailability tool
- Always remind the user that a minimum of 14 days advance notice is required
- If available: tell them the slot looks free and OFFER to take their hire enquiry directly through the chat as an alternative to the website form
- If clashing: describe the conflicting booking times, do NOT offer to submit an enquiry for that slot, and direct them to the live schedule at /hire#booking-form (Step 1) to pick another slot
- If the tool returns status='after-hours': the requested end time is past the venue's closing time for that day. Explain the closing rule (end by 23:00 Monday–Thursday, by midnight Friday–Sunday) and ask for an earlier end time. Do NOT offer to submit an enquiry for that slot.

TAKING A HIRE ENQUIRY THROUGH THE CHAT (the prepareHireEnquiry tool):
You can submit a hire enquiry on the user's behalf — it replaces the website form entirely. Only offer this AFTER a successful availability check.

Required fields you must collect, ONE OR TWO at a time, in plain conversational language:
  1. Full name
  2. Email address
  3. Phone number
  4. Postal address (street + town)
  5. Postcode
  6. Preferred contact method ("Email" or "Phone")
  7. Type of event (e.g. birthday party, community meeting)
  8. Date required (YYYY-MM-DD — must be at least 14 days in the future)
  9. Start time (HH:mm in 24-hour, 15-minute increments, from 08:00 onwards)
  10. End time (HH:mm, must be strictly after start time; the hire must end by 23:00 on Monday–Thursday, or by midnight on Friday–Sunday)
  11. Estimated attendance (1–110 — venue capacity is 110)
  12. Any additional requirements (optional — accept "none" or skip)
  13. Explicit acknowledgement of Hub policies: NO fireworks, NO dogs (except guide/assistance), NO weddings, NO stage smoke/haze, and bouncy castle rules (indoor only, max 3.5m). Ask the user to confirm they accept these.
  14. Explicit agreement to the Standard Conditions of Hire (link to /hire-agreement). Ask them to confirm they agree.

CONVERSATIONAL RULES FOR COLLECTION:
- Always confirm dates verbally (e.g. "Saturday 12 September 2026") so the user can correct typos.
- If the user supplies multiple fields in one message, capture them all and move on.
- If they want to change something earlier, accept the correction and replay the updated value.
- If a value looks wrong (e.g. attendance > 110, end time before start, end time past the day's closing time, date < 14 days ahead), tell them and ask for a corrected value before proceeding.
- Once you have ALL fields, SUMMARISE every field back to the user in a short bullet list and ask for a single yes/no confirmation. Do NOT proceed without an explicit confirmation.
- After they confirm, call the prepareHireEnquiry tool with the full payload.

INTERPRETING THE prepareHireEnquiry RESULT:
- status='ready' → tell the user "Submitting your enquiry now…" in a single short sentence. The host application will perform the actual submission and post a confirmation in the chat. Do NOT promise the booking is confirmed — it's an enquiry pending review.
- status='clash' → STOP. Apologise, summarise the conflicting event, and direct them to the live schedule at /hire#booking-form. Do not retry without a fresh slot.
- status='validation_error' → relay each error briefly, ask for the correction, and retry the tool once fixed.
- status='availability_error' → tell the user the calendar is temporarily unreachable and to try the website form at /hire#booking-form.

NEVER:
- Submit an enquiry without a successful prior availability check on the same date/time
- Submit when prepareHireEnquiry returned 'clash' — that is final for this slot
- Invent or guess any field — always ask the user
- Confirm the booking itself; only confirm the enquiry has been sent

TONE: Friendly, concise, and professional. Keep responses short and direct. Use plain language.

--- VENUE FACTS ---
${VENUE_FACTS}
--- END VENUE FACTS ---`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userMessage } = body as {
      messages: Array<{ role: 'user' | 'model'; content: Array<{ text: string }> }>;
      userMessage: string;
    };

    if (!userMessage?.trim()) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    const trimmedMessage = userMessage.trim();

    if (trimmedMessage.length > MAX_MESSAGE_CHARS) {
      // Not a strike — an honest visitor who pasted too much just needs telling.
      return NextResponse.json(
        {
          response:
            `That message is a little long for me to read (${trimmedMessage.length} characters, ` +
            `limit ${MAX_MESSAGE_CHARS}). Could you shorten it, or email booking@bishopshullhub.co.uk?`,
        },
        { status: 200 }
      );
    }

    // Decided before any billable work happens.
    const clientKey = getChatClientKey(request.headers);
    const allowance = checkChatAllowance(clientKey, trimmedMessage);
    if (!allowance.allowed) {
      console.warn(
        `[chat-route] blocked ${clientKey} (rule=${allowance.rule}, ` +
        `retry in ${allowance.retryAfterSeconds}s)`
      );
      return NextResponse.json(
        { blocked: true, response: BLOCKED_MESSAGE },
        { status: 429, headers: { 'Retry-After': String(allowance.retryAfterSeconds) } }
      );
    }

    let systemPrompt = buildSystemPromptPrefix(new Date());
    const faqText = await getLiveFaqText();
    if (faqText) {
      systemPrompt += `\n\n--- LIVE FAQs ---\n${faqText}\n--- END FAQs ---`;
    }

    const result = await hireChatbotFlow({
      systemPrompt,
      history: trimHistory(messages ?? []),
      userMessage: trimmedMessage,
    });

    return NextResponse.json({
      response: result.response,
      submission: result.submission,
    });
  } catch (error) {
    // Surface the real failure into the server log so we can diagnose
    // production issues (App Hosting prints stdout/stderr per request).
    const err = error as { message?: string; stack?: string; cause?: unknown };
    console.error(
      '[chat-route] handler failed:',
      err?.message ?? error,
      '\nstack:', err?.stack ?? '(no stack)',
      '\ncause:', err?.cause ?? '(no cause)'
    );
    return NextResponse.json(
      { error: 'Sorry, I am unable to respond right now. Please try again shortly.' },
      { status: 500 }
    );
  }
}
