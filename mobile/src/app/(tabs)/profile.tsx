/**
 * Profile — account, default model, sign-out. Guests get a sign-in CTA.
 * Dev builds expose a "copy session token" row for the Bearer-auth spike
 * (spec §5); it renders only when __DEV__.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { ModelPicker } from '@/components/ui/ModelPicker';
import { Button } from '@/components/ui/Button';
import { GlowBackground } from '@/components/ui/GlowBackground';
import { AIModelsOptions } from '@/services/models';
import { useGuestStore } from '@/stores/useGuestStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { colors, font, radius, spacing, type } from '@/theme/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const isGuest = useGuestStore((s) => s.isGuest);
  const clearGuest = useGuestStore((s) => s.clearGuest);
  const model = useSettingsStore((s) => s.model);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tokenNote, setTokenNote] = useState('');

  // Auto-dismiss the dev token confirmation
  useEffect(() => {
    if (!tokenNote) return;
    const t = setTimeout(() => setTokenNote(''), 2000);
    return () => clearTimeout(t);
  }, [tokenNote]);

  const activeModel = AIModelsOptions.find((m) => m.id === model);
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const name = user?.fullName ?? email?.split('@')[0] ?? 'Guest';

  const handleSignOut = async () => {
    clearGuest();
    await signOut?.();
    router.replace('/');
  };

  const copyTokenDev = async () => {
    const token = await getToken();
    setTokenNote(token ? 'Token logged to console (dev only)' : 'No active session token');
    console.log('[Bearer spike] session token:', token);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={type.pageHeading}>Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={type.cardTitle}>{name}</Text>
          <Text style={type.caption}>
            {isSignedIn && email ? email : 'Browsing as guest'}
          </Text>
        </View>
      </View>

      {!isSignedIn && (
        <View style={styles.ctaCard}>
          <Text style={styles.ctaBody}>
            Sign in to sync your search history with the Asteroid web app.
          </Text>
          <Button title="Sign in / Create account" onPress={() => router.push('/(auth)/welcome')} />
        </View>
      )}

      <Pressable style={styles.row} onPress={() => setPickerOpen(true)}>
        <View>
          <Text style={styles.rowTitle}>Default model</Text>
          <Text style={type.caption}>{activeModel ? `${activeModel.icon} ${activeModel.name}` : model}</Text>
        </View>
        <Text style={styles.rowChevron}>›</Text>
      </Pressable>

      {__DEV__ && (
        <Pressable style={styles.row} onPress={copyTokenDev}>
          <View>
            <Text style={styles.rowTitle}>Dev: log session token</Text>
            <Text style={type.caption}>{tokenNote || 'For the Bearer-auth spike (console)'}</Text>
          </View>
        </Pressable>
      )}

      {isSignedIn && (
        <View style={styles.signOutWrap}>
          <Button title="Sign out" variant="ghost" onPress={handleSignOut} />
        </View>
      )}

      <ModelPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} />
      <GlowBackground intensity={0.5} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(3), paddingTop: spacing(3), paddingBottom: spacing(2) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginHorizontal: spacing(3),
    marginBottom: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.display, fontSize: 22, color: colors.text },
  identity: { flex: 1 },
  ctaCard: {
    marginHorizontal: spacing(3),
    marginBottom: spacing(2),
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
    gap: spacing(2),
  },
  ctaBody: { ...type.caption, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing(3),
    marginBottom: spacing(1),
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
  },
  rowTitle: { fontFamily: font.bodySemi, fontSize: 15, color: colors.text, marginBottom: 2 },
  rowChevron: { fontFamily: font.body, fontSize: 22, color: colors.textSecondary },
  signOutWrap: { paddingHorizontal: spacing(3), marginTop: spacing(3) },
});
