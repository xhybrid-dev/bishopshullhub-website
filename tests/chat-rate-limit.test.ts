/**
 * Chat abuse-control tests.
 *
 * The one that matters most is the first: a genuine hire enquiry runs to 25-40
 * messages, and must never be cut off. Run with: npm run test:rate-limit
 */
import { checkChatAllowance, resetChatLimiter, getChatClientKey } from '../src/lib/chat-rate-limit';

const results: Array<[boolean, string, string]> = [];
const check = (name: string, cond: unknown, detail = '') => results.push([!!cond, name, detail]);

const SEC = 1000;
const MIN = 60 * SEC;

// --- a genuine booking conversation must survive ---
// 14 fields collected 1-2 at a time, plus questions either side. Model replies
// take ~3s and the visitor types for ~12s, so ~15s per message.
{
  resetChatLimiter();
  let t = Date.now();
  let blocked = 0;
  for (let i = 0; i < 40; i++) {
    const d = checkChatAllowance('1.2.3.4', `answer number ${i}`, t);
    if (!d.allowed) blocked++;
    t += 15 * SEC;
  }
  check('40-message booking conversation at human pace is never blocked', blocked === 0, `blocked=${blocked}`);
}

// A brisk visitor giving one-word answers every 8 seconds.
{
  resetChatLimiter();
  let t = Date.now();
  let blocked = 0;
  for (let i = 0; i < 35; i++) {
    const d = checkChatAllowance('1.2.3.5', `reply ${i}`, t);
    if (!d.allowed) blocked++;
    t += 8 * SEC;
  }
  check('brisk 35-message conversation (8s apart) is never blocked', blocked === 0, `blocked=${blocked}`);
}

// The tightest realistic human: one-word answers, ~7s apart including the
// model's own reply time. This is the boundary case the limits must clear.
{
  resetChatLimiter();
  let t = Date.now();
  let blocked = 0;
  for (let i = 0; i < 40; i++) {
    const d = checkChatAllowance('1.2.3.9', `answer ${i}`, t);
    if (!d.allowed) blocked++;
    t += 7 * SEC;
  }
  check('fastest realistic human (7s apart, 40 messages) is never blocked', blocked === 0, `blocked=${blocked}`);
}

// A script paced to duck the burst window must still be caught.
{
  resetChatLimiter();
  let t = Date.now();
  let firstBlockAt = -1;
  for (let i = 0; i < 40 && firstBlockAt < 0; i++) {
    const d = checkChatAllowance('9.9.9.5', `drip ${i}`, t);
    if (!d.allowed) firstBlockAt = i;
    t += 4 * SEC;
  }
  check('4s drip-feed script evades burst but is caught within ~15 messages',
    firstBlockAt > 0 && firstBlockAt <= 16, `firstBlockAt=${firstBlockAt}`);
}

// Two separate enquiries from the same household/IP in one afternoon.
{
  resetChatLimiter();
  let t = Date.now();
  let blocked = 0;
  for (let convo = 0; convo < 2; convo++) {
    for (let i = 0; i < 35; i++) {
      const d = checkChatAllowance('1.2.3.6', `c${convo} msg ${i}`, t);
      if (!d.allowed) blocked++;
      t += 15 * SEC;
    }
    t += 45 * MIN; // a gap between the two conversations
  }
  check('two full conversations from one IP in an afternoon are never blocked', blocked === 0, `blocked=${blocked}`);
}

// --- abuse must be stopped ---
{
  resetChatLimiter();
  let t = Date.now();
  let firstBlockAt = -1;
  for (let i = 0; i < 20; i++) {
    const d = checkChatAllowance('9.9.9.9', `spam ${i}`, t);
    if (!d.allowed && firstBlockAt < 0) firstBlockAt = i;
    t += 500; // two per second — no model round trip in between
  }
  check('scripted flood (2/sec) is blocked quickly', firstBlockAt >= 0 && firstBlockAt <= 7, `firstBlockAt=${firstBlockAt}`);
}

{
  resetChatLimiter();
  const t = Date.now();
  for (let i = 0; i < 6; i++) checkChatAllowance('9.9.9.8', `x${i}`, t + i);
  const d = checkChatAllowance('9.9.9.8', 'x-final', t + 7);
  check('6 messages in the same instant trips the burst window', !d.allowed && d.rule === 'burst', JSON.stringify(d));
}

{
  resetChatLimiter();
  let t = Date.now();
  let blockedRule = null;
  for (let i = 0; i < 40 && !blockedRule; i++) {
    const d = checkChatAllowance('9.9.9.7', 'the exact same question', t);
    if (!d.allowed) blockedRule = d.rule;
    t += 15 * SEC; // human pace, but the identical message every time
  }
  check('identical message repeated in a loop is caught as a repeat', blockedRule === 'repeat', `rule=${blockedRule}`);
}

// Paced to slip under the burst window but still far above real usage.
{
  resetChatLimiter();
  let t = Date.now();
  let blocked = false;
  for (let i = 0; i < 60 && !blocked; i++) {
    const d = checkChatAllowance('9.9.9.6', `varied message ${i}`, t);
    if (!d.allowed) blocked = true;
    t += 4 * SEC; // 15/min sustained — under burst, over the 5-minute window
  }
  check('sustained 15/min drip is caught by the short window', blocked);
}

// --- cooldown behaviour ---
{
  resetChatLimiter();
  let t = Date.now();
  for (let i = 0; i < 8; i++) { checkChatAllowance('8.8.8.8', `s${i}`, t); t += 500; }
  const during = checkChatAllowance('8.8.8.8', 'still trying', t + 60 * SEC);
  check('still blocked one minute later', !during.allowed);

  const after = checkChatAllowance('8.8.8.8', 'am I back?', t + 11 * MIN);
  check('recovers after the 10-minute first cooldown', after.allowed);
}

{
  resetChatLimiter();
  let t = Date.now();
  // First offence -> 10 min.
  for (let i = 0; i < 8; i++) { checkChatAllowance('7.7.7.7', `a${i}`, t); t += 500; }
  t += 11 * MIN;
  // Second offence -> 1 hour.
  for (let i = 0; i < 8; i++) { checkChatAllowance('7.7.7.7', `b${i}`, t); t += 500; }
  const at30min = checkChatAllowance('7.7.7.7', 'hello', t + 30 * MIN);
  const at61min = checkChatAllowance('7.7.7.7', 'hello', t + 61 * MIN);
  check('second offence escalates to a longer cooldown', !at30min.allowed && at61min.allowed);
}

// --- isolation: one abuser must not affect anyone else ---
{
  resetChatLimiter();
  let t = Date.now();
  for (let i = 0; i < 12; i++) { checkChatAllowance('6.6.6.6', `flood ${i}`, t); t += 300; }
  const abuser = checkChatAllowance('6.6.6.6', 'more', t);
  const bystander = checkChatAllowance('5.5.5.5', 'is the hall free on Saturday?', t);
  check('a blocked abuser does not block other visitors', !abuser.allowed && bystander.allowed);
}

// --- client key extraction ---
{
  const h = (o: Record<string, string>) => new Headers(o);
  check('takes the client IP from x-forwarded-for',
    getChatClientKey(h({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' })) === '203.0.113.7');
  check('falls back to x-real-ip', getChatClientKey(h({ 'x-real-ip': '198.51.100.4' })) === '198.51.100.4');
  check('falls back to a shared bucket when unidentifiable', getChatClientKey(h({})) === 'unknown');
}

console.log('');
let failed = 0;
for (const [ok, name, detail] of results) {
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${!ok && detail ? ` :: ${detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
