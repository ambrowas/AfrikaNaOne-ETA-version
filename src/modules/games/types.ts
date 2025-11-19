export type GameKind = 'trivia' | 'audio' | 'matching';

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  kind: GameKind;
  estimatedMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
}
