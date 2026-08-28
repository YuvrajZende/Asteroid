/**
 * Sign-in — email + password. Wrong credentials surface inline; accounts
 * that require an email-code step route to the shared verify screen
 * (v1 spec §4).
 */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
// Legacy imperative hooks — the new signal API lands with the core-3 migration
import { useSignIn } from '@clerk/expo/legacy';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { PasswordField } from '@/components/ui/PasswordField';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { colors, spacing, type } from '@/theme/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <GlowBackground intensity={0.6} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.pageHeading}>Welcome back</Text>
        <Text style={styles.subline}>Sign in to sync your searches across devices.</Text>

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
            placeholder="Your password"
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button title="Sign in" onPress={handleSignIn} loading={loading} disabled={!isLoaded} />
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
  content: { padding: spacing(3), paddingTop: spacing(8) },
  subline: { ...type.caption, marginTop: spacing(1), marginBottom: spacing(4) },
  form: { gap: spacing(1) },
  error: { ...type.caption, color: colors.critical, marginBottom: spacing(1) },
  switchLine: { ...type.caption, textAlign: 'center', marginTop: spacing(4) },
  switchLink: { color: colors.accentBright, fontFamily: type.cardTitle.fontFamily },
});
