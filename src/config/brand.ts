import type { ExperienceBrand } from '../types';

export const experienceBrand: ExperienceBrand = {
  id: 'ethiopian-airlines',
  code: 'ET',
  displayName: 'Ethiopian Airlines',
  palette: {
    primary: '#f26c22',
    secondary: '#ffd046',
    accent: '#3c6e71',
    dark: '#1c1c1c',
    light: '#fef8f0'
  },
  assets: {
    logo: '/media/images/ethiopian.jpg',
    heroPattern: '/assets/pattern-savannah.svg'
  },
  copy: {
    tagline: 'Ethiopian Airlines · Afrika Na One Experience',
    welcome: 'Karibu! Discover Africa with Ethiopian Airlines before we land.',
    goodbye: 'Thank you for flying Ethiopian Airlines. Keep the savannah spirit alive.'
  }
};

export const defaultExperienceBrand = experienceBrand;
