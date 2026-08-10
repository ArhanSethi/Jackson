# Jackson — Sprint: Open-Ended Topic Entry (UI Overhaul)

**This sprint pauses SPRINT3.md.** Status when paused (2026-08-10): Ticket
3.1 done (verified — live network trace clean, both generate-question and
grade-answer route through the backend only). Ticket 3.2 (Clerk auth)
implemented — prebuilt `<SignIn />`/`<SignUp />` on web, backend
`requireAuth`/`/api/me` wired, client verifies a real token against it —
but blocked purely on local verification (create a real account, sign
in/out, confirm `/api/me`) on a machine with normal internet access, since
the dev sandbox used for that work could not reach Clerk's domains at all
(network-policy block, not a code or key problem — see SPRINT3.md's Ticket
3.2 notes for the full diagnosis). Do that verification on Windows before
resuming SPRINT3.md. Tickets 3.3, 3.4, 3.5 not started.

**Resume SPRINT3.md from Ticket 3.2's local verification once this sprint
is done.** If this sprint runs long, re-read SPRINT3.md's actual current
state before resuming rather than assuming memory of where it was left —
don't let the pause turn into silent abandonment.

---

**Goal:** Replace the fixed 6-button topic picker with an open entry
point: the student (or parent) says what they want to work on, in their
own words. If it matches something Jackson already knows how to teach (the
existing 6 topics and their tier system), route there and use all existing
adaptive-difficulty infrastructure. If it's something new, generate
questions for it dynamically, without pretending to have a tracked tier
history for a topic that's never been assessed.

**Design decided:**
- Hybrid routing: known topics route into the existing topic/tier/tracking
  system (Sprint 1's infrastructure, don't rebuild it). Unmatched topics
  get dynamic, on-the-fly question generation with no persistent tier
  tracking for that session.
- This absorbs and replaces the old backlog "custom topic" ticket and
  folds in the old "adaptive placement" ticket's logic as the "first time
  on a known topic" experience, not a separate one-time-only quiz screen.

**Known internal topic set** (must match exactly what `App.tsx`/
`server/src/claude.js` already use — note "Word Problems" has a space, not
an underscore, in the actual code, unlike this sprint doc's own
"word_problems" shorthand): `Addition`, `Subtraction`, `Multiplication`,
`Division`, `Fractions`, `Word Problems`.

**Explicitly out of scope for this sprint:**
- Voice input for the "what do you want to work on" prompt (text only for
  now)
- Any UI/visual redesign beyond replacing the picker with the new entry
  screen — don't touch Sprint 2's color system/polish
- Persistent tracking for dynamic topics — that's a future decision, not
  this sprint's

---

### Ticket A — Topic classification/routing layer
**Task:** Given free-text input, use Claude to classify it against the
existing internal topic set (addition, subtraction, multiplication,
division, fractions, word problems). If it clearly matches one (allowing
for natural phrasing — "long division" → division, "adding fractions" →
fractions), return that internal topic name. If it doesn't match any of
them, return a "dynamic" classification with the topic as free text. Apply
the same content-safety guardrail decided for the original custom-topic
ticket: if the input isn't a plausible K-8 academic topic at all, decline
gracefully rather than passing it through to either path.

**Done when:** "long division", "times tables", and "fractions" all
correctly route to their matching internal topics. A genuinely novel but
valid topic ("telling time", "area of a rectangle") correctly routes to
the dynamic path. Inappropriate/nonsensical input is declined, verified
across at least 6 real test inputs covering both paths and the decline
case.

