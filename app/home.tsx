import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS, supabase } from '@/lib/supabase';
import {
  findTopic,
  isTopicUnlocked,
  nextTopicForStudent,
  topicsForGrade,
} from '@/lib/curriculum';
import type { Grade, Progress, Student, Topic } from '@/types';

type ProgressMap = Record<string, Pick<Progress, 'status' | 'mastery_score'>>;

export default function Home() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const studentId = await AsyncStorage.getItem(STORAGE_KEYS.studentId);
    if (!studentId) {
      router.replace('/onboarding');
      return;
    }

    const [{ data: studentRow }, { data: progressRows }] = await Promise.all([
      supabase.from('students').select('*').eq('id', studentId).maybeSingle(),
      supabase
        .from('progress')
        .select('topic_id,status,mastery_score')
        .eq('student_id', studentId),
    ]);

    if (!studentRow) {
      await AsyncStorage.removeItem(STORAGE_KEYS.studentId);
      router.replace('/onboarding');
      return;
    }

    const map: ProgressMap = {};
    (progressRows ?? []).forEach((p: any) => {
      map[p.topic_id] = { status: p.status, mastery_score: p.mastery_score };
    });

    setStudent(studentRow as Student);
    setProgress(map);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const goToSession = useCallback(
    async (topic: Topic) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: '/session', params: { topicId: topic.id } });
    },
    [router],
  );

  if (loading || !student) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#4A90E2" size="large" />
      </View>
    );
  }

  const grade = student.grade as Grade;
  const topics = topicsForGrade(grade);
  const currentTopic =
    (student.current_topic_id && findTopic(student.current_topic_id)) ||
    nextTopicForStudent(grade, progress);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90E2" />
        }
      >
        <Text style={styles.greeting}>Hey {student.name}!</Text>
        <Text style={styles.subgreeting}>Ready for some math?</Text>

        {/* Continue card */}
        <View style={styles.continueCard}>
          <Text style={styles.continueLabel}>Up next</Text>
          <Text style={styles.continueTitle}>{currentTopic.title}</Text>
          <Text style={styles.continueDesc}>{currentTopic.description}</Text>
          <Pressable
            onPress={() => goToSession(currentTopic)}
            style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionHeader}>Grade {grade} Math</Text>

        <View style={{ gap: 12 }}>
          {topics.map((topic) => {
            const p = progress[topic.id];
            const unlocked = p?.status !== 'locked' && isTopicUnlocked(topic, progress);
            const mastered = p?.status === 'mastered';
            const inProgress = p?.status === 'in_progress';
            return (
              <Pressable
                key={topic.id}
                onPress={() => unlocked && goToSession(topic)}
                disabled={!unlocked}
                style={({ pressed }) => [
                  styles.topicCard,
                  !unlocked && styles.topicCardLocked,
                  mastered && styles.topicCardMastered,
                  pressed && unlocked && styles.pressed,
                ]}
              >
                <View style={styles.topicCardLeft}>
                  <View
                    style={[
                      styles.topicDot,
                      mastered && { backgroundColor: '#34C759' },
                      inProgress && { backgroundColor: '#FFC93C' },
                      !unlocked && { backgroundColor: '#D8E4F3' },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.topicTitle, !unlocked && styles.topicTitleLocked]}
                      numberOfLines={1}
                    >
                      {topic.title}
                    </Text>
                    <Text style={styles.topicMeta} numberOfLines={1}>
                      {unlocked
                        ? mastered
                          ? 'Mastered'
                          : inProgress
                            ? `In progress — ${p?.mastery_score ?? 0}%`
                            : 'Tap to start'
                        : 'Locked — finish the topic above first'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.topicChevron}>{unlocked ? '›' : '🔒'}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F7FF' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
  },
  scroll: { padding: 24, gap: 16, paddingBottom: 48 },
  greeting: { fontSize: 34, fontWeight: '800', color: '#2C3E50' },
  subgreeting: { fontSize: 18, color: '#5A7390', marginTop: -8 },
  continueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 6,
    shadowColor: '#4A90E2',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  continueLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A90E2',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  continueTitle: { fontSize: 22, fontWeight: '800', color: '#2C3E50' },
  continueDesc: { fontSize: 14, color: '#5A7390', lineHeight: 20 },
  continueBtn: {
    marginTop: 12,
    backgroundColor: '#4A90E2',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginTop: 12,
  },
  topicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E1ECF9',
    minHeight: 72,
  },
  topicCardLocked: { backgroundColor: '#F4F8FD', opacity: 0.75 },
  topicCardMastered: { borderColor: '#B7E4C7' },
  topicCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  topicDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#4A90E2' },
  topicTitle: { fontSize: 17, fontWeight: '700', color: '#2C3E50' },
  topicTitleLocked: { color: '#88A0B5' },
  topicMeta: { fontSize: 13, color: '#88A0B5', marginTop: 2 },
  topicChevron: { fontSize: 26, color: '#A8BFD4', marginLeft: 8 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
