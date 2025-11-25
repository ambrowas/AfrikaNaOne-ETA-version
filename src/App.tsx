import { useCallback, useMemo, useState } from 'react';
import { SplashScreen } from './screens/SplashScreen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { GameScreen } from './screens/GameScreen';
import { PostGameScreen } from './screens/PostGameScreen';
import { GoodbyeScreen } from './screens/GoodbyeScreen';
import type { GameResult, LeaderboardEntry, ScreenId, SessionState } from './types';
import { defaultExperienceBrand } from './config/brand';
import { LEADERBOARD_LIMIT } from './constants/leaderboard';
import './screens/screens.css';

const baseLeaderboard: LeaderboardEntry[] = [
  { id: '1', name: 'Amina', score: 960, country: 'Kenya' },
  { id: '2', name: 'Kwame', score: 910, country: 'Ghana' },
  { id: '3', name: 'Zuri', score: 840, country: 'Tanzania' }
];

const initialState: SessionState = {
  screen: 'splash',
  activeGameId: null,
  player: {
    name: 'Explorer',
    avatarSeed: 'savannah',
    seatLocation: '12A'
  },
  leaderboard: baseLeaderboard,
  brand: defaultExperienceBrand
};

function App() {
  const [session, setSession] = useState<SessionState>(initialState);

  const handleNavigate = useCallback((screen: ScreenId) => {
    setSession((prev) => ({ ...prev, screen }));
  }, []);

  const handleSelectGame = useCallback((gameId: string) => {
    setSession((prev) => ({ ...prev, activeGameId: gameId }));
  }, []);

  const handleGameCompleted = useCallback((result: GameResult) => {
    setSession((prev) => ({
      ...prev,
      result,
      screen: 'postGame'
    }));
  }, []);

  const handleSaveLeaderboardEntry = useCallback((entry: LeaderboardEntry) => {
    setSession((prev) => ({
      ...prev,
      leaderboard: updateLeaderboard(prev.leaderboard, entry)
    }));
  }, []);

  const screenComponent = useMemo(() => {
    switch (session.screen) {
      case 'splash':
        return <SplashScreen onNavigate={handleNavigate} />;
      case 'menu':
        return <MainMenuScreen onNavigate={handleNavigate} onSelectGame={handleSelectGame} />;
      case 'game':
        return session.activeGameId ? (
          <GameScreen gameId={session.activeGameId} onCompleted={handleGameCompleted} onNavigate={handleNavigate} />
        ) : (
          <MainMenuScreen onNavigate={handleNavigate} onSelectGame={handleSelectGame} />
        );
      case 'postGame':
        return (
          <PostGameScreen
            result={session.result}
            leaderboard={session.leaderboard}
            onNavigate={handleNavigate}
            onSaveLeaderboardEntry={handleSaveLeaderboardEntry}
          />
        );
      case 'goodbye':
        return <GoodbyeScreen onNavigate={handleNavigate} />;
      default:
        return null;
    }
  }, [session, handleNavigate, handleSelectGame, handleGameCompleted]);

  return (
    <div className="app-shell">
      <div key={session.screen} className="screen-transition">
        {screenComponent}
      </div>
    </div>
  );
}

const updateLeaderboard = (entries: LeaderboardEntry[], newcomer: LeaderboardEntry) => {
  const next = [...entries]
    .concat(newcomer)
    .sort((a, b) => b.score - a.score)
    .slice(0, LEADERBOARD_LIMIT);
  return next;
};

export default App;
