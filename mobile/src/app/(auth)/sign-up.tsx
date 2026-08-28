/**
 * Sign-up — email + password with inline validation and strength meter.
 * Creates the account, then routes to verify with the email passed along
 * (v1 spec §4).
 */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { PasswordField } from '@/components/ui/PasswordField';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { colors, spacing, type } from '@/theme/theme';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlowBackground intensity={0.6} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.pageHeading}>Create account</Text>
        <Text style={styles.subline}>Your searches sync with the Asteroid web app.</Text>

        <View style={styles.form}>
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
  content: { padding: spacing(3), paddingTop: spacing(8) },
  subline: { ...type.caption, marginTop: spacing(1), marginBottom: spacing(4) },
  form: { gap: spacing(1) },
  error: { ...type.caption, color: colors.critical, marginBottom: spacing(1) },
  switchLine: { ...type.caption, textAlign: 'center', marginTop: spacing(4) },
  switchLink: { color: colors.accentBright, fontFamily: type.cardTitle.fontFamily },
});
