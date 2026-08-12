import { Pressable, StyleSheet, Text, View } from 'react-native';
import Mascot from './Mascot';
import { getAvatarColor, darken } from '../lib/colors';
import { StudentProfile } from '../lib/students';

// SPRINT3.md Ticket 3.3b: shown before Dashboard whenever a parent has
// more than one student profile (2+ always shows this; exactly 1 skips
// straight to Dashboard, per the ticket's literal Done-when), and
// reachable any time afterward via Dashboard's "Switch student"
// affordance. "+ Add sibling" reuses StudentNameEntry via onAddSibling.

interface StudentPickerProps {
  students: StudentProfile[];
  onSelect: (student: StudentProfile) => void;
  onAddSibling: () => void;
  onCancel?: () => void;
}

export default function StudentPicker({ students, onSelect, onAddSibling, onCancel }: StudentPickerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Matches the blue used on every other "flow" screen (auth,
            entry, name-entry) -- Dashboard/close-out's amber is a
            deliberate distinct "hub" identity, not the default. */}
        <Mascot color="#2E7DF0" size={64} />
        <Text style={styles.heading}>Who's practicing today?</Text>
      </View>

      <View style={styles.grid}>
        {students.map((student) => {
          const color = getAvatarColor(student.id);
          return (
            <Pressable key={student.id} style={styles.tile} onPress={() => onSelect(student)}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: color, borderBottomColor: darken(color, 0.3) },
                ]}
              >
                <Text style={styles.avatarText}>{student.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.tileName}>{student.name}</Text>
            </Pressable>
          );
        })}
        <Pressable style={styles.addTile} onPress={onAddSibling}>
          <View style={styles.addAvatar}>
            <Text style={styles.addAvatarText}>+</Text>
          </View>
          <Text style={styles.tileName}>Add sibling</Text>
        </Pressable>
      </View>

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
    gap: 24,
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heading: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 26,
    color: '#374151',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 520,
  },
  tile: {
    alignItems: 'center',
    gap: 8,
    width: 120,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderBottomWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 32,
    color: '#fff',
  },
  tileName: {
    fontFamily: 'Baloo2_700Bold',
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  addTile: {
    alignItems: 'center',
    gap: 8,
    width: 120,
  },
  addAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#fffdf7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAvatarText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 32,
    color: '#9ca3af',
  },
  cancelText: {
    color: '#6b7280',
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 14,
  },
});
