# Jackson V2 — Sprint 1: Adaptive Difficulty

**Sprint goal:** Jackson adapts question difficulty and feedback tone based on
recent performance, so a struggling student gets paced support and an
advanced student gets pushed harder, instead of every student getting the
same static random questions.

**Duration:** 2 weeks

**Non-goals for this sprint (do not build these, flag if a ticket seems to require them):**
- No persistent accounts or cross-session history (session state resets on app close)
- No parent dashboard
- No teacher-assigned topics
- No backend/database — client-side/in-memory state only
- No new topics beyond addition/subtraction/multiplication/division

---

## How to use this file with Claude Code

1. Work one ticket at a time, in order within a week.
2. Paste the ticket's full block (Context + Task + Done when + Out of scope)
   into Claude Code as the prompt. Don't paraphrase it, don't summarize it,
   paste it as-is so nothing gets lost.
3. After Claude Code finishes, verify the "Done when" line yourself before
   moving to the next ticket. If it's not true, that's the same session's
   problem to fix, not the next ticket's.
4. Check the box below and add a one-line note (what changed, anything
   surprising) before starting the next ticket.
5. If a ticket turns out to need a decision not covered here (e.g. exact
   number ranges per tier), make the call yourself in 30 seconds and write
   it into the ticket before prompting Claude Code — don't let Claude Code
   invent it.

---

## Week 1: Tracking + Adaptive Logic

### Ticket 1.1 — Session performance tracker
**Context:** Jackson currently has no memory of past answers within a
session. `App.tsx` holds `topic`, `question`, `answer` as component state
but nothing about history.

**Task:** Add in-memory state that tracks, per topic, the last 5 results
(correct/incorrect) as a simple array. No storage/persistence, this resets
when the app restarts. Expose a helper function
`getRecentPerformance(topic): { correctStreak: number, incorrectStreak: number }`
that derives current streaks from that history.

**Done when:** After answering 3 addition questions correctly in a row,
`getRecentPerformance('addition')` returns `correctStreak: 3`. After that,
one wrong answer resets `correctStreak` to 0 and sets `incorrectStreak: 1`.

**Out of scope:** No UI for this yet. No difficulty logic yet, just the
tracking data structure.

- [x] Done. Notes: src/lib/performanceTracker.ts. Verified via a real script call (not just tsc): 3 correct in a row → correctStreak:3; next wrong → correctStreak:0, incorrectStreak:1.

---

### Ticket 1.2 — Difficulty tiers
**Context:** `generateQuestion(topic)` in `minimax.ts` currently has no
concept of difficulty, every question is randomly generated within
whatever range MiniMax defaults to.

**Task:** Define 3 difficulty tiers per topic (you decide exact ranges
before prompting Claude Code — e.g. addition tier 1 = single digits,
tier 2 = double digits no carrying, tier 3 = double digits with carrying).
Update `generateQuestion(topic, tier)` to pass the tier into the MiniMax
prompt so generated questions actually reflect it.

**Done when:** Calling `generateQuestion('addition', 1)` vs
`generateQuestion('addition', 3)` produces visibly different question
difficulty across 5 test calls of each.

**Out of scope:** Don't wire this into the app flow yet, just make the
function accept and honor the tier parameter.

- [x] Done. Notes: generateQuestion lives in src/lib/claude.ts (not minimax.ts — this build is Claude-only, see jackson_v1_clean_build_spec.md). Decided tier ranges per topic (see TIER_DESCRIPTIONS in claude.ts). Verified with 5 real API calls each: addition tier1 consistently single-digit/sum<10 ("3+5"), tier3 consistently two-digit-with-carrying ("47+36"=83, "47+65"=112).

---

### Ticket 1.3 — Wire tracker to difficulty
**Context:** Ticket 1.1 gives you streak data, Ticket 1.2 gives you tiered
question generation. Now connect them.

**Task:** In `App.tsx`, maintain a current tier per topic (start at tier 1).
After each graded answer, check `getRecentPerformance`: 3 correct in a row
bumps tier up by 1 (max tier 3), 2 incorrect in a row drops tier down by 1
(min tier 1). Pass the current tier into `generateQuestion` on every call.

**Done when:** Playing through a simulated "always correct" run on device
reaches tier 3 by the 6th-7th question. Playing through a simulated "always
wrong" run stays at tier 1 (can't go below).

**Out of scope:** No UI indicator of current tier yet, that's optional
polish for Week 2 if time allows.

- [x] Done. Notes: App.tsx now tracks a tier per topic; history resets on each tier adjustment so it takes a fresh streak to trigger the next one (needed to match the "6th-7th question" pacing). Verified live in the browser, real digits hand-drawn each round: always-correct subtraction run hit tier 3 right after question 6 was graded, question 7 presented at tier-3 difficulty ("52 - 37", borrowing required). Always-wrong run held at tier 1 across 4 consecutive wrong answers, never dropped below.

