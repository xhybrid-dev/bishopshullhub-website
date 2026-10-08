# Migrating to the new Firebase project

Moving the site from the old Firebase project (`studio-567413641-bce0e`) to the
new one (`bishopshullhub-web`, App Hosting backend in `europe-west4`).

The code needs no changes for this. Everything that differs between the two
projects is either **configuration** (secrets, sign-in settings, domains) or
**data** (Firestore). Hallmaster, Resend and the GitHub repo are not tied to a
Firebase project.

---

## 1. What the site depends on

| Piece | Lives in | Moves how |
|---|---|---|
| Website code | GitHub repo | Already connected to the new backend ✅ |
| Booking enquiries, the full Kanban state, security comments, hire agreements | Firestore `booking_enquiries` | Copy script (§4) |
| Hirers' bank details and signatures | Firestore `booking_enquiries/{id}/private/payment` (admin-only) | Copy script (§4), copied with its enquiry |
| FAQs (site and chatbot) | Firestore `faqs` | Copy script (§4) |
| Admin and security-team lists | Firestore `admins`, `security_team` | Copy script (§4) |
| `community_initiatives`, `gallery_images`, `page_contents` | Firestore | Copy script (§4); may be empty |
| Admin and security-team logins | Firebase Authentication | People re-activate (§5) |
| Visitors' sign-in for the enquiry form and chatbot | Firebase Authentication (Anonymous) | Turn the provider on (§3) |
| Security rules | `firestore.rules` in the repo | Deploy (§3) |
| Emails (enquiries, security review, provisional, hire agreement, deposit return) | Resend, sending as `@bishopshullhub.co.uk` | Same Resend account and key; nothing to move (§6) |
| Chatbot | Gemini API key | Done ✅ |
| Maps on Find Us | Google Maps browser key | Check key restrictions (§6) |
| Google reviews | Places API key and Place ID | Fix the secret mapping (§6) |
| Live calendar and clash checks | Hallmaster public iCal feed | Nothing to do |
| `bishopshullhub.co.uk` / `bhhub.co.uk` | DNS + App Hosting custom domain | Cutover (§7) |

> **Why document IDs matter.** Emails already sent to hirers and the security
> team contain links such as `/confirm/<enquiry id>` and the security-review
> link. The copy script keeps every ID, so those links keep working once the
> domain points at the new site.

---

## 2. Order of work

1. Set up the new project (§3). Nothing changes for the public yet.
2. Do a first copy of the data (§4) and test the new site on its `hosted.app` address.
3. Sort out the third-party keys (§6).
4. **Cutover day** (§7): freeze, final copy, move the domain, copy any stragglers.
5. Keep the old project read-only for about a month, then close it down (§8).

The old site keeps running unchanged until step 4, so take your time over 1–3.

---

## 3. Set up the new Firebase project

In the Firebase console for **bishopshullhub-web**:

1. **Billing:** confirm the Blaze plan is on. App Hosting requires it.
2. **Firestore:** Build → Firestore Database → *Create database*, in production
   mode. Choose a region close to the old one if you can (e.g. `europe-west2`
   London). The region can't be changed later.
3. **Security rules:** deploy them from the repo:
   ```
   npx firebase deploy --only firestore:rules --project bishopshullhub-web
   ```
   Then check the Rules tab shows the file (it starts *Bishops Hull Hub Security Rules*).
4. **Authentication → Sign-in method:** turn on **both**
   - **Email/Password**: admins and the security team.
   - **Anonymous**: the public enquiry form and chatbot sign visitors in
     anonymously before saving an enquiry. **If this is off, every enquiry
     submission fails.**
5. **Authentication → Settings → Authorized domains:** add
   - `bishopshullhub-website--bishopshullhub-web.europe-west4.hosted.app`
   - `bishopshullhub.co.uk` and `www.bishopshullhub.co.uk`
   - `bhhub.co.uk` and `www.bhhub.co.uk`
6. **Web app config secrets.** Project settings → *Your apps* → the web app's
   config gives the values for these App Hosting secrets (they must belong to
   the **new** project):
   `firebase-api-key`, `firebase-project-id` (= `bishopshullhub-web`),
   `firebase-app-id`, `firebase-auth-domain` (= `bishopshullhub-web.firebaseapp.com`),
   `firebase-messaging-sender-id`, `firebase-measurement-id`.
   ```
   npx firebase apphosting:secrets:describe firebase-project-id --project bishopshullhub-web
   ```
   shows what a secret holds. Re-set any that still carry the old project's values.

---

## 4. Copy the data

`scripts/copy-firestore.mjs` copies every collection, including the private
bank-details documents, keeping all IDs. It signs in to **both** projects as
the primary admin, so it runs under the normal security rules and needs no
service-account keys. It never changes the old project.

**Before the first run**, activate the primary admin on the new site: open
`<new site>/login` → *Activate*, using `bishopshullhub@gmail.com`, and choose a password.

Values you need:

| Variable | Where from |
|---|---|
| `SOURCE_API_KEY`, `SOURCE_PROJECT_ID`, `SOURCE_AUTH_DOMAIN` | Old project → Project settings → Your apps → config |
| `TARGET_API_KEY`, `TARGET_PROJECT_ID`, `TARGET_AUTH_DOMAIN` | Same, in the new project |
| `SOURCE_ADMIN_PASSWORD` / `TARGET_ADMIN_PASSWORD` | Your `bishopshullhub@gmail.com` password on each site |

Run it from the repo on your own computer:

