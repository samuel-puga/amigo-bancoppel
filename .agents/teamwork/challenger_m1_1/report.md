# Milestone 1 Adversarial Stress Test & Verification Report

**Agent**: Challenger 1 (`challenger_m1_1`)  
**Role**: Empirical Challenger (critic, specialist)  
**Target Milestone**: Milestone 1 (Expo Android Wrapper & Autonomous Bundler)  
**Date**: 2026-09-25  
**Final Verdict**: **REJECT** (Blocking defect found in Expo CLI startup and ESM/CJS artifact compatibility)

---

## Challenge Summary

**Overall risk assessment**: **HIGH**  
While the single-file packaging engine (`scripts/generate-mobile-bundle.js`) and generated HTML payload (`dist/index.singlefile.html` and `src-mobile/generated/webAppHtml.ts`) demonstrate high mathematical integrity, deterministic output, and complete offline autonomy, the mobile execution pipeline fails at the first step of the developer and user experience: `npx expo start` and `node scripts/start-mobile.js` crash immediately on launch due to a Node ESM subpath resolution failure in `metro.config.js`. Additionally, the bundle generator outputs an invalid CommonJS module in `src-mobile/generated/webAppHtml.js` despite the project's root `"type": "module"` configuration.

---

## Empirical Challenge Matrix & Test Results

| Test ID | Adversarial Test Scenario | Expected Outcome | Empirical Behavior | Status |
|---|---|---|---|:---:|
| **ADV-1.01** | Bundling script execution (`node scripts/generate-mobile-bundle.js`) | Generates HTML, TS, and JS artifacts in < 3000ms | Generates all 3 artifacts in 1204ms cleanly | **PASS** |
| **ADV-1.02** | Repeated builds (3 consecutive iterations) | Identical SHA-256 hash across runs, zero file lock / EPERM errors | Exact SHA-256 match (`3b6c2...`) on all 3 builds; zero locks | **PASS** |
| **ADV-1.03** | Error resiliency under missing `splash.mp4` asset | Fails safely with explicit, informative error message | Throws `Error: Splash video not found at: .../splash.mp4` | **PASS** |
| **ADV-2.01** | TypeScript export contract (`webAppHtml.ts`) | Exports `export const webAppHtml: string = ...` matching HTML exactly | 100% string match (1,366,112 bytes) with `dist/index.singlefile.html` | **PASS** |
| **ADV-2.02** | Inlined CSS integrity & styling tokens | Zero external `<link rel="stylesheet">`, balanced braces, utility rules | Zero `<link rel="stylesheet">`, balanced `{}` (depth=0), 11,013 bytes of CSS | **PASS** |
| **ADV-2.03** | Inlined JavaScript syntax & structure | Zero external asset scripts, valid ES module script parsing | Single `<script type="module">`, 276,882 bytes, parses cleanly via `vm.Script` | **PASS** |
| **ADV-2.04** | Splash video Base64 encoding & Blob hydration | Decodes to 807,239 bytes, matching SHA-256 and `ftyp` MP4 header | Exact SHA-256 match, `ftyp` header at bytes 4-8, Blob logic verified | **PASS** |
| **ADV-2.05** | BanCoppel Logo Base64 inlining | Inlined Base64 PNG with valid 8-byte PNG signature | Matches `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A` | **PASS** |
| **ADV-3.01** | External script / iframe dependency check | Zero `<script src="http...">` or `<iframe>` tags | 0 external script src tags, 0 iframe tags | **PASS** |
| **ADV-3.02** | Network URL inventory & offline render safety | Zero runtime executable network calls; offline CSS fallback fonts | Zero runtime API/CDN calls; Google Fonts `@import` is non-blocking with fallback | **PASS** |
| **ADV-4.01** | Blob hydration script isolated DOM sandbox test | Creates in-memory Blob URL and patches `HTMLMediaElement.prototype.src` | Successfully intercepts `data:video/mp4` and sets `window.__SPLASH_BLOB_URL__` | **PASS** |
| **ADV-4.02** | LocalStorage edge cases (empty, corrupt, quota exceeded) | Graceful fallbacks without unhandled exceptions | Default state on empty; fallback on invalid JSON; caught QuotaExceededError | **PASS** |
| **ADV-4.03** | SessionStorage splash-seen persistence | Suppresses video replay on warm start navigation | Warm visit returns `splash-seen: true`, skipping video replay | **PASS** |
| **ADV-5.01** | `App.tsx` WebView props & BackHandler wiring | Full 26-prop contract (`domStorageEnabled`, `hardwareLayer`, `BackHandler`) | All required Android props declared; hardware back double-tap exit pattern | **PASS** |
| **ADV-5.02** | `src-mobile/generated/webAppHtml.js` module scope check | Valid JavaScript module in ESM project | **FAIL**: Throws `ReferenceError: module is not defined in ES module scope` | **DEFECT** |
| **ADV-5.03** | `metro.config.js` and Expo CLI startup execution | `npx expo start` starts Metro bundler without crash | **FAIL**: Throws `ERR_MODULE_NOT_FOUND` on `import "expo/metro-config"` | **BLOCKER** |

---

## Detailed Challenges & Defect Analysis

### 🚨 Challenge 1 [CRITICAL BLOCKER]: `metro.config.js` Fails on Startup Under Node ESM

