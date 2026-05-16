/* eslint-disable */
// One-shot build script: produces BookingProcess.pptx in the project root.
const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 inches (16:9)
pptx.author = 'Bishops Hull Hub';
pptx.title = 'Booking Process Overview';
pptx.subject = 'How the booking process works';

const C = {
  primary: '1A4D46',
  primaryDark: '0F3330',
  accent: '2A8077',
  accentSoft: 'B8D8D4',
  light: 'F5F7F5',
  panel: 'FFFFFF',
  text: '1E293B',
  muted: '64748B',
  amber: 'D97706',
  blue: '2563EB',
  green: '059669',
  slate: '475569',
  red: 'DC2626',
  gold: 'CA8A04',
};

const F = 'Calibri';

// ── Helpers ────────────────────────────────────────────────────────────────
function addHeaderBar(slide, title, subtitle) {
  slide.background = { color: C.light };
  // Top accent strip
  slide.addShape('rect', { x: 0, y: 0, w: 13.333, h: 0.18, fill: { color: C.primary }, line: { type: 'none' } });
  slide.addText(title, {
    x: 0.5, y: 0.35, w: 12.3, h: 0.6,
    color: C.primary, fontSize: 28, bold: true, fontFace: F,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 0.95, w: 12.3, h: 0.4,
      color: C.muted, fontSize: 15, italic: true, fontFace: F,
    });
  }
}

function addFooter(slide, pageNum, totalPages) {
  slide.addText('Bishops Hull Hub  ·  Booking Process', {
    x: 0.5, y: 7.05, w: 8, h: 0.3,
    color: C.muted, fontSize: 10, fontFace: F,
  });
  slide.addText(`${pageNum} / ${totalPages}`, {
    x: 11.8, y: 7.05, w: 1, h: 0.3,
    color: C.muted, fontSize: 10, align: 'right', fontFace: F,
  });
}

function numberBadge(slide, x, y, n, color) {
  slide.addShape('ellipse', {
    x, y, w: 0.85, h: 0.85,
    fill: { color }, line: { color, width: 0 },
  });
  slide.addText(String(n), {
    x, y, w: 0.85, h: 0.85,
    color: 'FFFFFF', fontSize: 32, bold: true, align: 'center', valign: 'middle', fontFace: F,
  });
}

function panelCard(slide, opts) {
  const { x, y, w, h, title, lines, accent } = opts;
  // shadow-y rect
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: 0.12,
    fill: { color: C.panel }, line: { color: 'E5E7EB', width: 1 },
  });
  // accent bar on left
  slide.addShape('rect', {
    x, y, w: 0.12, h, fill: { color: accent || C.accent }, line: { type: 'none' },
  });
  slide.addText(title, {
    x: x + 0.35, y: y + 0.2, w: w - 0.5, h: 0.4,
    color: C.primary, fontSize: 16, bold: true, fontFace: F,
  });
  slide.addText(
    lines.map(l => ({ text: l, options: { bullet: { code: '25CF' }, color: C.text, fontSize: 13, fontFace: F } })),
    { x: x + 0.35, y: y + 0.65, w: w - 0.5, h: h - 0.75, paraSpaceAfter: 4, valign: 'top' }
  );
}

function emailPill(slide, x, y, label, sublabel, color) {
  const w = 2.6, h = 1.0;
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: 'FFFFFF' }, line: { color, width: 2 },
  });
  // envelope glyph
  slide.addShape('rect', {
    x: x + 0.2, y: y + 0.3, w: 0.5, h: 0.35,
    fill: { color }, line: { color, width: 0 },
  });
  slide.addShape('line', {
    x: x + 0.2, y: y + 0.3, w: 0.5, h: 0.35,
    line: { color: 'FFFFFF', width: 1.5 },
  });
  slide.addShape('line', {
    x: x + 0.2, y: y + 0.65, w: 0.5, h: -0.35,
    line: { color: 'FFFFFF', width: 1.5 },
  });
  slide.addText(label, {
    x: x + 0.85, y: y + 0.2, w: w - 0.95, h: 0.35,
    color: C.primary, fontSize: 13, bold: true, fontFace: F,
  });
  slide.addText(sublabel, {
    x: x + 0.85, y: y + 0.55, w: w - 0.95, h: 0.35,
    color: C.muted, fontSize: 11, fontFace: F,
  });
}

