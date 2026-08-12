import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Mascot from './Mascot';

// SPRINT3.md Ticket 3.3b: shared between the mandatory first-profile
// screen (zero students yet) and "Add sibling" (reachable from the
// student picker) -- same screen/flow, per the ticket's explicit "reuses
// the same name-entry screen/flow" instruction. `isFirstProfile` only
// changes the heading copy, not the behavior.

interface StudentNameEntryProps {
  isFirstProfile: boolean;
  onSubmit: (name: string) => void;
  onCancel?: () => void;
  submitting: boolean;
  error: string | null;
}

export default function StudentNameEntry({
  isFirstProfile,
  onSubmit,
  onCancel,
  submitting,
  error,
}: StudentNameEntryProps) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    onSubmit(trimmed);
  };

  return (
    <View style={styles.container}>
      <Mascot color="#2E7DF0" size={72} />
      <Text style={styles.prompt}>
        {isFirstProfile ? "What's your student's name?" : 'Add a sibling'}
      </Text>
      {!isFirstProfile && (
        <Text style={styles.subtitle}>What's their name?</Text>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Student's name"
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleSubmit}
          editable={!submitting}
          autoCapitalize="words"
        />
        <Pressable
          style={[styles.goButton, (submitting || !name.trim()) && styles.goButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !name.trim()}
        >
          <Text style={styles.goButtonText}>{submitting ? '...' : 'Go'}</Text>
        </Pressable>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {onCancel && (
        <Pressable onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  prompt: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 26,
    color: '#374151',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 16,
    color: '#9ca3af',
    marginTop: -12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 420,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Baloo2_500Medium',
    fontSize: 16,
  },
  goButton: {
    backgroundColor: '#2E7DF0',
    borderBottomWidth: 4,
    borderBottomColor: '#1e5fc4',
    borderRadius: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  goButtonDisabled: {
    backgroundColor: '#9ca3af',
    borderBottomColor: '#6b7280',
  },
  goButtonText: {
    color: '#fff',
    fontFamily: 'Baloo2_700Bold',
    fontSize: 16,
  },
  errorBanner: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorBannerText: {
    color: '#b91c1c',
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 14,
  },
  cancelText: {
    color: '#6b7280',
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 14,
  },
});
