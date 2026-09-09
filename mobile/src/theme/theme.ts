/**
 * Asteroid theme — ultra-dark, X/Grok-inspired.
 * True OLED black backgrounds, X-blue accent, premium typography.
 * Single source of truth for every screen — no screen-local colors or radii.
 */
import { Easing } from 'react-native-reanimated';

export const colors = {
  bg: '#000000',
  bgDeep: '#000000',
  surface: '#16181C',
  elevated: '#1D1F23',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.12)',
  divider: 'rgba(255,255,255,0.04)',
  text: '#E7E9EA',
  textSecondary: '#71767B',
  textTertiary: 'rgba(113,118,123,0.6)',
  accent: '#1D9BF0',
  accentBright: '#1D9BF0',
  accentGlow: 'rgba(29,155,240,0.15)',
  surfaceHover: '#1E2024',
  warning: '#F59E0B',
  critical: '#F4212E',
  success: '#00BA7C',
} as const;

export const font = {
  // ── Lora (Titles, Section headings, Important editorial text) ──
  title: 'Lora_700Bold',
  heading: 'Lora_600SemiBold',
  headingMedium: 'Lora_500Medium',
  editorial: 'Lora_400Regular',
  editorialItalic: 'Lora_400Regular_Italic',

  // ── Inter (Body, UI, Sources, Captions, Follow-ups) ──
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',

  // ── JetBrains Mono (Code, Technical values, Structured data) ──
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemi: 'JetBrainsMono_600SemiBold',

  // Backwards-compatible aliases
  display: 'Lora_700Bold',
  displayMedium: 'Lora_500Medium',
  serif: 'Lora_400Regular',
  serifItalic: 'Lora_400Regular_Italic',
  techno: 'JetBrainsMono_600SemiBold',
} as const;

export const type = {
  display: { fontFamily: font.title, fontSize: 38, lineHeight: 46, color: colors.text },
  pageHeading: { fontFamily: font.title, fontSize: 30, lineHeight: 38, color: colors.text },
  sectionHeading: { fontFamily: font.heading, fontSize: 22, lineHeight: 28, color: colors.text },
  cardTitle: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 23, color: colors.text },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 23, color: colors.text },
  caption: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  code: { fontFamily: font.mono, fontSize: 13, lineHeight: 18, color: '#D6DEEB' },
  eyebrow: {
    fontFamily: font.monoMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.5,
    color: colors.accentBright,
  },
};

export const radius = {
  card: 16,
  button: 24,
  input: 24,
  image: 16,
  sheet: 24,
} as const;

/** Syntax-highlight palette for code blocks (dark, Night-Owl inspired). */
export const code = {
  plain: '#D6DEEB',
  keyword: '#C792EA',
  string: '#C3E88D',
  number: '#F78C6C',
  comment: '#5F7A7A',
  func: '#82AAFF',
  type: '#FFCB6B',
  punct: '#8B9CAE',
  surface: '#0D0D0D',
  chip: '#16181C',
} as const;

/** 8-point spacing grid */
export const spacing = (n: number) => n * 8;

export const motion = {
  entrance: 400,
  stagger: 60,
  easing: Easing.out(Easing.cubic),
} as const;
