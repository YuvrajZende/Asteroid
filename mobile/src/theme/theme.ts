/**
 * Asteroid theme — dark-first, Perplexity-inspired.
 * Single source of truth for every new screen (per docs/superpowers/specs/2026-08-27 spec §2).
 * No screen-local colors or radii — consume tokens only.
 */
import { Easing } from 'react-native-reanimated';

export const colors = {
  bg: '#191A1A',
  surface: '#202222',
  elevated: '#26282B',
  border: 'rgba(255,255,255,0.08)',
  text: '#F2F3F5',
  textSecondary: '#9AA0A6',
  accent: '#20808D',
  accentBright: '#2BB0C7',
  warning: '#F59E0B',
  critical: '#EF4444',
  success: '#22C55E',
} as const;

export const font = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 48, color: colors.text },
  pageHeading: { fontFamily: font.display, fontSize: 32, lineHeight: 38, color: colors.text },
  sectionHeading: { fontFamily: font.display, fontSize: 24, lineHeight: 30, color: colors.text },
  cardTitle: { fontFamily: font.bodySemi, fontSize: 18, lineHeight: 24, color: colors.text },
  body: { fontFamily: font.body, fontSize: 16, lineHeight: 24, color: colors.text },
  caption: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
};

export const radius = {
  card: 20,
  button: 16,
  input: 16,
  image: 22,
  sheet: 32,
} as const;

/** 8-point spacing grid */
export const spacing = (n: number) => n * 8;

export const motion = {
  entrance: 400,
  stagger: 60,
  easing: Easing.out(Easing.cubic),
} as const;
