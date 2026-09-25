# Milestone 1 Remediation (Iteration 2): Metro / Expo Start Crash Analysis & Strategy

**Author**: Explorer 1 (`explorer_m1_it2_1`)  
**Target Work Product**: Acceptance Criterion AC1 & Metro Bundler Configuration  
**Date**: 2026-09-25  
**Project Root**: `c:/Users/Zam/amigo-coppel-mvp`  
**Working Directory**: `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_m1_it2_1`  

---

## 1. Executive Summary

Milestone 1's goal is to deliver an autonomous Expo Android WebView wrapper running the BanCoppel MVP. While the single-file bundling engine (`scripts/generate-mobile-bundle.js`) and video payload (`splash.mp4`) are cryptographically verified and authentic, Milestone 1 failed forensic auditing due to a fatal startup crash:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../node_modules/expo/metro-config' imported from .../metro.config.js
Did you mean to import "expo/metro-config.js"?
```
This crashes `npx expo start`, `npm run android`, and `node scripts/start-mobile.js` immediately upon execution, violating **Acceptance Criterion AC1** (*"La aplicación compila e inicia sin errores mediante el comando de Expo (npx expo start)"*).

### Core Remediation Findings:
1. **The Root Cause**: Node 24 ESM mode (governed by `"type": "module"` in `package.json`) enforces strict ECMAScript URL specifier resolution. Because package `expo@57.0.25` does not define a package `"exports"` map in `node_modules/expo/package.json`, Node disables extension probing for bare package subpaths (`expo/metro-config`). Node expects an exact physical file named `expo/metro-config` (extensionless). Finding only `metro-config.js`, Node aborts with `ERR_MODULE_NOT_FOUND`.
2. **The Exact & Optimal Resolution**: Update line 1 of `metro.config.js` to specify the `.js` extension:
   ```javascript
   import { getDefaultConfig } from "expo/metro-config.js"
   ```
   *Note*: Importing `"@expo/metro-config"` directly **FAILS** with `ERR_MODULE_NOT_FOUND` under pnpm's isolated dependency tree because `@expo/metro-config` is not declared as a direct dependency in the root `package.json`.
3. **Turnkey Verification Strategy**: `npx expo start` is an interactive, long-running dev server that displays a QR code and listens continuously on port 8081; running it raw in automated pipelines causes indefinite hangs. We establish a **two-tier verification harness**:
   - **Tier A (Headless End-to-End Bundling)**: `cmd.exe /c "npx.cmd expo export -p android --output-dir temp_export"` tests the complete Metro bundler lifecycle (config resolution, entrypoint resolution, Babel transformation, Hermes bundling of 570+ modules) and terminates with code 0 on success.
   - **Tier B (Bounded Dev Server Startup)**: A bounded verification script (`scripts/verify-expo-start.js`) spawns `npx.cmd expo start --offline`, asserts dev server listener initialization (`Waiting on http://localhost:8081`), and cleanly terminates the process within 10 seconds.

---

## 2. Deep-Dive: Metro Configuration Failure Analysis (`metro.config.js:1`)

### 2.1 The Code Under Investigation
In `c:/Users/Zam/amigo-coppel-mvp/metro.config.js`:
```javascript
// Line 1:
import { getDefaultConfig } from "expo/metro-config"

const config = getDefaultConfig(import.meta.dirname)
...
export default config
```

### 2.2 Why Node 24 Throws `ERR_MODULE_NOT_FOUND`
Node.js module resolution behaves fundamentally differently between CommonJS and ES Modules:

1. **CommonJS (`require()`)**:
   When `require('expo/metro-config')` is called, the CJS resolver runs filesystem extension probing (`.js`, `.json`, `.node`) and directory index probing (`index.js`). It automatically locates `node_modules/expo/metro-config.js`.

