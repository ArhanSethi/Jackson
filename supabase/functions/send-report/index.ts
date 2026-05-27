// Supabase Edge Function: send-report
// Deploy with: supabase functions deploy send-report
// Required secrets: RESEND_API_KEY, REPORT_FROM_EMAIL (e.g. "Jackson <jackson@yourdomain.com>")

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("REPORT_FROM_EMAIL") ?? "Jackson <onboarding@resend.dev>";

interface RequestBody {
  to: string;
  student_name: string;
  topic_title: string;
  report_markdown: string;
}

function markdownToHtml(md: string): string {
  // Tiny markdown -> HTML. Good enough for the report shape we generate.
  return md
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .concat("</p>");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not set" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const subject = `${body.student_name}'s ${body.topic_title} session`;
  const html = `
    <div style="font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#2C3E50;">
      <h2 style="color:#4A90E2;">Session report</h2>
      ${markdownToHtml(body.report_markdown)}
      <hr style="border:none;border-top:1px solid #E5EEF8;margin:24px 0;" />
      <p style="font-size:12px;color:#88A0B5;">Sent by Jackson, your kid's AI math tutor.</p>
    </div>
  `;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: body.to,
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return new Response(
      JSON.stringify({ error: "resend_error", detail: text }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
});
