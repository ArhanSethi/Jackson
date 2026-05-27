// Supabase Edge Function: generate-report
// Deploy with: supabase functions deploy generate-report
// Required secrets: ANTHROPIC_API_KEY
//
// Wraps the Anthropic Claude API so we never ship the key in the mobile app.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-3-5-sonnet-latest";

interface RequestBody {
  student: {
    name: string;
    grade: number;
  };
  topic: {
    id: string;
    title: string;
    description: string;
  };
  metrics: {
    duration_seconds: number;
    stroke_count: number;
    confident_seconds: number;
    hesitant_seconds: number;
    idle_seconds: number;
    engagement_score: number;
    inactivity_warnings: number;
    inactivity_pauses: number;
  };
  notes?: string;
}

const SYSTEM_PROMPT = `You are writing a short, honest report for a parent after their kid finished a math tutoring session with Jackson.

Voice: warm, specific, real. Never sugarcoat. Never be harsh. Talk like a tutor who has been with this kid for years and respects the parent's time.

Structure (markdown, ~180-260 words):
1. One-sentence summary of how the session went.
2. **What went well** -- 2-3 concrete observations.
3. **Where they struggled** -- 1-2 specific weaknesses with evidence from the metrics.
4. **What to do next** -- one practical suggestion the parent can do today or this week.

Rules:
- Reference real metrics. If confident_seconds dominates, say so. If they paused a lot, say that.
- Never claim mastery from a single session.
- No filler. No "great job!" platitudes.
- Use the kid's first name.`;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const userPrompt = `Session data:
- Student: ${body.student.name}, grade ${body.student.grade}
- Topic: ${body.topic.title} -- ${body.topic.description}
- Duration: ${Math.round(body.metrics.duration_seconds / 60)} min
- Strokes written: ${body.metrics.stroke_count}
- Confident time: ${body.metrics.confident_seconds}s
- Hesitant time: ${body.metrics.hesitant_seconds}s
- Idle time: ${body.metrics.idle_seconds}s
- Engagement score: ${body.metrics.engagement_score}/100
- Inactivity warnings triggered: ${body.metrics.inactivity_warnings}
- Inactivity pauses triggered: ${body.metrics.inactivity_pauses}
${body.notes ? `- Tutor notes: ${body.notes}` : ""}

Write the parent report.`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return new Response(
      JSON.stringify({ error: "anthropic_error", detail: text }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  const data = await resp.json();
  const report = data?.content?.[0]?.text ?? "";

  return new Response(
    JSON.stringify({ report }),
    { headers: { "content-type": "application/json" } },
  );
});