// ── Slide 1: Title ─────────────────────────────────────────────────────────
const TOTAL = 11;
{
  const s = pptx.addSlide();
  s.background = { color: C.primary };
  // accent corner
  s.addShape('rect', { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.primary }, line: { type: 'none' } });
  s.addShape('rect', { x: 0, y: 6.3, w: 13.333, h: 1.2, fill: { color: C.primaryDark }, line: { type: 'none' } });
  s.addShape('ellipse', { x: 10.5, y: -2, w: 6, h: 6, fill: { color: C.accent, transparency: 70 }, line: { type: 'none' } });
  s.addShape('ellipse', { x: -2, y: 4.5, w: 5, h: 5, fill: { color: C.accent, transparency: 80 }, line: { type: 'none' } });

  s.addText('BISHOPS HULL HUB', {
    x: 0.5, y: 2.2, w: 12.3, h: 0.5,
    color: 'B8D8D4', fontSize: 18, bold: true, align: 'center', charSpacing: 8, fontFace: F,
  });
  s.addText('The Booking Process', {
    x: 0.5, y: 2.8, w: 12.3, h: 1.2,
    color: 'FFFFFF', fontSize: 60, bold: true, align: 'center', fontFace: F,
  });
  s.addShape('rect', { x: 6.17, y: 4.2, w: 1.0, h: 0.05, fill: { color: C.accentSoft }, line: { type: 'none' } });
  s.addText('A walk-through for the booking team', {
    x: 0.5, y: 4.4, w: 12.3, h: 0.5,
    color: 'B8D8D4', fontSize: 22, align: 'center', italic: true, fontFace: F,
  });

  s.addText('From first enquiry to deposit return', {
    x: 0.5, y: 6.6, w: 12.3, h: 0.4,
    color: C.accentSoft, fontSize: 14, align: 'center', fontFace: F,
  });
}

// ── Slide 2: Process overview ──────────────────────────────────────────────
{
  const s = pptx.addSlide();
  addHeaderBar(s, 'The journey at a glance', 'Seven steps — from a hirer pressing "Submit" to the deposit being returned');

  const steps = [
    { num: 1, title: 'Enquiry\nreceived', color: C.amber },
    { num: 2, title: 'Security\nreview', color: C.blue },
    { num: 3, title: 'Visit\ncomplete', color: C.blue },
    { num: 4, title: 'Confirmation\nsent', color: C.primary },
    { num: 5, title: 'Hirer\nsigns', color: C.green },
    { num: 6, title: 'Hire takes\nplace', color: C.slate },
    { num: 7, title: 'Deposit\nreturned', color: C.gold },
  ];

  const startX = 0.5;
  const stepW = 1.62;
  const stepGap = 0.18;
  const cy = 3.4;

  // Background timeline
  s.addShape('rect', {
    x: 0.5, y: cy + 0.42, w: 12.3, h: 0.04,
    fill: { color: C.accentSoft }, line: { type: 'none' },
  });

  steps.forEach((st, i) => {
    const x = startX + i * (stepW + stepGap);
    // circle
    s.addShape('ellipse', {
      x: x + (stepW - 1.0) / 2, y: cy, w: 1.0, h: 1.0,
      fill: { color: st.color }, line: { color: st.color, width: 0 },
    });
    s.addText(String(st.num), {
      x: x + (stepW - 1.0) / 2, y: cy, w: 1.0, h: 1.0,
      color: 'FFFFFF', fontSize: 36, bold: true, align: 'center', valign: 'middle', fontFace: F,
    });
    s.addText(st.title, {
      x, y: cy + 1.15, w: stepW, h: 0.8,
      color: C.text, fontSize: 14, bold: true, align: 'center', fontFace: F,
    });
  });

  // Arrows between
  for (let i = 0; i < 6; i++) {
    const ax = startX + i * (stepW + stepGap) + stepW - 0.15;
    s.addShape('rightArrow', {
      x: ax, y: cy + 0.32, w: 0.36, h: 0.36,
      fill: { color: C.accent }, line: { color: C.accent, width: 0 },
    });
  }

  // Caption strip
  s.addShape('roundRect', {
    x: 0.5, y: 5.7, w: 12.3, h: 1.0, rectRadius: 0.15,
    fill: { color: 'FFFFFF' }, line: { color: 'E5E7EB', width: 1 },
  });
  s.addText('At each step the right people are automatically kept in the loop by email.', {
    x: 0.7, y: 5.8, w: 11.9, h: 0.4,
    color: C.primary, fontSize: 16, bold: true, fontFace: F,
  });
  s.addText('The booking manager only needs to take action at four points — everything else happens on its own.', {
    x: 0.7, y: 6.2, w: 11.9, h: 0.4,
    color: C.muted, fontSize: 13, italic: true, fontFace: F,
  });

  addFooter(s, 2, TOTAL);
}

