# Jackson V1 — Clean Build Spec (Claude-only, fresh repo)

**This replaces all prior build prompts. If you're Claude Code reading this
in a fresh repo, this is the actual, current, correct spec. Ignore any
references to MiniMax, Supabase, ElevenLabs, PencilKit, or Expo Router in
any other file, prior branch, or prior conversation, this build uses none
of those.**

## Goal
A minimal Expo (React Native) iPad app, single screen flow:
1. User picks a topic (addition, subtraction, multiplication, division).
2. App calls Claude to generate a question + answer for that topic.
3. App speaks the question aloud (via local TTS during dev; real provider TBD for device builds).
4. User writes their answer with Apple Pencil on a Skia canvas.
5. On submit, the canvas is snapshotted and sent to Claude (vision) along with the known correct answer.
6. Claude returns whether the handwritten answer is correct.
7. App speaks "Correct!" or "Not quite, try again."

No accounts, no backend, no persistence beyond in-memory session state (Sprint 1 adds a tracked-in-memory history, still no database). No Expo Router, no Supabase, no ElevenLabs, no PencilKit.

---

## Stack
- Expo SDK 57 (managed workflow), TypeScript
- `"newArchEnabled": false` in app.json from the start (avoids a known SDK 57 bridgeless-mode MessageQueue crash)
- Plain entry point: `index.ts` calling `registerRootComponent(App)`. No `expo-router`.
- `@shopify/react-native-skia` for the drawing canvas
- One API key: `EXPO_PUBLIC_ANTHROPIC_API_KEY`, used for BOTH question generation and handwriting grading
- Speech: local dev only for now via Voicebox (localhost REST API) or a stub `speak()` that just logs — do not wire in MiniMax or ElevenLabs. Real cloud TTS provider is a decision for later, not this build.

---

## Step 1: Scaffold
```
npx create-expo-app jackson-v1 --template expo-template-blank-typescript
```
Install: `@shopify/react-native-skia`
Set `newArchEnabled: false` in `app.json` immediately.
Set up `.env` with `EXPO_PUBLIC_ANTHROPIC_API_KEY` only. Add `.env` to `.gitignore`.

## Step 2: Topic picker + question generation (Claude, not MiniMax)
- Simple screen: 4 buttons (Addition, Subtraction, Multiplication, Division)
- On topic select, call Claude's messages API:

```
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {ANTHROPIC_API_KEY}
  anthropic-version: 2023-06-01
  Content-Type: application/json
Body:
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 200,
  "messages": [{
    "role": "user",
    "content": "Generate one simple {topic} question appropriate for a K-8 student, tier {tier} difficulty. Return ONLY valid JSON, no markdown: {\"question\": \"4 + 4\", \"answer\": 8}"
  }]
}
```
- Parse the JSON out of the response content block. Store `{question, answer}` in component state.

## Step 3: Speak the question (dev stub)
- For now, implement `speak(text: string)` as either:
  - A console.log stub (`console.log('[speak]', text)`) if no local TTS is set up, OR
  - A call to a local Voicebox REST endpoint if the developer has it running on localhost
- Do not call MiniMax or ElevenLabs. This function will be replaced with a real cloud provider in a later, dedicated ticket, not this build.

## Step 4: Drawing canvas
- Full-width Skia `<Canvas>` with a `<Path>` built from touch events.
- "Clear" button resets the path.
- "Submit" button below the canvas.

## Step 5: Grading (Claude vision)
- On submit: snapshot canvas via `makeImageSnapshot()`, encode to base64 PNG.
- Call Claude vision (same endpoint as Step 2, different model call):

```
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 200,
  "messages": [{
    "role": "user",
    "content": [
      { "type": "image", "source": { "type": "base64", "media_type": "image/png", "data": "{base64_snapshot}" } },
      { "type": "text", "text": "A student was asked: {question}\nThe correct answer is {answer}.\nRead the number they wrote and determine if it matches. Respond ONLY with JSON: {\"written\": \"<value>\", \"correct\": true|false, \"confidence\": \"high\"|\"low\"}" }
    ]
  }]
}
```

## Step 6: Speak the result
- Same `speak()` stub/local-TTS function as Step 3.

## Step 7: Reset loop
- After grading, clear canvas, generate a new question for the same topic.

---

## Explicit non-goals for this build
- No MiniMax, no ElevenLabs, no Supabase, no PencilKit, no Expo Router
- No user accounts, no backend, no cross-session persistence
- No production-safe key handling (client-side `EXPO_PUBLIC_` key is a known, accepted V1 tradeoff)
- No palm rejection tuning

## Build order (do not skip ahead)
1. Blank Skia canvas, confirm touch → path works
2. Topic buttons → Claude question generation → display as text (no speech yet)
3. Wire up `speak()` stub for the question
4. Submit → snapshot → Claude vision grading → console.log parsed result
5. Wire up `speak()` stub for the result
6. Clear button, reset-loop, basic layout

## After this build works
Continue with `SPRINT.md` (adaptive difficulty) starting at Ticket 1.1. `SPRINT.md`'s tickets don't need changes, they were never MiniMax-specific.
`SPRINT2.md` Ticket 3.x references will need `generateQuestion` calls updated to Claude instead of MiniMax where relevant, check before pasting those tickets in.
