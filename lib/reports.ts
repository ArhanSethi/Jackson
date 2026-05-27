import type { Session, SessionMetrics, Student, Topic } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Calls the `generate-report` Supabase Edge Function which wraps Anthropic Claude.
 * Returns the markdown report body.
 */
export async function generateParentReport(args: {
  student: Pick<Student, 'name' | 'grade'>;
  topic: Pick<Topic, 'id' | 'title' | 'description'>;
  metrics: SessionMetrics;
  notes?: string;
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ report: string }>(
    'generate-report',
    {
      body: {
        student: args.student,
        topic: args.topic,
        metrics: args.metrics,
        notes: args.notes,
      },
    },
  );

  if (error) {
    console.warn('[Jackson] generate-report failed', error);
    return fallbackReport(args);
  }
  return data?.report ?? fallbackReport(args);
}

/**
 * Calls the `send-report` Supabase Edge Function which delivers the email via Resend.
 */
export async function sendParentEmail(args: {
  to: string;
  studentName: string;
  topicTitle: string;
  reportMarkdown: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.functions.invoke('send-report', {
    body: {
      to: args.to,
      student_name: args.studentName,
      topic_title: args.topicTitle,
      report_markdown: args.reportMarkdown,
    },
  });
  if (error) {
    console.warn('[Jackson] send-report failed', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Local fallback if the edge function is unreachable. Keeps the parent loop
 * working in dev when Anthropic / Resend keys aren't set yet.
 */
function fallbackReport(args: {
  student: Pick<Student, 'name'>;
  topic: Pick<Topic, 'title'>;
  metrics: SessionMetrics;
}): string {
  const { student, topic, metrics } = args;
  const minutes = Math.max(1, Math.round(metrics.duration_seconds / 60));
  return [
    `${student.name} spent ${minutes} minute${minutes === 1 ? '' : 's'} on **${topic.title}** today.`,
    '',
    '**What we saw**',
    `- Engagement score: ${metrics.engagement_score}/100`,
    `- Confident work: ${metrics.confident_seconds}s, hesitant: ${metrics.hesitant_seconds}s, idle: ${metrics.idle_seconds}s`,
    `- Strokes written: ${metrics.stroke_count}`,
    '',
    '**Next time**',
    metrics.engagement_score >= 70
      ? '- Push into a harder problem in this topic.'
      : '- Review the fundamentals together for a few minutes before the next session.',
  ].join('\n');
}

/**
 * Convenience: persists the generated report onto the session row.
 */
export async function saveReportToSession(sessionId: string, report: string) {
  const { error } = await supabase
    .from('sessions')
    .update({ parent_report: report })
    .eq('id', sessionId);
  if (error) console.warn('[Jackson] saveReportToSession failed', error);
}

export type { Session };
