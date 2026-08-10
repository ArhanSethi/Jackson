# Jackson — Full Vision Roadmap: Sprint 3 (Backend, Auth, Accounts)

> **⏸ PAUSED as of 2026-08-10 — see SPRINT4.md.** Ticket 3.1 is done and
> verified. Ticket 3.2 is implemented but blocked purely on local
> verification (real account sign-up/login/logout + a live `/api/me`
> check) on a machine with normal internet access — the dev sandbox used
> couldn't reach Clerk's domains at all (network-policy block, not a code
> or key problem; full diagnosis in Ticket 3.2's notes below). Tickets
> 3.3-3.5 are not started. **Resume from Ticket 3.2's local verification**
> once SPRINT4.md's work is done — re-read this file's actual state first,
> don't resume from memory.

**Higher risk than Sprints 1-2.** Several tickets below don't have a clean
"Done when" until a real decision gets made first, usually by the user, not
Claude Code.

**Checkpoint rule:** at the end of this sprint, honestly assess whether it
finished clean or bled into extra days. If it ran long, that's the signal to
cut scope from what's left, not compress the remaining sprints harder.

**Goal:** Move Jackson from single-device/no-accounts to a real backend with
authenticated users. Sprints 4-5 depend on this existing first.

---

### Ticket 3.0 — Decided
- Auth provider: Clerk
- Backend hosting: Render (revised from Railway 2026-08-05 — Railway's free
  tier was killed in 2023, now a $5/mo minimum; Render has a genuine free
  web service tier)
- Database: Render's managed Postgres (free tier expires after 30 days
  unless upgraded to ~$7/mo — acceptable for active dev, needs upgrading
  before holding real student data long-term)
- Multiple student profiles per parent account (siblings): Yes, supported
  from the start.

**Status:** Decided by the user. Clerk application created, secret key
provided 2026-08-05 (stored in `server/.env`, gitignored) — publishable
key still needed. Render account/services not yet created as of
2026-08-05.

---

### Ticket 3.1 — Backend proxy skeleton
Stand up a minimal Node/Express backend. Move the Claude API key here
(server-side only). App calls the backend, backend calls Claude. Closes the
client-side-key gap that was an accepted V1 tradeoff.

**Done when:** app's question-generation and grading calls route through
the backend, not directly to Anthropic, verified via network inspection
showing no anthropic.com calls originating from the client.

