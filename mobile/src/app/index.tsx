/**
 * Animated Splash & Loading Screen — Asteroid AI
 * Shows animated glowing brand mark with dynamic loading indicator and progress text.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Logo } from '@/components/brand/Logo';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { useGuestStore } from '@/stores/useGuestStore';
import { colors, font, radius, spacing, type } from '@/theme/theme';

const GATE_TIMEOUT_MS = 2500;

export default function Index() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);
  const [timedOut, setTimedOut] = useState(false);
  const [statusText, setStatusText] = useState('Initializing Asteroid...');

  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.6);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Pulse animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Glow pulse
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.6, { duration: 1200 }),
      ),
      -1,
      true,
    );

    // Progress bar animation
    progressWidth.value = withTiming(100, { duration: 2000, easing: Easing.out(Easing.cubic) });

    const statusTimer = setTimeout(() => {
      setStatusText('Connecting to knowledge engine...');
    }, 1000);

    return () => clearTimeout(statusTimer);
  }, [pulse, glow, progressWidth]);

  // Fallback timer
  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => {
      setTimedOut(true);
      router.replace(isGuest ? '/(tabs)/search' : '/(auth)/welcome');
    }, GATE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isLoaded, isGuest, router]);

  // Smooth route transition
  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(() => {
      router.replace(isSignedIn || isGuest ? '/(tabs)/search' : '/(auth)/welcome');
    }, 800);
    return () => clearTimeout(t);
  }, [isLoaded, isSignedIn, isGuest, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.screen}>
      <Animated.View style={glowStyle}>
        <GlowBackground intensity={0.4} />
      </Animated.View>

      <View style={styles.centerContainer}>
        {/* Animated Brand Logo */}
        <Animated.View style={[styles.markWrap, logoAnimatedStyle]}>
          <Logo size={130} />
        </Animated.View>

        {/* Dynamic Loading Section */}
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} />
          <Text style={styles.statusText}>{statusText}</Text>

          {/* Minimalist Progress Track */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressBarStyle]} />
          </View>
        </View>
      </View>

      {/* Fallback button if auth is delayed */}
      {timedOut && !isLoaded && (
        <View style={styles.fallback}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(auth)/welcome')}
            style={({ pressed }) => [styles.fallbackButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.fallbackButtonText}>Tap to start</Text>
          </Pressable>
        </View>
      )}

      {__DEV__ && (
        <Text style={styles.devStatus}>
          clerk {isLoaded ? '✓' : '…'} · guest {isGuest ? '✓' : '—'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(4),
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  loadingSection: {
    alignItems: 'center',
    gap: spacing(1.5),
    width: 220,
  },
  spinner: {
    marginBottom: 2,
  },
  statusText: {
    fontFamily: font.bodyMedium,
    fontSize: 13.5,
    color: '#8E959E',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: spacing(1),
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 1.5,
  },
  fallback: {
    position: 'absolute',
    bottom: spacing(6),
    alignItems: 'center',
  },
  fallbackButton: {
    backgroundColor: '#16181C',
    borderRadius: 20,
    paddingHorizontal: spacing(3),
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  fallbackButtonText: {
    fontFamily: font.bodySemi,
    fontSize: 13.5,
    color: colors.accent,
  },
  devStatus: {
    position: 'absolute',
    bottom: spacing(2),
    fontFamily: font.mono,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
