# Project: Amigo BanCoppel MVP — Expo Android WebView Wrapper

## Overview
Convert the existing React+Vite web app into an autonomous Android app executable in Expo Go using a WebView wrapper that serves/packages the build locally, preserving 100% of the visual and interactive UI for a live public demo.

## Architecture

### 1. Web Layer
- Existing React 19 + Vite 8 SPA in `src/`.
- Single-page application with React state navigation (`tab: 'login' | 'bolsillo'`) over a 200% width sliding track.
- Media: HTML5 splash video (`splash.mp4`, 807 KB), BanCoppel logo PNG, inline SVG icons, Google Fonts (`Inter`, `Poppins`).
- Storage: `localStorage` (`mi-bolsillo:v3:items`, `mb:incomes:v1`, etc.) and `sessionStorage` (`splash-seen`).

### 2. Mobile Layer (Expo Go Android Wrapper)
- Expo SDK project configured in `c:/Users/Zam/amigo-coppel-mvp`.
- Configuration: `app.json` (name: "Amigo BanCoppel", slug: "amigo-bancoppel-mvp", orientation: "portrait", Android configuration).
- Entry point: `index.js` registering the root Expo component (`App.tsx` or `src-mobile/App.tsx`).
- Root Component (`App.tsx`):
  - Embeds `<WebView />` from `react-native-webview`.
  - Android container props:
    - `source={{ html: webAppHtml, baseUrl: 'https://localhost' }}` (with auto-fallback / companion local server URI if desired)
    - `originWhitelist={['*']}`
    - `javaScriptEnabled={true}`
    - `domStorageEnabled={true}` (MANDATORY for persistence)
    - `mediaPlaybackRequiresUserAction={false}` (MANDATORY for video autoplay)
    - `allowsInlineMediaPlayback={true}`
    - `mixedContentMode="always"`
    - `allowFileAccess={true}`
    - `showsVerticalScrollIndicator={false}`
    - `showsHorizontalScrollIndicator={false}`
    - `androidHardwareAccelerationDisabled={false}`
  - Android BackHandler integration to handle back navigation and sheet dismissals gracefully.
  - Native `<StatusBar hidden />` to avoid clashing with the web app's mock status bar.

### 3. Packaging & Local Serving Pipeline (R2 Autonomy)
- Build script (`scripts/generate-mobile-bundle.js`):
  - Compiles the web app into a single inlined bundle using Vite (`vite-plugin-singlefile` or dedicated inline build config with `assetsInlineLimit: 2000000`).
  - Exports the self-contained HTML payload as a TypeScript/JavaScript constant (`src-mobile/generated/webAppHtml.ts`) imported synchronously by the mobile WebView wrapper.
  - Video handling: splash video base64-encoded and converted to in-memory Blob URL for smooth hardware playback.
  - Companion local static server option (`npm run serve:mobile` or auto-host script) for live streaming if needed.
- Result: Zero external IP configuration, zero CORS errors, 100% autonomous on-device execution in Expo Go.

