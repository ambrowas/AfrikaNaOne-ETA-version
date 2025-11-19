import { ReactNode } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import './ScreenShell.css';

interface ScreenShellProps {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
}

export const ScreenShell = ({ title, subtitle, rightSlot, children }: ScreenShellProps) => {
  const { brand } = useTheme();

  return (
    <div className="screen-shell">
      <div className="screen-shell__container">
        <header className="screen-shell__header">
          <div className="screen-shell__heading">
            {title && <p className="screen-shell__eyebrow">{brand.displayName}</p>}
            {title && <h1>{title}</h1>}
            {subtitle && <p className="screen-shell__subtitle">{subtitle}</p>}
          </div>
          {rightSlot && <div className="screen-shell__right">{rightSlot}</div>}
        </header>
        <div className="screen-shell__body">{children}</div>
      </div>
    </div>
  );
};
