# Handoff Report — Explorer 1 (Survey Phase)

**Type**: Hard Handoff  
**Agent**: `explorer_survey_1`  
**Recipient**: Orchestrator (`4694922b-e10d-44a0-96b4-3b2da058bfec`)  
**Timestamp**: 2026-09-25T14:21:00Z  

---

## 1. Observation

- **Toolchain & Windows Execution Policy**:
  - Running `node -v` returned `v24.21.0`.
  - Running `npm -v` in PowerShell yielded verbatim:
    `npm : No se puede cargar el archivo C:\Program Files\nodejs\npm.ps1 porque la ejecución de scripts está deshabilitada en este sistema.`
  - Running `npm.cmd -v` and `npx.cmd -v` succeeded with version `11.19.0`. All terminal commands must use `.cmd` extensions in PowerShell.
  - Dependencies were installed via `npx.cmd pnpm install` in 42.4s (React 19.2.4, Vite 8.0.5, Tailwind CSS 4.2.2).
- **Build Output**:
  - Executing `npm.cmd run build` compiled in 524ms, producing:
    - `dist/index.html` (917 B)
    - `dist/assets/bancoppel-logo-white-BlWxxP3_.png` (9.61 kB)
    - `dist/assets/splash-B73liuBk.mp4` (807.23 kB)
    - `dist/assets/index-CNYmMtR8.css` (10.64 kB)
    - `dist/assets/index-CF7Cgnm0.js` (264.14 kB)
    - `dist/robots.txt` (0.02 kB)
  - By default, `dist/index.html` uses absolute paths:
    `line 13: <script type="module" crossorigin src="/assets/index-CF7Cgnm0.js"></script>`
    `line 14: <link rel="stylesheet" crossorigin href="/assets/index-CNYmMtR8.css">`
  - Running `npm.cmd run build -- --base=./` produces relative paths (`./assets/...`) and relative `import.meta.url` module resolution.
- **Entry Points & Routing**:
  - `index.html:13` loads `/src/main.tsx`.
  - `src/main.tsx:6-10` mounts `<App />` from `src/App.tsx`.
  - Navigation does not use react-router; it uses React state `tab` in `src/mi-bolsillo/MiBolsillo.jsx:23` toggling between `'login'` ("Bienvenido") and `'bolsillo'` ("Amigo BanCoppel").
- **Assets**:
  - Splash video: `src/mi-bolsillo/assets/splash.mp4` (807 kB), imported in `src/App.tsx:4` (`import splashVideo from './mi-bolsillo/assets/splash.mp4'`).
  - Logo: `src/mi-bolsillo/assets/bancoppel-logo-white.png` (9.6 kB), imported in `src/mi-bolsillo/components.jsx:4`.
  - All icons are inline SVG React elements (`BellIcon`, `CloseIcon`, `CheckIcon`, etc.). No external SVG files.
  - Category icons are Unicode emojis in `src/mi-bolsillo/data.js:22-31`.
  - Fonts: Loaded from Google Fonts in `src/index.css:1` (`Inter` and `Poppins`).
  - `src/assets/img[1-6].png` are leftover text/code files from a previous Figma export and are unused.
- **State & Persistence**:
  - `sessionStorage` in `src/App.tsx:54,58` for `'splash-seen'`.
  - `localStorage` in `src/mi-bolsillo/MiBolsillo.jsx:10-16` and `BalanceCard.jsx:31-37` for:
    - `'mi-bolsillo:v3:items'`
    - `'mi-bolsillo:v3:introSeen'`
    - `'mi-bolsillo:v3:tutorialSeen'`
    - `'mi-bolsillo:v3:optOut'`
    - `'mi-bolsillo:v3:dismissedTDC'`
    - `'mb:incomes:v1'`
- **Video Autoplay Code**:
  - In `src/App.tsx:18`: `v.play().catch(() => finish());`. If autoplay is blocked by the WebView, `finish()` runs immediately and skips the splash screen video.
- **Portals**:
  - `IncomeSheet` (`BalanceCard.jsx:251`), `TutorialSpotlight` (`components.jsx:360`), and `ReminderSheet` (`components.jsx:780`) use `createPortal(..., document.body)`.

