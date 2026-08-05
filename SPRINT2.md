# Jackson V2 — Sprint 2: Depth + Polish

**Sprint goal:** Expand Jackson beyond the 4 basic operations, make grading
reliable across harder handwriting (fractions, word problem answers), and
give the app a playful, colorful, kid-friendly visual identity so it feels
like a finished product instead of a prototype.

**Duration:** Weeks 3-4 (runs immediately after Sprint 1)

**Non-goals for this sprint (do not build these, flag if a ticket seems to require them):**
- No multiple student profiles or accounts
- No persistence across app restarts (still session-only state)
- No backend/database
- No new adaptive-difficulty logic beyond what Sprint 1 built — this sprint
  extends topic variety and visuals, not the tracking/tier system itself

---

## How to use this file with Claude Code
Same process as SPRINT.md: paste one ticket's full block into Claude Code,
verify the "Done when" line yourself, check the box, note anything
surprising, then move to the next ticket. Don't skip ahead.

---

## Week 3: Topics + Grading Reliability

### Ticket 3.1 — Add fraction questions
**Context:** `generateQuestion(topic, tier)` in `minimax.ts` currently only
supports addition/subtraction/multiplication/division. `Topic` type and the
`TOPICS` array in `App.tsx` define what's selectable.

**Task:** Add `'fractions'` as a new topic. Tier 1 = simple same-denominator
addition/subtraction (e.g. "1/4 + 2/4"), tier 2 = different denominators
with easy common multiples, tier 3 = simplifying the result. Update the
MiniMax prompt to generate these, and make sure the returned `answer` field
is something a student would actually write by hand (e.g. "3/4" not "0.75").

**Done when:** Selecting Fractions from the topic picker generates a
question, speaks it correctly (e.g. "What is one fourth plus two fourths"
not literally reading the slash), and produces a sensible fraction answer
across 5 test generations per tier.

**Out of scope:** Don't touch the adaptive tier-bumping logic from Sprint 1,
it should just work automatically once fractions plugs into the same
`generateQuestion`/`getRecentPerformance` system.

- [x] Done. Notes: Adapted to src/lib/claude.ts (no minimax.ts in this build). Widened GeneratedQuestion.answer to number|string (fractions need string answers like "3/4") and added an optional `spoken` field so speak() can use natural phrasing while the screen shows slash notation. Verified with 15 real API calls (5 per tier): tier1 same-denominator, tier2 different-denom/easy-LCM, tier3 required simplification (had to strengthen the tier3 prompt — first pass generated pairs that happened to already be reduced). Verified live in browser: "3/8 + 4/8" displayed, `[speak] What is three eighths plus four eighths?` fired correctly.

---

### Ticket 3.2 — Add word problem questions
**Context:** Same system as 3.1, but word problems are read-aloud-heavy and
have less predictable answer formats.

**Task:** Add `'word_problems'` as a topic, tiered by number size/complexity
(tier 1 = single-step addition/subtraction word problems with small
numbers, tier 3 = two-step problems). The MiniMax prompt should return a
plain numeric `answer` even though the `question` is a sentence, so grading
stays a simple number comparison.

**Done when:** Selecting Word Problems generates a short story-style
question, speaks the full sentence clearly via MiniMax T2A, and the
returned answer is a clean number that Claude's grading can compare against
handwritten digits (not a fraction or sentence).

**Out of scope:** Don't add multi-part/multi-answer word problems, one
number answer per question only.

- [x] Done. Notes: Adapted to src/lib/claude.ts (no minimax.ts/T2A in this build — uses the speak() stub from Step 3). Ticket only specified tier 1 and tier 3; decided tier 2 myself (single-step, larger numbers up to 100) per the ticket's own instruction. Verified with 9 real API calls across all 3 tiers: all answers were clean `number` type, correct math, tier 3 genuinely two-step (e.g. "gave 6, then mom gave 3x as many as she had left" = 54). Verified live in browser: story-style question displayed and spoken in full via [speak].

---