// ── Detail slide builder ───────────────────────────────────────────────────
function detailSlide(opts) {
  const { num, totalSteps = 7, title, intro, whoActs, whatHappens, emails, badgeColor, pageNum } = opts;
  const s = pptx.addSlide();
  s.background = { color: C.light };

  // Top accent strip
  s.addShape('rect', { x: 0, y: 0, w: 13.333, h: 0.18, fill: { color: C.primary }, line: { type: 'none' } });

  // Step pill
  s.addShape('roundRect', {
    x: 0.5, y: 0.4, w: 1.6, h: 0.45, rectRadius: 0.22,
    fill: { color: badgeColor }, line: { type: 'none' },
  });
  s.addText(`STEP ${num} OF ${totalSteps}`, {
    x: 0.5, y: 0.4, w: 1.6, h: 0.45,
    color: 'FFFFFF', fontSize: 12, bold: true, align: 'center', valign: 'middle', charSpacing: 4, fontFace: F,
  });

  // Title
  s.addText(title, {
    x: 0.5, y: 1.0, w: 12.3, h: 0.7,
    color: C.primary, fontSize: 34, bold: true, fontFace: F,
  });
  s.addText(intro, {
    x: 0.5, y: 1.7, w: 12.3, h: 0.5,
    color: C.muted, fontSize: 16, italic: true, fontFace: F,
  });

  // Left column: big number badge + who acts
  s.addShape('ellipse', {
    x: 0.8, y: 2.8, w: 2.2, h: 2.2,
    fill: { color: badgeColor }, line: { color: badgeColor, width: 0 },
  });
  s.addText(String(num), {
    x: 0.8, y: 2.8, w: 2.2, h: 2.2,
    color: 'FFFFFF', fontSize: 110, bold: true, align: 'center', valign: 'middle', fontFace: F,
  });
  s.addText('WHO ACTS', {
    x: 0.5, y: 5.2, w: 2.8, h: 0.3,
    color: C.muted, fontSize: 11, bold: true, charSpacing: 4, align: 'center', fontFace: F,
  });
  s.addText(whoActs, {
    x: 0.5, y: 5.5, w: 2.8, h: 0.6,
    color: C.primary, fontSize: 18, bold: true, align: 'center', fontFace: F,
  });

  // Middle column: what happens
  panelCard(s, {
    x: 3.7, y: 2.7, w: 5.4, h: 4.0,
    title: 'What happens',
    lines: whatHappens,
    accent: badgeColor,
  });

  // Right column: emails sent
  s.addShape('roundRect', {
    x: 9.3, y: 2.7, w: 3.5, h: 4.0, rectRadius: 0.12,
    fill: { color: C.primary }, line: { type: 'none' },
  });
  s.addText('EMAILS SENT', {
    x: 9.5, y: 2.85, w: 3.1, h: 0.3,
    color: C.accentSoft, fontSize: 11, bold: true, charSpacing: 4, fontFace: F,
  });

  if (emails.length === 0) {
    s.addText('No emails at this step', {
      x: 9.5, y: 4.5, w: 3.1, h: 0.4,
      color: 'FFFFFF', fontSize: 14, italic: true, align: 'center', fontFace: F,
    });
  } else {
    let ey = 3.25;
    emails.forEach(e => {
      s.addShape('roundRect', {
        x: 9.5, y: ey, w: 3.1, h: 0.85, rectRadius: 0.08,
        fill: { color: 'FFFFFF' }, line: { type: 'none' },
      });
      // small envelope icon
      s.addShape('rect', {
        x: 9.65, y: ey + 0.25, w: 0.45, h: 0.32,
        fill: { color: C.accent }, line: { type: 'none' },
      });
      s.addShape('line', {
        x: 9.65, y: ey + 0.25, w: 0.225, h: 0.16,
        line: { color: 'FFFFFF', width: 1.5 },
      });
      s.addShape('line', {
        x: 9.875, y: ey + 0.41, w: 0.225, h: -0.16,
        line: { color: 'FFFFFF', width: 1.5 },
      });
      s.addText(e.to, {
        x: 10.2, y: ey + 0.08, w: 2.35, h: 0.35,
        color: C.primary, fontSize: 13, bold: true, fontFace: F,
      });
      s.addText(e.about, {
        x: 10.2, y: ey + 0.42, w: 2.35, h: 0.35,
        color: C.muted, fontSize: 10, italic: true, fontFace: F,
      });
      ey += 1.0;
    });
  }

  addFooter(s, pageNum, TOTAL);
  return s;
}

