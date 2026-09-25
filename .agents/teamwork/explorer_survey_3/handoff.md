# Handoff Report — Explorer 3: R3 Survey & Verification Criteria

- **Phase**: Survey (Phase 0)
- **Agent**: Explorer 3 (`explorer_survey_3`)
- **Working Directory**: `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_3/`
- **Recipient**: Orchestrator (`4694922b-e10d-44a0-96b4-3b2da058bfec`)
- **Primary Deliverable**: `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_3/report.md`

---

## 1. Observation

1. **Root Configuration & Entrypoint**:
   - `package.json` specifies `"dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" }`, `"devDependencies": { "tailwindcss": "^4.0.0", "vite": "^8.0.5", ... }`.
   - Node version is `v24.21.0` and npm version is `11.19.0` (accessible via `npm.cmd`). PowerShell script execution policy blocks `npm.ps1`, requiring execution via `npm.cmd` or `npx.cmd`.
   - `index.html` loads `<script type="module" src="/src/main.tsx"></script>`.
   - `src/main.tsx` mounts `<App />` and imports `src/index.css`.
   - `src/index.css` imports Google Fonts (`Poppins:wght@600`, `Inter:wght@400;500;600;700`) and `@import 'tailwindcss';`.

2. **Splash Screen (`src/App.tsx:6-50`)**:
   - Uses `<video ref={videoRef} src={splashVideo} muted playsInline onEnded={finish} />` with `splashVideo` imported from `./mi-bolsillo/assets/splash.mp4`.
   - Background is `#05297A`.
   - `useEffect` plays video on mount; if blocked: `v.play().catch(() => finish())`.
   - On completion or timeout: transitions opacity to 0 in 500ms (`transition: 'opacity .5s ease'`), waits 520ms, then invokes `onDone()`.
   - In `App`: `sessionStorage.getItem('splash-seen') === '1'` skips splash on repeated sessions.

3. **Core App & Navigation Structure (`src/mi-bolsillo/MiBolsillo.jsx:18-230`)**:
   - Two top-level views managed by `tab` state (`'login'` | `'bolsillo'`).
   - Smooth horizontal slide transition: `display: 'flex', width: '200%', height: '100%', transform: onB ? 'translateX(-50%)' : 'translateX(0)', transition: 'transform .38s cubic-bezier(.2,.8,.2,1)'`.
   - Header collapses upon vertical scroll (`scrollTop > 24px`), transforming from BanCoppel logo + Bell to 3 BanCoppel brand dots (`#F0D225`) + bell.
   - Status bar mockup (`StatusBar`) renders 47px height, white 9:41 clock, cellular, Wi-Fi, and battery SVG icons.

4. **Interactive Features & Bottom Sheets**:
   - `QuickAddBar`: Concept input, amount input, `autoCat()` regex classifier for 8 categories, expandable document capture options (ticket photo & PDF bank statement).
   - `BalanceCard` (`src/mi-bolsillo/BalanceCard.jsx:257-584`): Calculates 4 states (A: no income, B: surplus <80%, C: surplus >=80%, D: deficit/expenses exceeded income). Segmented category bar with unspent hatch pattern or deficit marker. Expandable breakdown drawer with Gastos/Ingresos tabs.
   - `ExpenseCard` / `ExpenseListCard`: Checkbox paid toggle, strikethrough, due today / overdue tags, touch swipe-to-delete gesture (threshold -60px), contextual BanCoppel suggestions for Apartados, Domiciliación, and TDC.
   - 5 Modal Bottom Sheets: `IntroSheet`, `ApartadoSheet`, `DomiciliacionSheet`, `ReminderSheet` (with inline `MiniCalendar`), and `IncomeSheet` (income creation/editing with quincenal doubling logic).
   - `TutorialSpotlight`: 4-step coach marks portal overlay.
   - `Toast`: Bottom toast with duration countdown progress bar and undo action.

