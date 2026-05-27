import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  BehaviorState,
  Session,
  SessionEvent,
  SessionEventType,
  SessionMetrics,
  Stroke,
} from '@/types';

interface UseSessionArgs {
  studentId: string;
  topicId: string;
  autoStart?: boolean;
}

interface BehaviorAccumulator {
  state: BehaviorState;
  since: number;
}

/**
 * Owns the lifecycle of a tutoring session:
 *   - starts a row in `sessions`
 *   - records events (strokes, voice messages, inactivity triggers)
 *   - tracks time spent in confident/hesitant/idle
 *   - computes an engagement score 0-100
 *   - on end(): persists the final row and returns it
 */
export function useSession({ studentId, topicId, autoStart = true }: UseSessionArgs) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);

  const startedAtRef = useRef<number>(0);
  const eventsRef = useRef<SessionEvent[]>([]);
  const behaviorRef = useRef<BehaviorAccumulator>({ state: 'idle', since: Date.now() });
  const totalsRef = useRef<{ confident: number; hesitant: number; idle: number }>({
    confident: 0,
    hesitant: 0,
    idle: 0,
  });

  const flushBehavior = useCallback(() => {
    const now = Date.now();
    const delta = (now - behaviorRef.current.since) / 1000;
    if (behaviorRef.current.state === 'confident') totalsRef.current.confident += delta;
    if (behaviorRef.current.state === 'hesitant') totalsRef.current.hesitant += delta;
    if (behaviorRef.current.state === 'idle') totalsRef.current.idle += delta;
    behaviorRef.current.since = now;
  }, []);

  const logEvent = useCallback(
    (type: SessionEventType, data?: Record<string, unknown>) => {
      eventsRef.current.push({ type, timestamp: Date.now(), data });
    },
    [],
  );

  const start = useCallback(async () => {
    if (isActive) return;
    startedAtRef.current = Date.now();
    eventsRef.current = [];
    totalsRef.current = { confident: 0, hesitant: 0, idle: 0 };
    behaviorRef.current = { state: 'idle', since: Date.now() };
    setStrokeCount(0);
    setWarningCount(0);
    setPauseCount(0);

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        student_id: studentId,
        topic_id: topicId,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !data) {
      console.warn('[Jackson] session insert failed, running ephemerally', error);
      setSessionId(`local-${Date.now()}`);
    } else {
      setSessionId(data.id);
    }
    setIsActive(true);
    logEvent('session_start', { topic_id: topicId });

    // Mark this topic as in_progress on the student's progress row.
    await supabase
      .from('progress')
      .upsert(
        {
          student_id: studentId,
          topic_id: topicId,
          status: 'in_progress',
          last_practiced_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,topic_id' },
      );
  }, [isActive, logEvent, studentId, topicId]);

  const recordStroke = useCallback(
    (stroke: Stroke) => {
      setStrokeCount((c) => c + 1);
      logEvent('stroke', {
        duration: stroke.endTime - stroke.startTime,
        points: stroke.points.length,
      });
    },
    [logEvent],
  );

  const setBehaviorState = useCallback(
    (state: BehaviorState) => {
      if (behaviorRef.current.state === state) return;
      flushBehavior();
      logEvent('state_change', { from: behaviorRef.current.state, to: state });
      behaviorRef.current.state = state;
    },
    [flushBehavior, logEvent],
  );

  const recordInactivityWarning = useCallback(() => {
    setWarningCount((c) => c + 1);
    logEvent('inactivity_warning');
  }, [logEvent]);

  const recordInactivityPause = useCallback(() => {
    setPauseCount((c) => c + 1);
    logEvent('inactivity_pause');
  }, [logEvent]);

  const recordVoiceMessage = useCallback(
    (message: string, role: 'jackson' | 'student') => {
      logEvent('voice_message', { role, message });
    },
    [logEvent],
  );

  /**
   * Engagement score is a transparent weighted mix:
   *   confident_pct * 60 + (1 - idle_pct) * 30 + (strokes >= 10 ? 10 : strokes)
   * Capped at 0-100.
   */
  const computeMetrics = useCallback((): SessionMetrics => {
    flushBehavior();
    const duration = Math.max(1, (Date.now() - startedAtRef.current) / 1000);
    const { confident, hesitant, idle } = totalsRef.current;
    const accounted = confident + hesitant + idle;
    const confidentPct = accounted > 0 ? confident / accounted : 0;
    const idlePct = accounted > 0 ? idle / accounted : 0;

    const score = Math.round(
      confidentPct * 60 + (1 - idlePct) * 30 + Math.min(10, strokeCount),
    );

    return {
      duration_seconds: Math.round(duration),
      stroke_count: strokeCount,
      confident_seconds: Math.round(confident),
      hesitant_seconds: Math.round(hesitant),
      idle_seconds: Math.round(idle),
      engagement_score: Math.max(0, Math.min(100, score)),
      inactivity_warnings: warningCount,
      inactivity_pauses: pauseCount,
    };
  }, [flushBehavior, pauseCount, strokeCount, warningCount]);

  const end = useCallback(
    async (opts: { notes?: string } = {}): Promise<{ session: Session | null; metrics: SessionMetrics }> => {
      if (!isActive) {
        return { session: null, metrics: computeMetrics() };
      }
      const metrics = computeMetrics();
      logEvent('session_end', { metrics });

      const endedAt = new Date().toISOString();
      let savedSession: Session | null = null;

      if (sessionId && !sessionId.startsWith('local-')) {
        const { data, error } = await supabase
          .from('sessions')
          .update({
            ended_at: endedAt,
            duration_seconds: metrics.duration_seconds,
            engagement_score: metrics.engagement_score,
            stroke_count: metrics.stroke_count,
            confident_seconds: metrics.confident_seconds,
            hesitant_seconds: metrics.hesitant_seconds,
            idle_seconds: metrics.idle_seconds,
            events: eventsRef.current,
            notes: opts.notes ?? null,
          })
          .eq('id', sessionId)
          .select('*')
          .single();
        if (error) console.warn('[Jackson] session update failed', error);
        else savedSession = data as Session;
      }

      // Optimistic progress bump: if engagement is high, raise mastery toward 100.
      if (metrics.engagement_score >= 80) {
        await supabase
          .from('progress')
          .upsert(
            {
              student_id: studentId,
              topic_id: topicId,
              status: 'mastered',
              mastery_score: 100,
              last_practiced_at: endedAt,
            },
            { onConflict: 'student_id,topic_id' },
          );
      } else if (metrics.engagement_score >= 50) {
        await supabase
          .from('progress')
          .upsert(
            {
              student_id: studentId,
              topic_id: topicId,
              status: 'in_progress',
              mastery_score: metrics.engagement_score,
              last_practiced_at: endedAt,
            },
            { onConflict: 'student_id,topic_id' },
          );
      }

      setIsActive(false);
      return { session: savedSession, metrics };
    },
    [computeMetrics, isActive, logEvent, sessionId, studentId, topicId],
  );

  useEffect(() => {
    if (autoStart) {
      void start();
    }
    // We intentionally do not call end() on unmount -- the screen owns end timing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sessionId,
    isActive,
    strokeCount,
    warningCount,
    pauseCount,
    start,
    end,
    recordStroke,
    setBehaviorState,
    recordInactivityWarning,
    recordInactivityPause,
    recordVoiceMessage,
    computeMetrics,
  };
}
