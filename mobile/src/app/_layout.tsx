/**
 * Root layout — ClerkProvider with SecureStore token cache, Google font
 * loading during splash hold, gesture handler, and the Bearer-token
 * getter installation for the API client (spec §5).
 */
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { setTokenGetter } from '@/services/api';
import { colors, font, spacing } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function MissingKeyNotice() {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>Missing Clerk key</Text>
      <Text style={styles.noticeBody}>
        Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env.local (same Clerk
        application as the web app), then restart with `npx expo start -c`.
      </Text>
    </View>
  );
}

function InnerLayout() {
  const { getToken } = useAuth();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  // Install the API client's token getter once (spec §5 Bearer attachment)
  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}

export default function RootLayout() {
  if (!publishableKey) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <MissingKeyNotice />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <InnerLayout />
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  notice: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(4),
  },
  noticeTitle: { fontFamily: font.display, fontSize: 24, color: colors.text, marginBottom: spacing(2) },
  noticeBody: { fontFamily: font.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
