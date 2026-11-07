# Bishops Hull Community Lottery: relaunch plan

The Community Lottery replaces the 100 Club. Same £5 a month, rebuilt around what the money does for
the village, and with its own page.

- **Page:** `/lottery` (`src/components/lottery/CommunityLottery.tsx`)
- **Everything the committee decides:** `src/lib/community-lottery.ts`
- **Share card** for Facebook/WhatsApp: `src/app/lottery/opengraph-image.tsx` (generated automatically)

## 1. Positioning

| | |
|---|---|
| Name | **Bishops Hull Community Lottery** (the monthly draw is **The Big Draw**) |
| Tagline | A little chance to win. A big difference for our village. |
| Offer | £5 a month, three cash prizes every month |
| Message | It's about more than winning. Every ticket supports Bishops Hull Hub. |
| Sign-off | Your village. Your Hub. Your lottery. |
| First target | 100 supporters = £500 a month, £6,000 a year in ticket sales. Stretch: 200 = £12,000 |

The page says "Formerly the 100 Club" and "The new home of the 100 Club" so existing members recognise it.
The old `/community#100-club` link still works, because the Community page keeps that anchor on the new card.

## 2. Decisions needed before launch

Anything still `null` in `src/lib/community-lottery.ts` shows a neutral fallback on the page ("Cash prize",
"date to be announced") rather than a made-up figure.

| Decision | Suggestion | Config field |
|---|---|---|
| Prize amounts | Fixed amounts, published, reviewed yearly. Size them on the membership you **have** now, not the target. For discussion only: at 100 tickets (£500), £100 / £50 / £25 is 35% to prizes | `prizesPence` |
| How each £5 is shared | Publish it. The law requires at least 20% to the Hub's purposes; aim for well over half | `split` |
| Draw day and method | Same day every month (e.g. last Friday). Random selection from paid-up tickets, witnessed by two trustees and recorded | `drawSchedule`, `firstDrawDate` |
| How people pay | Stripe Payment Link at launch, plus a paper standing-order form (see section 5) | `signUpUrl`, `paperFormUrl` |
| Who handles sign-ups | One named inbox. Currently set to trustees@ | `contactEmail` |
| Promoter | The member named as responsible for the lottery (must appear on tickets) | `promoter` |
| Registration ref | From the Somerset Council registration | `registration` |
| Full rules | One-page rules PDF in `/public` | `rulesUrl` |
| Existing 100 Club members | Do they move across automatically and keep their numbers? The page promises a personal contact; write to each one before the public launch | page copy |
| Publishing winners | Ask for consent at sign-up; publish first name + initial + area (e.g. "Sue P., Bishops Hull") | `winners` |

## 3. Compliance checklist (small society lottery)

A paid-entry monthly draw is a small society lottery under the Gambling Act 2005 and needs registration with
the local authority. Bishops Hull is in Somerset Council's west area (formerly Somerset West and Taunton).

- [ ] Confirm the existing 100 Club registration is current and in the Hub's name. Tell the council about the new
      name and arrangements, and ask whether anything needs updating. Renewal fees are due yearly.
- [ ] At least **20%** of ticket proceeds go to the Hub's purposes.
- [ ] Ticket sales stay under **£20,000 per draw** and **£250,000 per calendar year**. Even 200 members is £1,000 a
      draw. (A 2026 government consultation proposed raising the per-draw limit. Assume the current limits apply.)
- [ ] Tickets are **paid for before** the draw they enter. With monthly payments, each payment buys the next draw only.
- [ ] Players are **16 or over**: ask for an age confirmation at sign-up.
- [ ] Each ticket (for online sales, the confirmation email) states the society's name, the ticket price, the
      promoter's name and address, and the draw date or how it's set.
- [ ] Send the council a **return within three months of each draw** (sales and draw dates, proceeds, prizes,
      expenses and the amount applied to the Hub).
