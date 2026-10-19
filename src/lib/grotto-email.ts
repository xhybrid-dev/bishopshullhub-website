// Parent confirmation email for the Santa Grotto: a "scroll from Santa".
// Email-client safe: tables, inline styles, web-safe fonts, no images or SVG.
import { GROTTO_CONTACT_EMAIL } from '@/lib/santa-grotto';

export interface GrottoEmailInput {
  parentName: string;
  children: Array<{ name: string; age: number | null }>;
  amountPence: number;
  /** Same short reference shown in the admin register. */
  ref: string;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SCRIPT = "'Brush Script MT','Snell Roundhand','Segoe Script','Apple Chancery',Georgia,serif";
const SERIF = "Georgia,'Times New Roman',serif";
const BROWN = '#3a1f0d';
const LABEL = '#8a5a2b';

const rod = `<tr><td style="padding:0 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td height="18" bgcolor="#7a4a1f" style="height:18px;line-height:18px;font-size:0;border-radius:9px;background:linear-gradient(#b98240,#6b3f17);border-bottom:2px solid #4d2b0e;">&nbsp;</td></tr></table></td></tr>`;

function detailRow(label: string, value: string) {
  return `<tr><td style="padding:7px 0;border-bottom:1px dotted #d3b676;font-family:${SERIF};">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${LABEL};">${label}</div>
    <div style="font-size:18px;font-weight:bold;color:${BROWN};line-height:1.35;">${value}</div></td></tr>`;
}

export function buildGrottoConfirmationEmail(input: GrottoEmailInput) {
  const first = input.parentName.trim().split(/\s+/)[0] || 'there';
  const count = input.children.length;
  const tickets = `${count} ticket${count === 1 ? '' : 's'}`;
  const paid = `£${(input.amountPence / 100).toFixed(2)}`;
  const subject = `Your Santa’s Grotto tickets are confirmed – Saturday 12th December`;
  const mailto = `mailto:${GROTTO_CONTACT_EMAIL}?subject=${encodeURIComponent(`Santa Grotto – requirements (ref ${input.ref})`)}`;

  const kids = input.children
    .map((c) => `<tr><td style="padding:3px 0;font-family:${SERIF};font-size:17px;color:${BROWN};">&#10022;&nbsp; <strong>${esc(c.name)}</strong>${c.age !== null ? `, age ${esc(c.age)}` : ''}</td></tr>`)
    .join('');

  const html = `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#0b1a3a;" bgcolor="#0b1a3a">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Santa can’t wait to meet ${count === 1 ? 'your little one' : 'your little ones'}! Please arrive for 10am on Saturday 12th December.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0b1a3a" style="background:#0b1a3a;"><tr><td align="center" style="padding:22px 10px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">

<tr><td align="center" style="padding:0 0 12px;font-family:${SERIF};font-size:18px;letter-spacing:10px;color:#9fc6ff;">&#10052; &#10022; &#10052; &#10022; &#10052;</td></tr>
${rod}
<tr><td bgcolor="#f8ebc9" style="background:#f8ebc9;background:linear-gradient(90deg,#ecd49b,#f8ebc9 9%,#f8ebc9 91%,#ecd49b);border-left:1px solid #cfae6a;border-right:1px solid #cfae6a;padding:30px 34px 10px;">

  <div style="text-align:center;font-family:${SERIF};font-size:12px;letter-spacing:4px;text-transform:uppercase;color:${LABEL};">From the desk of Santa Claus &middot; The North Pole</div>
  <div style="text-align:center;font-family:${SCRIPT};font-size:54px;line-height:1.1;color:#b3122d;padding:10px 0 2px;font-style:italic;">Ho Ho Ho!</div>
  <div style="text-align:center;color:#c9a24a;font-size:16px;letter-spacing:6px;padding-bottom:16px;">&#10022; &#10022; &#10022;</div>

  <p style="margin:0 0 12px;font-family:${SERIF};font-size:19px;color:${BROWN};line-height:1.5;">Dear ${esc(first)},</p>
  <p style="margin:0 0 20px;font-family:${SERIF};font-size:17px;color:${BROWN};line-height:1.6;">The elves have checked the list twice, and your ${tickets} for <strong>Santa’s Grotto at Bishops Hull Hub</strong> ${count === 1 ? 'is' : 'are'} confirmed. I am so looking forward to meeting ${count === 1 ? 'your little one' : 'your little ones'}!</p>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td align="center" bgcolor="#b3122d" style="background:#b3122d;border-radius:12px;border:2px solid #c9a24a;padding:16px 14px;">
    <div style="font-family:${SERIF};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#ffd56b;">Please arrive for</div>
    <div style="font-family:${SCRIPT};font-size:44px;line-height:1.1;color:#ffffff;font-style:italic;">10 o’clock</div>
    <div style="font-family:${SERIF};font-size:15px;color:#fff3d6;">Saturday 12th December 2026</div>
  </td></tr></table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:2px dashed #c9a24a;border-radius:12px;"><tr><td style="padding:8px 20px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRow('When', 'Saturday 12th December 2026, 10am&ndash;12pm')}
      ${detailRow('Where', 'Bishops Hull Hub<br><span style="font-size:15px;font-weight:normal;">Bishops Hull Playing Field, Bishops Hull Hill,<br>Bishops Hull, Taunton TA1 5EB</span>')}
      ${detailRow('Your tickets', `${tickets} &middot; ${paid} paid`)}
      <tr><td style="padding:7px 0;font-family:${SERIF};">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${LABEL};">On Santa’s list</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:4px;">${kids}</table>
      </td></tr>
    </table>
  </td></tr></table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td bgcolor="#e8f3df" style="background:#e8f3df;border:2px solid #0d6b3a;border-radius:12px;padding:16px 20px;">
    <div style="font-family:${SERIF};font-size:20px;font-weight:bold;color:#0d6b3a;padding-bottom:6px;">Does your child have any particular requirements?</div>
    <div style="font-family:${SERIF};font-size:16px;color:${BROWN};line-height:1.6;">If there is anything we should be aware of, such as access needs, allergies, or a little one who might feel nervous, <strong>simply reply to this email</strong> and let us know. It goes straight to our team, and we will make sure everything is ready.</div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr><td bgcolor="#0d6b3a" style="background:#0d6b3a;border-radius:8px;"><a href="${mailto}" style="display:inline-block;padding:11px 20px;font-family:${SERIF};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Reply with requirements</a></td></tr></table>
  </td></tr></table>

  <p style="margin:0 0 6px;font-family:${SERIF};font-size:17px;color:${BROWN};line-height:1.6;">Until Saturday, be good, leave out a mince pie, and keep a sharp eye on the sky.</p>
  <p style="margin:18px 0 0;font-family:${SCRIPT};font-size:32px;line-height:1.2;color:#b3122d;font-style:italic;">Merry Christmas!</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;"><tr>
    <td style="font-family:${SCRIPT};font-size:26px;color:${BROWN};font-style:italic;padding-right:14px;">Santa &amp; the elves at the Hub</td>
    <td width="46" height="46" align="center" bgcolor="#b3122d" style="width:46px;height:46px;border-radius:23px;background:#b3122d;border:3px solid #8f0e24;color:#ffd56b;font-size:22px;line-height:40px;">&#10052;</td>
  </tr></table>

  <div style="text-align:center;font-family:${SERIF};font-size:12px;color:${LABEL};padding:18px 0 14px;border-top:1px dotted #d3b676;margin-top:18px;">Booking reference <strong style="letter-spacing:2px;">${esc(input.ref)}</strong> &middot; A payment receipt has been sent separately by Stripe.</div>
</td></tr>
${rod}
<tr><td align="center" style="padding:16px 10px 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#8fa6cf;">Bishops Hull Hub &middot; Bishops Hull, Taunton<br>You received this because you booked Santa’s Grotto at bhhub.co.uk.</td></tr>
</table></td></tr></table></body></html>`;

  const text = `Ho Ho Ho! From the desk of Santa Claus, The North Pole

Dear ${first},

Your ${tickets} for Santa's Grotto at Bishops Hull Hub ${count === 1 ? 'is' : 'are'} confirmed. I am so looking forward to meeting ${count === 1 ? 'your little one' : 'your little ones'}!

PLEASE ARRIVE FOR 10AM
Saturday 12th December 2026 (the grotto is open 10am-12pm)

Where: Bishops Hull Hub, Bishops Hull Playing Field, Bishops Hull Hill, Bishops Hull, Taunton TA1 5EB
Tickets: ${tickets}, ${paid} paid
On Santa's list:
${input.children.map((c) => `  * ${c.name}${c.age !== null ? `, age ${c.age}` : ''}`).join('\n')}

DOES YOUR CHILD HAVE ANY PARTICULAR REQUIREMENTS?
If there is anything we should be aware of, such as access needs, allergies, or a little one who might feel nervous, simply reply to this email and let us know. It goes straight to our team.

Until Saturday, be good, leave out a mince pie, and keep a sharp eye on the sky.

Merry Christmas!
Santa & the elves at the Hub

Booking reference ${input.ref}. A payment receipt has been sent separately by Stripe.`;

  return { subject, html, text };
}