## Code Layout
```
c:/Users/Zam/amigo-coppel-mvp/
├── app.json                               # Expo configuration
├── App.tsx                                # Expo mobile root wrapper (WebView)
├── index.js                               # Expo entry point
├── metro.config.js                        # Metro bundler config
├── scripts/
│   ├── generate-mobile-bundle.js          # Inlining/packaging script for mobile
│   └── start-mobile.js                    # Autonomous start script (build + expo start)
├── src-mobile/
│   └── generated/
│       └── webAppHtml.ts                  # Generated inlined web bundle
├── src/                                   # Existing React+Vite web app
│   ├── App.tsx                            # Web root with splash video
│   ├── main.tsx                           # Web entry point
│   ├── index.css                          # Styles and fonts
│   └── mi-bolsillo/                       # Core screens and components
│       ├── MiBolsillo.jsx                 # Main container & slider navigation
│       ├── BalanceCard.jsx                # Balance calculations & drawers
│       ├── components.jsx                 # Cards, sheets, suggestions, gestures
│       ├── data.js                        # Storage keys & default items
│       └── assets/                        # Splash MP4 & BanCoppel logo
└── dist/                                  # Web production build
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Expo Android Project Setup | Expo SDK configuration compatible with Expo Go and `react-native-webview` | M1 | R1, survey |
| F02 | Autonomous Bundling Pipeline | Script to compile Vite app into self-contained inlined bundle for mobile | M1 | R2, survey |
| F03 | Mobile WebView Wrapper | Root Expo component rendering WebView with all required Android flags | M1 | R1, R2, survey |
| F04 | Expo Go CLI Execution | Command `npx expo start` / `npm run android` runs cleanly without bundling errors | M1 | AC1, survey |
| F05 | Splash Video Autoplay & Fade | Video playback (`splash.mp4`), muted, playsInline, auto-fade after playback | M2 | R3, survey |
| F06 | Welcome Screen ("Bienvenido") | Login view, inputs, BanCoppel logo, transition button | M2 | R3, survey |
| F07 | Dashboard ("Amigo BanCoppel") | Main view, header with brand dots/bell, balance, and expense sections | M2 | R3, survey |
| F08 | 200% Horizontal Slide Navigation | Smooth slide transition between login and dashboard | M2 | R3, survey |
| F09 | Status Bar Harmonization | Clean status bar presentation without duplicate native/mock bars | M2 | R3, survey |
| F10 | QuickAddBar Expense Registration | Quick expense input with 8 regex auto-categories + ticket/PDF triggers | M3 | R3, survey |
| F11 | BalanceCard Dynamic States | 4 balance calculation states (A: no income, B/C: surplus, D: deficit) + breakdown | M3 | R3, survey |
| F12 | Expense List & Paid Toggles | Expense items with checkbox paid toggle, strikethrough, due tags | M3 | R3, survey |
| F13 | Swipe-to-Delete Gesture & Undo | Touch swipe gesture (-60px threshold) with undo toast countdown | M3 | R3, survey |
| F14 | Bottom Sheets Catalog | 5 bottom sheets: Intro, Apartado, Domiciliación, Reminder, Income | M3 | R3, survey |
| F15 | Device Data Persistence | `localStorage` persistence across app restarts for items, incomes, settings | M3 | R3, survey |
| F16 | BanCoppel Visual Fidelity | Colors (`#05297A`, `#F0D225`), fonts (`Inter`, `Poppins`), layout proportions | M2 | R3, survey |
| F17 | E2E Regression & Tier Verification | 100% pass across all E2E verification tiers (Tiers 1-4) | M4 | AC, survey |
| F18 | Adversarial Coverage Hardening | Tier 5 adversarial stress testing and verification | M4 | Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Expo Android Wrapper & Autonomous Bundler | F01, F02, F03, F04 (Expo project, WebView wrapper, bundling script, Expo start) | none | IN_PROGRESS |
| M2 | Visual Fidelity, Splash Video & Navigation | F05, F06, F07, F08, F09, F16 (Splash video, Bienvenido, Amigo BanCoppel, slider, styling) | M1 | PLANNED |
| M3 | Interactivity, Bottom Sheets & Persistence | F10, F11, F12, F13, F14, F15 (QuickAdd, BalanceCard, sheets, swipe gesture, localStorage) | M2 | PLANNED |
| M4 | Final E2E Test Suite & Adversarial Hardening | F17, F18 (100% E2E test pass across Tiers 1-4, Tier 5 adversarial hardening) | M3 | PLANNED |

## Interface Contracts

### 1. Bundler Output Contract (`scripts/generate-mobile-bundle.js` -> `src-mobile/generated/webAppHtml.ts`)
- The generator MUST output a valid TypeScript/JavaScript file exporting:
  `export const webAppHtml: string;`
- The `webAppHtml` string MUST contain the complete inlined HTML with CSS, JavaScript, and base64 assets.
- The HTML MUST include a script converting the base64 `splash.mp4` into an in-memory `Blob URL` assigned to `<video src="..." />` to guarantee Android hardware decoding.

### 2. Mobile Container Contract (`App.tsx` -> `react-native-webview`)
- `<WebView />` MUST receive:
  - `source={{ html: webAppHtml, baseUrl: 'https://localhost' }}`
  - `originWhitelist={['*']}`
  - `javaScriptEnabled={true}`
  - `domStorageEnabled={true}`
  - `mediaPlaybackRequiresUserAction={false}`
  - `allowsInlineMediaPlayback={true}`
  - `mixedContentMode="always"`
  - `allowFileAccess={true}`
- Android back button MUST be hooked via `BackHandler.addEventListener` and communicate via `webViewRef.current.postMessage` or evaluate JavaScript if needed, or prevent unexpected app exit.

### 3. Data Persistence Contract (`localStorage`)
- Storage keys preserved:
  - `mi-bolsillo:v3:items`
  - `mi-bolsillo:v3:introSeen`
  - `mi-bolsillo:v3:tutorialSeen`
  - `mi-bolsillo:v3:optOut`
  - `mi-bolsillo:v3:dismissedTDC`
  - `mb:incomes:v1`
  - `splash-seen` (sessionStorage)
