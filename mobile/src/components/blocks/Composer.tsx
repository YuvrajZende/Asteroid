/**
 * Composer — Authentic X/Twitter & Grok-style floating reply & search bar:
 *
 * 1) Top row:
 *    - User Avatar / Initial circle
 *    - Multiline auto-expanding TextInput ("Ask a follow up..." / "Post your reply")
 *    - Expand / Fullscreen icon
 * 2) Bottom toolbar:
 *    - Image / Attach icon
 *    - Pro / Deep Research agent toggle chip with glowing badge
 *    - Voice / Mic input icon
 *    - Solid Pill action button ("Search" / "Reply")
 */
import React, { useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useUser } from '@clerk/expo';
import {
  ArrowUp,
  Image as ImageIcon,
  Maximize2,
  Mic,
  Sparkles,
} from 'lucide-react-native';
import { colors, font, radius, spacing } from '@/theme/theme';

interface ComposerProps {
  placeholder?: string;
  onSubmit: (text: string, isPro: boolean) => void;
  isProSearch?: boolean;
  onTogglePro?: () => void;
}

export function Composer({
  placeholder = 'Ask a follow up...',
  onSubmit,
  isProSearch = true,
  onTogglePro,
}: ComposerProps) {
  const { user } = useUser();
  const [text, setText] = useState('');
  const [proMode, setProMode] = useState(isProSearch);
  const [isFocused, setIsFocused] = useState(false);

  const userInitial = (user?.fullName || user?.primaryEmailAddress?.emailAddress || 'G')
    .charAt(0)
    .toUpperCase();

  const togglePro = () => {
    Haptics.selectionAsync().catch(() => {});
    setProMode((p) => !p);
    onTogglePro?.();
  };

  const handleSend = () => {
    const q = text.trim();
    if (!q) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setText('');
    Keyboard.dismiss();
    setIsFocused(false);
    onSubmit(q, proMode);
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.card, isFocused && styles.cardFocused]}>
        {/* ── Top Area: Avatar + Multiline Input + Expand ── */}
        <View style={styles.topRow}>
          {/* User Avatar Badge */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>

          {/* Multiline Input Field */}
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#71767B"
            value={text}
            onChangeText={setText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />

          {/* Expand icon */}
          <Pressable
            hitSlop={8}
            onPress={() => Haptics.selectionAsync().catch(() => {})}
            style={styles.expandBtn}
          >
            <Maximize2 size={15} color="#71767B" />
          </Pressable>
        </View>

        {/* ── Bottom Action Toolbar ── */}
        <View style={styles.bottomBar}>
          {/* Left Action Icons */}
          <View style={styles.leftActions}>
            {/* Image / Attachment */}
            <Pressable
              hitSlop={8}
              style={styles.iconBtn}
              onPress={() => Haptics.selectionAsync().catch(() => {})}
            >
              <ImageIcon size={19} color="#71767B" />
            </Pressable>

            {/* Pro / Deep Research Toggle */}
            <Pressable
              style={[styles.proChip, proMode && styles.proChipActive]}
              onPress={togglePro}
            >
              <Sparkles size={13} color={proMode ? '#1D9BF0' : '#71767B'} />
              <Text style={[styles.proText, proMode && styles.proTextActive]}>
                {proMode ? 'Deep Research' : 'Search'}
              </Text>
            </Pressable>

            {/* Mic / Voice */}
            <Pressable
              hitSlop={8}
              style={styles.iconBtn}
              onPress={() => Haptics.selectionAsync().catch(() => {})}
            >
              <Mic size={18} color="#71767B" />
            </Pressable>
          </View>

          {/* Right Action Button (X-style solid Pill) */}
          <Pressable
            onPress={handleSend}
            disabled={!hasText}
            style={[styles.actionBtn, hasText && styles.actionBtnActive]}
          >
            <Text style={[styles.actionBtnText, hasText && styles.actionBtnTextActive]}>
              Ask
            </Text>
            {hasText && <ArrowUp size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 2 }} />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#000000',
    paddingHorizontal: spacing(2),
    paddingTop: 6,
    paddingBottom: spacing(2),
  },
  card: {
    backgroundColor: '#16181C',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: spacing(1.5),
    paddingBottom: spacing(1.5),
    paddingHorizontal: spacing(2),
    gap: 8,
  },
  cardFocused: {
    borderColor: 'rgba(29, 155, 240, 0.35)',
    backgroundColor: '#181A1F',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1D9BF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarText: {
    fontFamily: font.bodyBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  input: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 15,
    color: '#E7E9EA',
    minHeight: 34,
    maxHeight: 110,
    paddingTop: 4,
    paddingBottom: 4,
    textAlignVertical: 'top',
  },
  expandBtn: {
    padding: 4,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  proChipActive: {
    backgroundColor: 'rgba(29, 155, 240, 0.14)',
    borderColor: 'rgba(29, 155, 240, 0.4)',
  },
  proText: {
    fontFamily: font.bodySemi,
    fontSize: 12,
    color: '#71767B',
  },
  proTextActive: {
    color: '#1D9BF0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#272C30',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    minWidth: 64,
  },
  actionBtnActive: {
    backgroundColor: '#1D9BF0',
  },
  actionBtnText: {
    fontFamily: font.bodyBold,
    fontSize: 13.5,
    color: '#71767B',
  },
  actionBtnTextActive: {
    color: '#FFFFFF',
  },
});