// ── Slide 3: Step 1 ────────────────────────────────────────────────────────
detailSlide({
  num: 1,
  pageNum: 3,
  badgeColor: C.amber,
  title: 'Enquiry received',
  intro: 'A potential hirer fills in the booking form on the website.',
  whoActs: 'The hirer',
  whatHappens: [
    'Hirer submits the booking form online.',
    'Enquiry lands automatically on the Admin Portal.',
    'No action needed yet — the booking manager will pick it up next.',
  ],
  emails: [
    { to: 'The hirer', about: 'Confirms we have received their enquiry' },
    { to: 'Booking manager', about: 'Full enquiry details to review' },
  ],
});

// ── Slide 4: Step 2 ────────────────────────────────────────────────────────
detailSlide({
  num: 2,
  pageNum: 4,
  badgeColor: C.blue,
  title: 'Send for Security Review',
  intro: 'The booking manager asks the Security Team to check the event.',
  whoActs: 'Booking manager',
  whatHappens: [
    'Opens the enquiry on the Admin Portal.',
    'Clicks "Request Security Review".',
    'Enquiry stays on hold until the Security Team responds.',
  ],
  emails: [
    { to: 'Security Team', about: 'Event details + approval link' },
    { to: 'Booking manager', about: 'Copy of the request for records' },
  ],
});

// ── Slide 5: Step 3 ────────────────────────────────────────────────────────
detailSlide({
  num: 3,
  pageNum: 5,
  badgeColor: C.blue,
  title: 'Approval & Venue Visit',
  intro: 'A member of the Security Team approves the event, and a venue visit takes place.',
  whoActs: 'Security Team',
  whatHappens: [
    'Security Team approves via their email link.',
    'The booking moves to "Visit Complete" on the portal.',
    'By this point the booking manager has visited the hirer to discuss plans.',
  ],
  emails: [],
});

// ── Slide 6: Step 4 ────────────────────────────────────────────────────────
detailSlide({
  num: 4,
  pageNum: 6,
  badgeColor: C.primary,
  title: 'Send the Hire Confirmation',
  intro: 'The booking manager sends the hirer the formal confirmation pack.',
  whoActs: 'Booking manager',
  whatHappens: [
    'Clicks "Send Confirmation" on the portal.',
    'Hirer receives a link to read the conditions, sign and provide bank details.',
    'The link can be resent if the hirer needs a reminder.',
  ],
  emails: [
    { to: 'The hirer', about: 'Link to sign hire conditions' },
  ],
});

