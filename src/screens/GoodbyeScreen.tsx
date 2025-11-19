import { ScreenShell } from '../components/ScreenShell';
import { useTheme } from '../theme/ThemeProvider';
import type { ScreenId } from '../types';
import './screens.css';

interface GoodbyeScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const GoodbyeScreen = ({ onNavigate }: GoodbyeScreenProps) => {
  const { brand } = useTheme();

  return (
    <ScreenShell title="Shukrani for exploring" subtitle={brand.copy.goodbye}>
      <section className="goodbye">
        <p>Thank you for flying Ethiopian. Come back soon.</p>
        <button className="menu-button" onClick={() => onNavigate('menu')}>
          <span className="menu-button__icon" aria-hidden>
            🔁
          </span>
          <span>
            <strong>Return to main menu</strong>
            <p>© 2025 INICIATIVAS ELEBI. ALL RIGHTS RESERVED.</p>
          </span>
        </button>
      </section>
    </ScreenShell>
  );
};
