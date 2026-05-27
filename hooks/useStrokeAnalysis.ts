import { useCallback, useEffect, useRef, useState } from 'react';
import type { BehaviorState, Stroke, StrokeMetrics } from '@/types';

const IDLE_AFTER_MS = 6_000;
const HESITANT_PAUSE_MS = 2_500;
const CONFIDENT_VELOCITY = 250;
const HESITANT_VELOCITY = 80;
const RECENT_WINDOW = 5;

function strokeVelocity(stroke: Stroke): number {
  const duration = Math.max(stroke.endTime - stroke.startTime, 1);
  if (stroke.points.length < 2) return 0;
  let dist = 0;
  for (let i = 1; i < stroke.points.length; i++) {
    const a = stroke.points[i - 1];
    const b = stroke.points[i];
    dist += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return (dist / duration) * 1000; // px / s
}

/**
 * Reads a stream of strokes and outputs a behaviour state:
 *   - confident: writing fast with short pauses
 *   - hesitant: long pauses or slow strokes
 *   - idle: no strokes for > IDLE_AFTER_MS
 *
 * Call `pushStroke()` whenever a stroke ends. `pushTick()` is fired on a timer
 * so we can transition into 'idle' without any user input.
 */
export function useStrokeAnalysis() {
  const strokesRef = useRef<Stroke[]>([]);
  const lastStrokeEndRef = useRef<number>(Date.now());
  const [metrics, setMetrics] = useState<StrokeMetrics>({
    avgVelocity: 0,
    lastPauseMs: 0,
    hesitationCount: 0,
    state: 'idle',
  });

  const recompute = useCallback(() => {
    const now = Date.now();
    const recent = strokesRef.current.slice(-RECENT_WINDOW);

    const avgVelocity =
      recent.length === 0
        ? 0
        : recent.reduce((sum, s) => sum + strokeVelocity(s), 0) / recent.length;

    const lastPauseMs = now - lastStrokeEndRef.current;

    let hesitationCount = 0;
    for (let i = 1; i < recent.length; i++) {
      const gap = recent[i].startTime - recent[i - 1].endTime;
      if (gap > HESITANT_PAUSE_MS) hesitationCount += 1;
    }

    let state: BehaviorState;
    if (lastPauseMs > IDLE_AFTER_MS) {
      state = 'idle';
    } else if (
      avgVelocity >= CONFIDENT_VELOCITY &&
      hesitationCount === 0 &&
      lastPauseMs < HESITANT_PAUSE_MS
    ) {
      state = 'confident';
    } else if (avgVelocity < HESITANT_VELOCITY || hesitationCount >= 2 || lastPauseMs > HESITANT_PAUSE_MS) {
      state = 'hesitant';
    } else {
      state = 'confident';
    }

    setMetrics((prev) => {
      if (
        prev.state === state &&
        Math.abs(prev.avgVelocity - avgVelocity) < 5 &&
        Math.abs(prev.lastPauseMs - lastPauseMs) < 500 &&
        prev.hesitationCount === hesitationCount
      ) {
        return prev;
      }
      return { avgVelocity, lastPauseMs, hesitationCount, state };
    });
  }, []);

  const pushStroke = useCallback(
    (stroke: Stroke) => {
      strokesRef.current.push(stroke);
      lastStrokeEndRef.current = stroke.endTime;
      recompute();
    },
    [recompute],
  );

  const reset = useCallback(() => {
    strokesRef.current = [];
    lastStrokeEndRef.current = Date.now();
    setMetrics({ avgVelocity: 0, lastPauseMs: 0, hesitationCount: 0, state: 'idle' });
  }, []);

  // Tick so idle transitions happen without strokes.
  useEffect(() => {
    const id = setInterval(recompute, 1000);
    return () => clearInterval(id);
  }, [recompute]);

  return {
    metrics,
    pushStroke,
    reset,
    strokes: strokesRef,
  };
}
