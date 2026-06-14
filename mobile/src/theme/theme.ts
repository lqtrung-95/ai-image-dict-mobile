// "Modern Sinologist" design system (from Stitch), with light "Digital
// Parchment" and dark "Midnight Ink" palettes. Mode-independent tokens
// (spacing/radius/fonts/typography) live here too; colors are mode-specific
// and consumed through the theme context (see theme-context.tsx).

export interface ThemeColors {
  // Surfaces — tiered "paper" approach
  background: string;
  surface: string; // cards (lifted)
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceHighest: string;
  // Ink (text)
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  // Jade primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  primaryFixed: string;
  primarySoft: string; // pale jade wash for chips
  // Calligraphy red (high-intent accents, errors, radicals)
  secondary: string;
  onSecondary: string;
  error: string;
  errorContainer: string;
  // Card shadow (tinted, soft)
  shadowColor: string;
  jadeShadowColor: string;
}

// Light — "Digital Parchment"
export const lightColors: ThemeColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceContainer: '#edeeef',
  surfaceContainerHigh: '#e7e8e9',
  surfaceHighest: '#e1e3e4',
  onSurface: '#191c1d',
  onSurfaceVariant: '#404943',
  outline: '#707973',
  outlineVariant: '#bfc9c1',
  primary: '#0f5238',
  onPrimary: '#ffffff',
  primaryContainer: '#2d6a4f',
  onPrimaryContainer: '#a8e7c5',
  primaryFixed: '#b1f0ce',
  primarySoft: 'rgba(45,106,79,0.08)',
  secondary: '#ba181b',
  onSecondary: '#ffffff',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  shadowColor: '#000000',
  jadeShadowColor: '#2d6a4f',
};

// Dark — "Midnight Ink"
export const darkColors: ThemeColors = {
  background: '#131313',
  surface: '#1e1f1e',
  surfaceContainer: '#252625',
  surfaceContainerHigh: '#2f312f',
  surfaceHighest: '#353534',
  onSurface: '#e5e2e1',
  onSurfaceVariant: '#bec9c0',
  outline: '#89938b',
  outlineVariant: '#3f4943',
  primary: '#86d7ad',
  onPrimary: '#00391f',
  primaryContainer: '#354c3b',
  onPrimaryContainer: '#a1f4c8',
  primaryFixed: '#a1f4c8',
  primarySoft: 'rgba(134,215,173,0.12)',
  secondary: '#ffb4ab',
  onSecondary: '#690005',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  shadowColor: '#000000',
  jadeShadowColor: '#000000',
};

export const spacing = {
  base: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  containerMargin: 20,
  cardGutter: 16,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

// Font family names as registered with expo-font (see root layout)
export const fonts = {
  hanzi: 'NotoSerif_500Medium',
  hanziBold: 'NotoSerif_700Bold',
  headline: 'PlusJakartaSans_700Bold',
  headlineSemi: 'PlusJakartaSans_600SemiBold',
  body: 'WorkSans_400Regular',
  bodyMedium: 'WorkSans_500Medium',
  label: 'PlusJakartaSans_600SemiBold',
} as const;

// Typography presets (font family + size + spacing)
export const typography = {
  displayHanzi: { fontFamily: fonts.hanzi, fontSize: 48, lineHeight: 58 },
  headlineLg: { fontFamily: fonts.headline, fontSize: 28, lineHeight: 36 },
  headline: { fontFamily: fonts.headline, fontSize: 24, lineHeight: 32 },
  heading: { fontFamily: fonts.headlineSemi, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  pinyin: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.7 },
  label: { fontFamily: fonts.label, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
} as const;

export function makeShadow(c: ThemeColors, level: 'card' | 'jade' = 'card') {
  if (level === 'jade') {
    return {
      shadowColor: c.jadeShadowColor,
      shadowOpacity: 0.18,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    };
  }
  return {
    shadowColor: c.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  };
}
