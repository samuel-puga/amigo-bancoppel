## 2026-09-25T14:24:02Z
You are Spec Miner 3 for Milestone 1 (Expo Android Wrapper & Autonomous Bundler).
Your Working Directory: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/
Project Root: c:/Users/Zam/amigo-coppel-mvp
Authoritative Request: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/ORIGINAL_REQUEST.md
Project Spec: c:/Users/Zam/amigo-coppel-mvp/PROJECT.md
Orchestrator Conversation ID: 4694922b-e10d-44a0-96b4-3b2da058bfec

MANDATORY: Read c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/ORIGINAL_REQUEST.md and PROJECT.md before beginning.

Your mission:
Extract and specify the exact technical contracts for the mobile wrapper component (`App.tsx`):
1. Complete list of props required on `<WebView />` for Android in Expo Go:
   - `source={{ html: webAppHtml, baseUrl: 'https://localhost' }}`
   - `originWhitelist={['*']}`
   - `javaScriptEnabled={true}`
   - `domStorageEnabled={true}`
   - `mediaPlaybackRequiresUserAction={false}`
   - `allowsInlineMediaPlayback={true}`
   - `mixedContentMode="always"`
   - `allowFileAccess={true}`
   - Android hardware acceleration and scrolling indicator props.
2. Android `BackHandler` specification: how back press events are intercepted and sent to the WebView (e.g. dismissing sheets or going back from Amigo BanCoppel to Bienvenido if applicable).
3. Status bar configuration: `<StatusBar hidden={true} />` from `expo-status-bar` to prevent clashing with web mock status bar.
4. Error boundary and loading splash handling in React Native while the HTML string mounts.

Produce a detailed report in `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/report.md` and a summary `handoff.md`.
Message the orchestrator (ID: 4694922b-e10d-44a0-96b4-3b2da058bfec) when done.
