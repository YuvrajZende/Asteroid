/**
 * Welcome — dark hero: logo + wordmark, headline, three entry points
 * (Google / email / guest) per v1 spec §4, with Asteroid copy.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useOAuth } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { Logo } from '@/components/brand/Logo';
import { GoogleG } from '@/components/brand/GoogleG';
import { Button } from '@/components/ui/Button';
import { SocialButton } from '@/components/ui/SocialButton';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { useGuestStore } from '@/stores/useGuestStore';
import { colors, spacing, type } from '@/theme/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleGoogle = async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        router.replace('/(tabs)/search');
      }
      // User dismissed the browser → return silently (v1 spec §7)
    } catch {
      setGoogleError('Google sign-in is unavailable right now. Try email instead.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGuest = () => {
    useGuestStore.getState().setGuest();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.replace('/(tabs)/search');
  };

  return (
    <View style={styles.screen}>
      <GlowBackground />
      <View style={styles.hero}>
        <Logo size={104} />
        <Text style={styles.headline}>Ask anything.{'\n'}Understand everything.</Text>
        <Text style={styles.subline}>
          AI-powered search &amp; research — cited, structured answers in seconds.
        </Text>
      </View>

      <View style={styles.actions}>
        <SocialButton
          label="Continue with Google"
          icon={<GoogleG />}
          onPress={handleGoogle}
          disabled={googleLoading}
        />
        <Button
          title="Continue with email"
          onPress={() => router.push('/(auth)/sign-up')}
        />
        <Button
          title="Continue as guest"
          variant="ghost"
          onPress={handleGuest}
        />
        {!!googleError && <Text style={styles.error}>{googleError}</Text>}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLink} onPress={() => router.push('/(auth)/sign-in')}>
          Sign in
        </Text>
        <Text style={styles.legal}>
          By continuing you agree to our Terms and acknowledge the Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing(3) },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(3) },
  headline: {
    ...type.display,
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
  },
  subline: { ...type.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 300 },
  actions: { gap: spacing(1.5), paddingBottom: spacing(2) },
  error: { ...type.caption, color: colors.critical, textAlign: 'center' },
  footer: { alignItems: 'center', gap: spacing(1), paddingBottom: spacing(4) },
  footerLink: { fontFamily: type.cardTitle.fontFamily, fontSize: 15, color: colors.accentBright },
  legal: { ...type.caption, textAlign: 'center' },
});
