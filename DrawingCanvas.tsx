import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Canvas,
  ImageFormat,
  Path,
  Skia,
  useCanvasRef,
} from '@shopify/react-native-skia';
import {
  gradeAnswer,
  GeneratedQuestion,
  GradingResult,
} from './src/lib/claude';

interface DrawingCanvasProps {
  question: GeneratedQuestion | null;
  onGraded: (result: GradingResult) => void;
  topicColor?: string;
}

export default function DrawingCanvas({
  question,
  onGraded,
  topicColor = '#6b7280',
}: DrawingCanvasProps) {
  const [path, setPath] = useState(Skia.Path.Make());
  const canvasRef = useCanvasRef();
  const [grading, setGrading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);

  // SPRINT2.md Ticket 4.3: a subtle dot-grid drawn once behind the user's
  // path, purely decorative — doesn't touch touch handling or path logic.
  // Covers a generous fixed area rather than measuring the canvas, so it
  // works regardless of actual canvas size; anything outside the visible
  // canvas simply doesn't render.
  const dotGridPath = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    const spacing = 32;
    const size = 1600;
    for (let x = spacing; x < size; x += spacing) {
      for (let y = spacing; y < size; y += spacing) {
        builder.addCircle(x, y, 1.5);
      }
    }
    return builder.detach();
  }, []);

  // SPRINT2.md Ticket 4.2: fade the canvas back in as each new question
  // arrives, so clearing + the next question appearing doesn't feel like a
  // jump cut.
  const canvasAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (question) {
      canvasAnim.setValue(0);
      Animated.timing(canvasAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [question]);

  const handleResponderGrant = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const newPath = path.copy();
    newPath.moveTo(locationX, locationY);
    setPath(newPath);
  };

  const handleResponderMove = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const newPath = path.copy();
    newPath.lineTo(locationX, locationY);
    setPath(newPath);
  };

  const handleSubmit = async () => {
    if (!question) return;
    const image = canvasRef.current?.makeImageSnapshot();
    if (!image) return;

    setGrading(true);
    setGradingError(null);
    try {
      const base64 = image.encodeToBase64(ImageFormat.PNG);
      const result = await gradeAnswer(base64, question.question, question.answer);
      console.log('[grade]', JSON.stringify(result));
      onGraded(result);
      setPath(Skia.Path.Make());
    } catch (err) {
      setGradingError(err instanceof Error ? err.message : String(err));
    } finally {
      setGrading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.canvasWrapper, { opacity: canvasAnim }]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleResponderGrant}
        onResponderMove={handleResponderMove}
      >
        <Canvas ref={canvasRef} style={{ ...styles.canvas, borderColor: topicColor }}>
          <Path path={dotGridPath} color="#00000020" style="fill" />
          <Path
            path={path}
            color="black"
            style="stroke"
            strokeWidth={4}
            strokeJoin="round"
            strokeCap="round"
          />
        </Canvas>
      </Animated.View>
      <Pressable
        style={[
          styles.submitButton,
          (!question || grading) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!question || grading}
      >
        <Text style={styles.submitButtonText}>
          {grading ? 'Grading...' : 'Submit'}
        </Text>
      </Pressable>
      {gradingError && <Text style={styles.error}>{gradingError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvasWrapper: {
    flex: 1,
    margin: 16,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#fffdf7',
    borderRadius: 24,
    borderWidth: 3,
    overflow: 'hidden',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderBottomWidth: 4,
    borderBottomColor: '#0f7a34',
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    borderBottomColor: '#6b7280',
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: 'Baloo2_700Bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  error: {
    padding: 8,
    color: '#b91c1c',
    fontFamily: 'Baloo2_500Medium',
  },
});
