import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import type { Stroke, StrokePoint } from '@/types';

// PencilKit is iOS-only. We optional-require so the component still mounts on
// other platforms (the canvas just falls back to a plain view).
let PencilKitView: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PencilKitView = require('expo-pencilkit-ui').PencilKitView;
} catch {
  PencilKitView = null;
}

const LINE_SPACING = 56;
const LINE_COLOR = '#D8E4F3';
const MARGIN_COLOR = '#F4C2C2';
const BG_COLOR = '#FFFFFF';

interface WritingSurfaceProps {
  onStroke: (stroke: Stroke) => void;
  onActivity?: () => void;
}

interface ActiveStroke {
  id: string;
  points: StrokePoint[];
  startTime: number;
}

/**
 * Drawing surface with ruled-notebook lines under it.
 * On iOS uses PencilKit for ink quality; we also overlay a transparent
 * pan tracker so we can compute per-stroke timing/velocity ourselves
 * (PencilKit's onDrawingChange doesn't expose individual stroke metadata).
 */
export function WritingSurface({ onStroke, onActivity }: WritingSurfaceProps) {
  const sizeRef = useRef({ w: 0, h: 0 });
  const activeRef = useRef<ActiveStroke | null>(null);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    sizeRef.current = {
      w: e.nativeEvent.layout.width,
      h: e.nativeEvent.layout.height,
    };
  }, []);

  const finishStroke = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    const endTime = Date.now();
    activeRef.current = null;
    if (active.points.length < 2) return; // Ignore taps.
    onStroke({
      id: active.id,
      points: active.points,
      startTime: active.startTime,
      endTime,
    });
  }, [onStroke]);

  const onTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      const t = e.nativeEvent;
      activeRef.current = {
        id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        startTime: Date.now(),
        points: [{ x: t.locationX, y: t.locationY, t: Date.now() }],
      };
      onActivity?.();
    },
    [onActivity],
  );

  const onTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      const active = activeRef.current;
      if (!active) return;
      const t = e.nativeEvent;
      active.points.push({ x: t.locationX, y: t.locationY, t: Date.now() });
    },
    [],
  );

  const onTouchEnd = useCallback(() => {
    finishStroke();
    onActivity?.();
  }, [finishStroke, onActivity]);

  // Cleanup an unfinished stroke if the component unmounts mid-stroke.
  useEffect(() => () => finishStroke(), [finishStroke]);

  const lines = useMemo(() => {
    const out: number[] = [];
    for (let y = LINE_SPACING; y < 4000; y += LINE_SPACING) out.push(y);
    return out;
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Ruled lines */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.margin, { backgroundColor: MARGIN_COLOR }]} />
        {lines.map((y) => (
          <View key={y} style={[styles.line, { top: y, backgroundColor: LINE_COLOR }]} />
        ))}
      </View>

      {/* PencilKit canvas on iOS */}
      {Platform.OS === 'ios' && PencilKitView ? (
        <PencilKitView style={StyleSheet.absoluteFill} />
      ) : null}

      {/* Transparent overlay that captures touch events for stroke metrics.
          PencilKit still owns the ink rendering underneath. */}
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderStart={onTouchStart}
        onResponderMove={onTouchMove}
        onResponderRelease={onTouchEnd}
        onResponderTerminate={onTouchEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
    borderRadius: 24,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.7,
  },
  margin: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 56,
    width: 1.5,
    opacity: 0.6,
  },
});