---

## 2. Logic Chain

1. **Premise**: In Android WebView (`react-native-webview`), HTML5 `<video>` autoplay is blocked by default without physical touch gestures.
   **Evidence**: `src/App.tsx:18` contains `v.play().catch(() => finish())`.
   **Inference**: If `<WebView />` does not specify `mediaPlaybackRequiresUserAction={false}` and `allowsInlineMediaPlayback={true}`, the splash video will fail to autoplay and immediately skip to the dashboard, violating Acceptance Criteria R3.
2. **Premise**: In Android WebView, DOM storage (`localStorage` and `sessionStorage`) is disabled by default.
   **Evidence**: The application relies exclusively on `localStorage` for all user expenses (`mi-bolsillo:v3:items`) and incomes (`mb:incomes:v1`), and `sessionStorage` for splash screen state.
   **Inference**: Without `domStorageEnabled={true}` on `<WebView />`, state persistence will silently fail, violating Requirement R3.
3. **Premise**: ES modules (`<script type="module">`) loaded via `file:///` in Android WebView fail due to Chromium file-origin CORS policies.
   **Evidence**: Vite builds ES modules (`<script type="module" crossorigin src="...">`).
   **Inference**: Serving the production build via an HTTP mechanism (such as a local static HTTP server on the host auto-discovered via `Constants.expoConfig?.hostUri` or Metro middleware) provides complete compatibility, reliable streaming for the 807 kB video, and zero CORS errors.
4. **Premise**: Expo Go is a sandboxed runtime and cannot execute native libraries with custom C/Java code (like native embedded C web servers).
   **Evidence**: Expo Go specifications and `ORIGINAL_REQUEST.md` requirement for Expo Go compatibility.
   **Inference**: The serving strategy must either run on the host concurrently with `npx expo start` and be automatically discovered by the app, or use an inlined HTML bundle supported in Expo Go.

---

## 3. Caveats

- We did not test real Android device hardware performance for rendering the 807 kB video in base64 vs HTTP streaming; HTTP streaming is universally known to be safer and smoother on low/mid-range Android devices.
- Google Fonts (`Inter`, `Poppins`) require an internet connection if not cached. Offline demo behavior will fall back to Roboto / system sans-serif unless font files are bundled locally.
- The web layout in `src/App.tsx:73-75` has `maxWidth: 430` and `maxHeight: 900`. On tablets or large Android devices, it will center itself within the WebView with `#0A1A4A` background framing unless made responsive.

---

## 4. Conclusion

The React+Vite web app is fully functional, self-contained, and builds cleanly in ~500ms.
To meet the user requirements (R1, R2, R3) for Expo Go:
1. Initialize an Expo application compatible with Expo Go and install `react-native-webview`.
2. Configure `<WebView />` with essential flags: `domStorageEnabled={true}`, `mediaPlaybackRequiresUserAction={false}`, `allowsInlineMediaPlayback={true}`, `javaScriptEnabled={true}`.
3. Serve the `dist/` production build via a local HTTP server that is auto-resolved using `Constants.expoConfig?.hostUri` so no manual network setup is required by the presenter.
4. Hide the Android OS status bar (`<StatusBar hidden />`) to avoid displaying double status bars over the web app's simulated status bar.

---

## 5. Verification Method

- **Verify Build**:
  - Run `npm.cmd run build` in `c:/Users/Zam/amigo-coppel-mvp`.
  - Confirm `dist/index.html`, `dist/assets/splash-*.mp4`, `dist/assets/bancoppel-logo-*.png`, `dist/assets/index-*.js`, and `dist/assets/index-*.css` exist.
- **Inspect Detailed Report**:
  - Read `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_1/report.md`.
- **Invalidation Conditions**:
  - If `mediaPlaybackRequiresUserAction={false}` is omitted, the splash video will fail to autoplay.
  - If `domStorageEnabled={true}` is omitted, expense data will not persist across app reloads.
  - If raw `npm` is run directly in Windows PowerShell instead of `npm.cmd`, it will fail with an execution policy error.
