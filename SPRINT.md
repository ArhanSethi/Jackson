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

- [ ] Done. Notes: _______________

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

- [ ] Done. Notes: _______________

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

- [ ] Done. Notes: _______________

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

- [ ] Done. Notes: _______________

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

- [ ] Done. Notes: _______________

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

- [ ] Done. Notes: _______________

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

- [ ] Done. Notes: _______________