5. **Persistence Keys & Tokens (`src/mi-bolsillo/data.js:1-55` & `BalanceCard.jsx:258`)**:
   - LocalStorage keys: `mi-bolsillo:v3:items`, `mi-bolsillo:v3:introSeen`, `mi-bolsillo:v3:tutorialSeen`, `mi-bolsillo:v3:optOut`, `mi-bolsillo:v3:dismissedTDC`, `mb:incomes:v1`.
   - SessionStorage key: `splash-seen`.
   - Primary colors: `#05297A` (navy), `#022A7A` (dark navy), `#1C42E8` (primary blue), `#F0D225` (yellow), `#F0F2F5` (neutral bg), `#FFFFFF` (surface), `#16A34A` (success green), `#DC2626` (danger red).

---

## 2. Logic Chain

1. **Observation 1 & 2** establish that the web codebase is an SPA built on React 19 + Vite 8. The splash screen uses an HTML5 video tag with inline playback and muted attributes. In Android WebViews, media autoplay is strictly restricted by default unless explicitly permitted by container props (`mediaPlaybackRequiresUserAction={false}` and `allowsInlineMediaPlayback={true}`).
2. **Observation 3** shows that navigation is internal state-driven (`tab === 'login' | 'bolsillo'`) over a 200% width sliding track. A native React Native navigation library (like React Navigation) is NOT required inside the web application, meaning standard WebView wrapper architecture will preserve the exact 60fps CSS transform animations without route rewriting.
3. **Observation 4 & 5** demonstrate that all interactive states, dynamic calculations, gesture handlers (touch swipe), and bottom sheets are self-contained in React state and backed by `localStorage` / `sessionStorage`. Because `localStorage` is standard across Android WebViews (when `domStorageEnabled={true}` is enabled), user data will persist across app sessions without requiring immediate native SQLite or AsyncStorage migrations.
4. **Observation 3 & 5** reveal that the mock `StatusBar` (47px iOS-style 9:41 bar) sits directly at the top of `MiBolsillo`. Running this in an Android WebView without status bar coordination would cause a visual clash with the Android native status bar. Therefore, Expo's native `<StatusBar>` must be styled with light content and a matching `#05297A` background, or `showStatusBar` prop managed appropriately.
5. Consequently, preserving 100% of Requirement R3 is completely feasible by serving the built web app locally to `react-native-webview` with the specific WebView flags, view dimensions, and status bar settings cataloged in `report.md`.

---

## 3. Caveats

- **No Caveats** on feature inventory or visual tokens: 100% of components, styles, colors, dimensions, and interactions were inspected directly in source code.
- **Assumptions**: Assumes the Android wrapper will run in Expo Go on Android 10+ devices with modern Chromium-based WebView engines that support CSS `@import`, flexbox, touch events, and ES2022 features.
- **Hardware Back Button**: The web application currently relies on in-DOM click handlers to dismiss sheets and tabs; hardware back button handling must be bridged from React Native to the WebView to prevent accidental app exits.

---

## 4. Conclusion

The complete UI/UX specification, Feature Inventory, BanCoppel design tokens, and a concrete 4-Tier verification matrix have been thoroughly documented and saved to:
`c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_3/report.md`.

All technical contracts and acceptance criteria for Requirement R3 (Preservación Total de la Experiencia e Interactividad Demo) are ready to guide Phase 1 work breakdown, worker implementation, and automated test suite creation.

---

## 5. Verification Method

1. **Verify Report Integrity**:
   - Check file existence and line count:
     `Get-Item c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_3/report.md`
2. **Verify Component Paths & Lines**:
   - Confirm splash video implementation: `src/App.tsx` (lines 6-50)
   - Confirm balance state logic: `src/mi-bolsillo/BalanceCard.jsx` (lines 282-286, 318-338)
   - Confirm suggestions & swipe gesture: `src/mi-bolsillo/components.jsx` (lines 784-858)
3. **Test Suite Verification**:
   - When the test runner is configured, execute the 4-tier test scenarios outlined in Section 5 of `report.md`.