- [ ] Keep records of members, payments, draws and winners.

Sources: [Somerset Council: small society lotteries](https://www.somerset.gov.uk/business-economy-and-licences/licensing/small-scale-lotteries/),
[Gambling Commission: lottery proceeds](https://www.gamblingcommission.gov.uk/guidance/lotteries-and-the-gambling-act-2005/lotteries-and-the-ga05-lottery-proceeds),
[Blackpool Council guidance notes](https://www.blackpool.gov.uk/Business/Licensing-and-permits/Gambling-licences/Small-society-lottery-guidance-notes.aspx).
Check the details with the council before launch. This list is a summary, not legal advice.

## 4. The page

In order: hero with the £5 ticket, the three prizes, how it works (3 steps), where the money goes (five impact
areas plus the split or a transparency promise), the 100-supporter target with a progress bar, Big Draw results,
"What we've achieved together" updates, a thank-you to 100 Club members, FAQ, a final call to action, and the
legal small print (promoter, registration, 16+, gambling support line).

"Get your ticket" goes to `signUpUrl`. Until that's set, it opens a pre-filled email to `contactEmail`.

Also changed: the Community page card (now links to `/lottery` and replaces the two dead buttons), the
home page card, the hire chatbot's knowledge, and the sitemap.

**Monthly update:** add the three results to the top of `winners` and update `currentSupporters`.
**Quarterly:** add an entry to `updates` (photo in `/public/images/lottery/`).

## 5. Payments, in phases

**Launch (no code):** the Hub already has Stripe for the Santa Grotto. In the Stripe Dashboard, create a product
"Community Lottery ticket" with a **£5 monthly recurring price** and a **Payment Link** for it:
- allow the customer to adjust quantity (one ticket per £5)
- add a required custom field or consent for "I am 16 or over"
- collect phone number; send receipts

Paste the link into `signUpUrl`. Stripe handles the monthly payments and cancellations. A committee member
assigns ticket numbers and emails each new member. Check current Stripe fees and ask about charity pricing:
on a £5 payment the fixed part of the fee is a large share.

**Paper option:** a one-page form with a standing order mandate for people who don't want to pay by card. No card
fees, but payments have to be matched by hand each month.

**Later, once it's growing:** build it like the grotto. Stripe Checkout in subscription mode, a webhook that keeps a
`lottery_members` collection up to date (paid-up status, ticket numbers), an **Admin → Lottery** tab to run and
record the draw from paid-up tickets, and results published straight to the page without a code change.
Confirmation emails with the ticket number go out through Resend.

## 6. Four-week relaunch

| When | What | Page/asset |
|---|---|---|
| Before | Committee decisions (section 2), registration check, personal letters/emails to 100 Club members | Fill in config, merge |
| Week 1 | **Announce** the new name: Facebook (Hub page + village groups), newsletter article, A4 poster with QR code on noticeboards | Share `bhhub.co.uk/lottery`; the share card appears automatically |
| Week 2 | **£5 and three prizes**: post the prize amounts; ask hirers, clubs and organisers to share with members | Prize section |
| Week 3 | **What the money does**: a photo of something the 100 Club funded, and what's next | Impact section, first `updates` entry |
| Week 4 | **First Big Draw**: results post on Facebook, winners on the page, progress towards 100 | `winners`, `currentSupporters` |

Then promote it at every Hub event (Christmas events, quiz nights, craft fairs) with the poster and QR code.
Use a different link per channel (e.g. `/lottery?src=poster`, `?src=facebook`) so you can see what works.

## 7. Routine

**Monthly:** check paid-up tickets → draw → contact winners → pay prizes → update `winners` and
`currentSupporters` → Facebook winners post → council return (within three months).

**Quarterly:** "Your lottery, your community: here's what we've achieved together", with a photo.

**Measure:** supporters against target, cancellations per month, where sign-ups came from, and the share of ticket
income that reached the Hub.
