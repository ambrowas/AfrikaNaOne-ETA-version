import { MenuButton } from '../components/MenuButton';
import { games } from '../modules/games/registry';
import type { ScreenId } from '../types';
import './screens.css';
import { ThemeToggle } from '../components/ThemeToggle';
import { SavannahBackground } from '../components/SavannahBackground';

interface MainMenuScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectGame: (gameId: string) => void;
}

export const MainMenuScreen = ({ onNavigate, onSelectGame }: MainMenuScreenProps) => (
  <SavannahBackground>
    <div className="menu-hero">
      <div className="splash-card menu-card">
        <div className="menu-card__header">
          <div>
            <p className="menu-card__subtitle">Choose your next in-flight journey.</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="main-menu__grid">
          {games.map((game) => (
            <MenuButton
              key={game.id}
              icon={game.icon}
              title={game.title}
              subtitle={`${game.description} · ${game.estimatedMinutes} min`}
              onClick={() => {
                onSelectGame(game.id);
                onNavigate('game');
              }}
            />
          ))}
        </div>
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
  </SavannahBackground>
);
