import { Pressable, StyleSheet, Text, View } from 'react-native';
import Mascot from './Mascot';
import { getTopicColor, darken } from '../lib/colors';
import { KNOWN_TOPICS } from '../lib/topics';

// SPRINT_VISUAL_CATCHUP.md Ticket P.0: home base shown after sign-in,
// before the entry screen. Six topic cards show real persisted progress
// (Sprint 3's known_topic_tiers, passed in via `tiers`) instead of
// placeholder text, plus a "+ Start something new" card that opens the
// existing free-text entry flow (EntryScreen) unchanged.

interface DashboardProps {
  studentName: string;
  tiers: Record<string, number>;
  onTopicSelect: (topic: string) => void;
  onStartSomethingNew: () => void;
}

// Ticket P.0's own "decide before building" recommendation, followed as
// given: no data yet = "New", tier 1/2/3 = Just started/Great progress/
// Mastered, each with a matching filled-dot count out of 3.
function progressFor(tiers: Record<string, number>, topic: string): { label: string; filledDots: number } {
  const tier = tiers[topic.toLowerCase()];
  if (tier === undefined) return { label: 'New — give it a try!', filledDots: 0 };
  if (tier === 1) return { label: 'Just started', filledDots: 1 };
  if (tier === 2) return { label: 'Great progress', filledDots: 2 };
  return { label: 'Mastered!', filledDots: 3 };
}

function ProgressDots({ filled, color }: { filled: number; color: string }) {
  return (
    <View style={styles.dotRow}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { borderColor: '#fff' },
            i < filled ? { backgroundColor: '#fff' } : { backgroundColor: 'transparent' },
          ]}
        />
      ))}
    </View>
  );
}

export default function Dashboard({ studentName, tiers, onTopicSelect, onStartSomethingNew }: DashboardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Mascot color="#2E7DF0" size={64} />
        <Text style={styles.greeting}>Hi, {studentName}!</Text>
      </View>

      <View style={styles.grid}>
        {KNOWN_TOPICS.map((topic) => {
          const color = getTopicColor(topic);
          const { label, filledDots } = progressFor(tiers, topic);
          return (
            <Pressable
              key={topic}
              style={[
                styles.topicCard,
                { backgroundColor: color, borderBottomColor: darken(color, 0.3) },
              ]}
              onPress={() => onTopicSelect(topic)}
            >
              <Text style={styles.topicCardTitle}>{topic}</Text>
              <ProgressDots filled={filledDots} color={color} />
              <Text style={styles.topicCardLabel}>{label}</Text>
            </Pressable>
          );
        })}

        <Pressable style={styles.newCard} onPress={onStartSomethingNew}>
          <Text style={styles.newCardText}>+ Start something new</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 26,
    color: '#374151',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topicCard: {
    width: 160,
    padding: 16,
    borderRadius: 20,
    borderBottomWidth: 4,
    gap: 8,
  },
  topicCardTitle: {
    fontFamily: 'Baloo2_700Bold',
    fontSize: 18,
    color: '#fff',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  topicCardLabel: {
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  newCard: {
    width: 160,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCardText: {
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
});
