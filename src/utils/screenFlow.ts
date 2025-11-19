import type { ScreenId } from '../types';

export const screenOrder: ScreenId[] = ['splash', 'menu', 'game', 'postGame', 'goodbye'];

export const getNextScreen = (current: ScreenId): ScreenId => {
  const index = screenOrder.indexOf(current);
  return screenOrder[(index + 1) % screenOrder.length];
};
