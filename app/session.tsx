import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS, supabase } from '@/lib/supabase';
import { findTopic } from '@/lib/curriculum';
import { generateParentReport, saveReportToSession, sendParentEmail } from '@/lib/reports';
import { WritingSurface } from '@/components/WritingSurface';
import { JacksonVoice } from '@/components/JacksonVoice';
import { useSession } from '@/hooks/useSession';
import { useStrokeAnalysis } from '@/hooks/useStrokeAnalysis';
import { useInactivity } from '@/hooks/useInactivity';
import type { JacksonAgentContext } from '@/lib/elevenlabs';
import type { Student, Topic } from '@/types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SessionScreen() {
  const router = useRouter();
  const { topicId } = useLocalSearchParams<{ topicId: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const studentId = await AsyncStorage.getItem(STORAGE_KEYS.studentId);
        if (!studentId) {
          router.replace('/onboarding');
          return;
        }
        const { data: studentRow } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .maybeSingle();

        if (!studentRow) {
          setBootError("Couldn't load your profile.");
          return;
        }
        const t = topicId ? findTopic(topicId) : undefined;
        if (!t) {
          setBootError('That topic could not be found.');
          return;
        }
        setStudent(studentRow as Student);
        setTopic(t);
      } catch (e) {
        console.warn('[Jackson] session boot failed', e);
        setBootError('Something went wrong getting your session ready.');
      }
    })();
  }, [router, topicId]);

  if (bootError) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.error}>{bootError}</Text>
          <Pressable
            onPress={() => router.replace('/home')}
            style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
          >
            <Text style={styles.linkBtnText}>Back home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!student || !topic) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#4A90E2" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return <SessionInner student={student} topic={topic} />;
}

function SessionInner({ student, topic }: { student: Student; topic: Topic }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [promptMode, setPromptMode] =
    useState<JacksonAgentContext['prompt_mode']>('session_start');

  const session = useSession({ studentId: student.id, topicId: topic.id });
  const stroke = useStrokeAnalysis();

  const inactivity = useInactivity({
    enabled: session.isActive,
    onWarning: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      session.recordInactivityWarning();
      // Switching the voice agent into "check in" mode causes Jackson to nudge:
      // "hey [name], you still with me?"
      setPromptMode('inactivity_check');
    },
    onPause: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      session.recordInactivityPause();
    },
  });

  // Push behavior state into the session for time-in-state accounting.
  useEffect(() => {
    session.setBehaviorState(stroke.metrics.state);
  }, [session, stroke.metrics.state]);

  // Drop the opening prompt mode back to "normal" once the session is up.
  const sessionStartedRef = useRef(false);
  useEffect(() => {
    if (session.isActive && !sessionStartedRef.current) {
      sessionStartedRef.current = true;
      const t = setTimeout(() => setPromptMode('normal'), 5_000);
      return () => clearTimeout(t);
    }
  }, [session.isActive]);

  // On-screen timer tick.
  useEffect(() => {
    if (!session.isActive) return;
    const id = setInterval(() => {
      setElapsed(session.computeMetrics().duration_seconds);
    }, 1_000);
    return () => clearInterval(id);
  }, [session]);

  const handleStroke = useCallback(
    (s: Parameters<typeof stroke.pushStroke>[0]) => {
      stroke.pushStroke(s);
      session.recordStroke(s);
      inactivity.bump();
      if (promptMode === 'inactivity_check') setPromptMode('normal');
    },
    [inactivity, promptMode, session, stroke],
  );

  const handleVoiceMessage = useCallback(
    (message: string, role: 'jackson' | 'student') => {
      session.recordVoiceMessage(message, role);
      inactivity.bump();
      if (role === 'student' && promptMode === 'inactivity_check') {
        setPromptMode('normal');
      }
    },
    [inactivity, promptMode, session],
  );

  const endSession = useCallback(async () => {
    if (ending) return;
    setEnding(true);
    setPromptMode('session_end');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { session: savedSession, metrics } = await session.end();

    const report = await generateParentReport({
      student: { name: student.name, grade: student.grade },
      topic: { id: topic.id, title: topic.title, description: topic.description },
      metrics,
    });

    if (savedSession?.id) {
      await saveReportToSession(savedSession.id, report);
    }

    const emailResult = await sendParentEmail({
      to: student.parent_email,
      studentName: student.name,
      topicTitle: topic.title,
      reportMarkdown: report,
    });

    if (!emailResult.ok) {
      console.warn('[Jackson] parent email failed', emailResult.error);
    }

    router.replace('/home');
  }, [
    ending,
    router,
    session,
    student.grade,
    student.name,
    student.parent_email,
    topic.description,
    topic.id,
    topic.title,
  ]);

  const confirmEnd = useCallback(() => {
    Alert.alert('End session?', "Jackson will send a quick recap to your parent.", [
      { text: 'Keep going', style: 'cancel' },
      { text: 'End session', style: 'destructive', onPress: endSession },
    ]);
  }, [endSession]);

  const stateColor = useMemo(() => {
    switch (stroke.metrics.state) {
      case 'confident':
        return '#34C759';
      case 'hesitant':
        return '#FFC93C';
      default:
        return '#A8BFD4';
    }
  }, [stroke.metrics.state]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topicTitle} numberOfLines={1}>
            {topic.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
            <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
            <Text style={styles.stateLabel}>{stroke.metrics.state}</Text>
          </View>
        </View>
        <Pressable
          onPress={confirmEnd}
          disabled={ending}
          style={({ pressed }) => [styles.endBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="End session"
        >
          <Text style={styles.endBtnText}>{ending ? 'Ending…' : 'End'}</Text>
        </Pressable>
      </View>

      <View style={styles.writingWrap}>
        <WritingSurface onStroke={handleStroke} onActivity={inactivity.bump} />
      </View>

      <View style={styles.bottomBar}>
        <JacksonVoice
          student={student}
          topic={topic}
          behaviorState={stroke.metrics.state}
          promptMode={promptMode}
          onMessage={handleVoiceMessage}
        />
      </View>

      {ending ? (
        <View style={styles.overlay} pointerEvents="auto">
          <ActivityIndicator color="#FFFFFF" size="large" />
          <Text style={styles.overlayText}>
            Wrapping up and sending your parent's report…
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F7FF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  error: { color: '#E55B5B', fontSize: 16, textAlign: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
  },
  topicTitle: { fontSize: 20, fontWeight: '800', color: '#2C3E50' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  timer: { fontSize: 14, fontWeight: '700', color: '#5A7390' },
  stateDot: { width: 10, height: 10, borderRadius: 5 },
  stateLabel: { fontSize: 13, color: '#5A7390', textTransform: 'capitalize' },
  endBtn: {
    height: 44,
    minWidth: 84,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#FFE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnText: { color: '#E55B5B', fontWeight: '800', fontSize: 15 },
  writingWrap: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#4A90E2',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bottomBar: { paddingHorizontal: 16, paddingBottom: 16 },
  linkBtn: {
    height: 56,
    paddingHorizontal: 28,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 62, 80, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
