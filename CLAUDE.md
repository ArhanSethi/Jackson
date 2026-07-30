# Jackson — Project Context for Claude Code

## What this is
Jackson is an iPad math practice app for K-8 students. Student picks a
topic, hears a question spoken aloud, writes the answer by hand with
Apple Pencil (or mouse/touch in dev), gets it graded, hears feedback.
Built with Expo/React Native, MiniMax (question generation + TTS), and
Claude (handwriting grading via vision).

## Source of truth for scope
This file governs *how* to work. `SPRINT.md` and `SPRINT2.md` (project
root) govern *what* to build, ticket by ticket. Always work from the
current ticket's exact Context/Task/Done-when/Out-of-scope block, don't
infer scope from this file or from memory of past sessions.

**Never build ahead of the current ticket.** If a ticket's "Out of scope"
line excludes something, don't touch it even if it seems related or
convenient to do while you're in that file.

---

## Dev environment

**Primary dev loop (Windows, fast iteration):**
```
npx expo start --web
```
Use this for anything that isn't Apple Pencil/iOS-specific: canvas draw/
clear/submit logic, API integration, adaptive tier logic, UI layout.

**Fallback if web has Skia issues:**
```
npx expo start --android
```
(requires Android Studio emulator running)

**Real-device verification (periodic, not every ticket):**
Custom Expo Go build via `npx eas-cli go`, installed through TestFlight
on physical iPad. Only needed to confirm Apple Pencil feel and iOS-
specific rendering, not for day-to-day logic changes.

**If you touch `app.json`, native config, or add a native dependency:**
flag this explicitly, since it requires rebuilding the custom Expo Go
client (`npx eas-cli go`) before it'll work on the iPad again.

## Key files
- `App.tsx` — main screen logic, topic picker + question/canvas screen
- `src/lib/minimax.ts` — question generation (MiniMax chat) + speech (MiniMax T2A)
- `src/lib/claude.ts` — handwriting grading via Claude vision
- `app.json` — Expo config. `newArchEnabled: false` is intentional
  (works around a SDK 57 bridgeless-mode MessageQueue crash, don't
  remove without testing on device first)

## Environment variables
Read via `process.env.EXPO_PUBLIC_*` (required prefix for Expo to expose
vars to client code):
- `EXPO_PUBLIC_MINIMAX_API_KEY`
- `EXPO_PUBLIC_ANTHROPIC_API_KEY`

These are V1/V2 prototype-only — client-side keys are NOT production-safe.
Don't "fix" this by moving to a backend unless a ticket explicitly asks
for it; it's a known, documented tradeoff (see comments at the top of
`minimax.ts` and `claude.ts`), not an oversight to silently correct.

---

## Verification workflow (do this for every ticket, not just at the end)

1. Read the ticket's exact "Done when" line before writing code. That's
   the spec. If it's ambiguous, stop and ask rather than guessing.
2. After implementing, verify the "Done when" condition yourself using
   whatever means fits: console.log output, a quick manual test in the
   running app, or a small test script if one doesn't exist yet.
3. State explicitly whether the "Done when" condition passed or failed,
   don't just report that code was written. "I added the function" is
   not the same as "I confirmed it returns the right values."
4. If something breaks that's unrelated to the current ticket, report it
   rather than silently fixing it, it may be out of scope for this ticket
   and belongs in a bug-pass ticket instead.

## Known false-confidence risk
Don't assume a change is correct just because it compiles/runs without
errors. Runtime success is not the same as matching the "Done when"
criteria. Re-read the criteria after implementing and check the actual
behavior against it, not just that nothing crashed.

## Non-goals across all current sprints (do not build unless a ticket
explicitly asks)
- No backend/database — client-side and in-memory/local only
- No user accounts or cross-device sync
- No persistent storage beyond what a specific ticket calls for
- No new topics beyond what the current sprint's tickets specify
- No UI/visual changes outside of tickets explicitly scoped as polish
- No "helpful" refactors of working code outside the current ticket's
  files unless asked

## When a ticket is genuinely ambiguous
Make the smallest reasonable assumption, state it explicitly in your
response, and proceed. Don't silently pick an interpretation and don't
block on asking unless the ambiguity would send the work in a
substantially wrong direction.
