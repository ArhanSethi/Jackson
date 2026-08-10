import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  useFonts,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  generateQuestion,
  GeneratedQuestion,
  GradingResult,
  verifyBackendAuth,
} from './src/lib/claude';
import { speak } from './src/lib/speech';
import {
  getRecentPerformance,
  recordResult,
  resetTopicHistory,
} from './src/lib/performanceTracker';
import { getTopicColor, lighten } from './src/lib/colors';
import AuthScreen from './src/components/AuthScreen';
import EntryScreen from './src/components/EntryScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    Baloo2_500Medium,
    Baloo2_600SemiBold,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
  });

  const { isLoaded: authLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();

  const [backendUserId, setBackendUserId] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [tiers, setTiers] = useState<Record<string, number>>({});
  const [struggling, setStruggling] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);

  // SPRINT2.md Ticket 4.2: lightweight Animated-API feedback + transitions,
  // no new animation library.
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const questionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (feedback) {
      feedbackAnim.setValue(0);
      Animated.spring(feedbackAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: false,
      }).start();
    }
  }, [feedback]);

  useEffect(() => {
    if (question) {
      questionAnim.setValue(0);
      Animated.timing(questionAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [question]);

  // SPRINT3.md Ticket 3.2: proves the backend identifies the authenticated
  // user on a real request from the app (not just that /api/me exists) by
  // sending the Clerk session token and displaying what comes back.
  useEffect(() => {
    if (!isSignedIn) {
      setBackendUserId(null);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const { userId } = await verifyBackendAuth(token);
        setBackendUserId(userId);
        console.log('[auth] backend identified user as', userId);
      } catch (err) {
        console.error('[auth] backend could not identify user', err);
      }
    })();
  }, [isSignedIn]);

  const getTier = (t: string) => tiers[t.toLowerCase()] ?? 1;
  const isStruggling = (t: string) => struggling[t.toLowerCase()] ?? false;

  const handleTopicSelect = async (selectedTopic: string) => {
    setTopic(selectedTopic);
    setLoading(true);
    setError(null);
    try {
      const result = await generateQuestion(selectedTopic, getTier(selectedTopic));
      setQuestion(result);
      speak(result.spoken ?? result.question);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGraded = async (result: GradingResult) => {
    if (!topic) return;

    setSessionTotal((t) => t + 1);
    if (result.correct) {
      setSessionCorrect((c) => c + 1);
    }

    recordResult(topic, result.correct);
    const perf = getRecentPerformance(topic);

    // SPRINT.md Ticket 2.1: after 2 wrong in a row on this topic, switch to
    // gentler phrasing on the wrong-answer feedback. Correct-answer
    // phrasing is untouched.
    let message: string;
    if (result.correct) {
      message = 'Correct!';
    } else if (perf.incorrectStreak >= 2) {
      message = "That's okay, let's try one more like it.";
    } else {
      message = `Not quite, the answer was ${question?.answer}.`;
    }
    speak(message);
    setFeedback(message);
    setFeedbackCorrect(result.correct);

    // SPRINT.md Ticket 1.3: 3 correct in a row bumps tier up (max 3), 2
    // incorrect in a row drops tier down (min 1). Resetting the topic's
    // history on each adjustment means it takes a fresh streak to trigger
    // the next one, instead of every subsequent answer re-triggering it.
    //
    // Ticket 2.2 overrides this while "struggling": once 2 wrong in a row
    // fires, the topic/tier locks in place (question generation keeps using
    // it unchanged, "same specific operation type" = same topic here, we
    // don't have finer-grained operation subtypes) across every subsequent
    // question, ignoring the normal bump/drop thresholds, until 2 correct
    // land in a row unlocks it again.
    let newTier = getTier(topic);
    let isNowStruggling = isStruggling(topic);
    if (isNowStruggling) {
      if (perf.correctStreak >= 2) {
        isNowStruggling = false;
      }
    } else if (perf.correctStreak >= 3) {
      newTier = Math.min(3, newTier + 1);
      resetTopicHistory(topic);
    } else if (perf.incorrectStreak >= 2) {
      newTier = Math.max(1, newTier - 1);
      resetTopicHistory(topic);
      isNowStruggling = true;
    }
    setTiers((prev) => ({ ...prev, [topic.toLowerCase()]: newTier }));
    setStruggling((prev) => ({ ...prev, [topic.toLowerCase()]: isNowStruggling }));
    console.log('[tier]', topic, newTier);
    console.log('[struggling]', topic, isNowStruggling);

    setLoading(true);
    setError(null);
    try {
      const next = await generateQuestion(topic, newTier);
      setQuestion(next);
      speak(next.spoken ?? next.question);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = () => {
    const summary = `You got ${sessionCorrect} out of ${sessionTotal} correct.`;
    speak(summary);
    setFeedback(summary);
    setFeedbackCorrect(null);
    setTopic(null);
    setQuestion(null);
    // SPRINT.md Ticket 2.4 bug pass: without this, starting a new session
    // after ending one kept accumulating onto the previous session's count
    // instead of starting fresh. Tier/struggling state is intentionally left
    // alone — that adaptive tracking is meant to span the whole app run, not
    // reset every time a session ends (session state only resets on app close).
    setSessionCorrect(0);
    setSessionTotal(0);
  };

  if (!fontsLoaded || !authLoaded) {
    return <View style={styles.container} />;
  }

  if (!isSignedIn) {
    return <AuthScreen />;
  }

  // SPRINT2.md Ticket 4.1: topic color identity carries from the topic
  // button through to the question screen (text color + a light background
  // tint), not just the buttons themselves.
  const activeColor = getTopicColor(topic);

  return (
    <View
      style={[
        styles.container,
        topic ? { backgroundColor: lighten(activeColor, 0.93) } : null,
      ]}
    >
      <View style={styles.accountRow}>
        <Text style={styles.accountEmail}>
          {user?.primaryEmailAddress?.emailAddress ?? ''}
          {backendUserId ? ` · backend: ${backendUserId}` : ''}
        </Text>
        <Pressable style={styles.signOutButton} onPress={() => signOut()}>
          <Text style={styles.signOutButtonText}>Sign out</Text>
        </Pressable>
      </View>
      {!topic && <EntryScreen onTopicChosen={handleTopicSelect} />}
      {loading && <Text style={styles.status}>Generating question...</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {question && (
        <Animated.Text
          style={[
            styles.question,
            { color: activeColor, opacity: questionAnim },
          ]}
        >
          {question.question}
        </Animated.Text>
      )}
      {feedback && (
        <Animated.View
          style={[
            styles.feedbackRow,
            {
              opacity: feedbackAnim,
              transform: [
                {
                  scale: feedbackAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {feedbackCorrect !== null && (
            <Text style={styles.feedbackEmoji}>
              {feedbackCorrect ? '⭐' : '💭'}
            </Text>
          )}
          <Text style={styles.feedback}>{feedback}</Text>
        </Animated.View>
      )}
      {topic && (
        <Pressable style={styles.endSessionButton} onPress={handleEndSession}>
          <Text style={styles.endSessionButtonText}>End session</Text>
        </Pressable>
      )}
      {question && (
        <WithSkiaWeb
          fallback={<View style={styles.canvasFallback} />}
          getComponent={() => import('./DrawingCanvas')}
          componentProps={{
            question,
            onGraded: handleGraded,
            topicColor: activeColor,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  accountEmail: {
    fontFamily: 'Baloo2_500Medium',
    fontSize: 13,
    color: '#6b7280',
  },
  signOutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  signOutButtonText: {
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 13,
    color: '#374151',
  },
  status: {
    paddingHorizontal: 16,
    color: '#666',
    fontFamily: 'Baloo2_500Medium',
  },
  error: {
    paddingHorizontal: 16,
    color: '#b91c1c',
    fontFamily: 'Baloo2_500Medium',
  },
  question: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 30,
    fontFamily: 'Baloo2_800ExtraBold',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  feedbackEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  feedback: {
    fontSize: 18,
    color: '#374151',
    fontFamily: 'Baloo2_600SemiBold',
  },
  endSessionButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#4b5563',
  },
  endSessionButtonText: {
    color: '#fff',
    fontFamily: 'Baloo2_700Bold',
    fontSize: 14,
  },
  canvasFallback: {
    flex: 1,
  },
});