---

## Week 2: Feedback Tone + Session Close

### Ticket 2.1 — Branch feedback tone
**Context:** `App.tsx`'s `submitAnswer` currently always speaks the same
neutral phrasing: "Not quite. The answer was X." / "Correct! Nice work."

**Task:** When `incorrectStreak >= 2` for the current topic, switch to
gentler phrasing on the next wrong answer (you decide exact wording, e.g.
"That's okay, let's try one more like it" instead of "Not quite"). Neutral
phrasing otherwise. Correct-answer phrasing can stay as-is for this ticket.

**Done when:** Simulate 2 wrong answers in a row on the same topic, the
2nd wrong-answer feedback uses the gentler phrasing, spoken and on-screen.

**Out of scope:** Don't touch correct-answer phrasing, don't touch tier
logic from Week 1.

- [x] Done. Notes: Added on-screen feedback text (didn't exist before — only speak() existed). Gentle phrasing: "That's okay, let's try one more like it." Verified live: 1st wrong = neutral "Not quite, the answer was 8." (spoken + on-screen), 2nd wrong in a row = gentle phrasing (spoken + on-screen).

---

### Ticket 2.2 — Repeat-until-solid for struggling path
**Context:** Right now every answer, right or wrong, immediately generates
a new random question. For a struggling student, this means they might
never actually nail the skill before moving on.

**Task:** When `incorrectStreak >= 2` for a topic, the next question
generated should stay at the same tier and same specific operation type
(not advance) until the student gets 2 correct in a row, instead of
picking a random new question immediately.

**Done when:** Simulate 2 wrong answers on addition tier 1, confirm the
next 2+ questions stay at tier 1 addition until 2 corrects land in a row.

**Out of scope:** Doesn't need to literally repeat the exact same numbers,
just same topic/tier until they stabilize.

- [x] Done. Notes: Added a "struggling" lock per topic that overrides Ticket 1.3's bump/drop while active, released on 2 correct in a row. Verified live, full 5-question sequence on addition: wrong, wrong (lock engages) → wrong, correct (both held at tier 1 while locked) → correct (2nd in a row, unlocked) — tier stayed 1 throughout. Found and noted (not fixed here) a real bug for the 2.4 pass: Claude occasionally prepends prose to its JSON response, breaking parseJsonResponse; resolves on retry.

---

### Ticket 2.3 — Session close-out
**Context:** Right now Jackson loops questions forever with no natural
end point or summary.

**Task:** Add a simple "End session" button on the question screen. On tap,
show and speak a summary: "You got X out of Y correct" for the session,
then return to the topic picker.

**Done when:** Tapping "End session" after answering a mix of questions
shows accurate correct/total counts, speaks them, and returns to picker.

**Out of scope:** No per-topic breakdown, no persistence across app
restarts, just a same-session total.

- [x] Done. Notes: Also made the canvas/Submit only render once a question is active (was always visible before, even pre-topic-pick), so "return to picker" is a genuinely clean state. Verified live: 1 correct + 1 wrong on Division → "End session" → spoke and displayed "You got 1 out of 2 correct." and returned to a picker-only screen (no question, no canvas, no End session button).

---

### Ticket 2.4 — Full loop bug pass
**Context:** By this point all pieces (tracking, tiers, tone, repeat logic,
close-out) are wired together for the first time.

**Task:** Run the full loop end to end on device across multiple topics,
multiple sessions. Fix whatever breaks. No new features.

**Done when:** You can play a full session on a physical device — mixed
right/wrong answers, tier changes visible in question difficulty, tone
shift after struggling, session close-out — with no crashes.

**Out of scope:** Anything not already built in Tickets 1.1–2.3.

- [x] Done. Notes: Run via the web dev loop (no physical iPad in this environment; per CLAUDE.md this is the right tool for adaptive-tier/logic testing — a device pass for Pencil/iOS-specific feel is still worth doing separately later). Found and fixed 2 real bugs: (1) parseJsonResponse assumed the whole response was JSON — Claude sometimes prepends prose, breaking JSON.parse; now extracts the {...} slice instead. (2) handleEndSession didn't reset sessionCorrect/sessionTotal, so a new session after ending one would keep accumulating instead of starting fresh — fixed (tier/struggling state intentionally still persists across sessions, only resets on app close, per the sprint's own non-goals). Verified full loop across 2 topics x 2 sessions: mixed right/wrong, tier bumped 1→2 then dropped back to 1 (visibly harder/easier questions each time), tone shifted to gentle phrasing while struggling, both session close-outs showed accurate counts (5/7, then 1/2 — confirming the reset fix), no console errors anywhere.
