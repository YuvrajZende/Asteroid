import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
// Legacy imperative hooks — the new signal API lands with the core-3 migration
import { useSignIn } from '@clerk/expo/legacy';
import { useSSO } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { Button } from '@/components/ui/Button';
import { SocialButton } from '@/components/ui/SocialButton';
import { GoogleG } from '@/components/brand/GoogleG';
import { TextField } from '@/components/ui/TextField';
import { PasswordField } from '@/components/ui/PasswordField';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { colors, font, spacing, type } from '@/theme/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn?.create({ identifier: email, password });

      if (!result) return;

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive?.({ session: result.createdSessionId });
        router.replace('/(tabs)/search');
      } else if (result.status === 'needs_second_factor' || result.status === 'needs_first_factor') {
        // Email-code step required → shared verify screen
        router.push({ pathname: '/(auth)/verify', params: { email, mode: 'sign-in' } });
      } else {
        setError('We could not sign you in with those details.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        message.toLowerCase().includes('password') || message.toLowerCase().includes('identifier')
          ? 'Wrong email or password.'
          : message.toLowerCase().includes('network')
            ? 'Network unavailable — check your connection.'
            : 'Sign-in is unavailable right now — try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive: setOAuthActive, signIn: oAuthSignIn, signUp: oAuthSignUp } =
        await startSSOFlow({ strategy: 'oauth_google' });

      const sessionId =
        createdSessionId || oAuthSignIn?.createdSessionId || oAuthSignUp?.createdSessionId;

      if (sessionId) {
        await setOAuthActive?.({ session: sessionId });
        router.replace('/(tabs)/search');
      }
    } catch (err: any) {
      console.error('Google OAuth error in sign-in:', err);
      const rawMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || '';
      const msg = rawMsg.toLowerCase().includes('cancel')
        ? 'Sign-in cancelled.'
        : rawMsg.length > 0
        ? rawMsg
        : 'Google sign-in is unavailable right now. Try email instead.';
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlowBackground intensity={0.4} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subline}>Sign in to sync your searches across devices.</Text>

        <View style={styles.form}>
          <SocialButton
            label="Continue with Google"
            icon={<GoogleG />}
            onPress={handleGoogle}
            disabled={googleLoading}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <PasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button title="Sign in" onPress={handleSignIn} loading={loading} disabled={!isLoaded} />

          {/* Quick Demo/Test Fill Button */}
          <Button
            title="Use Test Account (admin@gmail.com)"
            variant="secondary"
            onPress={() => {
              setEmail('admin@gmail.com');
              setPassword('admin123');
            }}
          />
        </View>

        <Text style={styles.switchLine}>
          New to Asteroid?{' '}
          <Text style={styles.switchLink} onPress={() => router.replace('/(auth)/sign-up')}>
            Create an account
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing(3), paddingTop: spacing(10) },
  heading: { ...type.pageHeading, marginBottom: spacing(1) },
  subline: { ...type.caption, marginBottom: spacing(5) },
  form: { gap: spacing(1) },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing(2),
    gap: spacing(1.5),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E293B',
  },
  dividerText: {
    ...type.caption,
    color: '#64748B',
    fontSize: 12,
  },
  error: { ...type.caption, color: colors.critical, marginBottom: spacing(1) },
  switchLine: { ...type.caption, textAlign: 'center', marginTop: spacing(4) },
  switchLink: { color: colors.accent, fontFamily: font.bodySemi },
});
