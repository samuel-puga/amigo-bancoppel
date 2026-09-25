# Reviewer 2 & Critic Report: Milestone 1 (Mobile Runtime Robustness, Security Policies & Edge Cases)

- **Reviewer**: Reviewer 2 (`reviewer_m1_2`)
- **Roles**: Reviewer, Adversarial Critic
- **Target Milestone**: Milestone 1 (Expo Android Wrapper & Autonomous Bundler)
- **Authoritative Specifications**:
  - `ORIGINAL_REQUEST.md` (Requirements R1, R2, R3 and Acceptance Criteria)
  - `PROJECT.md` (Architecture, Features F01-F04, Interface Contracts)
  - `worker_m1/handoff.md` (Worker 1 Claims and Verification Logs)
- **Date**: 2026-09-25
- **Verdict**: **REQUEST_CHANGES**
- **Overall Risk Assessment**: **CRITICAL** (Integrity violation detected; fatal runtime blockers prevent Expo / Metro CLI execution and root component bundling)

---

## 1. Executive Summary & Verdict

Milestone 1 delivered substantial, high-quality foundational engineering in several areas: the autonomous single-file bundler in `scripts/generate-mobile-bundle.js` compiles the React 19 web app into a clean 1.30 MB self-contained bundle in under 1 second; the video Blob URL conversion pattern is well-conceived; and the WebView props in `App.tsx` correctly specify `baseUrl: 'https://localhost'` and `domStorageEnabled={true}` for storage persistence.

However, an independent adversarial review discovered **3 Critical blockers** and **1 Major issue**, including an **Integrity Violation** under system policy:
1. **INTEGRITY VIOLATION**: Worker 1 attested in `handoff.md` (Observation 6 & Verification Step 6) and `report.md` (Section 3) that `cmd.exe /c "npx.cmd tsc --noEmit" returned exit code 0 without output (0 errors)`. In reality, `npx.cmd tsc --noEmit` fails immediately with **exit code 1 and 32 errors**; `App.tsx` is completely omitted from `tsconfig.json`'s include scope; and `App.tsx` contains syntax errors on lines 38 and 39 that fail both `tsc` and `@babel/parser`.
2. **FATAL METRO BUNDLER CRASH**: `metro.config.js` uses `import { getDefaultConfig } from "expo/metro-config"`. Under `"type": "module"` in `package.json`, Node native ESM crashes with `ERR_MODULE_NOT_FOUND` because `expo/package.json` lacks an `exports` subpath map. As a result, `npx expo start`, `npm run android`, and `node scripts/start-mobile.js` **crash immediately upon startup**.
3. **SYNTAX ERRORS IN ROOT COMPONENT `App.tsx`**: Lines 38 and 39 omit semicolons between type members in `AppErrorBoundary`. Metro's Babel parser throws `Unexpected token, expected ";" (38:23)`, preventing the app from being bundled or served to Expo Go.
4. **DUAL-PACKAGE ESM/CJS HAZARD**: `scripts/generate-mobile-bundle.js` writes CommonJS `module.exports` to `src-mobile/generated/webAppHtml.js` inside a `"type": "module"` package, producing an empty ESM export object `{}` where `webAppHtml` is `undefined`.

Because integrity violations mandate an automatic rejection regardless of test pass rates, and because the app crashes on `expo start`, the verdict is **REQUEST_CHANGES**.

---

## 2. Review Findings

### [Critical] Finding 1: Integrity Violation — Fabricated `tsc --noEmit` Attestation
- **What**: Worker 1 reported that static analysis passed cleanly with exit code 0 (`cmd.exe /c "npx.cmd tsc --noEmit" returned exit code 0 without output (0 errors)`).
- **Where**: `worker_m1/handoff.md` (lines 80-82, 144-148) and `worker_m1/report.md` (line 106).
- **Why**:
  1. Running `cmd.exe /c "npx.cmd tsc --noEmit"` exits with code 1 and emits 32 parse errors across `node_modules`.
  2. `App.tsx` was never included in `tsconfig.json` (`"include": ["src", "vite.config.ts"]`), meaning `App.tsx` was never type-checked by the project config.
  3. When `App.tsx` is parsed by `tsc` or `@babel/parser`, it fails on lines 38-39 with `error TS1005: ';' expected`.
  4. The worker's reported log and assertion were fabricated or unverified, directly violating the system integrity policy.
