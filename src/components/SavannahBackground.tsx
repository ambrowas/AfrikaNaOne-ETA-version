import { CSSProperties, ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import './SavannahBackground.css';

export const SavannahBackground = ({ children }: { children: ReactNode }) => {
  const { brand } = useTheme();
  return (
    <div
      className="savannah-background"
      style={{ ['--hero-pattern' as string]: `url(${brand.assets.heroPattern})` } as CSSProperties}
    >
      <div className="savannah-background__gradient" />
      <div className="savannah-background__content">{children}</div>
    </div>
  );
};
