import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import Mascot from './Mascot';

// SPRINT3.md Ticket 3.2: native (iOS/Android) fallback sign-up/sign-in
// screen, hand-built on Clerk's useSignIn/useSignUp hooks. Clerk's prebuilt
// <SignIn />/<SignUp /> components (the ticket's decided approach) are
// web-only in @clerk/clerk-expo — see AuthScreen.web.tsx, which Metro picks
// for `expo start --web`, Jackson's primary dev loop. This file only
// matters for the periodic real-device/TestFlight checks.
//
// Supports all three flows the user asked for: email/password, passwordless
// email (Clerk's "email code" strategy — a code typed in-app, not a
// clickable link, since a true clickable magic link needs native deep-link
// redirect config that's disproportionate to the UX goal here), and Google
// social sign-in.
export default function AuthScreen() {
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPendingVerification(false);
    setCode('');
    setError(null);
  };

  const handlePasswordSubmit = async () => {
    if (!signInLoaded || !signUpLoaded) return;
    setBusy(true);
    setError(null);
    try {
      if (isNewAccount) {
        await signUp.create({ emailAddress: email, password });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true);
      } else {
        const result = await signIn.create({ identifier: email, password });
        if (result.status === 'complete') {
          await setActiveSignIn({ session: result.createdSessionId });
        } else {
          setError('Additional verification required.');
        }
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCodeRequest = async () => {
    if (!signInLoaded || !signUpLoaded) return;
    setBusy(true);
    setError(null);
    try {
      if (isNewAccount) {
        await signUp.create({ emailAddress: email });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      } else {
        await signIn.create({ identifier: email, strategy: 'email_code' } as any);
      }
      setPendingVerification(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp || !signIn) return;
    setBusy(true);
    setError(null);
    try {
      if (isNewAccount) {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === 'complete') {
          await setActiveSignUp({ session: result.createdSessionId });
        } else {
          setError('Verification incomplete.');
        }
      } else {
        const result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        } as any);
        if (result.status === 'complete') {
          await setActiveSignIn({ session: result.createdSessionId });
        } else {
          setError('Verification incomplete.');
        }
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: Linking.createURL('/sso-callback'),
      });
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? String(err));
    } finally {
      setBusy(false);
    }
  };

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.mascotWrapper}><Mascot color="#2E7DF0" size={72} /></View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>Enter the code we sent to {email}</Text>
        <TextInput
          style={styles.input}
          placeholder="Verification code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={styles.primaryButton} onPress={handleVerify} disabled={busy}>
          <Text style={styles.primaryButtonText}>{busy ? 'Verifying...' : 'Verify'}</Text>
        </Pressable>
        <Pressable onPress={reset}>
          <Text style={styles.linkText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mascotWrapper}><Mascot color="#2E7DF0" size={72} /></View>
      <Text style={styles.title}>Jackson</Text>
      <Text style={styles.subtitle}>
        {isNewAccount ? 'Create a parent account' : 'Sign in'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {mode === 'password' && (
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={styles.primaryButton}
        onPress={mode === 'password' ? handlePasswordSubmit : handleCodeRequest}
        disabled={busy || !email || (mode === 'password' && !password)}
      >
        <Text style={styles.primaryButtonText}>
          {busy
            ? 'Please wait...'
            : mode === 'password'
              ? isNewAccount
                ? 'Sign up'
                : 'Sign in'
              : 'Send code'}
        </Text>
      </Pressable>

      <Pressable onPress={() => setMode(mode === 'password' ? 'code' : 'password')}>
        <Text style={styles.linkText}>
          {mode === 'password' ? 'Use an email code instead' : 'Use a password instead'}
        </Text>
      </Pressable>

      <Pressable style={styles.googleButton} onPress={handleGoogle} disabled={busy}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </Pressable>

      <Pressable onPress={() => setIsNewAccount(!isNewAccount)}>
        <Text style={styles.linkText}>
          {isNewAccount ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </Text>
      </Pressable>

      {/* Clerk's bot-protection CAPTCHA widget attaches to this element by id. */}
      <View nativeID="clerk-captcha" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fff',
    gap: 12,
  },
  mascotWrapper: {
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 32,
    color: '#2E7DF0',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Baloo2_600SemiBold',
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Baloo2_500Medium',
    fontSize: 16,
  },
  error: {
    color: '#b91c1c',
    fontFamily: 'Baloo2_500Medium',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#2E7DF0',
    borderBottomWidth: 4,
    borderBottomColor: '#1e5fc4',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: 'Baloo2_700Bold',
    fontSize: 16,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  googleButtonText: {
    color: '#374151',
    fontFamily: 'Baloo2_700Bold',
    fontSize: 16,
  },
  linkText: {
    color: '#2E7DF0',
    fontFamily: 'Baloo2_600SemiBold',
    textAlign: 'center',
    fontSize: 14,
  },
});
