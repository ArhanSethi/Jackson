# Jackson — Full Vision Roadmap (Sprints 3-6)

**Read this before starting anything below.** This roadmap is higher-risk
than Sprints 1-2. Those sprints worked because every ticket had an
unambiguous "Done when." Several tickets below don't yet, they have a
"Decision needed" line instead, because the scope genuinely can't be
written as a clean engineering task until a real decision gets made
first, usually by you, not by Claude Code.

**Checkpoint rule:** at the end of each sprint below, stop and honestly
assess: did this sprint actually finish clean, or did it bleed into
extra days? If a sprint takes meaningfully longer than planned, that's
the signal to cut scope from what's left, not to compress the remaining
sprints harder. Silently sliding the deadline without noticing is worse
than deciding on purpose to descope.

---

## Sprint 3 (aim: ~4-5 days): Backend, Auth, Accounts

**Goal:** Move Jackson from single-device/no-accounts to a real backend
with authenticated users. Everything in Sprints 4-5 depends on this
existing first.

### Ticket 3.0 — Decided
- Auth provider: **Clerk**
- Backend hosting: **Railway**
- Database: **Railway's built-in Postgres**
- Multiple student profiles per parent account (siblings): **Yes**, supported from the start.

### Ticket 3.1 — Backend proxy skeleton
Stand up a minimal Node/Express backend. Move the Claude API key here
(server-side only). App calls your backend, backend calls Claude. This
closes the client-side-key gap that's been an accepted V1 tradeoff.
Done when: app's question-generation and grading calls route through
your backend, not directly to Anthropic, verified via network inspection
showing no anthropic.com calls originating from the client.

### Ticket 3.2 — Auth integration
Wire chosen auth provider into both backend and app. Parent creates an
account (email/password or similar, decide the exact flow).
Done when: a parent can sign up, log in, log out, and the backend can
identify which authenticated user is making a request.

### Ticket 3.3 — Database schema + student profile
Design and create tables: users (parents), students (linked to a parent
account, since the parent sets it up, not the kid), sessions, answer
history. One parent account supports multiple student profiles
(siblings), per Ticket 3.0's decision.
Done when: a parent account can create at least one student profile,
persisted in the database, retrievable on next login, and can create a
second profile for a sibling.

### Ticket 3.3b — Student profile creation UI
**Context:** Ticket 3.3 built the backend (`POST`/`GET /api/students`,
real schema, multi-sibling support) but no screen for a parent to
actually use it. Currently a "Student 1" row gets silently auto-
provisioned. This ticket adds the real UI: name a first student, add
siblings, and pick between them if more than one exists. This unblocks
`SPRINT_VISUAL_CATCHUP.md`'s Ticket P.2 (currently skipped) and the
sibling-profile portion of Ticket 3.5's verification walkthrough, which
has had no real interface to test through until now.

**Task:**
- On first sign-in with no student profiles yet, show a simple "What's
  your student's name?" screen (replaces silent auto-provisioning),
  submits via the existing `POST /api/students`.
- If a parent has one or more existing students, show a lightweight
  student picker (name + avatar-style initial, using the established
  color system) before reaching the Dashboard, unless only one profile
  exists, in which case skip straight to it.
- Add an "Add sibling" entry point, reachable from the student picker,
  reuses the same name-entry screen/flow as first-time creation.
- Reuse existing backend endpoints from Ticket 3.3, no new API surface
  needed, this is a UI to a pipe that already exists.

**Decide before building:** where "Add sibling" lives, recommend on the
Dashboard itself (e.g. a small "Switch student" or "+" affordance near
the greeting) rather than a separate settings screen, keeps it simple
for this scope.

**Done when:** A parent with zero students sees the name-entry screen,
creates a profile, reaches the Dashboard. A parent with one existing
student skips straight to Dashboard. A parent can add a second (sibling)
profile and switch between the two, verified against real DB rows, not
just UI state, matching Ticket 3.3's own verification standard.

**Out of scope:** No editing/deleting profiles, no avatar image upload,
just an initial-letter/color-based avatar per Ticket 3.3's existing
color system. No per-student settings beyond name.

---

