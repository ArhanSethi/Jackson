import { View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// MASCOT_SPEC.md: a single reusable mascot component, no external image
// assets, no illustration library. Built with @shopify/react-native-skia
// (already a dependency, already used by DrawingCanvas.tsx) rather than
// adding react-native-svg — react-native-svg has its own native module and
// would need an Expo Go rebuild (CLAUDE.md's native-dependency rule), while
// Skia already provides the same vector shape primitives this needs.
//
// The actual shape lives in MascotSkia.tsx, referenced ONLY via the
// dynamic `import('./MascotSkia')` below — never a static top-level
// import. A static import alongside this dynamic one would make Metro
// evaluate @shopify/react-native-skia's web module eagerly (Metro doesn't
// truly code-split a single bundle), permanently binding its CanvasKit-
// backed singleton to `undefined` before WithSkiaWeb's LoadSkiaWeb() ever
// runs — which is exactly what broke this component's first draft (traced
// via a full stack trace to `TypeError: Cannot read properties of
// undefined (reading 'PictureRecorder')` inside Skia's StaticContainer).
// This is the same reason App.tsx never statically imports DrawingCanvas.tsx
// either. WithSkiaWeb also works fine as-is on native (it just skips the
// CanvasKit wait and calls getComponent() directly), so no platform branch
// is needed here.
interface MascotProps {
  color: string;
  size?: number;
}

export default function Mascot({ color, size = 80 }: MascotProps) {
  return (
    <WithSkiaWeb
      fallback={<View style={{ width: size, height: size }} />}
      getComponent={() => import('./MascotSkia')}
      componentProps={{ color, size }}
    />
  );
}
