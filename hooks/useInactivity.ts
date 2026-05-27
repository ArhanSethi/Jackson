import { useCallback, useEffect, useRef, useState } from 'react';

const WARNING_AFTER_MS = 90_000;
const PAUSE_AFTER_MS = 150_000;

export interface InactivityCallbacks {
  onWarning?: () => void;
  onPause?: () => void;
  enabled?: boolean;
}

/**
 * Fires `onWarning` after 90s of no activity and `onPause` after 150s.
 * Activity is signalled by calling `bump()` -- typically from any stroke,
 * voice message, or scroll the kid does.
 */
export function useInactivity({ onWarning, onPause, enabled = true }: InactivityCallbacks) {
  const lastActivityRef = useRef<number>(Date.now());
  const warningFiredRef = useRef(false);
  const pauseFiredRef = useRef(false);
  const [warningCount, setWarningCount] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);

  const bump = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningFiredRef.current = false;
    pauseFiredRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= PAUSE_AFTER_MS && !pauseFiredRef.current) {
        pauseFiredRef.current = true;
        setPauseCount((c) => c + 1);
        onPause?.();
      } else if (idleMs >= WARNING_AFTER_MS && !warningFiredRef.current) {
        warningFiredRef.current = true;
        setWarningCount((c) => c + 1);
        onWarning?.();
      }
    }, 1_000);
    return () => clearInterval(id);
  }, [enabled, onPause, onWarning]);

  return { bump, warningCount, pauseCount };
}
