# Santa Grotto 2026 – payments and register

Saturday 12 December 2026, 10am–12pm. Page: `/christmas2026`. Capacity: 80 children
(`GROTTO_CAPACITY` in `src/lib/santa-grotto.ts`).

## How it works
1. The form posts to `/api/christmas2026/checkout`, which **reserves the places** (a 31-minute
   hold in `grotto_holds`) and creates a Stripe Checkout Session that expires after 30 minutes.
   If fewer places remain than requested it answers 409 "Only N places left".
2. On payment Stripe calls `/api/stripe/webhook` (`checkout.session.completed`). The webhook
   verifies the signature, writes the booking to `grotto_bookings/{sessionId}` (idempotent),
   bumps `grotto_meta/stats.childrenSold`, releases the hold, and emails booking@bishopshullhub.co.uk.
3. `checkout.session.expired` releases the hold so abandoned checkouts free their places.
4. Admins see the register in **Admin → Xmas 2026**: live list in age order, arrival ticks,
   Print, and Export register (CSV).

`/api/christmas2026/availability` feeds the "Only N places left" / sold-out message on the page.
A payment that lands after the hold expired is still recorded (the parent has paid) and flagged
`overCapacity`, with a warning in the alert email.

## Go-live checklist
1. Stripe: finish account verification; set receipts, branding, statement descriptor.
2. Create secrets and grant the backend access:
   `firebase apphosting:secrets:set stripe-secret-key` (a restricted key with *Checkout Sessions: Write* is enough),
   `firebase apphosting:secrets:set stripe-webhook-secret`, then `grantaccess` for each.
3. Uncomment the two Stripe blocks in `apphosting.yaml` and merge.
4. Deploy the rules: `firebase deploy --only firestore:rules`.
5. Stripe Dashboard → Developers → Webhooks → add endpoint
   `https://<live-domain>/api/stripe/webhook`, events `checkout.session.completed` and
   `checkout.session.expired`. Copy its signing secret (`whsec_…`) into `stripe-webhook-secret`.
6. Confirm the App Hosting service account can read/write Firestore (it uses application default credentials).
7. Test with Stripe test keys and card 4242 4242 4242 4242, check the booking appears in Admin → Xmas 2026,
   then swap in live keys and make one real £5 booking (refund it afterwards).
8. Update the privacy page (children's names/ages are collected) and add a refund policy.

## Tests
- `npm run test:grotto` – signature, parsing, register ordering, CSV.
- `npm run test:grotto-emulator` – capacity holds, idempotency and races (needs Java).
- `npm run test:rules` – Firestore rules, including the register.