// ── Slide 7: Step 5 ────────────────────────────────────────────────────────
detailSlide({
  num: 5,
  pageNum: 7,
  badgeColor: C.green,
  title: 'Hirer signs & confirms',
  intro: 'The hirer accepts the conditions, signs, and provides their bank details.',
  whoActs: 'The hirer',
  whatHappens: [
    'Reads the hire conditions and signs online.',
    'Provides bank details for the future deposit return.',
    'Booking moves to "Hire Confirmed" on the portal.',
  ],
  emails: [
    { to: 'Booking manager', about: 'Signed agreement + bank details' },
    { to: 'The hirer', about: 'Thank-you & copy of conditions' },
  ],
});

// ── Slide 8: Step 6 ────────────────────────────────────────────────────────
detailSlide({
  num: 6,
  pageNum: 8,
  badgeColor: C.slate,
  title: 'The hire takes place',
  intro: 'The event happens. After the date, the booking moves on automatically.',
  whoActs: 'No one — automatic',
  whatHappens: [
    'On the day of the event, the hire goes ahead as agreed.',
    'After the event date, the booking moves to "Hire Complete".',
    'A new deposit-return task appears for the booking manager.',
  ],
  emails: [],
});

// ── Slide 9: Step 7 ────────────────────────────────────────────────────────
detailSlide({
  num: 7,
  pageNum: 9,
  badgeColor: C.gold,
  title: 'Return the deposit',
  intro: 'The booking manager authorises the refund — full or with a deduction.',
  whoActs: 'Booking manager',
  whatHappens: [
    'Opens the Deposit Returns page on the portal.',
    'Either "Full Deposit Return" or "Deduction" (with a reason).',
    'The Treasurer receives the instruction and pays the hirer.',
  ],
  emails: [
    { to: 'The Treasurer', about: 'Refund amount + hirer bank details' },
  ],
});

// ── Slide 10: Who hears what (matrix) ──────────────────────────────────────
{
  const s = pptx.addSlide();
  addHeaderBar(s, 'Who hears what — and when', 'Every step keeps the right people informed automatically');

  const headerFill = { color: C.primary };
  const headerText = { color: 'FFFFFF', bold: true, fontSize: 13, align: 'center', valign: 'middle', fontFace: F };
  const cellOpts = { fontSize: 12, valign: 'middle', fontFace: F, color: C.text };
  const stepCol = { ...cellOpts, bold: true, color: C.primary };
  const tick = { ...cellOpts, align: 'center', bold: true, color: C.green, fontSize: 18 };
  const blank = { ...cellOpts, align: 'center', color: 'CBD5E1' };

  const rows = [
    [
      { text: 'Step', options: { ...headerText, fill: headerFill } },
      { text: 'Hirer', options: { ...headerText, fill: headerFill } },
      { text: 'Booking\nManager', options: { ...headerText, fill: headerFill } },
      { text: 'Security\nTeam', options: { ...headerText, fill: headerFill } },
      { text: 'Treasurer', options: { ...headerText, fill: headerFill } },
    ],
    [
      { text: '1. Enquiry submitted', options: stepCol },
      { text: '✓', options: tick },
      { text: '✓', options: tick },
      { text: '—', options: blank },
      { text: '—', options: blank },
    ],
    [
      { text: '2. Security review requested', options: stepCol },
      { text: '—', options: blank },
      { text: '✓', options: tick },
      { text: '✓', options: tick },
      { text: '—', options: blank },
    ],
    [
      { text: '3. Approval & visit', options: stepCol },
      { text: '—', options: blank },
      { text: '—', options: blank },
      { text: '—', options: blank },
      { text: '—', options: blank },
    ],
    [
      { text: '4. Confirmation sent', options: stepCol },
      { text: '✓', options: tick },
      { text: '—', options: blank },
      { text: '—', options: blank },
      { text: '—', options: blank },
    ],
    [
      { text: '5. Hirer signs & confirms', options: stepCol },
      { text: '✓', options: tick },
      { text: '✓', options: tick },
      { text: '—', options: blank },
      { text: '—', options: blank },
    ],
    [
      { text: '6. Hire takes place', options: stepCol },
      { text: '—', options: blank },
      { text: '—', options: blank },
      { text: '—', options: blank },
      { text: '—', options: blank },
    ],
    [
      { text: '7. Deposit returned', options: stepCol },
      { text: '—', options: blank },
      { text: '—', options: blank },
      { text: '—', options: blank },
      { text: '✓', options: tick },
    ],
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.7, w: 12.3,
    colW: [3.5, 2.2, 2.2, 2.2, 2.2],
    rowH: 0.55,
    border: { type: 'solid', color: 'E5E7EB', pt: 1 },
    fill: { color: 'FFFFFF' },
  });

  // Legend
  s.addShape('roundRect', {
    x: 0.5, y: 6.5, w: 12.3, h: 0.5, rectRadius: 0.08,
    fill: { color: 'FFFFFF' }, line: { color: 'E5E7EB', width: 1 },
  });
  s.addText('✓  = email sent automatically     ·     —  = no email at this step', {
    x: 0.7, y: 6.5, w: 11.9, h: 0.5,
    color: C.muted, fontSize: 13, align: 'center', valign: 'middle', italic: true, fontFace: F,
  });

  addFooter(s, 10, TOTAL);
}

