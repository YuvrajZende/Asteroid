/**
 * Verify — 6-box OTP with auto-advance, paste support and a 30s resend
 * cooldown. Handles both the sign-up email-code step and sign-in's
 * email-code factor via the `mode` param (v1 spec §4).
 */
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { colors, spacing, type } from '@/theme/theme';

const RESEND_COOLDOWN_SEC = 30;

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; mode?: string }>();
  const mode = params.mode === 'sign-in' ? 'sign-in' : 'sign-up';
  const email = params.email ?? '';

  const { signUp } = useSignUp();
  const { signIn } = useSignIn();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onVerified = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.replace('/(tabs)/search');
  }, [router]);

  const attempt = async (value: string) => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'sign-up') {
        await signUp?.attemptEmailAddressVerification({ code: value });
      } else {
        await signIn?.attemptFirstFactor({ strategy: 'email_code', code: value });
      }
      onVerified();
    } catch (err) {
      setCode('');
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(
        message.toLowerCase().includes('expired')
          ? 'That code expired — send a new one.'
          : 'That code is incorrect — try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setCode(value);
    if (value.length === 6) attempt(value); // auto-submit on full code
  };

  const resend = async () => {
    setCooldown(RESEND_COOLDOWN_SEC);
    setError(null);
    try {
      if (mode === 'sign-up') {
        await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
      } else if (email) {
        await signIn?.create({ identifier: email, strategy: 'email_code' });
      }
    } catch {
      setError('Could not resend the code — try again in a moment.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlowBackground intensity={0.6} />
      <View style={styles.content}>
        <Text style={type.pageHeading}>Check your email</Text>
        <Text style={styles.subline}>
          {mode === 'sign-up'
            ? `We sent a 6-digit code to ${email}. Enter it to verify your account.`
            : 'Enter the 6-digit code we sent to finish signing in.'}
        </Text>

        <OtpInput value={code} onChangeText={handleChange} />
        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <Button title="Verify" onPress={() => attempt(code)} loading={loading} disabled={code.length < 6} />
          {cooldown > 0 ? (
            <Text style={styles.cooldown}>Resend code in {cooldown}s</Text>
          ) : (
            <Button title="Resend code" variant="ghost" onPress={resend} />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing(3), paddingTop: spacing(8), gap: spacing(3) },
  subline: { ...type.caption, lineHeight: 20 },
  error: { ...type.caption, color: colors.critical },
  actions: { gap: spacing(2), marginTop: spacing(2) },
  cooldown: { ...type.caption, textAlign: 'center' },
});
