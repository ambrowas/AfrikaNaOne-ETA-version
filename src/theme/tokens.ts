import type { ExperienceBrand } from '../types';

export type ThemeMode = 'light' | 'dark';

export interface ThemeTokens {
  mode: ThemeMode;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  accent: string;
  accentMuted: string;
  outline: string;
}

export const createTokens = (mode: ThemeMode, brand: ExperienceBrand): ThemeTokens => {
  const palette = brand.palette;

  if (mode === 'dark') {
    return {
      mode,
      background: palette.dark,
      surface: '#1f2729',
      text: '#fef8f0',
      mutedText: '#b5c2c4',
      accent: palette.secondary,
      accentMuted: '#51451a',
      outline: 'rgba(255, 255, 255, 0.08)'
    };
  }

  return {
    mode,
    background: '#BCB88A',
    surface: '#fff6ea',
    text: '#1d1d1f',
    mutedText: '#6d6357',
    accent: palette.primary,
    accentMuted: '#c54f0d',
    outline: 'rgba(0, 0, 0, 0.08)'
  };
};