- [x] Done. Notes: Server-side only (`server/src/claude.js`'s new
  `classifyTopic()`, wired to a new `POST /api/classify-topic` route in
  `server/index.js`) — client wiring is Ticket B's job, per that ticket's
  own task line ("call Ticket A's classifier"). Known-topic matches return
  the exact strings the rest of the codebase already uses (`KNOWN_TOPICS`
  = `Addition`, `Subtraction`, `Multiplication`, `Division`, `Fractions`,
  `Word Problems` — note the space in "Word Problems", matching
  `TIER_DESCRIPTIONS`/`App.tsx`'s `TOPICS`, not the sprint doc's own
  "word_problems" shorthand); if Claude ever says "known" but returns a
  string outside that exact list, it's downgraded to "dynamic" rather than
  silently mis-routing. Verified with 12 real (non-mocked) calls against
  the actual backend/Claude: all 6 known topics matched via natural
  phrasing ("long division"→Division, "times tables"→Multiplication,
  "fractions"→Fractions, "adding fractions"→Fractions, "adding"→Addition,
  "subtracting numbers"→Subtraction, "word problems please"→Word
  Problems), 3 novel-but-valid topics correctly went dynamic ("telling
  time", "area of a rectangle", "counting money"), and 2 non-academic
  inputs ("how to make a bomb", nonsense gibberish) were declined. Also
  checked the input-validation edge case (empty string → 400), not part of
  the Done-when but worth confirming while in there.

---

### Ticket B — New primary UI: open entry point
**Task:** Replace the 6-button topic-picker screen with a single input
(text for now, voice input is a later addition, not in this ticket)
prompting "What do you want to work on?" or similar. On submit, call
Ticket A's classifier and route accordingly.

**Decision needed before building:** keep quick-access buttons for the 6
known topics alongside the text input (so it's not slower for the common
case), or pure text-only entry? Recommendation: keep quick buttons for the
known 6 as shortcuts, since they skip classification entirely and it's a
better experience for the common case, while the text input handles
everything else. This isn't a regression to the old picker, it's the same
known-topic routing, just reached two ways.

**Done when:** The new entry screen replaces the old fixed grid as the
first thing a student sees, both the text-input path and the quick-button
path correctly reach a question, verified for both.

- [x] Done. Notes: Went with the recommended hybrid (quick buttons + text
  input), not pure text-only. New `src/components/EntryScreen.tsx`
  replaces `App.tsx`'s old always-visible 6-button grid; `App.tsx` now
  shows it only while `!topic` (no topic picked/active), matching "first
  thing a student sees" rather than a persistent nav bar. Quick buttons
  call the exact same `onTopicChosen` handler `App.tsx` already had
  (`handleTopicSelect`, unchanged) — they just skip the classify call.
  Free text calls the new client-side `classifyTopic()`
  (`src/lib/claude.ts`, thin wrapper around Ticket A's
  `/api/classify-topic`) and both `known` and `dynamic` results feed into
  that identical handler, so "both paths route through the same
  underlying flow" is literally the same function call, not just similar
  behavior. `decline` results (and the defensive case of a missing topic)
  show an inline message on the entry screen itself and never call
  `onTopicChosen` — no console error, no dead end, the student can just
  try again.
  Verified live (Playwright against the real running app, real
  `/api/classify-topic` + `/api/generate-question` calls, not mocked):
  (1) quick button "Addition" → real question ("3 + 5") appeared
  immediately; (2) free text "long division" → routed through
  classification to Division → real question ("15 ÷ 3"); (3) free text
  "area of a triangle" (novel/dynamic) → real, gradable question generated
  ("A triangle has a base of 4 cm and a height of 2 cm. What is the area
  of the triangle?"); (4) free text nonsense gibberish → decline message
  shown on-screen ("That doesn't look like a math topic I can help
  with..."), confirmed no question/canvas was reached and the only
  page-level error in the whole run was the pre-existing, unrelated Clerk
  network-policy block (see SPRINT3.md Ticket 3.2), not anything from this
  feature. Clerk's own sign-in still can't load in this sandbox, so — same
  as the SPRINT3.md Ticket 3.1 retry — verification used a temporary,
  uncommitted `App.tsx` edit to bypass the auth gate only, reverted via
  `git checkout -- App.tsx` immediately after (confirmed clean diff before
  and after committing the real changes).

---

### Ticket C — Known-topic path: first-time assessment, then practice
**Task:** When routed to a known topic, check if the student has any
existing tier data for it (Sprint 1's tracker / Sprint 3's DB if that part
exists yet). If none exists, run the old adaptive-placement ticket's
2-question placement for that topic first, then proceed to normal practice
at the resulting tier. If tier data already exists, skip straight to
practice at the current tier, same as today's behavior.

**Done when:** A student's first-ever session on a known topic runs the
2-question placement before regular questions start. A returning session
on a topic they've already been assessed on skips straight to practice,
verified for both cases.

- [x] Done. Notes: "Existing tier data" = `topic.toLowerCase() in tiers`
  (`App.tsx`) — distinct from `getTier()`'s `?? 1` fallback, which was
  never a reliable signal of "already assessed" (pre-Sprint4, a topic only
  got an entry in `tiers` once a natural bump/drop fired, not on first
  play). Placement now explicitly writes an entry the moment it finishes,
  so the `in` check is a clean, correct "have we placed this topic" flag.
  Extracted the mapping into `src/lib/placement.ts`
  (`placementStartingTier`, `PLACEMENT_TIER=2` baseline for both questions)
  and the known-topic list into `src/lib/topics.ts` (now shared by
  `App.tsx` and `EntryScreen.tsx` instead of two copies that could drift).
  Placement grading uses plain correct/incorrect feedback and deliberately
  skips Sprint 1's streak tracker (`recordResult`/`getRecentPerformance`)
  so the gentle-tone/struggling logic can't fire mid-placement; real
  practice starts with a clean streak history once placement ends. Added a
  small "Quick check (N of 2) to find your starting level" status line so
  a student isn't confused why the first couple of questions feel
  different — not a visual redesign, same plain-text status pattern
  `App.tsx` already uses for "Generating question...".
  Verified two ways: (1) **Pure-function unit test** of the actual,
  unmodified `placementStartingTier` (compiled and imported for real, not
  reimplemented) against all 4 boolean combinations —
  `[true,true]→3, [false,false]→1, [true,false]→2, [false,true]→2`, all
  passed exactly. Real handwritten-answer correctness isn't something I
  can force via synthetic mouse strokes (Claude's vision grading is the
  real, unmocked model — a scribble sometimes reads as correct depending
  on the specific question), so the exhaustive input space is proven at
  the function level rather than by trying to fake "correct" handwriting.
  (2) **Live end-to-end trace** (Playwright, real backend/Claude, no
  mocking) against the real running app: picking "Multiplication" for the
  first time showed "Quick check (1 of 2)", answering it correctly
  transitioned to "Quick check (2 of 2)" (confirmed via polling for that
  exact text, not a fixed timer — proves a genuine second placement
  question, not the first one lingering), answering that cleared the
  indicator entirely and landed on a real practice question; the actual
  live console output confirmed `[placement] Multiplication [true, true]
  -> tier 3`. A separate run on "Subtraction" landed on `[true, false] ->
  tier 2` (mixed), also live and unmocked. Ending the session and picking
  "Multiplication" again showed no placement indicator at all — straight
  to practice, confirming the returning-topic skip. Zero console errors
  beyond the pre-existing, unrelated Clerk network-policy block (see
  SPRINT3.md Ticket 3.2). As with Tickets 3.1(retry)/B, verification used
  a temporary uncommitted `App.tsx` auth-bypass edit reverted via `git
  checkout` right after — the real Ticket C changes were committed first
  this time specifically to avoid last ticket's mistake of losing
  uncommitted work to that same revert.

---

### Ticket D — Dynamic-topic path: on-the-fly generation, no false tracking
**Task:** When routed to the dynamic path (topic not in the known set),
generate questions for that topic using the same content-safety and
gradable-answer-format constraints from the original custom-topic ticket
(short, single-value answers only, no essay-style output). Do NOT create
fake persistent tier tracking for this topic, it's session-only.
Difficulty can still adjust within the session using simple
correct/incorrect streak logic (reuse Sprint 1's streak mechanism), just
don't persist it as a "known" topic in the student's long-term profile.

**Done when:** Typing a valid but unlisted topic ("area of a triangle")
produces real, gradable questions, and gets easier/harder within that
session based on performance, without appearing as a tracked topic in the
student's profile/plan view afterward.

- [x] Done. Notes: **Important scope note on the persistence check:** there
  is no database or storage layer in this codebase at all yet —
  SPRINT3.md Tickets 3.3 (DB schema) and 3.4 (migrate session tracking to
  the DB) are both still unstarted, and there's no student profile/plan
  view screen either. Confirmed by inspection (no postgres/prisma/
  sequelize/knex/sqlite/mongo/drizzle anywhere in the repo, `server/
  package.json` has only `@clerk/backend`+`express`+`cors`+`dotenv`,
  no DB driver). So "check the actual database" doesn't have a database to
  check yet — the honest equivalent today is the in-memory state
  structure that a future Ticket 3.4 migration would actually read from to
  persist "the student's tracked topics." That structure is `tiers`
  (`App.tsx`), and this ticket's core change is making sure a dynamic
  topic never enters it.
  Implementation: `server/src/claude.js`'s generic question-generation
  branch (the one any topic not "fractions"/"word problems" falls through
  to — exactly the branch dynamic topics hit) now explicitly requires a
  genuine K-8 academic exercise with "a single, short, concretely gradable
  answer... never an essay, paragraph, list, or open-ended response,"
  reinforcing the original custom-topic ticket's constraints as defense in
  depth (classifyTopic already declines non-academic input before
  generation is ever called). `App.tsx` now has a separate `dynamicTiers`
  state bucket; `getTier()`/`setTierFor()` branch on `isKnownTopic()` to
  read/write the right one. Sprint 1's actual bump/drop code in
  `handleGraded` — the exact same `if/else` block, same
  `recordResult`/`getRecentPerformance` calls — is completely unbranched
  for known-vs-dynamic; it just calls `setTierFor()`, which resolves to
  whichever bucket applies. This is genuine reuse (identical code path),
  not a reimplementation with similar behavior.
  Verified live (Playwright, real backend/Claude, no mocking): (1) direct
  API calls confirmed gradable, non-essay answers across 3 tiers of "Area
  of a Triangle" (e.g. "12 cm²", "30 cm²") and two other novel topics
  ("Telling Time" → "3:00", "Counting Money" → "100"); (2) entering "area
  of a triangle" via free text showed no placement indicator (correctly
  out of Ticket C's scope) and went straight to a real question; (3)
  submitting 5 answers in a row produced the exact same `[tier]`/
  `[struggling]` console log lines Sprint 1's known-topic system produces
  — direct proof the identical code executed, not a lookalike; (4) added a
  temporary, uncommitted debug hook exposing React state to the test
  (`window.__DEBUG_STATE__`, reverted via `git checkout` immediately
  after, same pattern as the auth-bypass edits in prior tickets) and
  confirmed directly: `tiers` was `{}` (empty) throughout the entire
  dynamic-topic session, `dynamicTiers` held `{"area of a triangle": 1}`,
  and — critically — `tiers` was still `{}` after clicking "End session,"
  confirming the dynamic topic never leaked into the known-topic bucket at
  any point, not just "wasn't shown in the UI." Zero console errors beyond
  the pre-existing, unrelated Clerk network-policy block (SPRINT3.md
  Ticket 3.2). As in prior tickets, real changes were committed before any
  temporary test instrumentation was added, so the later revert couldn't
  touch real work.

- [ ] Done. Notes: _______________

---

### Ticket E — Full loop bug pass
**Task:** Test both paths end to end: known-topic first-time (placement →
practice), known-topic returning (straight to practice), dynamic-topic
(generate → in-session adjust), and the decline case (inappropriate/
nonsensical input). Fix what breaks. Confirm nothing from Sprint 1/2's
existing adaptive system regressed for the known-topic path.

- [ ] Done. Notes: _______________
