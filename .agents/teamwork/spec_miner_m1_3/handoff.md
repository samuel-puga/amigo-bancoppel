# Handoff Report: Mobile Wrapper Component (`App.tsx`) Technical Contract
**Project**: Amigo BanCoppel MVP  
**Milestone**: Milestone 1 (Expo Android Wrapper & Autonomous Bundler)  
**Agent**: Spec Miner 3 (`spec_miner_m1_3`)  
**Date**: 2026-09-25  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

Direct observations from authoritative specifications and existing codebases:

1. **WebView Props Contract in Project Specification**:
   - In `c:/Users/Zam/amigo-coppel-mvp/PROJECT.md` (lines 20–33):
     ```
     - source={{ html: webAppHtml, baseUrl: 'https://localhost' }}
     - originWhitelist={['*']}
     - javaScriptEnabled={true}
     - domStorageEnabled={true} (MANDATORY for persistence)
     - mediaPlaybackRequiresUserAction={false} (MANDATORY for video autoplay)
     - allowsInlineMediaPlayback={true}
     - mixedContentMode="always"
     - allowFileAccess={true}
     - showsVerticalScrollIndicator={false}
     - showsHorizontalScrollIndicator={false}
     - androidHardwareAccelerationDisabled={false}
     - Android BackHandler integration to handle back navigation and sheet dismissals gracefully.
     - Native <StatusBar hidden /> to avoid clashing with the web app's mock status bar.
     ```

2. **Splash Video Autoplay Logic in Web App**:
   - In `c:/Users/Zam/amigo-coppel-mvp/src/App.tsx` (lines 15–19):
     ```tsx
     useEffect(() => {
       const v = videoRef.current;
       if (!v) return;
       v.play().catch(() => finish()); // if autoplay blocked, skip
     }, []);
     ```
     If `mediaPlaybackRequiresUserAction` is omitted (defaults to `true` on Android), `v.play()` is rejected immediately and skips the splash screen video without playing.

3. **Mock Status Bar in Web App**:
   - In `c:/Users/Zam/amigo-coppel-mvp/src/mi-bolsillo/components.jsx` (lines 37–40):
     ```jsx
     export function StatusBar() {
       return (
         <div style={{ height: 47, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px 0 32px' }}>
           <span style={{ fontWeight: 600, fontSize: 16, color: '#FFFFFF' }}>9:41</span>
     ```
   - In `c:/Users/Zam/amigo-coppel-mvp/src/App.tsx` (line 78):
     `<MiBolsillo showStatusBar={true} trashMode="hover" />`
     The web application renders its own BanCoppel mock status bar with 9:41 clock and white icons.

4. **Internal State Navigation vs Browser History**:
   - In `c:/Users/Zam/amigo-coppel-mvp/src/mi-bolsillo/MiBolsillo.jsx` (lines 23, 37):
     ```javascript
     const [tab, setTab] = useState('login');
     ...
     const [sheet, setSheet] = useState(null);
     ```
     The web app uses purely internal React state (`tab`, `sheet`, `tutorialStep`). It never pushes to `window.history`.
   - Consequently, `navState.canGoBack` in `react-native-webview` is **always `false`**.

5. **Sheet Dismissal Event Hook**:
   - In `c:/Users/Zam/amigo-coppel-mvp/src/mi-bolsillo/components.jsx` (lines 1033–1038):
     ```javascript
     useEffect(() => {
       if (!open) return;
       const onKey = e => { if (e.key === 'Escape') onClose(); };
       window.addEventListener('keydown', onKey);
       return () => window.removeEventListener('keydown', onKey);
     }, [open, onClose]);
     ```
     All standard bottom sheets (`IntroSheet`, `ApartadoSheet`, `DomiciliacionSheet`) close upon receiving a `KeyboardEvent` with `key === 'Escape'`.

---

## 2. Logic Chain

1. **Step 1 (Props Completeness)**:
   - Based on Observation 1 and Android WebSettings specifications, Android WebView restricts DOM storage, JavaScript, hardware layers, and media playback by default.
   - Enabling `domStorageEnabled={true}` is strictly required to prevent `SecurityError` and keep `mi-bolsillo:v3:items` and `mb:incomes:v1` stored across sessions.
   - Enabling `mediaPlaybackRequiresUserAction={false}` and `allowsInlineMediaPlayback={true}` is strictly required; otherwise, based on Observation 2, `v.play().catch()` triggers immediately and drops the splash video.
   - Hardware acceleration (`androidHardwareAccelerationDisabled={false}` and `androidLayerType="hardware"`) is required to maintain 60fps across the 200% width slide animation and avoid dropped video frames.