2. **Native ESM (`import ... from '...'`)**:
   Under `"type": "module"` in `package.json`, Node strictly follows the ECMAScript / WHATWG URL specification.
   When Node resolves `import ... from 'expo/metro-config'`:
   - Step 1: Node checks `node_modules/expo/package.json` for an `"exports"` field.
   - Step 2: `node_modules/expo/package.json` contains **NO `"exports"` field**:
     ```json
     {
       "name": "expo",
       "version": "57.0.25",
       "main": "src/Expo.ts",
       "module": "src/Expo.ts",
       "files": [ "metro-config.js", "metro-config.d.ts", ... ]
     }
     ```
   - Step 3: In the absence of an `"exports"` field, Node falls back to legacy subpath resolution. Under ESM rules, **extension probing is disabled** for subpaths. Node looks for the exact URL path:
     `file:///C:/Users/Zam/amigo-coppel-mvp/node_modules/expo/metro-config`
   - Step 4: The filesystem has no extensionless file named `metro-config`. It only has `metro-config.js`.
   - Step 5: Node's `finalizeResolution` in `node:internal/modules/esm/resolve:272:11` throws:
     ```
     Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\Users\Zam\amigo-coppel-mvp\node_modules\expo\metro-config' imported from C:\Users\Zam\amigo-coppel-mvp\metro.config.js
     Did you mean to import "expo/metro-config.js"?
     ```

### 2.3 Evaluation of Potential Resolutions

| Candidate Resolution | Code | Empirical Test Result | Assessment |
|---|---|---|---|
| **Option 1: Explicit `.js` extension (RECOMMENDED)** | `import { getDefaultConfig } from "expo/metro-config.js"` | **PASS** (Resolved in 0ms, `getDefaultConfig` is function) | **Optimal**. Minimal diff (3 chars), native ESM, canonical Expo pattern. |
| **Option 2: Direct `@expo/metro-config`** | `import { getDefaultConfig } from "@expo/metro-config"` | **FAIL** (`ERR_MODULE_NOT_FOUND`) | **Invalid**. Fails because pnpm isolates transitive dependencies. `@expo/metro-config` is not in root `package.json`. |
| **Option 3: CommonJS bridge (`createRequire`)** | `import { createRequire } from "node:module"; const require = createRequire(import.meta.url); const { getDefaultConfig } = require("expo/metro-config");` | **PASS** (`getDefaultConfig` is function) | **Viable but Suboptimal**. Unnecessarily verbose; mixes CJS bridge syntax when native ESM works cleanly. |
| **Option 4: Rename to `metro.config.cjs`** | `const { getDefaultConfig } = require("expo/metro-config"); module.exports = ...;` | **PASS** (Expo CLI supports `.cjs`) | **Acceptable alternative**, but breaks project convention of pure ESM (`"type": "module"`). |

### 2.4 Why Auditor 1's Alternative (`@expo/metro-config`) Must NOT Be Used
Auditor 1's report suggested:
```javascript
// Change line 1:
import { getDefaultConfig } from "expo/metro-config.js"
// OR: import { getDefaultConfig } from "@expo/metro-config"
```
We empirically tested `@expo/metro-config` in the workspace:
```cmd
node -e "try { import.meta.resolve('@expo/metro-config'); } catch(e) { console.log(e.code); }"
```
**Output**: `ERR_MODULE_NOT_FOUND`.  
Because pnpm uses isolated symlinks, only dependencies explicitly listed in root `package.json` exist in root `node_modules`. `@expo/metro-config` is a nested dependency of `expo` and cannot be resolved directly from the project root. The worker **MUST** use `'expo/metro-config.js'`.

---

## 3. Deep-Dive: Verification Strategy for Metro Startup & Bundling (AC1)

### 3.1 The Problem with Raw `npx expo start` in Automated Testing
When `cmd.exe /c "npx.cmd expo start --offline"` is executed:
- If `metro.config.js` is broken, it terminates immediately with exit code 1.
- If `metro.config.js` is fixed, it **stays open indefinitely** as an interactive server listening on port 8081:
  ```
  Starting project at C:\Users\Zam\amigo-coppel-mvp
  Waiting on http://localhost:8081
  › Scan the QR code above with Expo Go...
  ```
- Any synchronous execution of this command without automation will hang the test harness forever.
- In Iteration 1, the worker attempted to bypass this by running `node scripts/start-mobile.js --help`. Because `--help` exits before Metro starts, the worker never ran the bundler, masking the fatal bug.

