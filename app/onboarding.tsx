import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS, supabase } from '@/lib/supabase';
import { firstTopicForGrade, topicsForGrade } from '@/lib/curriculum';
import type { Grade } from '@/types';

const GRADES: Grade[] = [4, 5, 6, 7, 8];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [parentEmail, setParentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 && grade !== null && EMAIL_RE.test(parentEmail.trim());

  const handleSubmit = async () => {
    if (!canSubmit || grade === null) return;
    setSubmitting(true);
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const firstTopic = firstTopicForGrade(grade);

    const { data, error: insertError } = await supabase
      .from('students')
      .insert({
        name: name.trim(),
        grade,
        parent_email: parentEmail.trim(),
        current_topic_id: firstTopic.id,
      })
      .select('id')
      .single();

    if (insertError || !data) {
      console.warn('[Jackson] insert student failed', insertError);
      setError("Couldn't save your profile. Check your internet and try again.");
      setSubmitting(false);
      return;
    }

    // Seed progress rows: first topic unlocked, the rest locked.
    const topics = topicsForGrade(grade);
    await supabase.from('progress').insert(
      topics.map((t) => ({
        student_id: data.id,
        topic_id: t.id,
        status: t.prerequisites.length === 0 ? 'unlocked' : 'locked',
        mastery_score: 0,
      })),
    );

    await AsyncStorage.setItem(STORAGE_KEYS.studentId, data.id);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.hello}>Hi! I'm Jackson.</Text>
          <Text style={styles.subtitle}>Your math buddy. Let's set you up.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>What's your name?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="First name"
              placeholderTextColor="#A8BFD4"
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={30}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>What grade are you in?</Text>
            <View style={styles.gradeRow}>
              {GRADES.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => {
                    setGrade(g);
                    void Haptics.selectionAsync();
                  }}
                  style={({ pressed }) => [
                    styles.gradePill,
                    grade === g && styles.gradePillActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.gradePillText,
                      grade === g && styles.gradePillTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Parent's email</Text>
            <Text style={styles.help}>
              We'll send a short report to your parent after each session.
            </Text>
            <TextInput
              style={styles.input}
              value={parentEmail}
              onChangeText={setParentEmail}
              placeholder="parent@example.com"
              placeholderTextColor="#A8BFD4"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={!canSubmit || submitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.cta,
              (!canSubmit || submitting) && styles.ctaDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.ctaText}>{submitting ? 'Saving…' : "Let's go"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F7FF' },
  scroll: { padding: 24, paddingTop: 40, gap: 24 },
  hello: { fontSize: 34, fontWeight: '800', color: '#2C3E50' },
  subtitle: { fontSize: 18, color: '#5A7390', marginTop: -8 },
  field: { gap: 8 },
  label: { fontSize: 16, fontWeight: '700', color: '#2C3E50' },
  help: { fontSize: 13, color: '#88A0B5' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E1ECF9',
  },
  gradeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  gradePill: {
    flex: 1,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1ECF9',
  },
  gradePillActive: { backgroundColor: '#4A90E2', borderColor: '#4A90E2' },
  gradePillText: { fontSize: 22, fontWeight: '700', color: '#4A90E2' },
  gradePillTextActive: { color: '#FFFFFF' },
  cta: {
    marginTop: 12,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { backgroundColor: '#BFD4EB' },
  ctaText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  error: { color: '#E55B5B', fontWeight: '600' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
