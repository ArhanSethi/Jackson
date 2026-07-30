# Jackson — Backlog (not scheduled in current sprints)

Items here are captured for later, deliberately not part of Sprint 1 or
Sprint 2. Don't pull these into active work without explicitly deciding
to schedule them into a sprint first.

---

## Backlog Ticket: On-device handwriting recognition (cost optimization)

**Why:** Every graded answer currently costs a Claude vision API call.
At meaningful usage volume (hundreds-thousands of submissions/day), this
adds up. iOS ships a free, on-device text/handwriting recognition
framework (Vision framework, `VNRecognizeTextRequest`) that can read
handwritten digits/numbers locally with no API cost and lower latency.

**Proposed approach (hybrid, not a replacement):**
1. On submit, run the canvas image through on-device Vision recognition
   first.
2. If Vision returns a clean, high-confidence numeric/text result, grade
   it locally (simple string/number comparison against the known answer,
   no API call at all).
3. If Vision's result is empty, low-confidence, or doesn't parse cleanly
   (e.g. fractions, messy handwriting, ambiguous digits), fall back to
   the existing Claude vision grading call as-is.
4. Log which path was used (local vs. Claude fallback) so you can
   measure what % of submissions are actually being offloaded, this
   tells you if the optimization is worth the added complexity.

**Why this is real native work, not a simple Claude Code ticket:**
`VNRecognizeTextRequest` is part of Apple's native Vision framework, not
accessible from plain JS/TS in Expo Go managed workflow. This requires
either:
- A small native Swift module wrapped as an Expo config plugin, built
  and tested through the custom `eas-cli go` dev client pipeline
  (already set up for this project), or
- An existing community Expo module wrapping Vision text recognition, if
  one exists and is actively maintained (needs research before assuming
  this shortcut is viable).

This is meaningfully more involved than the JS-only tickets in
`SPRINT.md`/`SPRINT2.md` and should not be scoped as a quick add.

**When to actually schedule this:**
Not before Aug 20. Not until real usage volume makes Claude vision
grading costs a genuine concern, this is a scale optimization, not a V1/V2
correctness or UX feature. Reasonable trigger point: once Jackson has
real students using it regularly and grading API cost becomes visible/
worth optimizing, roughly aligned with the "10 users → 1,000 users"
backend work discussed separately, not the Aug 20 "app done" milestone.

**Done when (once actually scheduled):** A student can submit a clean,
simple numeric answer (e.g. basic addition/subtraction) and get graded
entirely on-device with zero Claude API call, verified via the logging
in step 4. Messy handwriting, fractions, or low-confidence cases
correctly fall back to Claude vision and still grade accurately.

**Out of scope even when scheduled:** Don't try to replace Claude vision
entirely, this is a fallback pattern, not a full swap. Word problems and
fractions likely stay on Claude vision permanently given their higher
complexity, only simple numeric answers are good on-device candidates.