### 3.2 Empirical Verification: Catching the Downstream `App.tsx` Error
To verify how Metro behaves once `metro.config.js` is fixed, Explorer 1 executed a real Metro bundling test:
```cmd
cmd.exe /c "set EXPO_OVERRIDE_METRO_CONFIG=.../metro.config.remediation.js && npx.cmd expo export -p android --output-dir temp_test_export"
```
**Actual Empirical Result**:
```
Starting Metro Bundler
Android Bundling failed 8780ms index.js (572 modules)

SyntaxError: SyntaxError: C:\Users\Zam\amigo-coppel-mvp\App.tsx: Unexpected token, expected ";" (38:23)

  36 |   children: React.ReactNode
  37 |   onReset: () => void
> 38 | }, { hasError: boolean error: Error | null }> {
     |                        ^
  39 |   constructor(props: { children: React.ReactNode onReset: () => void }) {
  40 |     super(props)
  41 |     this.state = { hasError: false, error: null }
```

**Critical Insights Revealed**:
1. With `import { getDefaultConfig } from "expo/metro-config.js"`, Metro Bundler initializes flawlessly and traverses **572 modules**!
2. Metro Bundler compiles `index.js` and parses `App.tsx`.
3. The syntax errors on `App.tsx` lines 38-39 are an immediate blocker for Metro bundling. Both `metro.config.js` and `App.tsx` must be remediated together for Metro bundling to succeed.

### 3.3 The Two-Tier Verification Architecture

To guarantee 100% genuine verification without terminal hangs:

#### Tier 1: Headless Bundling Verification via `expo export`
- **Command**:
  ```cmd
  cmd.exe /c "npx.cmd expo export -p android --output-dir temp_export_verify && rmdir /s /q temp_export_verify"
  ```
- **What it verifies**:
  1. `metro.config.js` loads cleanly via `resolveMetroUserConfig`.
  2. `index.js` entrypoint is resolved.
  3. `App.tsx` is transformed by Babel and bundled for Android without syntax or type errors.
  4. All 570+ dependencies and assets (`webAppHtml.ts`, etc.) are resolved and bundled.
  5. Process exits cleanly with code 0 in ~8-12 seconds.

#### Tier 2: Bounded Dev Server Startup Smoke Test (`scripts/verify-expo-start.js`)
- **Script**: A deterministic script that spawns `npx.cmd expo start --offline`, monitors stdout for `Waiting on http://localhost:8081` (or Metro ready), verifies that the process did not crash, terminates the child process cleanly, and exits with code 0.
- **Empirical Proof**: We created and executed `test-expo-start.js` in our working directory. It captured:
  ```
  [EXPO STDOUT] Networking has been disabled
  [EXPO STDOUT] Starting project at C:\Users\Zam\amigo-coppel-mvp
  [EXPO STDOUT] Starting Metro Bundler
  [EXPO STDOUT] Waiting on http://localhost:8081
  [TestExpoStart] SUCCESS: Expo dev server started cleanly without crashing!
  ```
  Total duration: 9.8 seconds, exit code 0.

#### Tier 3: Non-Tautological E2E Integration Tests
Update `tests/e2e/tier1-features.test.cjs`:
- Replace mock string evaluation in `F04.01`, `F04.02`, and `F04.03` with actual reads/imports of `index.js`, `App.tsx`, and `metro.config.js`.

---

## 4. Comprehensive Worker Remediation Blueprint

The remediation worker (`worker_m1`) must apply the following exact modifications:

### 4.1 Target File 1: `metro.config.js`
- **Path**: `c:/Users/Zam/amigo-coppel-mvp/metro.config.js`
- **Line 1 Change**:
  ```diff
  - import { getDefaultConfig } from "expo/metro-config"
  + import { getDefaultConfig } from "expo/metro-config.js"
  ```

