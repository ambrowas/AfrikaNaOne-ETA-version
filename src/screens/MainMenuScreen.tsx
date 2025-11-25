import { games } from '../modules/games/registry';
import type { ScreenId } from '../types';
import './screens.css';
import { ThemeToggle } from '../components/ThemeToggle';
import { SavannahBackground } from '../components/SavannahBackground';

interface MainMenuScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectGame: (gameId: string) => void;
}

const upcomingExperiences = [
  {
    id: 'savanah-puzzle',
    title: 'Savannah Puzzle',
    status: 'COMING SOON',
    image: '/media/images/savanah-puzzle.jpg'
  },
  {
    id: 'savanah-matching',
    title: 'Savannah Matching',
    status: 'COMING SOON',
    image: '/media/images/savanah-match-making.jpg'
  }
];

export const MainMenuScreen = ({ onNavigate, onSelectGame }: MainMenuScreenProps) => {
  const heroGame = games.find((game) => game.id === 'savannah-trivia');

  return (
    <SavannahBackground>
      <div className="menu-hero">
        <div className="splash-card menu-card">
          <div className="menu-card__header">
            <div>
              <p className="menu-card__subtitle">Choose your next in-flight journey.</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="main-menu__layout">
            <div className="main-menu__hero">
              <button
                className="menu-button main-menu__hero-button main-menu__hero-landscape"
                onClick={() => {
                  if (heroGame) {
                    onSelectGame(heroGame.id);
                    onNavigate('game');
                  }
                }}
              >
                <div className="main-menu__hero-media">
                  <img src="/media/images/savanah-trivia.jpg" alt="Savannah Trivia hero" />
                </div>
                <div className="main-menu__hero-copy">
                  <strong>{heroGame?.title ?? 'Savannah Trivia Flight'}</strong>
                  <p>{heroGame?.description ?? 'Rapid-fire journey across Africa.'}</p>
                </div>
              </button>
            </div>

            <div className="main-menu__coming-soon-grid">
              {upcomingExperiences.map((experience) => (
                <div className="menu-button main-menu__soon-card" key={experience.id}>
                  <span className="menu-button__icon main-menu__soon-icon" aria-hidden>
                    <img src={experience.image} alt={`${experience.title} thumbnail`} />
                  </span>
                  <span>
                    <strong>{experience.title}</strong>
                    <p>{experience.status}</p>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="main-menu__exit">
            <button className="menu-button" onClick={() => onNavigate('goodbye')}>
              <span className="menu-button__icon" aria-hidden>
                👋
              </span>
              <span>
                <strong>Exit suite</strong>
                <p>Return to IFE home after showcasing the savannah.</p>
              </span>
            </button>
          </div>
        </div>
      </div>
    </SavannahBackground>
  );
};