### Ticket 3.3 — Improve low-confidence grading path
**Context:** `gradeAnswer` in `claude.ts` already returns a `confidence`
field, and `App.tsx` currently just says "I couldn't read that clearly" on
low confidence. With fractions and word problems added, handwriting is
more varied (slashes, multi-digit numbers, negative signs) and more likely
to trip this path.

**Task:** Test grading specifically against messy/ambiguous handwritten
fractions and multi-digit numbers (write test cases by hand on device).
Tune the grading prompt in `claude.ts` if needed, e.g. explicitly telling
Claude to look for a fraction bar/slash shape, or handle a "1 1/2" mixed
number format. If confidence is consistently low for a valid answer format,
fix the prompt rather than just accepting more low-confidence retries.

**Done when:** Writing 5 different valid fraction answers and 5 different
valid word-problem numeric answers by hand on device, at least 4/5 of each
grade correctly on the first try (not stuck in low-confidence retry loop).

**Out of scope:** Don't rebuild the grading architecture, this is prompt
tuning and testing, not a new grading method.

- [x] Done. Notes: Context didn't match our build — App.tsx never had an "I couldn't read that clearly" low-confidence fallback (grading just checks `correct`); confirmed via grep before assuming it existed. Tested via the real web dev loop (device-equivalent per CLAUDE.md) with hand-drawn answers, not synthetic input: 5/5 fractions correct on first try (both stacked "7/8"-style and slash-notation "7 / 8" styles, one with an accidental stray line still graded correctly), 5/5 word-problem numeric answers correct on first try (single- and double-digit, e.g. "58", "49"). 9/10 were high confidence; the one low-confidence case (still graded correct) was a genuinely messy draw with a stray artifact on my end, not a systemic fraction/word-problem issue. No prompt tuning was actually needed — existing gradeAnswer prompt already handles both formats reliably, so I left it as-is rather than making speculative changes.

---

## Week 4: Visual Polish (Playful / Colorful / Kid-Friendly)