```bash
export SOURCE_API_KEY=...  SOURCE_PROJECT_ID=studio-567413641-bce0e  SOURCE_AUTH_DOMAIN=studio-567413641-bce0e.firebaseapp.com
export TARGET_API_KEY=...  TARGET_PROJECT_ID=bishopshullhub-web       TARGET_AUTH_DOMAIN=bishopshullhub-web.firebaseapp.com
export ADMIN_EMAIL=bishopshullhub@gmail.com
read -s SOURCE_ADMIN_PASSWORD; export SOURCE_ADMIN_PASSWORD
read -s TARGET_ADMIN_PASSWORD; export TARGET_ADMIN_PASSWORD

node scripts/copy-firestore.mjs                     # dry run: counts only
node scripts/copy-firestore.mjs --apply             # copy what's missing
```

| Flag | Effect |
|---|---|
| *(none)* | Dry run. Shows what's in each collection and what would be copied |
| `--apply` | Copies documents the new project doesn't have yet. Safe to repeat |
| `--apply --overwrite` | Also replaces documents already in the new project. **Only before cutover**: afterwards it would undo work done on the new site |

The dry run's counts are also your check afterwards: once the copy is complete,
every line should say *would copy 0*.

**Alternative for very large data:** Google's managed
`gcloud firestore export` / `import` through a Cloud Storage bucket. It needs
the new project's Firestore service agent to have read access to the old
project's bucket. The script is simpler at this site's size.

---

## 5. Logins

Firebase Authentication users can't be copied by the script, and no-one's
access depends on their user ID (admin access is decided by **email**, via
the `admins` / `security_team` lists), so the simplest route is:

- After the copy, each admin and security-team member opens `/login` on the new site,
  chooses **Activate** and sets a password. The Activate button only works
  for emails on the copied lists.
- Anyone who forgets can be removed and re-added from the admin page.

If you'd rather people keep their existing passwords, Firebase can move them:
`firebase auth:export` from the old project, then `firebase auth:import` into
the new one with the old project's *password hash parameters* (Authentication
→ Users → ⋮ menu). For a handful of people re-activating is quicker.

---

## 6. Keys and outside services

**Resend (all booking emails)**: nothing to move. The `resend-api-key`
secret just needs the same key as before. The sending domain
`bishopshullhub.co.uk` is verified in the Resend account through DNS, and
that doesn't change. Test it by submitting an enquiry and checking the
bookings and operations inboxes.

**Gemini (chatbot)**: done. Keep it a dedicated server-only key.

**Google Places (reviews)**: `apphosting.yaml` currently maps
`GOOGLE_PLACES_API_KEY` to the `google-place-id` secret. It must be
`google-places-api-key`, or the reviews fetch fails.

**Google Maps (Find Us page)**: the browser key is usually restricted to
websites. In Google Cloud → Credentials → that key → *Website restrictions*,
add the `hosted.app` address and both domains (`https://bishopshullhub.co.uk/*`,
`https://bhhub.co.uk/*`, with `www.` versions). If the key was created in the
**old** project, either keep using it, since it works from any project, or create
a new one in the new project and update `google-maps-api-key`.

**Analytics**: `firebase-measurement-id` must be the new project's web app
measurement ID, or analytics keeps reporting into the old project.

**Hallmaster**: nothing to do; the iCal feed is public.

After changing any secret, start a new rollout. Secrets are read at build and start-up.

---

## 7. Cutover day

Allow about an hour of quiet, then up to a day for DNS to settle.

1. **Freeze**: tell admins and the security team not to process bookings on the
   old site for the hour. Public enquiries can carry on; step 5 catches them.
2. **Final copy**: `node scripts/copy-firestore.mjs --apply --overwrite`. This is
   the last time `--overwrite` is used: it brings across every change made on the
   old site since the first copy.
3. **Move the domains**:
   - Old Firebase console → App Hosting → old backend → Settings → Domains:
     **remove** `bishopshullhub.co.uk` / `bhhub.co.uk`.
   - New console → App Hosting → `bishopshullhub-website` → Settings → Domains:
     **add** them and copy the DNS records it shows (A / TXT, plus any CNAME for `www`).
   - At your domain registrar, replace the old App Hosting records with the new ones.
   - The new console shows *Certificate pending* until the records are seen and
     HTTPS is issued, usually under an hour and up to 24 hours.
4. **Check** the live domain serves the new site; the address bar shows
   `bishopshullhub.co.uk` and the admin board shows your bookings.
5. **Stragglers**: while DNS updates around the world, some visitors still reach
   the old site. Re-run `node scripts/copy-firestore.mjs --apply` (no `--overwrite`)
   later that day and again the next day. It adds new enquiries and never touches
   ones already on the new site.

---

## 8. After cutover

**Test each flow on the live domain:**
- [ ] Public enquiry form submits; booking emails arrive
- [ ] Chatbot answers, checks availability and can submit an enquiry
- [ ] Admin login; Kanban shows existing bookings; Hallmaster re-sync works
- [ ] *Request Security Review* sends; the review link opens and saves comments
- [ ] Hire agreement link opens, submits, and bank details appear for admins
- [ ] An **old** link from an email sent before the move still opens
- [ ] Find Us map and Google reviews load

**Then the old project:**
- Leave it running read-only for about 30 days as a fallback.
- Lock it: replace its Firestore rules with `allow read, write: if false;` so no
  new enquiries land there unnoticed.
- After that, export a final backup if you want one, and delete the old
  project or its App Hosting backend. Remember the old project holds hirers'
  bank details too, so don't leave it running indefinitely.
