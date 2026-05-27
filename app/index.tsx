import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, supabase } from '@/lib/supabase';

/**
 * Boot screen: figures out where to send the kid.
 *   - No stored student id -> onboarding.
 *   - Stored id but Supabase row is gone -> onboarding.
 *   - Otherwise -> home.
 */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const storedId = await AsyncStorage.getItem(STORAGE_KEYS.studentId);
      if (!storedId) {
        router.replace('/onboarding');
        return;
      }

      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('id', storedId)
        .maybeSingle();

      if (error || !data) {
        await AsyncStorage.removeItem(STORAGE_KEYS.studentId);
        router.replace('/onboarding');
        return;
      }

      router.replace('/home');
    })();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#4A90E2" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
