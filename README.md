# Afrika Na One · IFE Suite

HTML5/React application skeleton for offline-ready quiz experiences targeting in-flight entertainment (IFE) systems. This build centers on the Afrika Na One brand with a savannah-forward aesthetic, dark/light modes, and the core screen flow: Splash → Main Menu → Game → Post Game (Results + Leaderboard) → Goodbye.

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript for modern, bundler-friendly builds
- CSS-variables-driven theming layered over the suite palette tokens
- Componentized screens so future partner skins only swap configuration and assets

No remote APIs, analytics, or CDN fonts are referenced to keep the package self-contained once dependencies are vendored.

## Getting Started

Network access is required once to install dependencies; afterward builds run fully offline.

```bash
npm install
npm run dev     # local preview
npm run build   # production bundle under dist/afrika
npm run preview # serve build output
```

## Project layout

```
├── public/
│   ├── assets/           # shared SVGs/patterns
│   ├── media/
│       ├── audio/        # offline audio loops, stingers, narrations
│       └── images/       # quiz illustrations, atlas cards, avatars
│   └── fonts/            # drop NishikiTeki files here
├── src/
│   ├── App.tsx           # screen state machine
│   ├── config/           # single Afrika Na One brand profile
│   ├── components/       # reusable UI primitives (shell, toggles, stats, etc.)
│   ├── hooks/            # reusable hooks (mock game engine)
│   ├── modules/games/    # registry + metadata for quiz types
│   ├── screens/          # Splash/Main/Game/PostGame/Goodbye views
│   ├── styles/           # global styles + tokens
│   └── theme/            # ThemeProvider + tokens per mode
└── vite.config.ts        # outputs build to dist/afrika for packaging
```

## Extending the experience

1. Drop additional brand assets under `public/assets/` or `public/media/`.
2. Update `src/config/brand.ts` to point to the new palette, logo, and copy.
3. Extend `ThemeProvider` if runtime selection between skins is required.
4. Rebuild to separate subfolders (tweak `vite.config.ts` `outDir`) for each packaged variant.

> **Font note:** Place the `NishikiTeki` font file(s) under `public/fonts/` (currently `NishikiTeki-MVxaJ.ttf`) to activate the custom typography baked into `src/styles/global.css`.

## Next steps

- Plug actual quiz engines, media, and localization packs into `useGameEngine` and `modules/games`.
- Replace mock leaderboard data with cabin-local storage or seat-to-seat network syncing once approved.
- Add service worker / app shell caching if the target IFE runtime benefits from it.
