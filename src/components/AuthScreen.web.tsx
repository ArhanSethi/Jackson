import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SignIn, SignUp } from '@clerk/clerk-expo/web';

// SPRINT3.md Ticket 3.2 (decided 2026-08-05): Clerk's prebuilt <SignIn />/
// <SignUp /> components — they read whichever strategies (email/password,
// email code, Google) are turned on in the Clerk Dashboard and render the
// right form/buttons with no per-method flow code on our side.
//
// These prebuilt components only exist for Expo *web* (imported from
// '@clerk/clerk-expo/web', backed by @clerk/clerk-react) — Clerk has no
// prebuilt UI for bare React Native/Expo Go. Metro resolves this
// AuthScreen.web.tsx for web builds and falls back to the plain
// AuthScreen.tsx (hook-based, useSignIn/useSignUp) for native, so this file
// only has to cover the web case.
//
// routing="virtual" keeps Clerk from trying to own the browser URL (there's
// no router in this app); toggling between sign-in and sign-up is done
// ourselves via `mode` instead of Clerk's own footer link.
export default function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jackson</Text>
      {mode === 'sign-in' ? (
        <SignIn routing="virtual" />
      ) : (
        <SignUp routing="virtual" />
      )}
      <Pressable onPress={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>
        <Text style={styles.linkText}>
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: '#fff',
    gap: 16,
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 32,
    color: '#2E7DF0',
    textAlign: 'center',
  },
  linkText: {
    color: '#2E7DF0',
    fontFamily: 'Baloo2_600SemiBold',
    textAlign: 'center',
    fontSize: 14,
  },
});
