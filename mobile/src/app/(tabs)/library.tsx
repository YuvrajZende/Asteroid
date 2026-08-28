/**
 * Library — search history. Signed-in: the shared Supabase `Library`
 * table (same rows the web app writes). Guest: on-device recents.
 * Delete is optimistic — the row leaves the UI immediately and is
 * restored on server failure (mirrors the web app's optimistic pattern).
 */
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Library as LibraryIcon, X } from 'lucide-react-native';
import { useUser } from '@clerk/clerk-expo';
import { deleteLibraryEntry, fetchLibrary } from '@/services/supabase';
import { useSearchStore } from '@/stores/useSearchStore';
import { useGuestStore } from '@/stores/useGuestStore';
import { Button } from '@/components/ui/Button';
import { colors, font, radius, spacing, type } from '@/theme/theme';
import type { LibraryRow } from '@/types/api';

type HistoryItem = {
  libId: string;
  query: string;
  type: string;
  when: string;
  source: 'shared' | 'local';
};

function formatDate(iso?: string | number): string {
  const d = new Date(iso ?? Date.now());
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function LibraryScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();
  const isGuest = useGuestStore((s) => s.isGuest);
  const recents = useSearchStore((s) => s.recents);
  const removeRecent = useSearchStore((s) => s.removeRecent);
  const [shared, setShared] = useState<LibraryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const useSharedHistory = Boolean(isLoaded && isSignedIn && email && !isGuest);

  const load = useCallback(async () => {
    if (!useSharedHistory || !email) return;
    setLoading(true);
    const rows = await fetchLibrary(email);
    setShared(rows);
    setLoading(false);
  }, [useSharedHistory, email]);

  useEffect(() => {
    load();
  }, [load]);

  const items: HistoryItem[] = useSharedHistory
    ? shared
        .filter((r) => r.libId && r.searchInput)
        .map((r) => ({
          libId: r.libId!,
          query: r.searchInput!,
          type: r.type ?? 'search',
          when: formatDate(r.created_at),
          source: 'shared' as const,
        }))
    : recents.map((r) => ({
        libId: r.libId,
        query: r.query,
        type: r.type,
        when: formatDate(r.timestamp),
        source: 'local' as const,
      }));

  const open = (item: HistoryItem) => {
    router.push({
      pathname: '/search/[libId]',
      params: { libId: item.libId, query: item.query, type: item.type },
    });
  };

  const remove = async (item: HistoryItem) => {
    // Optimistic removal (web parity)
    if (item.source === 'local') {
      removeRecent(item.libId);
      return;
    }
    setShared((prev) => prev.filter((r) => r.libId !== item.libId));
    try {
      await deleteLibraryEntry(item.libId);
    } catch {
      load(); // restore on failure
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={type.pageHeading}>Library</Text>
        {!isLoaded ? null : (
          <Text style={type.caption}>
            {useSharedHistory ? 'Synced with your web history' : 'Local history — sign in to sync'}
          </Text>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.libId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accentBright} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <LibraryIcon size={40} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No searches yet</Text>
            <Text style={styles.emptyBody}>
              Everything you search appears here — on this device and, once
              signed in, on the web.
            </Text>
            <Button title="Start searching" variant="secondary" onPress={() => router.push('/(tabs)/search')} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]} onPress={() => open(item)}>
            <View style={styles.rowText}>
              <Text style={styles.rowQuery} numberOfLines={2}>
                {item.query}
              </Text>
              <Text style={type.caption}>
                {item.type} · {item.when}
                {item.source === 'local' ? ' · local' : ''}
              </Text>
            </View>
            <Pressable hitSlop={12} onPress={() => remove(item)} accessibilityLabel={`Delete ${item.query}`}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(3), paddingTop: spacing(3), paddingBottom: spacing(2), gap: 4 },
  list: { paddingHorizontal: spacing(3), paddingBottom: spacing(4), gap: spacing(1) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2.5),
    gap: spacing(2),
  },
  rowText: { flex: 1, gap: 4 },
  rowQuery: { fontFamily: font.bodySemi, fontSize: 15, color: colors.text },
  empty: {
    alignItems: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(4),
    paddingTop: spacing(12),
  },
  emptyTitle: { ...type.cardTitle, marginTop: spacing(1) },
  emptyBody: { ...type.caption, textAlign: 'center', lineHeight: 20, marginBottom: spacing(2) },
});
