import type { GameDefinition } from './types';

export const games: GameDefinition[] = [
  {
    id: 'savannah-trivia',
    title: 'Savannah Trivia Flight',
    description:
      'Rapid-fire general knowledge questions:\nfrom Casablanca to Cape Town, from Malabo to Djibouti.',
    kind: 'trivia',
    estimatedMinutes: 5,
    difficulty: 'medium',
    icon: '🦁'
  },
  {
    id: 'roots-matcher',
    title: 'Roots Matcher',
    description: 'Pair iconic landmarks, dishes, and beats with their countries.',
    kind: 'matching',
    estimatedMinutes: 7,
    difficulty: 'easy',
    icon: '🌍'
  },
  {
    id: 'rhythm-coast',
    title: 'Rhythm of the Coast',
    description: 'Name the region after listening to indigenous rhythms (offline audio).',
    kind: 'audio',
    estimatedMinutes: 4,
    difficulty: 'hard',
    icon: '🥁'
  }
];

export const getGameById = (id: string) => games.find((game) => game.id === id);
