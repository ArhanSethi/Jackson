# Jackson

An AI math tutor for kids in grades 4-8. Built with Expo (React Native + TypeScript), Expo Router, Supabase, ElevenLabs Conversational AI, and Apple's PencilKit.

## Stack

- **Expo** + **TypeScript**
- **Expo Router** for navigation
- **expo-pencilkit-ui** for the writing surface (iOS only)
- **@11labs/react** for ElevenLabs Conversational AI
- **@supabase/supabase-js** + **@react-native-async-storage/async-storage** for backend & local state
- **expo-haptics** for tactile feedback
- Supabase **Edge Functions** to call Anthropic Claude and Resend without shipping API keys in the app

## Project layout

```
app/
  _layout.tsx          Stack root
  index.tsx            Boot screen → routes to onboarding or home
  onboarding.tsx       Name / grade / parent email
  home.tsx             Greeting, current topic, curriculum list
  session.tsx          Writing + voice + analysis (the main product)
components/
  WritingSurface.tsx   Ruled lines + PencilKit + stroke tracking
  JacksonVoice.tsx     ElevenLabs Conversational AI agent
hooks/
  useStrokeAnalysis.ts confident / hesitant / idle
  useInactivity.ts     90s warning, 150s pause
  useSession.ts        Whole-session lifecycle + Supabase + engagement score
lib/
  supabase.ts          Client + AsyncStorage adapter
  curriculum.ts        25 Common Core topics, grades 4-8, with prerequisites
  elevenlabs.ts        Dynamic agent context builder
  reports.ts           Calls Supabase Edge Functions for report + email
types/
  index.ts             Shared types
supabase/
  functions/
    generate-report/   Edge Function that calls Anthropic Claude
    send-report/       Edge Function that emails the parent via Resend
schema.sql             Three tables: students, progress, sessions
```

## Setup

### 1. Install dependencies

```bash
npm install
```

If Expo complains about version mismatches, run:

```bash
npx expo install --check
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill it in:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_ELEVENLABS_AGENT_ID=agent_xxx
```

### 3. Set up Supabase

1. Create a project at supabase.com.
2. Open the SQL editor and paste `schema.sql`.
3. Deploy the two edge functions:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy generate-report
   supabase functions deploy send-report
   ```
4. Set the function secrets:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase secrets set RESEND_API_KEY=re_...
   supabase secrets set REPORT_FROM_EMAIL="Jackson <jackson@yourdomain.com>"
   ```

### 4. Set up ElevenLabs

1. Create a Conversational AI agent in the ElevenLabs dashboard.
2. In the agent's system prompt, reference the dynamic variables we inject:
   - `{{student_name}}`, `{{student_grade}}`
   - `{{topic_title}}`, `{{topic_description}}`, `{{common_core_standard}}`
   - `{{behavior_state}}` — `confident`, `hesitant`, or `idle`
   - `{{prompt_mode}}` — `normal`, `inactivity_check`, `session_start`, `session_end`
3. Branch on `{{prompt_mode}}` so the agent knows when to do a check-in. The check-in line lives in `lib/elevenlabs.ts > MODE_HINTS`.
4. Copy the agent ID into `EXPO_PUBLIC_ELEVENLABS_AGENT_ID`.

### 5. Run on iOS

PencilKit and microphone access need a native build, not Expo Go.

```bash
npx expo prebuild --clean
npx expo run:ios --device
```

Test on an iPad with Apple Pencil for the best experience.

## What's wired together

- `useStrokeAnalysis` reads stroke velocity / pauses and outputs `confident | hesitant | idle`.
- `useInactivity` fires `onWarning` at 90 s and `onPause` at 150 s.
- `useSession` owns the Supabase row, accumulates time-in-state, and computes the engagement score.
- The session screen pipes:
  - `WritingSurface` → `useStrokeAnalysis.pushStroke` → `useSession.recordStroke`
  - Any stroke or voice message → `useInactivity.bump`
  - Behavior state changes → `useSession.setBehaviorState` and into `JacksonVoice` via the `behaviorState` prop
  - Inactivity warning → switches `promptMode` to `inactivity_check`, which causes Jackson to nudge the student
- On end, `session.end()` resolves, then `generateParentReport` (Claude via edge function) → `sendParentEmail` (Resend via edge function), then `router.replace('/home')`.

## Caveats

- `@11labs/react` is web-first. If you hit issues running it inside React Native, swap in `@elevenlabs/react-native` — the `JacksonVoice` component uses an optional require so the rest of the app keeps running while you migrate.
- `expo-pencilkit-ui` is iOS only. The writing surface degrades to plain touch tracking on Android/web.
- The RLS policies in `schema.sql` are permissive for MVP. Tighten them before going to production.
- The Anthropic and Resend API keys live in Supabase function secrets, never on device.
