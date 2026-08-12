import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { classifyTopic } from '../lib/claude';
import { getTopicColor, darken } from '../lib/colors';
import { KNOWN_TOPICS } from '../lib/topics';
import Mascot from './Mascot';

// SPRINT4.md Ticket B: the 6 known topics as quick-access shortcuts. These
// skip classification entirely (Ticket A's job is routing free text, not
// re-deciding topics the student picked directly) and call onTopicChosen
// the same way a successful classification does — both paths converge on
// the same call, per the ticket's "same underlying flow" requirement.

interface EntryScreenProps {
  onTopicChosen: (topic: string) => void;
}

// SPRINT4.md Ticket B: replaces the old fixed 6-button grid as the first
// screen a student sees. Free text goes through Ticket A's classifier;
// the quick buttons bypass it. Decline messaging is handled right here so
// a student who types something off-topic sees a plain-language reason
// and can just try again, not a dead end or a console error.
export default function EntryScreen({ onTopicChosen }: EntryScreenProps) {
  const [input, setInput] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [declineMessage, setDeclineMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // SPRINT_VISUAL_CATCHUP.md Ticket P.3: highlights the input with a
  // colored accent border on focus instead of the plain gray default.
  const [inputFocused, setInputFocused] = useState(false);

  const handleQuickButton = (topic: string) => {
    setDeclineMessage(null);
    setError(null);
    onTopicChosen(topic);
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || classifying) return;

    setClassifying(true);
    setDeclineMessage(null);
    setError(null);
    try {
      const result = await classifyTopic(trimmed);
      if (result.classification === 'decline' || !result.topic) {
        setDeclineMessage(
          "That doesn't look like a math topic I can help with — try something like \"fractions\" or \"telling time\"."
        );
        return;
      }
      setInput('');
      onTopicChosen(result.topic);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setClassifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Mascot color="#2E7DF0" size={56} />
        <Text style={styles.prompt}>What do you want to work on?</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, inputFocused && styles.inputFocused]}
          placeholder="e.g. fractions, telling time, area of a triangle"
          value={input}
          onChangeText={(text) => {
            setInput(text);
            setDeclineMessage(null);
            setError(null);
          }}
          onSubmitEditing={handleSubmit}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          editable={!classifying}
          autoCapitalize="none"
        />
        <Pressable
          style={[
            styles.goButton,
            (classifying || !input.trim()) && styles.goButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={classifying || !input.trim()}
        >
          <Text style={styles.goButtonText}>{classifying ? '...' : 'Go'}</Text>
        </Pressable>
      </View>

      {declineMessage && (
        <View style={styles.messageBanner}>
          <Text style={styles.messageBannerText}>{declineMessage}</Text>
        </View>
      )}
      {error && (
        <View style={styles.messageBanner}>
          <Text style={styles.messageBannerText}>{error}</Text>
        </View>
      )}

      <Text style={styles.quickLabel}>Or pick one:</Text>
      <View style={styles.topicRow}>
        {KNOWN_TOPICS.map((t) => {
          const color = getTopicColor(t);
          return (
            <Pressable
              key={t}
              style={[
                styles.topicButton,
                { backgroundColor: color, borderBottomColor: darken(color, 0.3) },
              ]}
              onPress={() => handleQuickButton(t)}
            >
              <Text style={styles.topicButtonText}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  prompt: {
    flex: 1,
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 26,
    color: '#374151',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
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
  inputFocused: {
    borderColor: '#2E7DF0',
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
  messageBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  messageBannerText: {
    color: '#b91c1c',
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 14,
  },
  quickLabel: {
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topicButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderBottomWidth: 4,
  },
  topicButtonText: {
    color: '#fff',
    fontFamily: 'Baloo2_700Bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
