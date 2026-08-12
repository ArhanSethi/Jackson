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
  // SPRINT3.md Ticket 3.3b: opens the student picker (also where "Add
  // sibling" lives) -- per the ticket's own "decide before building"
  // recommendation, a small affordance near the greeting rather than a
  // separate settings screen.
  onSwitchStudent: () => void;
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

function ProgressDots({ filled }: { filled: number }) {
  return (
    <View style={styles.dotRow}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < filled ? styles.dotFilled : styles.dotUnfilled,
          ]}
        />
      ))}
    </View>
  );
}

export default function Dashboard({
  studentName,
  tiers,
  onTopicSelect,
  onStartSomethingNew,
  onSwitchStudent,
}: DashboardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Design reference: Dashboard's mascot uses a neutral amber, not a
            topic color -- unlike topic-specific screens where the mascot
            matches the active topic's color. */}
        <Mascot color="#FBBF24" size={72} />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hi, {studentName}!</Text>
          <Text style={styles.subtitle}>What do you want to work on today?</Text>
        </View>
        <Pressable style={styles.switchStudentButton} onPress={onSwitchStudent}>
          <Text style={styles.switchStudentButtonText}>Switch student</Text>
        </Pressable>
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
              <ProgressDots filled={filledDots} />
              <Text style={styles.topicCardLabel}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.newCard} onPress={onStartSomethingNew}>
        <Text style={styles.newCardText}>+ Start something new</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 30,
    color: '#374151',
  },
  subtitle: {
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 2,
  },
  switchStudentButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
  },
  switchStudentButtonText: {
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 13,
    color: '#374151',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 22,
  },
  topicCard: {
    width: '31%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderBottomWidth: 4,
    gap: 8,
  },
  topicCardTitle: {
    fontFamily: 'Baloo2_700Bold',
    fontSize: 19,
    color: '#fff',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  dotFilled: {
    backgroundColor: '#fff',
  },
  dotUnfilled: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  topicCardLabel: {
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  newCard: {
    flex: 1,
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#fffdf7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCardText: {
    fontFamily: 'Baloo2_700Bold',
    fontSize: 19,
    color: '#374151',
    textAlign: 'center',
  },
});