2. **Step 2 (BackHandler Interception Architecture)**:
   - Based on Observation 4, `navState.canGoBack` is always `false`. If the mobile wrapper relies on `canGoBack`, any back press will immediately exit Expo Go, destroying the demo experience.
   - Based on Observation 5, `<Sheet />` components listen to `Escape`. Dispatching an `Escape` keyboard event or `android:hardwareBack` via `injectJavaScript` dismisses open sheets.
   - A priority chain must be established: (1) Active Bottom Sheet -> dismiss sheet; (2) Active Tutorial Spotlight -> dismiss tutorial; (3) Active Dashboard (`tab === 'bolsillo'`) -> switch to Bienvenido (`tab === 'login'`); (4) On Bienvenido -> Double-Back-to-Exit safety pattern with `ToastAndroid.show('Presiona de nuevo para salir', ToastAndroid.SHORT)`.

3. **Step 3 (Status Bar Harmonization)**:
   - Based on Observation 3, the web application renders a permanent 9:41 mock status bar.
   - If the native Android status bar is visible, two conflicting status bars are displayed simultaneously.
   - Setting `<StatusBar hidden={true} />` from `expo-status-bar` and configuring `"androidStatusBar": { "hidden": true }` in `app.json` resolves this clash cleanly.

4. **Step 4 (Anti-White-Flash & Lifecycle Resilience)**:
   - Android WebView initializes with a white background by default.
   - Setting `style={{ flex: 1, backgroundColor: '#05297A' }}` on both container and WebView, along with `startInLoadingState={true}` and a BanCoppel-branded `renderLoading` placeholder, eliminates the white flash while `webAppHtml` parses.
   - Adding `onRenderProcessGone` with `reload()` automatically recovers from Android OS low-memory Chromium renderer terminations.
   - Embedding `AppErrorBoundary` catches React Native mount/render exceptions and displays a BanCoppel-branded retry screen.

---

## 3. Caveats

1. **Offline External Fonts**:
   - The web app imports Google Fonts (`Inter` and `Poppins`) via CDN in `src/index.css`. If the device is tested in strict offline/airplane mode without prior font caching, the system will fall back to Roboto. Font rendering remains functional, but offline bundling of WOFF2 files could be considered for M2 if 100% offline typography is demanded.
2. **React Native WebView Version Compatibility**:
   - The props specified are standard across Expo SDK 52/53 with `react-native-webview` (v13.x). Ensure `npx expo install react-native-webview` is used during dependency installation.

---

## 4. Conclusion

The technical contract for the mobile wrapper component (`App.tsx`) is fully specified, verified against the codebase, and documented in detail in `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/report.md`.

Key Deliverables:
- **26 Android WebView Props Matrix**: Full prop names, values, underlying Android APIs, and failure modes.
- **BackHandler Interception Protocol**: Gating state hierarchy, bi-directional message bridging, injected fallback script, and double-back exit safety pattern.
- **Status Bar Harmonization**: Native status bar suppression eliminating duplicate bars.
- **Lifecycle & Error Handling**: Anti-white-flash architecture, loading placeholder, `AppErrorBoundary`, and Chromium crash auto-reload.
- **Production-Ready Reference Implementation**: Fully coded `App.tsx` ready for drop-in deployment by the implementer.

---

## 5. Verification Method

To independently verify this specification:

1. **Static Inspection of Code & Contracts**:
   - Inspect `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/spec_miner_m1_3/report.md` §6 for the complete `App.tsx` implementation.
   - Check that all props match `PROJECT.md` §2 and §Interface Contracts.
2. **E2E Test Runner Verification**:
   - When `test_writer_e2e` runs Tier 1 checks:
     - Verify prop existence: `source.baseUrl === 'https://localhost'`, `domStorageEnabled === true`, `mediaPlaybackRequiresUserAction === false`, `allowsInlineMediaPlayback === true`, `mixedContentMode === 'always'`.
3. **Runtime Verification in Expo Go (Milestone 1 Validation)**:
   - Execute `npx expo start` and run on an Android device or emulator.
   - Confirm splash video autoplays on launch with zero white flashes.
   - Open a bottom sheet (e.g. Apartado or Domiciliación) and press the Android back button: verify the sheet closes and the app does NOT exit.
   - While on "Amigo BanCoppel", press back: verify it slides back to "Bienvenido".
   - While on "Bienvenido", press back once: verify toast "Presiona de nuevo para salir" appears without exiting.
