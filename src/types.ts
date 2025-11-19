export type ScreenId = 'splash' | 'menu' | 'game' | 'postGame' | 'goodbye';

export interface ExperienceBrand {
  id: string;
  displayName: string;
  code: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    light: string;
  };
  assets: {
    logo: string;
    heroPattern: string;
  };
  copy: {
    tagline: string;
    welcome: string;
    goodbye: string;
  };
}

export interface PlayerProfile {
  name: string;
  avatarSeed: string;
  seatLocation: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  country: string;
}

export interface GameResult {
  correct: number;
  incorrect: number;
  streak: number;
  totalTimeSeconds: number;
}

export interface SessionState {
  activeGameId: string | null;
  screen: ScreenId;
  player: PlayerProfile;
  result?: GameResult;
  leaderboard: LeaderboardEntry[];
  brand: ExperienceBrand;
}