// ── Slide 11: Closing / takeaways ─────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: C.primary };
  s.addShape('ellipse', { x: -2, y: -2, w: 7, h: 7, fill: { color: C.accent, transparency: 80 }, line: { type: 'none' } });
  s.addShape('ellipse', { x: 9, y: 4, w: 7, h: 7, fill: { color: C.accent, transparency: 80 }, line: { type: 'none' } });

  s.addText('In a nutshell', {
    x: 0.5, y: 0.5, w: 12.3, h: 0.6,
    color: C.accentSoft, fontSize: 18, bold: true, charSpacing: 6, fontFace: F,
  });
  s.addText('Four simple actions, one smooth process', {
    x: 0.5, y: 1.1, w: 12.3, h: 1.0,
    color: 'FFFFFF', fontSize: 40, bold: true, fontFace: F,
  });

  const cards = [
    { n: '1', t: 'Request Security Review', d: 'Send the enquiry to the Security Team for a safety check.' },
    { n: '2', t: 'Send Confirmation', d: 'Email the hirer the link to sign the agreement.' },
    { n: '3', t: 'Wait for hire date', d: 'The system moves the booking forward on its own.' },
    { n: '4', t: 'Authorise Deposit Return', d: 'Tell the Treasurer to refund — full or with a deduction.' },
  ];
  const cardW = 2.9, cardH = 3.2, gap = 0.2, total = 4 * cardW + 3 * gap;
  const startX = (13.333 - total) / 2;
  cards.forEach((c, i) => {
    const x = startX + i * (cardW + gap);
    s.addShape('roundRect', {
      x, y: 3.0, w: cardW, h: cardH, rectRadius: 0.18,
      fill: { color: 'FFFFFF' }, line: { type: 'none' },
    });
    s.addShape('ellipse', {
      x: x + (cardW - 0.85) / 2, y: 3.3, w: 0.85, h: 0.85,
      fill: { color: C.primary }, line: { type: 'none' },
    });
    s.addText(c.n, {
      x: x + (cardW - 0.85) / 2, y: 3.3, w: 0.85, h: 0.85,
      color: 'FFFFFF', fontSize: 32, bold: true, align: 'center', valign: 'middle', fontFace: F,
    });
    s.addText(c.t, {
      x: x + 0.25, y: 4.35, w: cardW - 0.5, h: 0.7,
      color: C.primary, fontSize: 17, bold: true, align: 'center', fontFace: F,
    });
    s.addText(c.d, {
      x: x + 0.25, y: 5.1, w: cardW - 0.5, h: 1.2,
      color: C.muted, fontSize: 13, align: 'center', fontFace: F,
    });
  });

  s.addText('Everything else — the emails, status updates, and reminders — happens automatically.', {
    x: 0.5, y: 6.7, w: 12.3, h: 0.5,
    color: C.accentSoft, fontSize: 16, italic: true, align: 'center', fontFace: F,
  });
}

// ── Save ───────────────────────────────────────────────────────────────────
pptx.writeFile({ fileName: 'BookingProcess.pptx' })
  .then(name => console.log('Wrote', name))
  .catch(err => { console.error(err); process.exit(1); });
