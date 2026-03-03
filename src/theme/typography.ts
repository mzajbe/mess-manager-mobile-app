import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  mono: 'SpaceMono',
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const LineHeight = {
  xs: 16,
  sm: 18,
  md: 22,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 38,
  '4xl': 44,
};

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontSize: FontSize['4xl'],
    lineHeight: LineHeight['4xl'],
    fontWeight: '700',
  },
  h2: {
    fontSize: FontSize['3xl'],
    lineHeight: LineHeight['3xl'],
    fontWeight: '700',
  },
  h3: {
    fontSize: FontSize['2xl'],
    lineHeight: LineHeight['2xl'],
    fontWeight: '600',
  },
  h4: {
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
    fontWeight: '600',
  },
  body: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: '400',
  },
  caption: {
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    fontWeight: '400',
  },
  button: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: '600',
  },
  label: {
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: '500',
  },
  money: {
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
    fontWeight: '700',
    fontFamily: 'SpaceMono',
  },
};
