# BRIEFING — 2026-09-25T14:30:00Z

## Mission
Extract and specify the exact technical contracts for the mobile wrapper component (`App.tsx`) in Expo Go Android, including WebView props, BackHandler interception, status bar configuration, and error/loading handling.

## 🔒 My Identity
- Archetype: Specification Miner
- Roles: External domain expert, React Native / Expo Go WebView specification engineer
- Working directory: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/
- Original parent: 4694922b-e10d-44a0-96b4-3b2da058bfec
- Milestone: Milestone 1 (Expo Android Wrapper & Autonomous Bundler)

## 🔒 Key Constraints
- Do NOT implement anything — specification miner is strictly read-only regarding application source code.
- Report findings in `report.md` (detailed) and `handoff.md` (summary).
- Prioritize authoritative specifications: React Native WebView documentation, Expo Go Android runtime behavior, and project requirements.
- Must cover all 4 core areas: complete WebView props, BackHandler spec, StatusBar configuration, error boundary & loading splash handling.

## Current Parent
- Conversation ID: 4694922b-e10d-44a0-96b4-3b2da058bfec
- Updated: not yet

## Task Summary
- **What to build**: Exhaustive specification report (`report.md`) defining the technical contract of `App.tsx` (Expo mobile wrapper), covering `<WebView />` Android props, hardware BackHandler integration with web app state/sheets, `<StatusBar hidden={true} />` harmonization, and React Native error boundary & mount loading splash.
- **Success criteria**: Complete specification with prop lists, event protocols, error recovery patterns, and boundary conditions ready for implementation and E2E verification.
- **Interface contracts**: `c:/Users/Zam/amigo-coppel-mvp/PROJECT.md` § Interface Contracts (Contract 2: Mobile Container Contract)
- **Code layout**: `c:/Users/Zam/amigo-coppel-mvp/PROJECT.md` § Code Layout

## Key Decisions Made
- The mobile wrapper `App.tsx` must implement bidirectional message bridging or an injected event protocol because the React SPA uses internal state (`tab`, `sheet`, `tutorialStep`), not browser history (`history.pushState`). Relying solely on `navState.canGoBack` would cause accidental exits on hardware back press.
- Double-back-to-exit pattern with ToastAndroid implemented to guard the live demo against accidental exit on single back press from the login view.
- Native status bar must be hidden (`<StatusBar hidden={true} />` from `expo-status-bar`) because the web application renders its own BanCoppel-branded mock status bar (`StatusBar` component with 9:41, wifi, battery icons).
- WebView must have all 26 required Android multimedia, storage, and rendering permissions enabled (`mediaPlaybackRequiresUserAction={false}`, `allowsInlineMediaPlayback={true}`, `domStorageEnabled={true}`, `mixedContentMode="always"`, `allowFileAccess={true}`, `androidHardwareAccelerationDisabled={false}`, `androidLayerType="hardware"`).
- Error boundary (`AppErrorBoundary`) catches HTML loading or parsing errors, rendering a native retry view with BanCoppel styling (`#05297A`), and the loading splash (`BrandLoadingView`) matches the `#05297A` brand background while the inlined HTML mounts to prevent the Android WebView "white flash".

## Artifact Index
- `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/DISPATCH.md` — Dispatch prompt and assignments
- `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/BRIEFING.md` — Working memory and identity
- `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/progress.md` — Liveness heartbeat and progress
- `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/report.md` — Detailed technical specification report
- `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/handoff.md` — 5-component handoff report

## Loaded Skills
- None specified by orchestrator.
