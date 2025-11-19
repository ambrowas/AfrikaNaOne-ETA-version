import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { defaultExperienceBrand } from '../config/brand';
import type { ExperienceBrand } from '../types';
import { createTokens, ThemeMode, ThemeTokens } from './tokens';

interface ThemeContextValue {
  mode: ThemeMode;
  tokens: ThemeTokens;
  brand: ExperienceBrand;
  toggleMode: () => void;
  setBrand: (brand: ExperienceBrand) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [brand, setBrand] = useState<ExperienceBrand>(defaultExperienceBrand);

  const value = useMemo(() => {
    const tokens = createTokens(mode, brand);
    return {
      mode,
      tokens,
      brand,
      toggleMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
      setBrand
    };
  }, [mode, brand]);

  return (
    <ThemeContext.Provider value={value}>
      <ThemeStyles tokens={value.tokens} brand={value.brand}>
        {children}
      </ThemeStyles>
    </ThemeContext.Provider>
  );
};

const ThemeStyles = ({
  tokens,
  brand,
  children
}: {
  tokens: ThemeTokens;
  brand: ExperienceBrand;
  children: ReactNode;
}) => {
  const styles = {
    '--bg': tokens.background,
    '--surface': tokens.surface,
    '--text': tokens.text,
    '--text-muted': tokens.mutedText,
    '--accent': tokens.accent,
    '--accent-muted': tokens.accentMuted,
    '--outline': tokens.outline,
    '--brand-primary': brand.palette.primary,
    '--brand-secondary': brand.palette.secondary
  } as React.CSSProperties;

  return (
    <div style={styles as React.CSSProperties} data-theme={tokens.mode}>
      {children}
    </div>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
