import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Line, Path, RoundedRect } from '@shopify/react-native-skia';

// MASCOT_SPEC.md: a single reusable mascot component, no external image
// assets, no illustration library. Built with @shopify/react-native-skia
// (already a dependency, already used by DrawingCanvas.tsx) rather than
// adding react-native-svg — react-native-svg has its own native module and
// would need an Expo Go rebuild (CLAUDE.md's native-dependency rule), while
// Skia already provides the same vector shape primitives (rounded rects,
// circles, paths) this needs, so no new dependency is required. Coordinates
// below are a 0-100 space, matching the spec's "viewBox 0 0 100 100",
// scaled to `size` via s() so stroke widths scale proportionally too.

const STROKE_COLOR = '#1E293B';
const CHEEK_COLOR = '#FFB6C1';

interface MascotProps {
  color: string;
  size?: number;
}

export default function Mascot({ color, size = 80 }: MascotProps) {
  const s = (v: number) => (v / 100) * size;

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Antenna */}
        <Line
          p1={{ x: s(50), y: s(8) }}
          p2={{ x: s(50), y: s(0) }}
          color={STROKE_COLOR}
          strokeWidth={s(3)}
        />
        <Circle cx={s(50)} cy={s(0)} r={s(4)} color={color} />

        {/* Head */}
        <RoundedRect x={s(20)} y={s(8)} width={s(60)} height={s(50)} r={s(16)} color="#FFFFFF" style="fill" />
        <RoundedRect
          x={s(20)}
          y={s(8)}
          width={s(60)}
          height={s(50)}
          r={s(16)}
          color={STROKE_COLOR}
          style="stroke"
          strokeWidth={s(3)}
        />

        {/* Eyes */}
        <Circle cx={s(38)} cy={s(33)} r={s(3.5)} color={STROKE_COLOR} />
        <Circle cx={s(62)} cy={s(33)} r={s(3.5)} color={STROKE_COLOR} />

        {/* Cheeks */}
        <Circle cx={s(30)} cy={s(40)} r={s(4)} color={CHEEK_COLOR} />
        <Circle cx={s(70)} cy={s(40)} r={s(4)} color={CHEEK_COLOR} />

        {/* Mouth */}
        <Path
          path={`M${s(40)},${s(44)} Q${s(50)},${s(51)} ${s(60)},${s(44)}`}
          color={STROKE_COLOR}
          style="stroke"
          strokeWidth={s(3)}
          strokeCap="round"
        />

        {/* Arms */}
        <RoundedRect x={s(6)} y={s(64)} width={s(16)} height={s(10)} r={s(5)} color="#FFFFFF" style="fill" />
        <RoundedRect
          x={s(6)}
          y={s(64)}
          width={s(16)}
          height={s(10)}
          r={s(5)}
          color={STROKE_COLOR}
          style="stroke"
          strokeWidth={s(2.5)}
        />
        <RoundedRect x={s(78)} y={s(64)} width={s(16)} height={s(10)} r={s(5)} color="#FFFFFF" style="fill" />
        <RoundedRect
          x={s(78)}
          y={s(64)}
          width={s(16)}
          height={s(10)}
          r={s(5)}
          color={STROKE_COLOR}
          style="stroke"
          strokeWidth={s(2.5)}
        />

        {/* Body */}
        <RoundedRect x={s(28)} y={s(62)} width={s(44)} height={s(32)} r={s(14)} color="#FFFFFF" style="fill" />
        <RoundedRect
          x={s(28)}
          y={s(62)}
          width={s(44)}
          height={s(32)}
          r={s(14)}
          color={STROKE_COLOR}
          style="stroke"
          strokeWidth={s(3)}
        />
        <Circle cx={s(50)} cy={s(78)} r={s(7)} color={color} />
      </Canvas>
    </View>
  );
}
