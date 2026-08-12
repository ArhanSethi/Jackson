import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SignIn, SignUp } from '@clerk/clerk-expo/web';
import Mascot from './Mascot';

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
//
// SPRINT_VISUAL_CATCHUP.md Ticket P.1: `appearance` re-themes Clerk's
// prebuilt UI to match the app's established look (Baloo 2, the app's
// blue, rounded chunky buttons with a bottom-border "depth" shadow, plain
// white background) instead of Clerk's own default styling. Values below
// mirror AuthScreen.tsx's (the native fallback's) hand-built styles
// exactly, so both platforms read as the same design. Clerk's own footer
// ("Don't have an account? Sign up") is hidden -- it targets Clerk-owned
// routing that isn't wired up here, and would just duplicate the working
// toggle link already rendered below the form.
const clerkAppearance = {
  variables: {
    colorPrimary: '#2E7DF0',
    colorBackground: '#fff',
    colorText: '#374151',
    colorInputBackground: '#fff',
    colorInputText: '#374151',
    fontFamily: 'Baloo2_500Medium',
    fontFamilyButtons: 'Baloo2_700Bold',
    borderRadius: '12px',
  },
  elements: {
    rootBox: { width: '100%' },
    card: {
      boxShadow: 'none',
      border: 'none',
      backgroundColor: 'transparent',
      padding: 0,
      width: '100%',
    },
    headerTitle: {
      fontFamily: 'Baloo2_700Bold',
      color: '#374151',
    },
    headerSubtitle: {
      fontFamily: 'Baloo2_500Medium',
      color: '#6b7280',
    },
    socialButtonsBlockButton: {
      borderRadius: '16px',
      borderWidth: '1px',
      borderColor: '#d1d5db',
      backgroundColor: '#fff',
    },
    socialButtonsBlockButtonText: {
      fontFamily: 'Baloo2_700Bold',
      color: '#374151',
    },
    dividerLine: { backgroundColor: '#e5e7eb' },
    dividerText: { fontFamily: 'Baloo2_500Medium', color: '#9ca3af' },
    formFieldLabel: { fontFamily: 'Baloo2_600SemiBold', color: '#374151' },
    formFieldInput: {
      borderRadius: '12px',
      borderWidth: '1px',
      borderColor: '#d1d5db',
      fontFamily: 'Baloo2_500Medium',
    },
    formButtonPrimary: {
      backgroundColor: '#2E7DF0',
      borderRadius: '16px',
      boxShadow: 'none',
      border: 'none',
      borderBottom: '4px solid #1e5fc4',
      fontFamily: 'Baloo2_700Bold',
      textTransform: 'none',
    },
    footer: { display: 'none' },
  },
};

export default function AuthScreen() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <View style={styles.container}>
      <Mascot color="#2E7DF0" size={72} />
      <Text style={styles.title}>Jackson</Text>
      <View style={styles.formWrapper}>
        {mode === 'sign-in' ? (
          <SignIn routing="virtual" appearance={clerkAppearance} />
        ) : (
          <SignUp routing="virtual" appearance={clerkAppearance} />
        )}
      </View>
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
  formWrapper: {
    width: '100%',
    maxWidth: 420,
  },
  linkText: {
    color: '#2E7DF0',
    fontFamily: 'Baloo2_600SemiBold',
    textAlign: 'center',
    fontSize: 14,
  },
});