- **Requirement / Acceptance Criterion Challenged**:
  - `ORIGINAL_REQUEST.md` Acceptance Criteria: *"La aplicación compila e inicia sin errores mediante el comando de Expo (npx expo start)."*
  - `PROJECT.md` Feature F04: *"Expo Go CLI Execution: Command `npx expo start` / `npm run android` runs cleanly without bundling errors."*
- **Worker Claim Challenged**:
  - Worker Handoff section 4 claims Milestone 1 is *"100% complete and verified... ready for Milestone 2"*.
- **Empirical Attack Scenario**:
  Executed `npx expo start --offline` and `node scripts/start-mobile.js --offline`:
  ```cmd
  node scripts/start-mobile.js --offline
  ```
- **Verbatim Error Output**:
  ```
  Starting project at C:\Users\Zam\amigo-coppel-mvp
  Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\Users\Zam\amigo-coppel-mvp\node_modules\expo\metro-config' imported from C:\Users\Zam\amigo-coppel-mvp\metro.config.js
  Did you mean to import "expo/metro-config.js"?
      at finalizeResolution (node:internal/modules/esm/resolve:272:11)
      at moduleResolve (node:internal/modules/esm/resolve:879:10)
      at defaultResolve (node:internal/modules/esm/resolve:1006:11)
      at loadConfigFile (resolveMetroUserConfig.js:68:50)
      ...
  ```
- **Root Cause**:
  `package.json` specifies `"type": "module"`. In Node 24 ESM mode, subpath imports without an explicit extension (e.g. `expo/metro-config`) require an explicit `"exports"` subpath definition in `node_modules/expo/package.json`. Because `expo` does not declare a subpath mapping for `metro-config`, Node requires the full file extension `expo/metro-config.js`.
- **Blast Radius**:
  The application **cannot start** using Expo CLI (`npx expo start`, `npm start`, `npm run android`, or `npm run start:mobile`). Anyone attempting to run the app in Expo Go encounters an immediate fatal process crash before the QR code is generated.
- **Remediation**:
  In `c:/Users/Zam/amigo-coppel-mvp/metro.config.js`, line 1:
  Change:
  ```javascript
  import { getDefaultConfig } from "expo/metro-config"
  ```
  To:
  ```javascript
  import { getDefaultConfig } from "expo/metro-config.js"
  ```

---

### ⚠️ Challenge 2 [MEDIUM]: `src-mobile/generated/webAppHtml.js` Emits CommonJS in ESM Project Scope

- **Requirement Challenged**:
  `scripts/generate-mobile-bundle.js` artifact generation contract.
- **Empirical Attack Scenario**:
  Inspected lines 180-185 of `scripts/generate-mobile-bundle.js`:
  ```javascript
  const jsModuleContent =
    `// Auto-generated by scripts/generate-mobile-bundle.js - DO NOT EDIT MANUALLY\n` +
    `const webAppHtml = ${escapedHtml};\n` +
    `module.exports = { webAppHtml };\n` +
    `module.exports.default = webAppHtml;\n`
  ```
  Attempted to load or require `src-mobile/generated/webAppHtml.js` from Node:
  ```
  node -e "require('./src-mobile/generated/webAppHtml.js')"
  ```
- **Verbatim Error Output**:
  ```
  ReferenceError: module is not defined in ES module scope
  This file is being treated as an ES module because it has a '.js' file extension and 'package.json' contains "type": "module". To treat it as a CommonJS script, rename it to use the '.cjs' file extension.
  ```
- **Root Cause**:
  Because `package.json` contains `"type": "module"`, any `.js` file is interpreted as ESM where `module` is undefined.
- **Blast Radius**:
  If Metro bundler resolves `webAppHtml` without extension, Metro's default `sourceExts` (`['js', 'jsx', 'json', 'ts', 'tsx']`) attempts to resolve `webAppHtml.js` prior to `webAppHtml.ts`, causing potential bundler ambiguity or runtime loader failures.
- **Remediation**:
  In `scripts/generate-mobile-bundle.js`:
  Option A (pure ESM): Output `export const webAppHtml = ...; export default webAppHtml;`
  Option B (explicit CJS): Rename artifact to `src-mobile/generated/webAppHtml.cjs`.

---

## Master E2E Suite Execution

The existing 115 unit and mock contract tests were run via:
```cmd
node tests/e2e/run-all.cjs
```
**Results**:
- Tier 1 (Feature Coverage): 80 / 80 passed (72ms)
- Tier 2 (Boundary & Corner Cases): 20 / 20 passed (7ms)
- Tier 3 (Cross-Feature Combinations): 10 / 10 passed (4ms)
- Tier 4 (Real-World Scenarios): 5 / 5 passed (4ms)
- **Total**: 115 / 115 passed (88ms)

*Challenger Finding on Existing Suite*: The existing 115 tests validated contract schemas and mathematical calculations in isolation, but did NOT execute `metro.config.js` or start the Metro dev server. Hence, Challenge 1 was masked until this adversarial stress harness exercised the real CLI lifecycle.

---

## Unchallenged Areas

- **Physical Android Device Touch Interaction**: Out of scope for Milestone 1 headless CLI environment; scheduled for Milestone 2 and Milestone 4 physical device testing.
- **Production APK Binary Compilation**: Out of scope (project target is Expo Go Android demo mode).

---

## Verdict: REJECT

Milestone 1 **cannot be approved** until Challenge 1 (CRITICAL: `metro.config.js` import resolution) and Challenge 2 (MEDIUM: `webAppHtml.js` module scope) are resolved by the worker. All empirical evidence, commands, and reproductions are documented above.
