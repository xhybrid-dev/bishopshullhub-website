// Everything the /lottery page says that the committee has to decide lives here,
// so a monthly update (new winners, supporter count) is a one-file change.
//
// A field left as null means "not decided yet": the page shows a neutral
// fallback ("Cash prize", "date to be announced") or hides that element rather
// than printing a made-up figure. Fill these in before launch; the checklist is
// in docs/community-lottery.md.

export interface LotteryWinner {
  /** The draw this result belongs to, e.g. 'January 2027'. Newest first. */
  draw: string;
  place: 1 | 2 | 3;
  /** Only what the winner agreed to publish, e.g. 'Sue P., Bishops Hull'. */
  name: string;
  ticket: number;
  amountPence?: number;
}

export interface ImpactUpdate {
  /** e.g. 'Spring 2027'. Newest first. */
  when: string;
  title: string;
  text: string;
  /** Optional image in /public, e.g. '/images/lottery/new-lighting.webp'. */
  image?: string;
}

export interface LotteryConfig {
  name: string;
  drawName: string;
  ticketPricePence: number;
  /** 1st, 2nd and 3rd prize in pence. null shows "Cash prize". */
  prizesPence: [number | null, number | null, number | null];
  /** How each ticket is shared, in whole percent totalling 100. null hides the bar.
   *  The law requires at least 20% of ticket sales to go to the Hub's purposes. */
  split: { prizes: number; hub: number; costs: number } | null;
  /** Finishes the sentence "Three numbers are drawn …", e.g. 'on the last Friday of every month'. */
  drawSchedule: string | null;
  /** First draw after the relaunch, as YYYY-MM-DD. */
  firstDrawDate: string | null;
  supporterTarget: number;
  stretchTarget: number;
  /** Tickets currently held. null hides the progress bar. */
  currentSupporters: number | null;
  /** Online sign-up, e.g. a Stripe Payment Link for a £5/month subscription.
   *  null makes "Get your ticket" open a pre-filled email instead. */
  signUpUrl: string | null;
  /** Paper sign-up / standing-order form, e.g. '/lottery-sign-up-form.pdf'. null hides the button. */
  paperFormUrl: string | null;
  /** Full rules (PDF in /public or a page). null hides the link. */
  rulesUrl: string | null;
  contactEmail: string;
  /** The member named as responsible for the lottery (must appear on tickets). */
  promoter: string | null;
  /** Somerset Council small society lottery registration reference. */
  registration: string | null;
  winners: LotteryWinner[];
  updates: ImpactUpdate[];
}

export const LOTTERY: LotteryConfig = {
  name: 'Bishops Hull Community Lottery',
  drawName: 'The Big Draw',
  ticketPricePence: 500,
  prizesPence: [null, null, null], // TODO(committee): e.g. [10000, 5000, 2500]
  split: null, // TODO(committee): e.g. { prizes: 40, hub: 55, costs: 5 }
  drawSchedule: null, // TODO(committee)
  firstDrawDate: null, // TODO(committee)
  supporterTarget: 100,
  stretchTarget: 200,
  currentSupporters: null, // TODO: set once existing 100 Club members have moved across
  signUpUrl: null, // TODO: Stripe Payment Link (see docs/community-lottery.md)
  paperFormUrl: null,
  rulesUrl: null,
  contactEmail: 'trustees@bishopshullhub.co.uk', // TODO(committee): confirm who handles sign-ups
  promoter: null,
  registration: null,
  winners: [],
  updates: [],
};

/** £5, £12.50, £6,000 */
export function formatPounds(pence: number): string {
  const pounds = pence / 100;
  return pounds.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: pence % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Monthly and yearly ticket sales for a number of supporters (before prizes and costs). */
export function salesFor(supporters: number, ticketPricePence = LOTTERY.ticketPricePence) {
  const monthly = supporters * ticketPricePence;
  return { monthly, yearly: monthly * 12 };
}

/** 'Friday 29 January 2027' from 'YYYY-MM-DD', or null. */
export function formatDrawDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London',
  });
}

/** The winners grouped by draw, keeping the order they were listed in. */
export function winnersByDraw(winners: LotteryWinner[]): Array<{ draw: string; results: LotteryWinner[] }> {
  const groups: Array<{ draw: string; results: LotteryWinner[] }> = [];
  for (const w of winners) {
    let g = groups.find((x) => x.draw === w.draw);
    if (!g) groups.push((g = { draw: w.draw, results: [] }));
    g.results.push(w);
  }
  for (const g of groups) g.results.sort((a, b) => a.place - b.place);
  return groups;
}