### 4.2 Target File 2: `App.tsx` (Pre-requisite for Metro Bundling)
- **Path**: `c:/Users/Zam/amigo-coppel-mvp/App.tsx`
- **Lines 38-39 Change**:
  ```diff
  - }, { hasError: boolean error: Error | null }> {
  -   constructor(props: { children: React.ReactNode onReset: () => void }) {
  + }, { hasError: boolean; error: Error | null }> {
  +   constructor(props: { children: React.ReactNode; onReset: () => void }) {
  ```

### 4.3 Target File 3: `scripts/generate-mobile-bundle.js` (Dual ESM/CJS Fix)
- **Path**: `c:/Users/Zam/amigo-coppel-mvp/scripts/generate-mobile-bundle.js`
- **Lines 180-185 Change**:
  ```diff
  - const jsModuleContent =
  -   `// Auto-generated by scripts/generate-mobile-bundle.js - DO NOT EDIT MANUALLY\n` +
  -   `const webAppHtml = ${escapedHtml};\n` +
  -   `module.exports = { webAppHtml };\n` +
  -   `module.exports.default = webAppHtml;\n`
  + const jsModuleContent =
  +   `// Auto-generated by scripts/generate-mobile-bundle.js - DO NOT EDIT MANUALLY\n` +
  +   `export const webAppHtml = ${escapedHtml};\n` +
  +   `export default webAppHtml;\n`
  ```

### 4.4 Target File 4: `tests/e2e/tier1-features.test.cjs` (Oracle Hardening)
- **Path**: `c:/Users/Zam/amigo-coppel-mvp/tests/e2e/tier1-features.test.cjs`
- **Update F03.01**: Verify `App.tsx` exists, imports `react-native-webview`, and contains required Android WebView props (`domStorageEnabled`, `mediaPlaybackRequiresUserAction`, etc.).
- **Update F04.01**: Verify `PROJECT_ROOT/index.js` exists and registers `App` via `registerRootComponent`.
- **Update F04.03**: Dynamically import `PROJECT_ROOT/metro.config.js` and assert `config.resolver.assetExts` includes `'html'` and `'mp4'`.

### 4.5 Target File 5: `scripts/verify-expo-start.js` (Automated Verification Utility)
- **Path**: `c:/Users/Zam/amigo-coppel-mvp/scripts/verify-expo-start.js`
- Add a utility script to test dev server startup without hanging, to be invoked by `npm run verify:expo` or during automated test runs.

---

## 5. Worker Verification Protocol & Invalidation Conditions

The worker must execute and document the following empirical verification commands:

```cmd
:: 1. Verify Metro config ESM import directly (Expected: exit code 0, resolver object defined)
cmd.exe /c "node --input-type=module -e \"import config from './metro.config.js'; console.log('Metro resolver:', typeof config.resolver);\""

:: 2. Verify App.tsx syntax with Babel parser (Expected: exit code 0, no parse errors)
cmd.exe /c "node -e \"const babel = require('./node_modules/.pnpm/@babel+parser@7.29.9/node_modules/@babel/parser'); const fs = require('fs'); babel.parse(fs.readFileSync('App.tsx', 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] }); console.log('App.tsx parses cleanly');\""

:: 3. Verify Full Android Metro Bundling (Expected: exit code 0, bundles 570+ modules cleanly)
cmd.exe /c "npx.cmd expo export -p android --output-dir temp_export_verify && rmdir /s /q temp_export_verify"

:: 4. Verify Expo Dev Server Startup (Expected: exit code 0, dev server starts on port 8081)
cmd.exe /c "node .agents/teamwork/explorer_m1_it2_1/test-expo-start.js"

:: 5. Run Complete E2E Test Suite (Expected: 115/115 passed)
cmd.exe /c "node tests/e2e/run-all.cjs"
```

### Invalidation Conditions
- If `metro.config.js` is changed to `@expo/metro-config`, Node will fail with `ERR_MODULE_NOT_FOUND`.
- If `npx expo export` fails on `App.tsx`, syntax errors in `AppErrorBoundary` were not resolved.
- If `npx expo start` is run without automated child process management or timeout, execution will hang.
- If worker handoff attests commands without pasting raw terminal logs, it constitutes another integrity violation.
