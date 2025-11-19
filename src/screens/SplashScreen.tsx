import { useCallback, useEffect, useRef, useState } from 'react';
import { SavannahBackground } from '../components/SavannahBackground';
import type { ScreenId } from '../types';
import './SplashScreen.css';

interface SplashScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const SplashScreen = ({ onNavigate }: SplashScreenProps) => {
  const [proverb, setProverb] = useState('');
  const [displayedProverb, setDisplayedProverb] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/assets/proverbs.json')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch proverbs');
        return response.json();
      })
      .then((data: { proverb: string }[]) => {
        if (!isMounted || !data?.length) return;
        const randomIndex = Math.floor(Math.random() * data.length);
        setProverb(data[randomIndex].proverb);
      })
      .catch(() => {
        if (isMounted) {
          setProverb('Wisdom is like a baobab tree; no one individual can embrace it.');
        }
      });

    audioRef.current = document.getElementById('mong-sound') as HTMLAudioElement;
    audioRef.current?.play().catch(() => undefined);

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!proverb) {
      setDisplayedProverb('');
      setTypingComplete(false);
      return;
    }

    setDisplayedProverb('');
    setTypingComplete(false);
    let index = 0;
    const typeTimer = window.setInterval(() => {
      index += 1;
      setDisplayedProverb(proverb.slice(0, index));
      if (index >= proverb.length) {
        window.clearInterval(typeTimer);
        setTypingComplete(true);
      }
    }, 70);

    return () => window.clearInterval(typeTimer);
  }, [proverb]);

  const handleStart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onNavigate('menu');
  }, [onNavigate]);

  return (
    <SavannahBackground>
      <div className="splash-overlay">
        <audio id="mong-sound" src="/media/audio/mong.mp3" preload="auto" />
        <div className="splash-card">
          <div className="splash-card__logos">
            <img src="/media/images/afrikanaonelogo.png" alt="Afrika Na One logo" />
            <img src="/media/images/ethiopian.jpg" alt="Ethiopian Airlines" />
            <img src="/media/images/ElebiLogoTransp2024.png" alt="Elebi Labs" />
          </div>
        <h1>
          AFRIKA <span className="splash-card__one">N@ ONE</span>
        </h1>
          {displayedProverb && (
            <p className="splash-card__proverb">
              <span className={`splash-card__proverb-text${typingComplete ? ' is-complete' : ''}`}>“{displayedProverb}”</span>
            </p>
          )}
          {typingComplete && (
            <button className="splash-card__cta splash-card__cta--visible" onClick={handleStart}>
              TAKE OFF
            </button>
          )}
        </div>
      </div>
    </SavannahBackground>
  );
};
