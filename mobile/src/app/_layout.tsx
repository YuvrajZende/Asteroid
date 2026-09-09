/**
 * Root layout — ClerkProvider with SecureStore token cache, Google font
 * loading during splash hold, gesture handler, and the Bearer-token
 * getter installation for the API client (spec §5).
 */
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import * as WebBrowser from 'expo-web-browser';
import * as SplashScreen from 'expo-splash-screen';

WebBrowser.maybeCompleteAuthSession();
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from '@expo-google-fonts/jetbrains-mono';
import { setTokenGetter } from '@/services/api';
import { colors, font, spacing } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
// Publishable keys start with pk_ and encode the instance domain; anything
// else (secret keys sk_…, placeholders) produces cryptic runtime errors.
const keyLooksValid = /^pk_(test|live)_[A-Za-z0-9_-]+$/.test(publishableKey);

function KeyErrorNotice() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const missing = publishableKey.length === 0;
  const foundPrefix = missing ? '' : `${publishableKey.slice(0, 8)}…`;
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeTitle}>{missing ? 'Missing Clerk key' : 'Wrong Clerk key type'}</Text>
      <Text style={styles.noticeBody}>
        {missing
          ? 'Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env, then restart with `npx expo start -c`.'
          : `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY starts with "${foundPrefix}" — that is not a publishable key. Open the Clerk Dashboard → API Keys and copy the key that starts with "pk_test_" (never the sk_ secret key), then restart with \`npx expo start -c\`.`}
      </Text>
    </View>
  );
}

function InnerLayout() {
  const { getToken } = useAuth();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  // Install the API client's token getter once (spec §5 Bearer attachment)
  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  // Fail-safe splash screen dismissal (ensures black screen NEVER hangs)
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);

    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }

    return () => clearTimeout(safetyTimer);
  }, [fontsLoaded, fontError]);

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
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!keyLooksValid) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <KeyErrorNotice />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
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
