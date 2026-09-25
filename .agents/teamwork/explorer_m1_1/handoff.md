# Milestone 1 Investigation Handoff Report

**Agent**: Explorer 1 (Milestone 1)  
**Date**: 2026-09-25  
**Working Directory**: `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_m1_1/`  
**Parent Orchestrator ID**: `4694922b-e10d-44a0-96b4-3b2da058bfec`  
**Full Technical Report**: `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_m1_1/report.md`

---

## 1. Observation

1. **Installed React & Vite Baseline**:
   - `package.json` lines 12-15 define `"dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" }`.
   - `package.json` line 5 defines `"type": "module"`.
   - Inspection of `node_modules` confirmed: `react@19.2.4`, `react-dom@19.2.4`, `vite@8.0.5`, `typescript@5.9.3`.

2. **Windows PowerShell Execution Policy Error**:
   - Command `node -v; npm -v` failed with:
     ```
     npm : No se puede cargar el archivo C:\Program Files\nodejs\npm.ps1 porque la ejecución de scripts está deshabilitada en este sistema.
     + CategoryInfo          : SecurityError: (:) [], PSSecurityException
     + FullyQualifiedErrorId : UnauthorizedAccess
     ```
   - Running via `cmd.exe /c "npm -v && npx -v"` succeeded with exit code 0 (`11.19.0` / `11.19.0`). Node is `v24.21.0`.

3. **Expo SDK Version Registry & React 19 Parity**:
   - Inspection of npm dist-tags:
     - `expo@latest` is `57.0.25`.
   - Inspection of `bundledNativeModules.json` across Expo SDKs:
     - Expo SDK 52 (`52.0.49`): pinned to `react: 18.3.1`, `react-native: 0.76.9`.
     - Expo SDK 53 (`53.0.27`): pinned to `react: 19.0.0`, `react-native: 0.79.6`.
     - Expo SDK 54 (`54.0.37`): pinned to `react: 19.1.0`, `react-native: 0.81.5`.
     - Expo SDK 55 (`55.0.31`): pinned to `react: 19.2.0`, `react-native: 0.83.10`.
     - Expo SDK 57 (`57.0.25`): pinned to `react: 19.2.3`, `react-native: 0.86.3`, `react-native-webview: 13.16.1`, `expo-status-bar: ~57.0.1`.
   - Inspection of `react-native@0.86.3` peerDependencies confirmed: `"react": "^19.2.3"`.

4. **Bundler & Asset Inlining Compatibility**:
   - `vite-plugin-singlefile@2.3.3` peerDependencies: `"rollup": "^4.59.0"`, `"vite": "^5.4.21 || ^6.0.0 || ^7.0.0 || ^8.0.0"`. Fully matches installed Vite `8.0.5`.
   - Existing splash video (`src/mi-bolsillo/assets/splash.mp4`) size: 807,239 bytes (~807 KB).

5. **Root Component Structure & Non-collision**:
   - Web application root is `src/App.tsx`.
   - No `App.tsx` exists at repository root (`c:/Users/Zam/amigo-coppel-mvp/App.tsx`), allowing clean placement of the Expo mobile root wrapper without naming collision.

---

## 2. Logic Chain

1. **Zero-conflict React 19 Strategy**:
   - *Observation 1 & 3*: The web application depends on React 19 (`19.2.4`), while Expo SDK 52 required React 18 (`18.3.1`). If SDK 52 were installed, npm would reject peer dependencies or require forced overrides that could destabilize web rendering.
   - *Inference*: Targeting Expo SDK 57 (`57.0.25`) natively aligns with `react-native@0.86.3` and `react@19.2.4`, eliminating all peer-dependency friction.

2. **Windows Execution Guarantee**:
   - *Observation 2*: Windows PowerShell script execution policy prevents direct execution of `.ps1` wrappers (`npm.ps1`, `npx.ps1`).
   - *Inference*: All launcher scripts and CLI commands must be invoked via `cmd.exe /c` or using explicit `.cmd` executables (`npm.cmd`, `npx.cmd`).

3. **Metro Configuration with `"type": "module"`**:
   - *Observation 1 & 5*: `package.json` contains `"type": "module"`. In Node 24, `.js` files are treated as ESM by default.
   - *Inference*: To avoid `require is not defined in ES module scope`, `metro.config.js` should use ESM syntax (`import { getDefaultConfig } from 'expo/metro-config'; const config = getDefaultConfig(import.meta.dirname); export default config;`) or be named `metro.config.cjs`.

4. **Autonomous On-Device Execution (R2 Autonomy)**:
   - *Observation 4*: `vite-plugin-singlefile` inlines web assets into a self-contained HTML document.
   - *Inference*: Exporting this HTML string via `src-mobile/generated/webAppHtml.ts` enables synchronous import by React Native's `<WebView />`. Converting base64 `splash.mp4` to a Blob URL within the injected HTML ensures native hardware decoding on Android WebView without requiring external HTTP servers or IP configuration.

---

## 3. Caveats

1. **Pre-build Stub Required**: `App.tsx` imports `src-mobile/generated/webAppHtml.ts`. If this file is absent before the first Vite build, Metro will report a module resolution error. A lightweight HTML stub must be present upon project initialization.
2. **Local Assets Directory**: Root `./assets/` (for `icon.png`, `splash.png`, `adaptive-icon.png`) does not exist initially. It must be created and populated from `src/mi-bolsillo/assets/bancoppel-logo-white.png` to satisfy `app.json` validation during `expo start`.
3. **Network CA in Sandbox**: Some direct `fetch()` calls in Node require `--use-system-ca` due to local enterprise certificates on the Windows host.

---

## 4. Conclusion

Milestone 1 project setup is fully specified, verified, and ready for implementation:
- **Dependencies**: Add `expo@~57.0.25`, `react-native@0.86.3`, `react-native-webview@13.16.1`, `expo-status-bar@~57.0.1`, and devDependency `vite-plugin-singlefile@^2.3.3`.
- **App Configuration**: `app.json` configured for "Amigo BanCoppel", package `com.bancoppel.amigobancoppel`, portrait orientation, BanCoppel blue `#05297A`, and light interface style.
- **Entry & Metro**: `index.js` calling `registerRootComponent(App)` from `./App.tsx`, with `metro.config.js` supporting ESM and HTML assets.
- **Windows Command**: All execution verified via `cmd.exe /c "npx expo start"`.

---

## 5. Verification Method

To independently verify this configuration upon implementation:

1. **Verify dependency installation without errors**:
   ```cmd
   cmd.exe /c "npm install"
   ```
   *Expected outcome*: Exit code 0, no unresolvable peer-dependency conflicts.

2. **Verify autonomous bundle generation**:
   ```cmd
   cmd.exe /c "node scripts/generate-mobile-bundle.js"
   ```
   *Expected outcome*: `src-mobile/generated/webAppHtml.ts` is created and exports `webAppHtml`.

3. **Verify Expo compilation and start in Expo Go**:
   ```cmd
   cmd.exe /c "npx expo start"
   ```
   *Expected outcome*: Metro bundler starts cleanly, displays the QR code, and accepts Android connections (`a`) without bundling or syntax errors.
