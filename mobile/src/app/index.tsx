/**
 * Animated splash — the "Asteroid" motif: two moons orbiting the mark on
 * elliptical paths. Routes by the gate once Clerk is loaded: signed-in or
 * guest → tabs, else the auth flow (v1 spec §4).
 *
 * Safety valves: a dev status line reports gate state, and if Clerk never
 * loads (bad key, offline) a "Continue" affordance appears so the app can
 * never deadlock on this screen.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Logo } from '@/components/brand/Logo';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { useGuestStore } from '@/stores/useGuestStore';
import { colors, font, radius, spacing, type } from '@/theme/theme';

const GATE_TIMEOUT_MS = 6000;

export default function Index() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const isGuest = useGuestStore((s) => s.isGuest);
  const [timedOut, setTimedOut] = useState(false);

  const orbit = useSharedValue(0);
  const glow = useSharedValue(0.7);

  useEffect(() => {
    orbit.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
    glow.value = withTiming(1, { duration: 900 });
  }, [orbit, glow]);

  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setTimedOut(true), GATE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return; // hold the splash — no auth flash
    const t = setTimeout(() => {
      router.replace(isSignedIn || isGuest ? '/(tabs)/search' : '/(auth)/welcome');
    }, 900);
    return () => clearTimeout(t);
  }, [isLoaded, isSignedIn, isGuest, router]);

  const orbitA = useAnimatedStyle(() => ({ transform: [{ rotate: `${orbit.value}deg` }] }));
  const orbitB = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbit.value + 160}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={styles.screen}>
      <Animated.View style={glowStyle}>
        <GlowBackground />
      </Animated.View>
      <View style={styles.markWrap}>
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <Animated.View style={[styles.orbitWrap, orbitA]}>
            <View style={styles.moonA} />
          </Animated.View>
          <Animated.View style={[styles.orbitWrap, orbitB]}>
            <View style={styles.moonB} />
          </Animated.View>
        </View>
        <Logo size={120} />
      </View>

      {timedOut && !isLoaded && (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Auth is taking a while to load</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(auth)/welcome')}
            style={({ pressed }) => [styles.fallbackButton, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.fallbackButtonText}>Continue to sign in</Text>
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
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  markWrap: { alignItems: 'center', justifyContent: 'center', width: 260, height: 260 },
  orbitWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  moonA: {
    width: 10,
    height: 10,
    borderRadius: radius.button / 2,
    backgroundColor: colors.accentBright,
    marginTop: 6,
  },
  moonB: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
    marginTop: 22,
  },
  fallback: { alignItems: 'center', gap: spacing(1.5), marginTop: spacing(4) },
  fallbackText: { ...type.caption },
  fallbackButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  fallbackButtonText: { fontFamily: font.bodySemi, fontSize: 14, color: colors.text },
  devStatus: {
    position: 'absolute',
    bottom: spacing(3),
    fontFamily: font.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