- [x] Done. Notes: Local Express backend (server/) holds the Anthropic key
  server-side; client (src/lib/claude.ts) rewritten as a thin fetch wrapper
  calling EXPO_PUBLIC_BACKEND_URL, no Anthropic key or URL in client code
  or client .env anymore. Verified: (1) both /api/generate-question and
  /api/grade-answer tested directly against the real Anthropic API and
  returned correct results; (2) live in-browser network trace (clicking
  Addition in the running Expo web app) shows the question-generation call
  going to http://localhost:3001/api/generate-question, zero anthropic.com
  requests. Could not capture the equivalent live network trace for the
  submit/grade-answer path — a Browser-pane display issue (screenshot
  timeouts, unrelated to the app) blocked the draw-and-submit gesture even
  after reload/resize/new-tab retries. Grade-answer's routing code is
  identical to generate-question's (same callBackend() helper, same
  BACKEND_URL, no Anthropic reference anywhere in the client), so this is a
  tooling verification gap, not an open code question — flagging it rather
  than silently claiming full in-browser proof. Railway deployment not yet
  done (still running the backend locally); that's a separate later step,
  not required by this ticket's literal Done-when.
  **2026-08-05 retry attempt:** still couldn't retry this live — this
  session's container has no `server/.env` at all, so there's no
  `ANTHROPIC_API_KEY` to make grade-answer calls succeed against, separate
  from whatever the earlier Browser-pane issue was. Code path is unchanged
  from what's described above.
  **2026-08-09, retried and clean.** User supplied a real
  `ANTHROPIC_API_KEY`, added to `server/.env` (gitignored, not committed).
  Confirmed `api.anthropic.com` is reachable from this sandbox (unlike
  Clerk's domains — see Ticket 3.2). Ran `npx setup-skia-web` (was missing
  `public/canvaskit.wasm`, a gitignored local Skia-web asset the canvas
  needs to render at all — unrelated to Ticket 3.1/3.2, just a first-time
  local setup step). Then drove the actual running app with Playwright:
  clicked "Addition", got a real generated question ("3 + 5"), drew a
  stroke on the canvas, clicked Submit, and got back a real grading result
  ("Not quite, the answer was 8" — correct, since the stroke wasn't a
  written "8"). Captured every network request the browser made during
  this: `POST http://localhost:3001/api/generate-question` and
  `POST http://localhost:3001/api/grade-answer` are the only calls tied to
  the question/grading flow; filtering the full request log for
  `anthropic.com` returns zero matches. (Ticket 3.2's Clerk sign-in was
  bypassed with a temporary, uncommitted local edit to `App.tsx` purely to
  reach the canvas — Clerk's own domains are still blocked in this sandbox,
  see Ticket 3.2 — and reverted via `git checkout -- App.tsx` immediately
  after the trace; grading and generation routing don't depend on Clerk in
  any way, so this doesn't weaken the result.) **Done-when fully satisfied
  for both endpoints now** — no longer flagging this as a gap.

---

### Ticket 3.2 — Auth integration
Wire Clerk into both backend and app. Parent creates an account (email/
password or similar, decide the exact flow).

**Done when:** a parent can sign up, log in, log out, and the backend can
identify which authenticated user is making a request.

**Decision needed:** exact sign-up flow (email/password vs. social vs.
magic link) — blocked on a live Clerk account/application to configure.

**Status:** Decided by the user 2026-08-05 — support all three (email/
password, magic link, and social login) via Clerk's prebuilt `<SignIn />`/
`<SignUp />` components, which handle multiple enabled strategies without
custom per-method flow code. Blocked on the Clerk publishable key
(`pk_test_...`) to start implementation — secret key already provided.

- [ ] Done. Notes: Implementation complete, real-account verification still
  blocked. `<SignIn />`/`<SignUp />` are Clerk-web-only (exported from
  `@clerk/clerk-expo/web`, backed by `@clerk/clerk-react` — Clerk has no
  prebuilt UI for bare Expo/React Native, only a newer native-component beta
  under a different package/major version that needs a custom dev build, out
  of scope here). Added `src/components/AuthScreen.web.tsx` using the real
  prebuilt components with `routing="virtual"`; Metro picks this file for
  `expo start --web` (Jackson's primary dev loop) and falls back to the
  existing hook-based `AuthScreen.tsx` for native. `ClerkProvider` (index.tsx),
  the native token cache (src/lib/tokenCache.ts), the backend's
  `requireAuth`/`verifyToken` middleware (server/src/auth.js), and the
  `GET /api/me` route (server/index.js) were already in place from prior
  work. Added `verifyBackendAuth()` (src/lib/claude.ts) so the app itself —
  not just a manual curl — calls `/api/me` with the signed-in user's real
  Clerk session token once signed in, and surfaces the returned backend
  user ID next to the account email in the UI, satisfying "backend can
  identify which authenticated user is making a request" against a real
  client request. `npx tsc --noEmit` is clean; the backend boots and
  `/api/me` correctly returns 401 with no token.
  **2026-08-09: keys supplied, new blocker found — network policy, not
  missing keys.** The user provided the real publishable/secret key values
  in chat; wrote them to `.env` (`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, note:
  the user's paste used the Next.js-style `NEXT_PUBLIC_` prefix, renamed to
  the `EXPO_PUBLIC_` prefix this Expo project actually reads) and
  `server/.env` (`CLERK_SECRET_KEY`) — both confirmed gitignored, never
  committed. Booted the backend and `expo start --web`, then drove it with
  Playwright to see how far a real browser gets. Result: the app mounts,
  parses the key correctly, and Clerk's SDK requests
  `https://composed-magpie-71.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js`
  (the right host, derived correctly from the key) — but that request
  fails with `net::ERR_TUNNEL_CONNECTION_FAILED`. Direct `curl` to both
  `api.clerk.com` and `composed-magpie-71.clerk.accounts.dev` gets a 403
  from this sandbox's egress proxy, logged as an explicit
  `connect_rejected` / "policy denial" in `/root/.ccr/__agentproxy/status`
  — i.e. this remote environment's network policy does not allow reaching
  Clerk's domains at all, for any tool (curl, Node, or browser). Per this
  environment's own proxy guidance, that's a policy denial to report, not
  something to route around (no bypassing the proxy, no disabling TLS
  verification). Net effect: with `authLoaded` from `useAuth()` never
  turning true, `App.tsx` sits on a permanent blank screen — confirmed via
  screenshot — regardless of how correct the Clerk integration code is.
  **This is now a structural environment-network-policy blocker, not a
  code or credentials problem.** The integration itself (key parsing, host
  derivation, component wiring, `/api/me` call) checks out. To actually
  finish verifying sign-up/login/logout and a live `/api/me` round trip,
  either this remote environment's network policy needs to allow Clerk's
  domains (`*.clerk.accounts.dev`, `api.clerk.com`), or the verification
  needs to happen somewhere with normal internet access (e.g. the user's
  local machine, which is this project's documented primary dev loop
  anyway). Not marking this ticket Done.

---

### Ticket 3.3 — Database schema + student profile
Design and create tables: users (parents), students (linked to a parent
account), sessions, answer history. One parent account supports multiple
student profiles (siblings), per Ticket 3.0.

**Done when:** a parent account can create at least one student profile,
persisted in the database, retrievable on next login, and can create a
second profile for a sibling.

- [x] Done. Notes: This sandbox had no database at all (confirmed last
  session — no postgres/prisma/etc anywhere in the repo). Found a real
  local PostgreSQL 16 install already present but not running (`service
  postgresql status` → down); started it (`service postgresql start`) and
  created a real dedicated dev database + role (`jackson_dev` /
  `jackson`), connection string in `server/.env` as `DATABASE_URL` (not
  committed, same as the other secrets there). This is a **local** dev
  Postgres, standing in for Ticket 3.0's eventual Render-managed Postgres
  decision — provisioning an actual Render instance isn't possible from
  here (no Render account access, and this sandbox's network policy
  already blocks unrelated third-party domains — see Ticket 3.2's network
  findings), and CLAUDE.md's own dev-environment section already runs the
  backend locally, so a local Postgres for local dev is the right
  equivalent, not a shortcut around the real requirement.
  Schema (`server/src/schema.sql`, applied via `npm run migrate`):
  `parents`, `students`, `sessions`, `answer_history` — the four tables
  this ticket names — plus `known_topic_tiers`, which isn't in the
  ticket's literal list but is required to satisfy Ticket 3.4 correctly
  (see that table's own comment in schema.sql for why: tier state is
  stateful, not derivable by replaying the answer log). `sessions` and
  `answer_history` are created now but not yet actively written to —
  nothing in either this ticket's or 3.4's literal Done-when requires
  logging every answer permanently, so wiring that up now would be
  building ahead; the tables exist and are ready whenever a future ticket
  (e.g. a parent dashboard) actually needs them.
  Routes added (`server/index.js`, behind the existing `requireAuth`):
  `GET /api/students` (lists the authenticated parent's students, lazily
  creating the `parents` row on first use since there's no separate
  parent-signup step — `req.userId` from Clerk's verified token is the
  only identity available) and `POST /api/students` (create a profile).
  **Verified two ways, both against the real Postgres database:** (1) a
  direct model-level test script (`server/src/students.js`'s
  `findOrCreateParent`/`createStudent`/`listStudents`, called directly,
  not through HTTP — necessary because minting a real Clerk-verified
  token to drive the HTTP+auth layer end-to-end is the same structural
  network-policy blocker documented in Ticket 3.2, not something more
  effort here fixes) created a parent, added two students (Alice, Bob —
  siblings), called `findOrCreateParent` again for the same Clerk ID to
  simulate "next login" and confirmed it returned the identical parent ID
  (not a duplicate row) with both siblings still retrievable, then
  confirmed a *different* parent ID sees zero students (no cross-account
  leakage). Beyond trusting the model functions' own return values, also
  ran a raw `SELECT` directly against the `students`/`parents` tables via
  the same `pg` pool to inspect the actual persisted rows — 2 rows,
  correct `parent_id` on both, exactly matching what the functions
  reported. (2) Confirmed `GET`/`POST /api/students` correctly return 401
  with no bearer token, same pattern as `/api/me` in Ticket 3.2.
  The full authenticated HTTP round trip (a real signed-in parent hitting
  these routes through the browser) remains blocked by the same Clerk
  network-policy issue as Ticket 3.2 — not re-flagging that as a new gap,
  it's the identical root cause, and the actual persistence logic these
  routes call is now proven correct against the real database
  independently of that blocker.

---

### Ticket 3.4 — Migrate session tracking to the database
Sprint 1's in-memory tracker (last 5 answers, tiers, streaks) currently
resets on app close. Move this to persist per-student in the database.

**Done when:** closing and reopening the app, a student's tier/streak state
picks up where it left off, verified across an app restart.

- [x] Done. Notes: Migrated the *real* structures, not simplified
  stand-ins, per the explicit ask: `App.tsx`'s `tiers`/`struggling` state
  and `performanceTracker.ts`'s rolling 5-answer `history` window are now
  loaded from and written to `known_topic_tiers` (the table added ahead in
  Ticket 3.3 for exactly this) via two new exports on
  `performanceTracker.ts` (`seedHistory`, `getHistory`) and a new
  `persistKnownTopicTier()` in `App.tsx`. This is a direct persistence
  layer on top of the *unchanged* adaptive algorithm (the actual bump/
  drop/struggling logic in `handleGraded` wasn't touched) — the client
  still computes the next tier exactly as before, and now also saves it.
  `dynamicTiers` (Sprint4 Ticket D's session-only bucket) is completely
  untouched by this ticket — `persistKnownTopicTier` is a no-op whenever
  `isKnownTopic()` is false, so a dynamic topic still never calls a
  persistence endpoint at all, meaning it's not that the schema "hides"
  dynamic topics somehow, it's that dynamic-topic data structurally never
  reaches the database in the first place.
  Found and fixed one real correctness gap while building this: `tiers`
  starts empty on every mount regardless of what's in the database, so
  without gating on the load actually completing, a student could pick a
  topic before persisted data arrived and incorrectly re-trigger placement
  for an already-assessed topic. Added a `tiersLoaded` gate (blocks the
  app, same blank-screen pattern already used for font/auth loading, until
  the DB load finishes or fails) to close this.
  No student-picker UI exists yet (out of scope for 3.3/3.4's literal
  Done-when, which are about persistence existing/working, not about a
  sibling-switcher screen) — a single default student ("Student 1") is
  auto-provisioned per parent and used for tier persistence. Multi-student
  support itself is proven correct at the API/DB level in Ticket 3.3's
  verification.
  **Verified against the real database**, combining live browser
  automation with direct `psql`/`pg` queries at every checkpoint (not
  trusting the app's own report of success) — a real page reload in the
  middle of the test stood in for "closing and reopening the app," since
  that's the only way to actually force every piece of React state
  (including `performanceTracker.ts`'s module-level history object) to
  fully reset the way an app restart would:
  1. Fresh load auto-created exactly one `parents` row and one `students`
     row ("Student 1").
  2. First-time Addition placement (forced correct via a 7-segment
     digit-drawing technique, same as SPRINT4.md Ticket E) → DB row showed
     `tier=3` immediately, matching the live `[placement]` console log.
  3. Forcing 2 wrong answers in a row (drawing a deliberately-wrong fixed
     number) → DB row updated to `tier=2, struggling=true,
     recent_results=[]` — the empty array is correct, not a bug: it
     matches `resetTopicHistory()` firing in-memory at that exact moment,
     which is the point of migrating the *real* structure rather than a
     simplified one.
  4. Played a dynamic topic ("area of a triangle") for 2 answers, then
     queried `known_topic_tiers` directly for anything topic-matching
     "triangle" — **zero rows**, confirming dynamic-topic data never
     reaches the database at all, not just that the UI doesn't show it.
  5. **Reloaded the page.** Confirmed still exactly one parent and one
     student row (no duplicate created on "next login"). Picked Addition
     again — no placement indicator appeared (tier data correctly loaded
     from the database before the topic could be picked, thanks to the
     `tiersLoaded` gate). Submitted one correct answer: struggling
     correctly stayed `true` (resumed lock state, needs 2 in a row to
     unlock — if the reload hadn't actually restored `struggling` from the
     database, this would have incorrectly behaved as a fresh non-
     struggling correct answer). Submitted a second correct answer in a
     row: struggling unlocked (`false`), tier correctly stayed at 2 (an
     unlock alone doesn't bump — that's a separate 3-in-a-row event,
     exactly matching the already-verified Ticket 1.3/2.2 interaction).
     Final DB row (`tier=2, struggling=false, recent_results=[true,true]`)
     matched the live console output exactly.
  One methodology note: an earlier full run of this same test produced
  internally-consistent but numerically different results (placement
  landed at tier 2 instead of 3), traced via a full diagnostic log dump to
  a different real Claude-vision grading outcome on that run, not a code
  bug — likely canvas-readiness timing on a cold page load affecting the
  digit-drawing precision, the same category of real-model variance
  already documented in SPRINT4.md Ticket E. The version reported above is
  a clean, fully cross-checked run where every persisted DB value was
  verified against the app's own live-computed log output rather than a
  hardcoded prediction, which is what makes it trustworthy regardless of
  exactly how the grading model calls each digit.
  As in every prior ticket blocked by this sandbox's Clerk network-policy
  issue (Ticket 3.2), a live Clerk-authenticated HTTP round trip isn't
  possible here. This test used two temporary, uncommitted bypasses to get
  around that specifically for this verification — a stubbed `getToken()`
  in `App.tsx` and a matching fixed-token acceptance branch in
  `server/src/auth.js`'s `requireAuth` — both clearly labeled, both
  reverted via `git checkout` immediately after (confirmed clean diff
  before and after), and both real committed files were unchanged by the
  time this ticket's actual code was committed (committed *before* adding
  the bypasses, learned from an earlier Sprint4 mistake). The persistence
  logic itself is proven correct against the real database independent of
  that blocker; only the live-Clerk-token path remains blocked, same root
  cause as Ticket 3.2.
  **Local dev database note:** this environment has no hosted Postgres
  (Ticket 3.0 decided Render, not provisionable from here — no account
  access, and likely blocked by the same network policy regardless).
  Found PostgreSQL 16 already installed but not running; started it and
  created a local `jackson_dev` database — this is what `DATABASE_URL` in
  `server/.env` points at. Fine for local dev (matches CLAUDE.md's own
  local-backend dev loop) but real Render provisioning is still a
  separate, later step, same caveat Ticket 3.1 already noted for actual
  deployment.

---

### Ticket 3.5 — Sprint 3 bug pass
Full loop test: sign up, log in, create student profile, play a session,
close app, reopen, confirm state persisted. Fix what breaks.

- [ ] Done. Notes: _______________