### Ticket 3.4 — Migrate session tracking to the database
Sprint 1's in-memory tracker (last 5 answers, tiers, streaks) currently
resets on app close. Move this to persist per-student in the database.
Done when: closing and reopening the app, a student's tier/streak state
picks up where it left off, verified across an app restart.

### Ticket 3.5 — Sprint 3 bug pass
Full loop test: sign up, log in, create student profile, play a session,
close app, reopen, confirm state persisted. Fix what breaks.

---

## Sprint 4 (aim: ~3-4 days): Parent Onboarding

**Goal:** A parent-facing setup flow. NOT a separate "parent app" (you
already descoped that), this lives inside the same iPad app as a
parent-mode entry point.

### Ticket 4.0 — Decision needed
"Sending a call to the parent" — decide what this actually means before
scoping it as a ticket:
- Option A: SMS/email verification link during signup (standard, cheap,
  fast to build via your auth provider's built-in flows)
- Option B: an actual phone call (requires Twilio or similar, real per-
  call cost, meaningfully more infrastructure, genuinely its own
  multi-day sub-project)
Given the timeline, Option A is very likely the right call. If you want
Option B, treat it as a Sprint 7, not something folded into this one.

### Ticket 4.1 — Parent setup screen
On first launch (or a "Parent Setup" entry point), parent signs up
(Sprint 3's auth), verifies via chosen Ticket 4.0 method, creates a
student profile (name, grade level).
Done when: a parent can complete signup-to-student-profile-created in
one flow, verified end to end.

### Ticket 4.2 — Handoff to student mode
After parent setup, app transitions to "student mode", the existing
topic-picker/question loop, now tied to the created student profile
instead of anonymous/local state.
Done when: student answers get recorded against the correct student
profile in the database (verify by checking DB records after a session).

### Ticket 4.3 — Scaffolded hints before marking incorrect
**Context:** Right now grading is binary, correct or incorrect, no
in-between. Competitor apps (IXL) offer a hint step before a wrong
answer counts as wrong, this is genuinely valuable and doesn't depend
on backend/accounts work, it's pure app-logic on top of the existing
grading call.

**Task:** After a first incorrect submission on a question, instead of
immediately moving to "Not quite, the answer was X" and generating a new
question, offer one scaffolded hint (e.g. "Try breaking 27 + 38 into
20 + 30 and 7 + 8" style, generated via Claude given the question) and
let the student try that same question again. Only mark it "incorrect"
for streak/tier purposes if they get it wrong a second time after the
hint. First-attempt-wrong-then-hint-then-right should NOT count as an
incorrect streak entry, it's treated as a supported correct answer.

**Decide before building:** does a hint apply to every wrong answer, or
only after a certain incorrect-streak threshold (e.g. only kicks in once
the "struggling" state from Sprint 1 Ticket 2.2 is already active)?
Recommend the latter, keeps it from feeling naggy on a single slip-up.

**Done when:** Getting a question wrong once triggers a spoken/on-screen
hint and a retry of the same question, not a new question. Getting it
right on the retry does not count as an incorrect-streak entry. Getting
it wrong twice does count as incorrect and proceeds as before.

**Out of scope:** Don't build a hint system with multiple escalating
hints, one hint per question is enough for this scope.

### Ticket 4.4 — Custom/free-text topic input
**Context:** Currently limited to 6 fixed topics. A genuinely valuable
extension: let a parent or student type in any subject ("long division",
"telling time", "area of a rectangle") rather than picking from the list.
This is a real feature, not a small add, it touches content safety and
grading format, both need explicit decisions before building.

**Decide before building (don't let Claude Code guess):**
1. **Content guardrail.** The question-generation prompt must explicitly
   constrain output to K-8-appropriate, academically relevant content
   regardless of what's typed. Recommend: if the typed subject doesn't
   plausibly map to a K-8 academic topic, the app should decline
   gracefully ("Let's pick a school subject!") rather than attempting to
   generate something from an inappropriate or nonsensical input.
2. **Answer format must stay gradable.** The generated question, no
   matter the typed subject, must still produce a short, single-value
   answer (a number, a short word, a simple fraction) compatible with
   the existing handwriting-grading pipeline. A free-text topic does NOT
   mean free-form essay-style answers, that would break grading
   entirely. E.g. "World War I" as a topic should generate something
   like "In what year did WWI begin?" (short numeric/short-word answer),
   not an explanatory question.
3. **Where this lives in the UI.** Recommend: an additional "Custom
   topic" option alongside the 6 fixed topic buttons, opens a text input,
   generates a question the same way the fixed topics do, does NOT
   replace or change the fixed topics.

**Task:** Add a custom-topic entry point. On submit, validate/generate
via the constrained prompt from decision #1, using the same
`generateQuestion`-style flow as fixed topics but with the typed subject
injected, enforcing decision #2's answer-format constraint.

**Done when:** Typing a valid K-8 subject (e.g. "telling time") produces
a real, gradable question and answer, verified end-to-end including
grading a handwritten response. Typing something inappropriate or
nonsensical is declined gracefully, not silently passed through to
question generation.

**Out of scope:** No saving/history of custom topics used. No difficulty
tiering for custom topics in this ticket, that can layer on later once
the base feature works. No essay/long-form answer support, ever, this
stays within the existing short-answer grading model.

### Ticket 4.5 — Hesitation/confidence signals from canvas behavior
**Context:** Rather than camera-based facial analysis (rejected: real
biometric/COPPA legal exposure for a children's product, plus reliably
inferring emotion from a face is an unsolved research problem, not a
buildable feature), use behavior already captured by the drawing canvas
as a proxy for doubt vs. confidence. This is a genuinely available signal
with no privacy/legal complexity beyond what the app already handles.

**Task:** Track, per question, from the moment it's spoken to the moment
of submit:
- Time-to-first-stroke (long pause before writing starts = possible
  doubt)
- Number of clear-and-redraw events on that question (multiple erasures
  = possible doubt)
- Total time spent before submit relative to that topic/tier's typical
  time (if you have Sprint 3's history to compare against; otherwise
  just track absolute time for now)

Combine these into a simple signal, NOT a confidence score with false
precision, something like a 2-state flag: "hesitant" if time-to-first-
stroke or redraw count crosses a threshold, "confident" otherwise. Pick
concrete thresholds before building (e.g. >8 seconds to first stroke, or
2+ redraws = hesitant) rather than letting Claude Code guess reasonable-
sounding numbers.

**Behavior when "hesitant" is flagged:** offer the Ticket 4.3 hint
proactively, before they even submit, rather than waiting for a wrong
answer. **Behavior when "confident" but the answer is wrong:** let them
submit, grade normally, don't interrupt mid-write, this is the
"confident arithmetic slip, tell them after" case, distinct from doubt.

**Done when:** Deliberately hesitating (pause + redraw a few times)
before writing an answer triggers a proactive hint before submit.
Writing confidently and submitting, even if wrong, does not interrupt,
grades normally after submit, verified with both scenarios acted out on
device.

**Out of scope:** No camera, no facial/emotional inference of any kind.
No numeric "confidence score" displayed anywhere, keep it a simple
internal flag driving one behavior (proactive hint), not a metric shown
to the student in a way that could feel judgmental.

---

## Sprint 5 (aim: ~5-6 days, highest risk): Placement Quiz + Lesson Plan

**Read this section twice before starting.** This is not primarily an
engineering problem. Deciding what K-8 math mastery progression actually
looks like, what a placement quiz should test, and how "the plan" should
be structured, is curriculum design. Claude Code can implement whatever
you decide, but it cannot decide the pedagogy for you. Budget real time
here for you thinking, not just coding.

### Ticket 5.0 — Decision needed (the big one)
Before any ticket below, decide and write down (in this file, replacing
this ticket):
1. What does the placement quiz actually test? (Likely: a handful of
   questions per topic/tier, similar shape to existing questions, used
   once to set initial tier per topic rather than starting everyone at
   tier 1.)
2. What does "the plan" actually consist of? Realistic scope given your
   timeline: an ordered list of topics/tiers the student works through,
   NOT a fully custom AI-generated curriculum map, that's a much bigger
   project than 5-6 days allows honestly.
3. What triggers moving to the next item in the plan? (Likely: same
   logic as Sprint 1's tier-up condition, applied at the plan level.)

**Honest recommendation:** scope this as "placement quiz sets each
topic's starting tier, plan is just the existing 6 topics in a
recommended order based on quiz results," not a genuinely novel adaptive
curriculum engine. The latter is a real EdTech product feature that
takes teams months, not days.

### Ticket 5.1 — Adaptive placement quiz
**Upgraded from a single fixed-tier question per topic to real adaptive
testing** (the technique standardized tests like the SAT use): ask a
question at a starting difficulty, if correct go harder, if incorrect go
easier, converge on the student's actual level rather than one data point.

**Task:** Per topic, start at tier 2 (middle). If correct, ask a tier 3
question next; if that's also correct, place the student starting at
tier 3. If the first question is incorrect, ask a tier 1 question next;
if that's also incorrect, place at tier 1; if the second question is
correct, place at tier 2 (the middle ground). This is a maximum of 2
questions per topic, 12 total across all 6 topics, not exhaustive but a
real signal beyond a single question.

**Decide before building:** exact question count per topic (2 as
described above is the recommended default, keeps the whole quiz short
enough a K-8 student won't lose focus, longer converges more precisely
but risks quiz fatigue undermining the result's quality).

Done when: completing the placement quiz sets a starting tier per topic
that reflects a 2-question adaptive result (not just first-question
right/wrong), verified in the database against the actual quiz answers
given.

### Ticket 5.2 — Plan/progress view
A simple screen (not a "map", per your own descoping instinct, a clean
list is more realistic) showing the 6 topics, current tier per topic,
and a simple visual indicator of progress. This is a read view over data
that already exists from Sprint 1/3, not new logic.
Done when: parent or student can see current tier/progress per topic in
one screen, matching actual database state.

### Ticket 5.3 — Sprint 5 bug pass
Full flow: new student profile → placement quiz → plan view reflects
quiz results → play sessions → plan view updates.

### Ticket 5.4 — Mistake-pattern analytics for parents
**Context:** IXL-style parent dashboards report common incorrect
answers, not just a raw score. A parent seeing "70% correct" learns
little; a parent seeing "keeps missing carrying in double-digit
addition" can actually act on it. This depends on Sprint 3's database
(answer history must already be persisted) and Ticket 5.2's plan view
existing as a screen to extend.

**Task:** On the plan/progress view (Ticket 5.2), add a simple
per-topic breakdown of recent incorrect answers, grouped by rough
pattern where feasible (e.g. tag each graded answer with the tier/
question type it came from, then surface "most missed tier/type per
topic" rather than a flat list of every wrong answer). Keep this
genuinely simple, don't build a full mistake-taxonomy classifier,
grouping by existing tier/topic metadata you already have is enough.

**Done when:** After a student session with several wrong answers on
one topic, the parent-facing view shows something more useful than a
percentage, e.g. "Struggling most with: Subtraction, tier 2 (borrowing)"
sourced from real recorded answer history, not a guess.

**Out of scope:** No natural-language mistake explanations beyond what
Claude's existing grading already returns. No trend graphs over time,
that's a further-out addition if you want it later.

---

## Sprint 6 (remaining days): Assessments + Buffer

### Ticket 6.0 — Decision needed
Define "assessment" concretely: recommend it's simply a slightly longer
version of the existing question loop (e.g. 5 questions at current tier
per topic) run periodically (e.g. parent-triggered, or every N sessions),
scored, and used to confirm/adjust tier placement, NOT a fundamentally
new question type or grading mechanism.

### Ticket 6.1 — Assessment flow
Implement per Ticket 6.0's decision, reusing existing question-gen/
grading/tier logic rather than building new systems.
Done when: running an assessment produces a score and can move a
student's tier up/down based on that score, distinct from the moment-to-
moment tier logic from Sprint 1.

### Ticket 6.2+ — Buffer
Whatever's left of your runway. Full regression across the entire
accounts → placement → plan → sessions → assessment flow. Real testing
with an actual K-8 student and parent, not simulated. Fix what breaks.
This is genuinely the most important use of any days you have left,
resist the urge to add more scope here instead of hardening what exists.

---

## What stays explicitly out, even in the full vision
- Real phone calls (Twilio) — Option B from Ticket 4.0, only if you
  decide to spend a dedicated sprint on it later
- Teacher features
- Multi-child comparative analytics for parents
- Any AI-generated fully-custom curriculum (Ticket 5.0's honest scope-down)
- Payment/subscription anything
- App Store submission/production key security hardening
