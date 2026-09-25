## 2026-09-25T14:55:48Z

You are Worker 1 for Milestone 1 (Expo Android Wrapper & Autonomous Bundler).
Your Working Directory: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/worker_m1/
Project Root: c:/Users/Zam/amigo-coppel-mvp
Authoritative Request: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/ORIGINAL_REQUEST.md
Project Spec: c:/Users/Zam/amigo-coppel-mvp/PROJECT.md
Orchestrator Conversation ID: 4694922b-e10d-44a0-96b4-3b2da058bfec

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/ORIGINAL_REQUEST.md and PROJECT.md before beginning.
Also review the design specifications provided by the three Milestone 1 Explorers:
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_m1_1/report.md (Expo setup, package.json dependencies, app.json, index.js, metro.config.js)
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_m1_2/report.md (Autonomous bundling pipeline scripts, Vite inline build, Blob video generator)
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/report.md (App.tsx full implementation, 26-prop WebView configuration, BackHandler, status bar hiding, error boundary)

Your mission:
Implement Milestone 1 end-to-end:
1. Update `package.json` to include:
   - Dependencies: `expo@~57.0.25`, `react-native@0.86.3`, `react-native-webview@13.16.1`, `expo-status-bar@~57.0.1`
   - DevDependencies (if needed): `vite-plugin-singlefile@^2.3.3`
   - Scripts:
     `"bundle:mobile": "node scripts/generate-mobile-bundle.js"`,
     `"start:mobile": "node scripts/start-mobile.js"`,
     `"serve:mobile": "node scripts/serve-mobile.js"`,
     `"start": "expo start"`,
     `"android": "expo start --android"`
   Install dependencies cleanly using `npx.cmd pnpm install` or `npm.cmd install`.
   NOTE ON WINDOWS: All npm/npx commands in PowerShell must use `npm.cmd`, `npx.cmd`, or `cmd.exe /c "..."`.
2. Create `app.json` per the specification in `explorer_m1_1/report.md` (BanCoppel blue `#05297A`, portrait, slug `amigo-bancoppel-mvp`, package `com.bancoppel.amigobancoppel`, hidden native status bar).
3. Create `index.js` registering `App` via `registerRootComponent(App)`.
4. Create `metro.config.js` per `explorer_m1_1/report.md`.
5. Create `scripts/generate-mobile-bundle.js` per `explorer_m1_2/report.md`:
   - Builds Vite app programmatically with asset inlining (`assetsInlineLimit: 2000000`).
   - Converts the base64 `splash.mp4` to an in-memory `Blob URL` script.
   - Beware string replacement hazards (use arrow function replacers).
   - Packages output into `src-mobile/generated/webAppHtml.ts` with synchronous string export.
6. Create companion scripts `scripts/serve-mobile.js` and `scripts/start-mobile.js`.
7. Create `App.tsx` (Expo mobile root wrapper) per `spec_miner_m1_3/report.md`:
   - Embeds `<WebView />` with complete 26-prop matrix (`domStorageEnabled={true}`, `mediaPlaybackRequiresUserAction={false}`, `allowsInlineMediaPlayback={true}`, `originWhitelist={['*']}`, etc.).
   - Implements Android `BackHandler` bridge with priority gating (bottom sheet -> tutorial -> slide to Bienvenido -> double-back exit safety).
   - Implements `<StatusBar hidden={true} />`.
   - Implements `AppErrorBoundary` with brand loading view.
8. Execute verification:
   - Run `npm.cmd run bundle:mobile` and verify bundle generation in `src-mobile/generated/webAppHtml.ts`.
   - Run `node tests/e2e/run-all.cjs` and verify that all 115 tests pass with 0 failures.
   - Run `cmd.exe /c "npx expo config --type public"` or verify expo start validation.

Write a detailed `report.md` and `handoff.md` in `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/worker_m1/`.
Message the orchestrator (ID: 4694922b-e10d-44a0-96b4-3b2da058bfec) when done.
