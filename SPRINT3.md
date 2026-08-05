# Jackson — Full Vision Roadmap: Sprint 3 (Backend, Auth, Accounts)

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

- [ ] Done. Notes: _______________

---

### Ticket 3.3 — Database schema + student profile
Design and create tables: users (parents), students (linked to a parent
account), sessions, answer history. One parent account supports multiple
student profiles (siblings), per Ticket 3.0.

**Done when:** a parent account can create at least one student profile,
persisted in the database, retrievable on next login, and can create a
second profile for a sibling.

- [ ] Done. Notes: _______________

---

### Ticket 3.4 — Migrate session tracking to the database
Sprint 1's in-memory tracker (last 5 answers, tiers, streaks) currently
resets on app close. Move this to persist per-student in the database.

**Done when:** closing and reopening the app, a student's tier/streak state
picks up where it left off, verified across an app restart.

- [ ] Done. Notes: _______________

---

### Ticket 3.5 — Sprint 3 bug pass
Full loop test: sign up, log in, create student profile, play a session,
close app, reopen, confirm state persisted. Fix what breaks.

- [ ] Done. Notes: _______________