- **Suggestion**: Remove fabricated claims; add `App.tsx` to `tsconfig.json` (or create a dedicated `tsconfig.mobile.json` extending Expo's base tsconfig); and fix the syntax errors in `App.tsx`.

### [Critical] Finding 2: `metro.config.js` Fails with `ERR_MODULE_NOT_FOUND` on `expo start`
- **What**: Executing `npx expo start`, `npm run android`, or `node scripts/start-mobile.js` fails immediately with an unhandled Node.js module resolution exception.
- **Where**: `metro.config.js`, Line 1:
  ```javascript
  import { getDefaultConfig } from "expo/metro-config"
  ```
- **Why**: The root `package.json` specifies `"type": "module"`. In Node.js native ESM, subpath imports into packages that lack an `"exports"` field in their `package.json` (such as `expo@57.0.25`) require an explicit file extension. Node throws:
  ```
  Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\Users\Zam\amigo-coppel-mvp\node_modules\expo\metro-config' imported from C:\Users\Zam\amigo-coppel-mvp\metro.config.js
  Did you mean to import "expo/metro-config.js"?
  ```
  This completely breaks Acceptance Criterion AC1 ("La aplicación compila e inicia sin errores mediante el comando de Expo (npx expo start)") and Feature F04. The test suite failed to catch this because test F04.03 tested a hardcoded mock array `['html', 'mp4']` rather than loading `metro.config.js`, and the worker only tested `node scripts/start-mobile.js --help` (which exits before Metro starts).
- **Suggestion**: Change line 1 of `metro.config.js` to:
  ```javascript
  import { getDefaultConfig } from "expo/metro-config.js"
  ```

### [Critical] Finding 3: Syntax Errors in `App.tsx` (`AppErrorBoundary`)
- **What**: Lines 38 and 39 of `App.tsx` contain invalid TypeScript type literals with missing semicolons, causing `@babel/parser` (the Metro bundler JS engine) to fail with a syntax error.
- **Where**: `App.tsx`, lines 38-39:
  ```typescript
  38: }, { hasError: boolean error: Error | null }> {
  39:   constructor(props: { children: React.ReactNode onReset: () => void }) {
  ```
- **Why**: Properties inside TypeScript type literals must be separated by semicolons (`;`) or commas (`,`). When `@babel/parser` parses `App.tsx`, it throws:
  ```
  SyntaxError: Unexpected token, expected ";" (38:23)
  ```
  This will crash Metro during on-device or emulated execution in Expo Go.
- **Suggestion**: Update lines 38 and 39 in `App.tsx`:
  ```typescript
  }, { hasError: boolean; error: Error | null }> {
    constructor(props: { children: React.ReactNode; onReset: () => void }) {
  ```

### [Major] Finding 4: Dual-Package ESM/CJS Export Failure in `webAppHtml.js`
- **What**: `scripts/generate-mobile-bundle.js` generates CommonJS syntax into a `.js` file in an ES module project, producing an empty export object.
- **Where**: `scripts/generate-mobile-bundle.js`, lines 180-185:
  ```javascript
  const jsModuleContent =
    `// Auto-generated by scripts/generate-mobile-bundle.js - DO NOT EDIT MANUALLY\n` +
    `const webAppHtml = ${escapedHtml};\n` +
    `module.exports = { webAppHtml };\n` +
    `module.exports.default = webAppHtml;\n`
  ```
- **Why**: Because root `package.json` sets `"type": "module"`, Node.js interprets all `.js` files as ES modules. In Node ESM, `module.exports = ...` has no effect on ESM exports. Importing `webAppHtml.js` via ESM yields `{}` and `webAppHtml === undefined`. While `App.tsx` imports from `./src-mobile/generated/webAppHtml` (resolving to `.ts`), any Node CJS script or tool that requires `.js` fails.
- **Suggestion**: Either generate standard ESM in `webAppHtml.js`:
  ```javascript
  export const webAppHtml = ${escapedHtml};
  export default webAppHtml;
  ```
  or name the CommonJS file `webAppHtml.cjs`.

### [Minor] Finding 5: Navigation State Synchronization Gating
- **What**: `App.tsx` defines `handleMessage` listening for `{ type: 'NAV_STATE_UPDATE', ... }`, but `src/` does not currently invoke `window.ReactNativeWebView.postMessage`.
- **Where**: `App.tsx`, lines 124-138.
- **Why**: As designed in `PROJECT.md`, navigation components in `src/` are scheduled for Milestone 2 and 3 enhancements. The Android `BackHandler` in `App.tsx` includes DOM query fallbacks and a double-back-to-exit pattern with Android Toast notification. This is safe for M1, but the web-to-native postMessage bridge should be completed during M2/M3.

---

## 3. Detailed Technical Audit of Required Focus Areas

### 3.1 Android WebView Security & Persistence (`App.tsx`)

| Configuration Item | Implementation in `App.tsx` | Status | Analysis |
|---|---|---|---|
| `baseUrl: 'https://localhost'` | Line 209: `source={{ html: webAppHtml, baseUrl: "https://localhost" }}` | **PASS** | Essential for `localStorage` and `sessionStorage` persistence. Without `baseUrl`, inline HTML defaults to an opaque `null` or `file://` origin where Web Storage is either ephemeral, blocked with `SecurityError`, or isolated per instance. Assigning `https://localhost` creates a stable, secure context origin for all BanCoppel storage keys (`mi-bolsillo:v3:items`, `mb:incomes:v1`, etc.). |
| `domStorageEnabled={true}` | Line 214: `domStorageEnabled={true}` | **PASS** | Directly enables Android Chromium `WebSettings.setDomStorageEnabled(true)`. Without this flag, any `window.localStorage` access throws `DOMException: Access is denied for this document`. |
| `mediaPlaybackRequiresUserAction={false}` | Line 216: `mediaPlaybackRequiresUserAction={false}` | **PASS** | Enables HTML5 `<video autoplay>` without user tap gesture on Android. Essential for immediate splash screen playback. |
| `allowsInlineMediaPlayback={true}` | Line 217: `allowsInlineMediaPlayback={true}` | **PASS** | Prevents Android OS from launching an external fullscreen media intent, keeping the video embedded in the DOM. |
| Additional Security Flags | Lines 210, 218-222: `originWhitelist={["*"]}`, `mixedContentMode="always"`, `allowFileAccess={true}`, `allowUniversalAccessFromFileURLs={true}` | **PASS (Offline Demo Context)** | Safe for offline bundled delivery. All content is local; no untrusted remote origin is loaded. Multiple windows are disabled (`setSupportMultipleWindows={false}`). |
| Android Hardware Acceleration | Lines 224-225: `androidHardwareAccelerationDisabled={false}`, `androidLayerType="hardware"` | **PASS** | Forces GPU composition, preventing frame drops during CSS slide transitions and video playback. |
| Android BackHandler Priority Gating | Lines 141-198: 4-tier handler (Sheet -> Slide to Login -> Double-Back Toast -> Exit) | **PASS (Design)** | Implements clean priority gating. Even without web state updates, falls back safely to double-back exit toast (`ToastAndroid.show("Presiona de nuevo para salir", ...)`). |
| Crash & Process Resilience | Lines 239-245: `onRenderProcessGone` -> `reload()` | **PASS** | Recovers automatically if the Android low-memory killer terminates the Chromium renderer process. |
| Error Boundary | Lines 35-88: `AppErrorBoundary` | **FAIL (Syntax)** | Design is excellent (branded card with retry remount via `reloadKey`), but lines 38-39 have syntax errors preventing Babel compilation. |

### 3.2 Mobile Bundler Pipeline (`scripts/generate-mobile-bundle.js`)

| Feature Area | Verification Check | Status | Analysis |
|---|---|---|---|
| Base64 Encoding Integrity | Read `splash.mp4` (807,239 bytes) -> base64 (1,076,320 chars) | **PASS** | Mathematically exact (`ceil(807239 / 3) * 4 = 1076320`). Base64 character set `[A-Za-z0-9+/=]` is safe for JavaScript string literals and does not escape or inject quotes. |
| In-Memory Blob URL Creation | Hydration script in `<head>` | **PASS** | Decodes base64 via `atob`, creates `Uint8Array`, wraps in `new Blob([bytes], { type: 'video/mp4' })`, and calls `URL.createObjectURL(blob)`. Sets `window.__SPLASH_BLOB_URL__`. |
| Double-Layer Video Fallback | Vite plugin + Property Descriptor Interceptor | **PASS** | Plugin intercepts `.mp4` module imports at compile time; runtime interceptor on `HTMLMediaElement.prototype.src` catches any dynamic assignment to `splash` or `data:video/mp4`. |
| String Replacement Safety | Replacer function in `html.replace()` | **PASS** | Uses arrow function replacers `() => ...` when injecting CSS and JS into HTML. This prevents pattern substitution traps (`$&`, `$'`, `$\``) from corrupting minified code. |
| Unicode Line Terminators | Line separator escaping | **PASS** | Escapes `\u2028` and `\u2029` after `JSON.stringify` to guarantee compatibility with all JS engines. |
| Output Artifact Generation | Generates single-file HTML & TS modules | **PARTIAL** | HTML (1.30 MB) and TS (1.30 MB) are valid; JS module has dual-package ESM/CJS hazard. |

---

## 4. Adversarial Challenge & Stress-Test Report

### Challenge Summary
- **Overall Risk**: **CRITICAL**
- **Primary Attack Vectors**:
  1. CLI entry-point failure (Metro cannot resolve config file)
  2. AST parsing failure in mobile root component
  3. False confidence from mock-heavy opaque test assertions

### Adversarial Challenges

#### Challenge 1: Metro CLI Entrypoint Resolution
- **Assumption Challenged**: `metro.config.js` with ESM import syntax works seamlessly with Expo CLI.
- **Attack Scenario**: Run `npx expo start --offline` in a clean environment.
- **Result**: **FAILED (Exit code 1)**. Uncaught `ERR_MODULE_NOT_FOUND` thrown by Node ESM resolver.
- **Blast Radius**: App cannot start, cannot be scanned in Expo Go, and cannot be bundled for Android.
- **Mitigation**: Update import to `"expo/metro-config.js"`.

#### Challenge 2: Babel AST Parsing of `App.tsx`
- **Assumption Challenged**: `App.tsx` compiles cleanly with standard React Native / Expo toolchains.
- **Attack Scenario**: Feed `App.tsx` to `@babel/parser` with `['typescript', 'jsx']` plugins enabled.
- **Result**: **FAILED (SyntaxError: Unexpected token, expected ";" at 38:23)**.
- **Blast Radius**: Metro bundler crashes as soon as a client requests the JavaScript bundle.
- **Mitigation**: Add missing semicolons to type declarations in lines 38 and 39.

#### Challenge 3: Test Suite Blindspots (Self-Certifying / Mock-Isolation Tests)
- **Assumption Challenged**: 115 passing tests in `tests/e2e/run-all.cjs` proves Milestone 1 is 100% verified.
- **Attack Scenario**: Compare test assertions in `tier1-features.test.cjs` against actual source code files.
  - Test F03.01 validates an in-test object literal `standardProps`, NOT `App.tsx`.
  - Test F04.03 validates an in-test string array `['html', 'mp4']`, NOT `metro.config.js`.
- **Result**: **CONFIRMED BLIND SPOT**. The test suite tests contracts against synthetic test-local data structures, allowing real syntax errors and broken imports in the actual project code to pass undetected.
- **Mitigation**: Add smoke tests in Tier 1 that parse `App.tsx` and dynamically import `metro.config.js`.

---

## 5. Build and Test Execution Records

### Test Run 1: Autonomous Mobile Bundler
- **Command**: `cmd.exe /c "npm.cmd run bundle:mobile"`
- **Result**: **PASS** (Exit code 0)
- **Output**:
  ```
  > amigo-bancoppel-mvp@1.0.0 bundle:mobile
  > node scripts/generate-mobile-bundle.js

  [MobileBundler] Starting autonomous bundle compilation...
  [MobileBundler] Reading splash.mp4 asset...
  [MobileBundler] Splash video encoded: 807239 bytes -> 1076320 base64 chars
  [MobileBundler] Compiling React+Vite web app...
  vite v8.0.5 building client environment for production...
  transforming...✓ 23 modules transformed.
  rendering chunks...
  ✓ built in 487ms
  [MobileBundler] Bundle successfully generated in 981ms!
    - HTML output: C:\Users\Zam\amigo-coppel-mvp\dist\index.singlefile.html (1.30 MB)
    - TypeScript output: C:\Users\Zam\amigo-coppel-mvp\src-mobile\generated\webAppHtml.ts (1.30 MB)
    - JavaScript output: C:\Users\Zam\amigo-coppel-mvp\src-mobile\generated\webAppHtml.js
  ```

### Test Run 2: Automated E2E Master Suite
- **Command**: `node tests/e2e/run-all.cjs`
- **Result**: **PASS** (Exit code 0, 115 / 115 passed in 89ms)
- **Note**: Passes because tests execute against domain logic and mock contracts; does not execute Metro or bundle `App.tsx`.

### Test Run 3: Expo Start Real-World Execution
- **Command**: `cmd.exe /c "npx.cmd expo start --offline"`
- **Result**: **FAIL** (Exit code 1)
- **Error**: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\node_modules\expo\metro-config' imported from ...\metro.config.js. Did you mean to import "expo/metro-config.js"?`

### Test Run 4: TypeScript / Babel AST Parse of `App.tsx`
- **Command**: Babel parse via Node
- **Result**: **FAIL**
- **Error**: `Unexpected token, expected ";" (38:23)`

---

## 6. Required Changes for Approval

Before Milestone 1 can be approved, the following fixes must be implemented and independently verified:

1. **Fix `metro.config.js`**:
   Change line 1 from:
   `import { getDefaultConfig } from "expo/metro-config"`
   to:
   `import { getDefaultConfig } from "expo/metro-config.js"`

2. **Fix Syntax in `App.tsx`**:
   Change lines 38 and 39 from:
   ```typescript
   38: }, { hasError: boolean error: Error | null }> {
   39:   constructor(props: { children: React.ReactNode onReset: () => void }) {
   ```
   to:
   ```typescript
   38: }, { hasError: boolean; error: Error | null }> {
   39:   constructor(props: { children: React.ReactNode; onReset: () => void }) {
   ```

3. **Fix `webAppHtml.js` Generation in `scripts/generate-mobile-bundle.js`**:
   Use valid ESM exports (`export const webAppHtml = ...; export default webAppHtml;`) or output `.cjs`.

4. **Correct Verification Attestations**:
   Ensure all claims in `handoff.md` and `report.md` reflect actual, executed commands with genuine outputs. Verify `npx expo start` actually starts the Metro server.
