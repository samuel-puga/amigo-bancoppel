# BRIEFING — 2026-09-25T14:12:20Z

## Mission
Deeply inspect the existing React+Vite web app in c:/Users/Zam/amigo-coppel-mvp for Expo Android WebView packaging.

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, survey
- Working directory: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_1
- Original parent: 4694922b-e10d-44a0-96b4-3b2da058bfec
- Milestone: Survey Phase

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Inspect existing React+Vite web app, configuration, entry points, components, assets, state, build output, and WebView obstacles.
- Write report to report.md and handoff to handoff.md in working directory.

## Current Parent
- Conversation ID: 4694922b-e10d-44a0-96b4-3b2da058bfec
- Updated: 2026-09-25T14:21:20Z

## Investigation State
- **Explored paths**: package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx, src/App.tsx, src/index.css, src/mi-bolsillo/* (MiBolsillo.jsx, components.jsx, BalanceCard.jsx, data.js, mi-bolsillo.css, assets/splash.mp4, assets/bancoppel-logo-white.png), dist/*, .figma/make/*, .mise.toml
- **Key findings**:
  - React 19.2.4 + Vite 8.0.5 + Tailwind CSS 4.2.2.
  - Windows PowerShell ExecutionPolicy requires `npm.cmd` / `npx.cmd`.
  - Build outputs to `dist/` with content hashing; default base `/` uses absolute URLs, `--base=./` produces relative `import.meta.url` paths.
  - Video splash: `src/mi-bolsillo/assets/splash.mp4` (807 KB). Autoplay requires `mediaPlaybackRequiresUserAction={false}` and `allowsInlineMediaPlayback={true}`.
  - State persistence: `sessionStorage` ('splash-seen') and `localStorage` ('mi-bolsillo:v3:items', 'mb:incomes:v1', etc.). Requires `domStorageEnabled={true}` in WebView.
  - Expo Go cannot run custom native HTTP server modules; local serving via host IP auto-resolution (`Constants.expoConfig?.hostUri`) or inlined HTML is needed.
- **Unexplored areas**: None for survey phase.

## Key Decisions Made
- Documented complete 6-point survey in `report.md`.
- Formulated 5-component hard handoff in `handoff.md`.

## Artifact Index
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_1/report.md — Comprehensive survey report
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_1/handoff.md — 5-component hard handoff report
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_1/progress.md — Progress heartbeat
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_1/DISPATCH.md — Turn dispatch log
