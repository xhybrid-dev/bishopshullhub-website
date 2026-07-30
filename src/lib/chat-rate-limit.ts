/**
 * Abuse control for the public chat endpoint.
 *
 * The endpoint is unauthenticated and every call costs the Hub money, so it
 * needs a ceiling. The difficulty is that a *genuine* hire enquiry is a long
 * conversation — the assistant collects fourteen fields one or two at a time,
 * which is comfortably 25-40 messages over twenty minutes. Any volume limit
 * tight enough to stop a script would cut those people off mid-booking.
 *
 * So the limits key on pace rather than total volume. A real visitor waits for
 * the assistant to reply (a couple of seconds) and then types, which puts a
 * natural floor of roughly one message per eight seconds on genuine traffic.
 * A script has no such floor. The burst window is what actually catches abuse;
 * the longer windows are backstops sized well above a real conversation.
 *
 * State is per-instance and in memory. The backend runs with maxInstances: 1,
 * so that is exact today; if it is ever scaled out, each instance would keep
 * its own counters and the effective limits would multiply by the instance
 * count. A restart clears the counters, which fails open — acceptable, since
 * the cost ceiling is per hour and an attacker cannot force a restart.
 */

export interface ChatLimitAllowed {
  allowed: true;
}

export interface ChatLimitBlocked {
  allowed: false;
  /** Which rule tripped — for server logs, never shown to the visitor. */
  rule: string;
  retryAfterSeconds: number;
}

export type ChatLimitDecision = ChatLimitAllowed | ChatLimitBlocked;

/**
 * Sliding windows, sized against a real booking conversation (25-40 messages
 * over 10-25 minutes) with generous headroom.
 */
const WINDOWS: ReadonlyArray<{ rule: string; ms: number; max: number }> = [
  // Implies a floor of ~3.3s per message. Nobody reads a reply that fast.
  { rule: 'burst', ms: 20_000, max: 6 },
  // ~4.3s per message sustained for a full minute. Model latency alone is 2-5s,
  // so a human cannot hold this pace; a drip-feed script slow enough to duck
  // the burst window still lands here.
  { rule: 'minute', ms: 60_000, max: 14 },
  // ~6s per message for five minutes solid. A fast visitor answering in single
  // words averages nearer 8s, so this sits above them with room to spare.
  { rule: 'short', ms: 5 * 60_000, max: 50 },
  // Two full booking conversations in an hour is about 70 messages.
  { rule: 'hourly', ms: 60 * 60_000, max: 100 },
  { rule: 'daily', ms: 24 * 60 * 60_000, max: 250 },
];

/** Repeating the identical message this many times in a row is a loop, not a question. */
const REPEAT_LIMIT = 5;

/** Escalating cooldowns. The first is deliberately short in case of a false positive. */
const BLOCK_DURATIONS_MS = [10 * 60_000, 60 * 60_000, 24 * 60 * 60_000];

/** Strikes fade after a day of good behaviour, so one bad afternoon isn't permanent. */
const STRIKE_DECAY_MS = 24 * 60 * 60_000;

/** Drop idle callers so the map can't grow without bound. */
const IDLE_EVICTION_MS = 24 * 60 * 60_000;
const MAX_TRACKED_KEYS = 10_000;

interface Bucket {
  /** Timestamps of allowed requests, newest last. */
  hits: number[];
  strikes: number;
  lastStrikeAt: number;
  blockedUntil: number;
  lastSeen: number;
  lastMessage: string;
  repeatCount: number;
}

const buckets = new Map<string, Bucket>();
const longestWindowMs = Math.max(...WINDOWS.map((w) => w.ms));

function newBucket(now: number): Bucket {
  return {
    hits: [],
    strikes: 0,
    lastStrikeAt: 0,
    blockedUntil: 0,
    lastSeen: now,
    lastMessage: '',
    repeatCount: 0,
  };
}

function sweep(now: number) {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastSeen > IDLE_EVICTION_MS && bucket.blockedUntil < now) {
      buckets.delete(key);
    }
  }
}

function normaliseMessage(message: string): string {
  return message.trim().toLowerCase().replace(/\s+/g, ' ');
}

function block(bucket: Bucket, now: number, rule: string): ChatLimitBlocked {
  if (now - bucket.lastStrikeAt > STRIKE_DECAY_MS) bucket.strikes = 0;
  bucket.strikes += 1;
  bucket.lastStrikeAt = now;
  const duration = BLOCK_DURATIONS_MS[Math.min(bucket.strikes - 1, BLOCK_DURATIONS_MS.length - 1)];
  bucket.blockedUntil = now + duration;
  // Clear history so the cooldown starts from a clean slate on expiry.
  bucket.hits = [];
  bucket.repeatCount = 0;
  return { allowed: false, rule, retryAfterSeconds: Math.ceil(duration / 1000) };
}

/**
 * Records an attempt and decides whether it may reach the model.
 *
 * Call once per incoming chat message. A blocked attempt is not recorded as a
 * hit, so hammering a closed door doesn't extend the cooldown by itself — but
 * it also doesn't reopen it.
 */
export function checkChatAllowance(
  key: string,
  message: string,
  now: number = Date.now()
): ChatLimitDecision {
  sweep(now);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = newBucket(now);
    buckets.set(key, bucket);
  }
  bucket.lastSeen = now;

  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      rule: 'cooldown',
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  // Forget hits that have aged out of every window.
  const cutoff = now - longestWindowMs;
  if (bucket.hits.length && bucket.hits[0] <= cutoff) {
    bucket.hits = bucket.hits.filter((t) => t > cutoff);
  }

  for (const window of WINDOWS) {
    const since = now - window.ms;
    let count = 0;
    for (let i = bucket.hits.length - 1; i >= 0; i--) {
      if (bucket.hits[i] <= since) break;
      count++;
    }
    if (count >= window.max) return block(bucket, now, window.rule);
  }

  const normalised = normaliseMessage(message);
  if (normalised && normalised === bucket.lastMessage) {
    bucket.repeatCount += 1;
    if (bucket.repeatCount >= REPEAT_LIMIT) return block(bucket, now, 'repeat');
  } else {
    bucket.lastMessage = normalised;
    bucket.repeatCount = 1;
  }

  bucket.hits.push(now);
  return { allowed: true };
}

/** Test helper — clears all tracked state. */
export function resetChatLimiter() {
  buckets.clear();
}

/**
 * Best-effort caller identity. Behind Google's load balancer the client IP is
 * the first entry of x-forwarded-for. Callers we can't identify share one
 * bucket, which is stricter for them but never leaks into anyone else's.
 */
export function getChatClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
