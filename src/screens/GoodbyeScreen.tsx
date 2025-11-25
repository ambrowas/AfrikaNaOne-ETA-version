import { useEffect, useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import type { ScreenId } from '../types';
import { SavannahBackground } from '../components/SavannahBackground';
import './screens.css';

interface GoodbyeScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

const phrases = [
  "አመሰግናለሁ",
  'Galatooma',
  'የቐንየለይ',
  'Mahadsanid',
  'Abuk',
  'Ameeseh',
  'Aifoyyo'
];

const colors = ['#ffd046', '#d64545', '#0b3d2c', '#ffffff', '#f4a259', '#8c5e34'];

export const GoodbyeScreen = ({ onNavigate }: GoodbyeScreenProps) => {
  const { brand } = useTheme();
  const [floatingWords, setFloatingWords] = useState<
    Array<{ id: number; text: string; top: number; left: number; color: string }>
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const newWord = {
        id: Date.now(),
        text: phrase,
        top: Math.random() * 70 + 5,
        left: Math.random() * 70 + 5,
        color
      };

      setFloatingWords((prev) => [...prev.slice(-14), newWord]);

      setTimeout(() => {
        setFloatingWords((prev) => prev.filter((w) => w.id !== newWord.id));
      }, 2000);
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return (
    <SavannahBackground>
      <div className="quiz-hero">
        <div className="quiz-panel animate-in post-game-panel">
          <header className="post-game__header goodbye-header" />

          <div className="floating-words-layer">
            {floatingWords.map((word) => (
              <span
                key={word.id}
                className="floating-word"
                style={{
                  top: `${word.top}%`,
                  left: `${word.left}%`,
                  color: word.color
                }}
              >
                {word.text}
              </span>
            ))}
          </div>

          <section className="goodbye">
            <div className="goodbye-logos logos-centered">
              <img className="logo-fix" src="/media/images/afrikanaonelogo.png" alt="Afrika Na One" />
              <img className="logo-fix ethiopian-logo" src="/media/images/ethiopian.jpg" alt="Ethiopian Airlines" />
              <img className="logo-fix" src="/media/images/ElebiLogoTransp2024.png" alt="Elebi Labs" />
            </div>
            <p className="goodbye__thank">
              <span>Thank you for flying Ethiopian.</span>
              <span>Keep the savannah spirit alive.</span>
            </p>

            <button className="menu-button" onClick={() => onNavigate('menu')}>
              <span className="menu-button__icon" aria-hidden>
                🔁
              </span>
              <strong>Return to main menu</strong>
            </button>
            <p className="goodbye-copyright">© 2025 INICIATIVAS ELEBI. ALL RIGHTS RESERVED.</p>
          </section>
        </div>
      </div>
    </SavannahBackground>
  );
};
