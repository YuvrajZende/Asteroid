import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
// Legacy imperative hooks — the new signal API lands with the core-3 migration
import { useSignUp } from '@clerk/expo/legacy';
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyClerkError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('already')) return 'An account with this email already exists — sign in instead.';
  if (message.includes('password')) return 'Choose a stronger password (8+ characters).';
  if (message.includes('network')) return 'Network unavailable — check your connection.';
  return message.length < 120 ? message : 'Something went wrong — please try again.';
}

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoaded, signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignUp = async () => {
    setFieldError(null);
    if (!EMAIL_RE.test(email)) {
      setFieldError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setFieldError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUp?.create({ emailAddress: email, password });
      await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
      router.push({ pathname: '/(auth)/verify', params: { email, mode: 'sign-up' } });
    } catch (err) {
      setFieldError(friendlyClerkError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setFieldError(null);
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
      console.error('Google OAuth error in sign-up:', err);
      const rawMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || '';
      const msg = rawMsg.toLowerCase().includes('cancel')
        ? 'Sign-up cancelled.'
        : rawMsg.length > 0
        ? rawMsg
        : 'Google sign-up is unavailable right now. Try email instead.';
      setFieldError(msg);
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
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.subline}>Your searches sync with the Asteroid web app.</Text>

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
            placeholder="8+ characters"
          />
          {!!fieldError && <Text style={styles.error}>{fieldError}</Text>}
          <Button
            title="Create account"
            onPress={handleSignUp}
            loading={loading}
            disabled={!isLoaded}
          />
        </View>

        <Text style={styles.switchLine}>
          Already have an account?{' '}
          <Text style={styles.switchLink} onPress={() => router.replace('/(auth)/sign-in')}>
            Sign in
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