### Ticket 4.1 — Color system + typography pass
**Context:** Current UI (`App.tsx` styles) uses a single blue (#3478f6),
white background, system font, functional but generic, not kid-friendly.

**Task:** Define a small playful color palette (you pick 4-5 colors before
prompting Claude Code — e.g. one per topic: addition=orange,
subtraction=purple, multiplication=green, division=pink, fractions/word
problems get their own). Apply topic-specific colors to topic buttons and
the question screen background/accents. Consider a rounder, friendlier font
if available via Expo's font loading (e.g. a rounded sans-serif) instead of
the system default.

**Done when:** Each topic has a visually distinct, kid-appropriate color
identity carried from the topic button through to that topic's question
screen, and typography feels less "default iOS app."

**Out of scope:** Don't change any layout structure, positions, or add new
screens, this ticket is colors/fonts only.

- [x] Done. Notes: Used the exact 6-color palette given (src/lib/colors.ts). Installed @expo-google-fonts/baloo-2 + expo-font — this added expo-font as a config plugin in app.json (flagged: native config touched, needs an EAS/Expo Go rebuild before it'll show on the physical iPad; unaffected on the web dev loop used to verify). Chunky rounded buttons via borderRadius + a darker bottom-border for a pressed/depth look. Verified live: computed styles confirmed fontFamily "Baloo2_800ExtraBold" (not a system-font fallback) and question text color exactly #EC4899 for Division, distinct light-tinted background per topic carried from button through to question screen.

---

### Ticket 4.2 — Playful feedback + transitions
**Context:** Feedback currently is plain text ("Correct! Nice work.") with
no visual celebration, and moving between questions is an abrupt state
swap.

**Task:** Add simple animated feedback on correct/incorrect (e.g. a
lightweight scale/fade-in on the feedback text, or a simple emoji/icon
that appears, star for correct, gentle icon for incorrect). Add a basic
transition (fade or slide) between clearing the canvas and the next
question appearing, so it doesn't feel like a jump cut. Use React Native's
built-in `Animated` API, no new animation library needed for this scope.

**Done when:** Answering a question correctly shows a visible, brief
celebratory animation before the next question loads. Answering incorrectly
shows a distinct but gentle (non-punishing) visual cue. Question transitions
don't feel instant/jarring.

**Out of scope:** No sound effects beyond existing MiniMax speech, no
confetti libraries or heavy animation dependencies, keep it lightweight.

- [x] Done. Notes: Adapted "MiniMax speech" to our speak() stub (no sound in this build). Used only React Native's built-in Animated API (Animated.timing for the question fade, Animated.spring for the feedback pop-in) — no new dependency. ⭐ star for correct, 💭 thought-bubble for incorrect (distinct, non-punishing). Canvas fades back in via Animated.View as each new question arrives. Verified live across several correct/incorrect cycles including a tone-shift (2nd wrong in a row) case — all rendered cleanly, no console errors.

---

### Ticket 4.3 — Canvas + layout polish
**Context:** The drawing canvas currently has a plain light-gray background
with a thin border, functional but not inviting for a kid to write on.

**Task:** Give the canvas a more tactile, inviting look within the playful
theme, rounded corners (already partially there), maybe a subtle
notebook-line or dot-grid background pattern rendered in Skia behind the
drawing path, topic-color-tinted border. Keep the actual drawing/grading
logic completely untouched, this is purely visual.

**Done when:** The canvas visually feels like an inviting space to write on
rather than a bare gray box, and still functions identically for drawing,
clearing, and snapshotting.

**Out of scope:** Don't change touch handling, path logic, or the
snapshot/grading pipeline in any way.

- [x] Done. Notes: Dot-grid rendered as one Skia Path (PathBuilder, not hundreds of React elements) behind the drawing path, cream background, rounded corners, topic-colored border (threaded from App.tsx via a new `topicColor` prop). Hit and fixed a real crash along the way: `[styles.canvas, {borderColor: topicColor}]` array-style merge triggered a react-native-web shorthand/longhand `flex` conflict that crashed the canvas to a blank black screen on re-render — switched to object-spread `{...styles.canvas, borderColor}` which resolved it, confirmed via a fresh tab with clean console history (not just the same tab where stale errors could linger). Verified live across 3 topics (violet/pink/orange borders) and confirmed grading still works identically — real handwritten "5" graded correctly at high confidence with the new background in place.

---

### Ticket 4.4 — Full loop bug + polish pass
**Context:** By this point Sprint 2 has added 2 new topics and a full
visual pass on top of Sprint 1's adaptive logic. First time everything
runs together.

**Task:** Run the full loop end to end on device across all 6 topics now
available, confirm adaptive tiers still work correctly with the new topics,
confirm visuals hold up across all topic colors, fix whatever breaks.

**Done when:** You can play a full session touching multiple topics
including fractions and word problems, with tier changes, playful feedback,
and polished visuals all working together with no crashes.

**Out of scope:** No new features, this ticket is stabilization only.

- [x] Done. Notes: Adapted "on device" to the web dev loop (no physical iPad here; matches CLAUDE.md guidance for this class of logic — a real Pencil/iOS pass is still worth doing separately). Ran one continuous multi-topic session: Multiplication (3 correct → tier bump 1→2, "3 x 4"→"7 x 8" visibly harder) → switched to Fractions mid-session (fresh independent tier 1, orange theme) → 2 wrong in a row (tone shift + struggling lock, distinct from Multiplication's state) → Word Problems (fresh tier 1, teal theme, correct answer) → End session → summary read "You got 4 out of 6 correct.", exactly matching the real cross-topic count. All 6 topics visually confirmed distinct and functional (colors, dot-grid canvas, fonts). Zero console errors across the whole run.

---

## Looking ahead: Weeks 5-6 (Sprint 3, buffer + final polish)
Not scoped in ticket form yet, deliberately, this sprint should mostly
react to what Sprint 1 and 2 leave unfinished or broken. Rough shape:
full-device regression testing across every topic/tier/scenario, fixing
whatever Sprint 2's new content surfaces, and general stability. Scope this
one closer to week 4's actual results rather than guessing now.
