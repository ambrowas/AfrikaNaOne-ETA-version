import { useTheme } from '../theme/ThemeProvider';
import './ThemeToggle.css';

export const ThemeToggle = () => {
  const { mode, toggleMode } = useTheme();
  return (
    <button className="theme-toggle" onClick={toggleMode} aria-label="Toggle theme">
      {mode === 'light' ? '🌞' : '🌜'}
      <span>{mode === 'light' ? 'Light' : 'Dark'} mode</span>
    </button>
  );
};
