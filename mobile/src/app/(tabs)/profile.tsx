/**
 * Profile Screen — Apple / Linear-grade Account, Intelligence & Preferences:
 *
 * 1) Hero Identity: Glassmorphic user banner with status beacon & quick stats
 * 2) Asteroid Pro: High-conversion metallic card with credits gauge & feature pills
 * 3) Bento Settings: Grouped Apple-style tiles with colorful icon badges & right chips
 * 4) Cross-device Cloud sync status
 */
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Bot,
  Check,
  ChevronRight,
  Cloud,
  ExternalLink,
  HelpCircle,
  LogOut,
  Moon,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { ModelPicker } from '@/components/ui/ModelPicker';
import { AIModelsOptions } from '@/services/models';
import { useGuestStore } from '@/stores/useGuestStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSearchStore } from '@/stores/useSearchStore';
import { colors, font, radius, spacing } from '@/theme/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const isGuest = useGuestStore((s) => s.isGuest);
  const clearGuest = useGuestStore((s) => s.clearGuest);
  const model = useSettingsStore((s) => s.model);
  const recents = useSearchStore((s) => s.recents);
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeModel = AIModelsOptions.find((m) => m.id === model);
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const name = user?.fullName ?? email?.split('@')[0] ?? 'Guest Explorer';
  const initial = (name || 'G').charAt(0).toUpperCase();

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Sign out', 'Are you sure you want to sign out of your Asteroid account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          clearGuest();
          await signOut?.();
          router.replace('/');
        },
      },
    ]);
  };

  const handleUpgradeGo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Asteroid Pro Membership',
      'Unlock unlimited Deep Research agent sessions, priority 70B+ model reasoning, and 15,000 monthly queries.',
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Get Asteroid Pro ($1/mo)',
          onPress: () => {
            Linking.openURL('https://asteroid.ai/pricing').catch(() => {});
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header ── */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
          <View style={styles.headerBadge}>
            <View style={styles.headerDot} />
            <Text style={styles.headerBadgeText}>
              {isSignedIn ? 'Cloud Synced' : 'Local Guest'}
            </Text>
          </View>
        </View>

        {/* ── 1. Hero Identity Card ── */}
        <Animated.View entering={FadeInDown.duration(320)} style={styles.heroCardWrapper}>
          <LinearGradient
            colors={['#0F1526', '#090D17', '#06080E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Top Specular Edge */}
            <View style={styles.specularTop} />

            <View style={styles.heroTopRow}>
              {/* Avatar with illuminated gradient aura */}
              <View style={styles.avatarGlow}>
                <LinearGradient
                  colors={['#38BDF8', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarInner}
                >
                  <Text style={styles.avatarText}>{initial}</Text>
                </LinearGradient>
              </View>

              <View style={styles.heroMeta}>
                <View style={styles.nameTierRow}>
                  <Text style={styles.heroName} numberOfLines={1}>
                    {isSignedIn ? name : 'Guest Profile'}
                  </Text>
                  <View style={styles.tierPill}>
                    <Sparkles size={10} color="#38BDF8" />
                    <Text style={styles.tierPillText}>
                      {isSignedIn ? 'PRO' : 'FREE'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.heroEmail} numberOfLines={1}>
                  {isSignedIn && email ? email : 'Searches saved locally'}
                </Text>
              </View>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{recents.length}</Text>
                <Text style={styles.metricLabel}>Searches</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue} numberOfLines={1}>
                  {activeModel?.name?.split(' ')?.[0] || 'Qwen'}
                </Text>
                <Text style={styles.metricLabel}>AI Engine</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>Fast</Text>
                <Text style={styles.metricLabel}>Latency</Text>
              </View>
            </View>

            {/* Auth Action Button */}
            {!isSignedIn ? (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push('/(auth)/welcome');
                }}
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <Text style={styles.ctaButtonText}>Sign in to sync devices</Text>
                <ChevronRight size={16} color="#000000" />
              </Pressable>
            ) : null}
          </LinearGradient>
        </Animated.View>

        {/* ── 2. Asteroid Pro Membership Card ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.sectionWrap}>
          <LinearGradient
            colors={['#171F36', '#0E1424', '#090D17']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proCard}
          >
            <View style={styles.proCardTop}>
              <View style={styles.proTag}>
                <Zap size={13} color="#F59E0B" />
                <Text style={styles.proTagText}>UPGRADE</Text>
              </View>
              <Text style={styles.proPricing}>$1 <Text style={styles.proMonth}>/ month</Text></Text>
            </View>

            <Text style={styles.proTitle}>Asteroid Pro & Research Agent</Text>
            <Text style={styles.proDesc}>
              Includes unlimited Deep Research agent runs, 15,000 monthly queries, and $10 in AI reasoning credits.
            </Text>

            {/* Feature Pills */}
            <View style={styles.featureGrid}>
              <View style={styles.featurePill}>
                <Check size={12} color="#10B981" strokeWidth={2.5} />
                <Text style={styles.featurePillText}>70B+ Instruct Models</Text>
              </View>
              <View style={styles.featurePill}>
                <Check size={12} color="#10B981" strokeWidth={2.5} />
                <Text style={styles.featurePillText}>Multi-Source Web Scraper</Text>
              </View>
              <View style={styles.featurePill}>
                <Check size={12} color="#10B981" strokeWidth={2.5} />
                <Text style={styles.featurePillText}>Cloud Library Sync</Text>
              </View>
            </View>

            <Pressable
              onPress={handleUpgradeGo}
              style={({ pressed }) => [
                styles.proUpgradeBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={['#1D9BF0', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.proUpgradeGradient}
              >
                <Sparkles size={15} color="#FFFFFF" />
                <Text style={styles.proUpgradeText}>Upgrade to Pro</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* ── 3. Bento Settings Groups ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(320)} style={styles.sectionWrap}>
          <Text style={styles.groupHeading}>Intelligence & Preferences</Text>
          <View style={styles.bentoGroup}>
            {/* Model Selector Row */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setPickerOpen(true);
              }}
              style={({ pressed }) => [styles.bentoRow, pressed && styles.bentoRowPressed]}
            >
              <View style={styles.bentoLeft}>
                <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <Bot size={18} color="#C084FC" />
                </View>
                <Text style={styles.bentoTitle}>Default Model</Text>
              </View>
              <View style={styles.bentoRight}>
                <Text style={styles.bentoValueBadge}>
                  {activeModel ? `${activeModel.icon} ${activeModel.name}` : model}
                </Text>
                <ChevronRight size={16} color="#64748B" />
              </View>
            </Pressable>

            <View style={styles.bentoDivider} />

            {/* Appearance Row */}
            <Pressable
              onPress={() => Haptics.selectionAsync().catch(() => {})}
              style={({ pressed }) => [styles.bentoRow, pressed && styles.bentoRowPressed]}
            >
              <View style={styles.bentoLeft}>
                <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Moon size={18} color="#38BDF8" />
                </View>
                <Text style={styles.bentoTitle}>Appearance</Text>
              </View>
              <View style={styles.bentoRight}>
                <Text style={styles.bentoValueBadge}>OLED Black</Text>
                <ChevronRight size={16} color="#64748B" />
              </View>
            </Pressable>

            <View style={styles.bentoDivider} />

            {/* Cloud Sync Row */}
            <Pressable
              onPress={() => Haptics.selectionAsync().catch(() => {})}
              style={({ pressed }) => [styles.bentoRow, pressed && styles.bentoRowPressed]}
            >
              <View style={styles.bentoLeft}>
                <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Cloud size={18} color="#34D399" />
                </View>
                <Text style={styles.bentoTitle}>Cross-Device Library</Text>
              </View>
              <View style={styles.bentoRight}>
                <Text style={styles.bentoValueBadge}>
                  {isSignedIn ? 'Connected' : 'Local Only'}
                </Text>
                <ChevronRight size={16} color="#64748B" />
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── 4. About & Legal Group ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(320)} style={styles.sectionWrap}>
          <Text style={styles.groupHeading}>About & Support</Text>
          <View style={styles.bentoGroup}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                Linking.openURL('mailto:support@asteroid.ai').catch(() => {});
              }}
              style={({ pressed }) => [styles.bentoRow, pressed && styles.bentoRowPressed]}
            >
              <View style={styles.bentoLeft}>
                <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <HelpCircle size={18} color="#FBBF24" />
                </View>
                <Text style={styles.bentoTitle}>Help & Feedback</Text>
              </View>
              <ExternalLink size={15} color="#64748B" />
            </Pressable>

            <View style={styles.bentoDivider} />

            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                Linking.openURL('https://asteroid.ai/privacy').catch(() => {});
              }}
              style={({ pressed }) => [styles.bentoRow, pressed && styles.bentoRowPressed]}
            >
              <View style={styles.bentoLeft}>
                <View style={[styles.bentoIconBadge, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
                  <Shield size={18} color="#CBD5E1" />
                </View>
                <Text style={styles.bentoTitle}>Privacy & Security</Text>
              </View>
              <ExternalLink size={15} color="#64748B" />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── 5. Sign Out Button (Signed-In) ── */}
        {isSignedIn && (
          <Animated.View entering={FadeInDown.delay(220).duration(320)} style={styles.signOutWrap}>
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LogOut size={16} color="#F87171" />
              <Text style={styles.signOutText}>Sign out of Asteroid</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={styles.footerVersion}>
          <Text style={styles.versionText}>Asteroid v1.0.0 • Intelligence Engine 2.0</Text>
        </View>
      </ScrollView>

      <ModelPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: spacing(2.5),
    paddingBottom: spacing(10),
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing(2),
    paddingBottom: spacing(2.5),
  },
  pageTitle: {
    fontFamily: font.title,
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerBadgeText: {
    fontFamily: font.bodySemi,
    fontSize: 11.5,
    color: '#94A3B8',
  },

  /* Hero Card */
  heroCardWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: spacing(3),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroCard: {
    padding: spacing(2.5),
    gap: spacing(2),
  },
  specularTop: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.35)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarGlow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  avatarInner: {
    flex: 1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: font.title,
    fontSize: 22,
    color: '#FFFFFF',
  },
  heroMeta: {
    flex: 1,
    gap: 3,
  },
  nameTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroName: {
    fontFamily: font.bodyBold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  tierPillText: {
    fontFamily: font.mono,
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '700',
  },
  heroEmail: {
    fontFamily: font.body,
    fontSize: 13,
    color: '#94A3B8',
  },

  /* Metrics */
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: '#F8FAFC',
  },
  metricLabel: {
    fontFamily: font.body,
    fontSize: 11,
    color: '#64748B',
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  /* CTA Button */
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    marginTop: 2,
  },
  ctaButtonText: {
    fontFamily: font.bodyBold,
    fontSize: 14,
    color: '#000000',
  },

  /* Asteroid Pro Card */
  sectionWrap: {
    marginBottom: spacing(3),
  },
  proCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing(2.5),
    gap: 12,
  },
  proCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  proTagText: {
    fontFamily: font.mono,
    fontSize: 10.5,
    color: '#F59E0B',
    fontWeight: '700',
  },
  proPricing: {
    fontFamily: font.title,
    fontSize: 20,
    color: '#FFFFFF',
  },
  proMonth: {
    fontFamily: font.body,
    fontSize: 13,
    color: '#94A3B8',
  },
  proTitle: {
    fontFamily: font.bodyBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  proDesc: {
    fontFamily: font.body,
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
  },
  featureGrid: {
    gap: 6,
    marginVertical: 2,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featurePillText: {
    fontFamily: font.bodyMedium,
    fontSize: 12.5,
    color: '#E2E8F0',
  },
  proUpgradeBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  proUpgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  proUpgradeText: {
    fontFamily: font.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  /* Bento Group */
  groupHeading: {
    fontFamily: font.bodySemi,
    fontSize: 13,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing(1.2),
    paddingHorizontal: 4,
  },
  bentoGroup: {
    backgroundColor: '#0F131C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  bentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bentoRowPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  bentoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bentoIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoTitle: {
    fontFamily: font.bodyMedium,
    fontSize: 15,
    color: '#F1F5F9',
  },
  bentoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bentoValueBadge: {
    fontFamily: font.body,
    fontSize: 13,
    color: '#94A3B8',
  },
  bentoDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 62,
  },

  /* Sign Out */
  signOutWrap: {
    marginTop: spacing(1),
    marginBottom: spacing(3),
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  signOutText: {
    fontFamily: font.bodySemi,
    fontSize: 14,
    color: '#F87171',
  },

  /* Footer */
  footerVersion: {
    alignItems: 'center',
    paddingVertical: spacing(2),
  },
  versionText: {
    fontFamily: font.mono,
    fontSize: 11,
    color: '#475569',
  },
});
