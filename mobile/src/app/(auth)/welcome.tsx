/**
 * Welcome — Clean, premium onboarding screen with the authentic Asteroid icon,
 * prominent brand typography, and tight vertical rhythm right above the action group.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSSO } from '@clerk/expo';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { GoogleG } from '@/components/brand/GoogleG';
import { Button } from '@/components/ui/Button';
import { SocialButton } from '@/components/ui/SocialButton';
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';
import { useGuestStore } from '@/stores/useGuestStore';
import { colors, font, radius, spacing, type } from '@/theme/theme';

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  React.useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export default function WelcomeScreen() {
  useWarmUpBrowser();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [googleError, setGoogleError] = React.useState<string | null>(null);
  const { startSSOFlow } = useSSO();

  const handleGoogle = async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
      });

      const sessionId = createdSessionId || signIn?.createdSessionId || signUp?.createdSessionId;

      if (sessionId) {
        await setActive?.({ session: sessionId });
        router.replace('/(tabs)/search');
      } else if (signIn?.status === 'needs_second_factor' || signUp?.status === 'missing_requirements') {
        router.push('/(auth)/sign-in');
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      const rawMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || '';
      const msg = rawMsg.toLowerCase().includes('cancel')
        ? 'Sign-in cancelled.'
        : rawMsg.length > 0
        ? rawMsg
        : 'Google sign-in is unavailable right now. Try email instead.';
      setGoogleError(msg);
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
      {/* Subtle starfield particles */}
      <StarfieldBackground />

      <View style={styles.container}>
        {/* Main Content Area: Centered and pulled close to the actions */}
        <View style={styles.content}>
          {/* Hero Branding with Large Standalone Asteroid Icon */}
          <View style={styles.brandArea}>
            <Image
              source={require('../../../assets/images/asteroid-logo.png')}
              style={styles.logoImage}
              contentFit="contain"
              transition={200}
              accessibilityLabel="Asteroid logo icon"
            />
            <Text style={styles.brandName}>Asteroid</Text>
            <Text style={styles.tagline}>Search the universe of knowledge</Text>
          </View>

          {/* Actions Group directly under the tagline */}
          <View style={styles.actions}>
            {/* Primary CTA: Solid white button */}
            <Button 
              title="Continue with Email" 
              onPress={() => router.push('/(auth)/sign-up')} 
              style={styles.primaryButton}
            />

            {/* Secondary CTA: Dark elevated button */}
            <SocialButton
              label="Continue with Google"
              icon={<GoogleG />}
              onPress={handleGoogle}
              disabled={googleLoading}
            />

            {/* Browse as guest link */}
            <Pressable
              accessibilityRole="button"
              onPress={handleGuest}
              style={({ pressed }) => [styles.guestRow, { opacity: pressed ? 0.65 : 1 }]}
            >
              <Text style={styles.guestText}>Browse as guest</Text>
              <Text style={styles.guestArrow}>→</Text>
            </Pressable>

            {!!googleError && <Text style={styles.error}>{googleError}</Text>}

            {/* Sign in prompt */}
            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <Pressable hitSlop={10} onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.signinLink}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Legal Footer */}
        <View style={styles.footer}>
          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalHighlight}>Terms</Text> and acknowledge our{' '}
            <Text style={styles.legalHighlight}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing(3),
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: spacing(6),
  },

  /* Hero Branding */
  brandArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(4),
  },
  logoImage: {
    width: 175,
    height: 175,
    marginBottom: spacing(2.5),
  },
  brandName: {
    fontFamily: font.display,
    fontSize: 42,
    lineHeight: 48,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: font.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
    color: '#94A3B8',
    marginTop: spacing(1),
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  /* Actions */
  actions: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 12,
  },
  primaryButton: {
    height: 54,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 2,
  },
  guestText: {
    fontFamily: font.bodySemi,
    fontSize: 14.5,
    color: '#94A3B8',
  },
  guestArrow: {
    fontFamily: font.bodySemi,
    fontSize: 16,
    color: colors.accent,
  },
  error: {
    ...type.caption,
    color: colors.critical,
    textAlign: 'center',
  },
  signinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  signinText: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: '#64748B',
  },
  signinLink: {
    fontFamily: font.bodySemi,
    fontSize: 13.5,
    color: colors.accent,
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing(2),
    paddingBottom: spacing(4),
    paddingTop: spacing(1.5),
  },
  legal: {
    fontFamily: font.body,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 320,
  },
  legalHighlight: {
    color: '#64748B',
  },
});
