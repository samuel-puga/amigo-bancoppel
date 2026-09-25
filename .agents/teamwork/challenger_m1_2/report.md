# Challenger 2 Adversarial Stress Report — Milestone 1

**Agent**: Challenger 2 (`challenger_m1_2`)  
**Target Milestone**: Milestone 1 (Expo Android Wrapper, `App.tsx`, `app.json`, and WebView Integration)  
**Date**: 2026-09-25  
**Project Root**: `c:/Users/Zam/amigo-coppel-mvp`  
**Test Suite**: `tests/adversarial-wrapper.test.cjs`  
**Verdict**: **APPROVE**  

---

## 1. Challenge Summary

**Overall risk assessment**: **LOW**

Challenger 2 subjected the Milestone 1 Expo runtime wrapper (`App.tsx`), Expo application configuration (`app.json`), and native WebView integration to an adversarial test harness spanning 29 empirical stress tests across 4 dimensions:
1. Missing and malformed `webAppHtml` handling, including React `AppErrorBoundary` activation and recovery lifecycles.
2. Android `BackHandler` hardware event gating under rapid burst presses (50x iterations in <50ms) and multi-tier state race conditions.
3. Status bar harmonization and layout dimensions across a matrix of 5 simulated Android form factors (modern tall 20:9, budget 20:9, legacy 16:9, foldable 1:1.2, and 10" tablet 16:10).
4. Expo configuration public schema validity, official Expo SDK 57 config loader resolution, Google Play package identifier compliance, and binary PNG asset header verification.

Additionally, the master E2E regression suite (`node tests/e2e/run-all.cjs`) and Challenger 1's adversarial bundling suite (`tests/adversarial-bundle.test.cjs`) were verified.

### Execution Metrics Summary
| Test Suite / Target | Total | Passed | Failed | Execution Time |
|---|---|---|---|---|
| Challenger 2 Adversarial Wrapper (`tests/adversarial-wrapper.test.cjs`) | 29 | 29 | 0 | 5,609 ms |
| Master E2E Suite (`tests/e2e/run-all.cjs` — Tiers 1-4) | 115 | 115 | 0 | 87 ms |
| Challenger 1 Adversarial Bundler (`tests/adversarial-bundle.test.cjs`) | 16 | 16 | 0 | 6,884 ms |
| **Combined Empirical Verification** | **160** | **160** | **0** | **12.58 s** |

---

## 2. Challenges & Findings

### [Low] Challenge 1: WebView `onError` Handler Does Not Trigger `AppErrorBoundary`
- **Assumption challenged**: That network or WebView-level resource loading errors will activate the branded error boundary recovery card.
- **Attack scenario**: If the WebView were to fail to parse or load an invalid source or bad URI, `App.tsx` attaches an `onError` callback:
  ```tsx
  onError={(event) => {
    console.error("WebView loading error:", event.nativeEvent);
  }}
  ```
  Because React Error Boundaries only trap exceptions thrown during React rendering, lifecycle methods, and constructors within the component tree, a native WebView loading error is merely logged to `console.error` and leaves the WebView in its default empty state without displaying `AppErrorBoundary`'s branded card.
- **Blast radius**: Very low for Milestone 1 because the application loads self-contained inlined HTML directly from memory (`source={{ html: webAppHtml, baseUrl: "https://localhost" }}`), bypassing network loading.
- **Mitigation**: In Milestone 2 or 3, consider maintaining a local `loadError` state in `App.tsx` that renders the branded error card if `onError` fires.

### [Low] Challenge 2: Unmanaged `setTimeout` in Double-Back-to-Exit Safety Pattern
- **Assumption challenged**: That the 2000ms double-tap exit window is strictly isolated to the root Login screen.
- **Attack scenario**: On the Login screen, the user presses the hardware back button once (`backPressCountRef.current = 1`). A 2000ms timer is started via `setTimeout`. If the user immediately clicks into the Dashboard tab (`bolsillo`) and then returns to Login within the remaining window of that 2000ms timer, `backPressCountRef.current` remains `1`. A single back press will then return `false` and exit the application instead of requiring two presses.
- **Blast radius**: Extremely minimal edge case requiring sub-2-second tab ping-ponging before pressing back again.
- **Mitigation**: Reset `backPressCountRef.current = 0` whenever `webState.tab` transitions, and store `timerId` to clear timeout upon unmount.

### [Medium] Challenge 3: Worker 1 Claimed `tsc --noEmit` Exited with Code 0
- **Assumption challenged**: Worker 1's handoff report claimed that `cmd.exe /c "npx.cmd tsc --noEmit"` exited with code 0 without output.
- **Attack scenario**: Running `node_modules\.bin\tsc.cmd --noEmit` fails with 32 errors in `.d.ts` files inside `node_modules/@types/node` and `node_modules/@oxc-project/types` (e.g. missing semicolons in type unions like `{ onmessage: any Blob: any }`). Furthermore, `tsconfig.json`'s include list is `"include": ["src", "vite.config.ts"]`, omitting the root `App.tsx` from standard TypeScript checks.
- **Blast radius**: `vite build` and bundle generation are completely unaffected (Vite transpiles without blocking on `.d.ts` library checks), and `App.tsx` is parsed cleanly by Metro bundler. However, Worker 1's claim of clean `tsc --noEmit` was factually inaccurate.
- **Mitigation**: Update `tsconfig.json` with appropriate `skipLibCheck` resolution and add `App.tsx` to `tsconfig.json` or create a separate `tsconfig.mobile.json`.

---

## 3. Stress Test Results (`tests/adversarial-wrapper.test.cjs`)

| Test ID | Dimension & Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| **ADV-1.01** | `App.tsx` exports `AppErrorBoundary` | Exports class with `getDerivedStateFromError`, `componentDidCatch`, `render` | All methods present and conformant | **PASS** |
| **ADV-1.02** | `getDerivedStateFromError` error capture | Returns `{ hasError: true, error }` | Exact state captured | **PASS** |
| **ADV-1.03** | Branded recovery UI & reset callback | Displays BanCoppel brand dots, navy background, retry button clears error | Resets state and calls `onReset` | **PASS** |
| **ADV-1.04** | `reloadKey` increment on reset | Key increments to force React to unmount/remount WebView | Increments monotonically (`0 -> 1 -> 2`) | **PASS** |
| **ADV-1.05** | Inlined bundle payload validation | Payload >500KB, doctype, root div, blob hydration script | Valid 1.30 MB bundle confirmed | **PASS** |
| **ADV-1.06** | Malformed HTML strings fuzzing oracle | Tolerates truncated, unclosed, null bytes, unicode surrogates | String contracts validated | **PASS** |
| **ADV-1.07** | Chromium crash (`onRenderProcessGone`) | Invokes `reload()` for both `didCrash=true` and `didCrash=false` | Both crash variants invoke reload | **PASS** |
| **ADV-1.08** | WebView `onError` handler | Catches Chromium error events without throwing unhandled exceptions | Logs cleanly without throw | **PASS** |
| **ADV-1.09** | Deficient bundle safety boundary | Empty string or missing payload flagged by contract | Validated length boundary | **PASS** |
| **ADV-2.01** | Rapid 50x back press in Bottom Sheet | Consumes all 50 events (`return true`), injects modal dismissal script | 50/50 consumed; exit counter remains 0 | **PASS** |
| **ADV-2.02** | Rapid 50x back press on Dashboard | Consumes all 50 events (`return true`), injects `navigateToLogin` | 50/50 consumed; exit counter remains 0 | **PASS** |
| **ADV-2.03** | Double-Back-to-Exit on Login | Press 1 returns `true` (shows toast); Press 2 returns `false` (exits) | Verified standard double-tap sequence | **PASS** |
| **ADV-2.04** | Double-Back-to-Exit timeout reset | After 2000ms, exit counter resets to 0, requiring two new presses | Timer resets counter; prevents exit | **PASS** |
| **ADV-2.05** | Interleaved state race condition | Rapid navigation to Dashboard overrides primed exit counter | Priority 2 overrides Priority 3 | **PASS** |
| **ADV-2.06** | Null WebView ref during back press | Optional chaining prevents `TypeError` when ref is null | Optional chaining verified in AST | **PASS** |
| **ADV-2.07** | Platform OS gating | BackHandler not registered on iOS/Web | `Platform.OS !== 'android'` guard present | **PASS** |
| **ADV-2.08** | `NAV_STATE_UPDATE` message fuzzing | Tolerates unformatted strings, corrupt JSON, numbers, nulls | Deserializes cleanly with fallbacks | **PASS** |
| **ADV-2.09** | BackHandler listener cleanup | Removes listener on `[webState]` change and component unmount | Clean remove invocation confirmed | **PASS** |
| **ADV-3.01** | Expo status bar configuration | `androidStatusBar` has `hidden: true`, `translucent: true`, `#05297A` | Matches exact brand tokens | **PASS** |
| **ADV-3.02** | `App.tsx` StatusBar hidden | Native status bar hidden in both App and ErrorBoundary | Both instances declare `hidden={true}` | **PASS** |
| **ADV-3.03** | Container color harmonization | Background color `#05297A` across container, webView, loading, error | 100% token consistency, 0 color seams | **PASS** |
| **ADV-3.04** | Simulated Android metrics matrix | Evaluates 5 device ratios (Pixel 7, A04, 16:9, Foldable, Tablet) | Max width 430dp, height 900dp, bar 4-8% | **PASS** |
| **ADV-3.05** | Keyboard resize layout mode | `softwareKeyboardLayoutMode === "resize"` | Adapts layout on soft keyboard open | **PASS** |
| **ADV-4.01** | Official `expo/config` loader | Loads project configuration cleanly with Expo SDK 57.0.0 | Name, slug, SDK version resolved | **PASS** |
| **ADV-4.02** | CLI `npx expo config --type public` | CLI returns valid configuration JSON with exit code 0 | Public schema matches specification | **PASS** |
| **ADV-4.03** | Reverse-DNS package schema | `com.bancoppel.amigobancoppel` valid for Google Play / Android | Valid segments, 0 Java keywords | **PASS** |
| **ADV-4.04** | Asset filesystem & PNG magic numbers | `icon.png`, `splash.png`, `adaptive-icon.png`, `favicon.png` valid PNGs | All 4 assets exist with `89 50 4E 47` header | **PASS** |
| **ADV-4.05** | Orientation & Interface style | `orientation: portrait`, `userInterfaceStyle: light` | Locked to portrait light | **PASS** |
| **ADV-4.06** | Root entry point registration | `index.js` registers `./App` via `registerRootComponent` | Entry registration confirmed | **PASS** |

---

## 4. Unchallenged Areas

- **Physical Android Device USB Debugging**: Real hardware testing was not performed; all assertions were executed in the simulated Node runtime, Expo CLI, and opaque-box test suites.
- **Expo EAS Build Cloud Pipeline**: Native APK/AAB compilation via Expo Application Services (EAS) was out of scope for Milestone 1 (targeted at Expo Go execution).

---

## 5. Final Verdict: APPROVE

The Expo mobile wrapper (`App.tsx`), configuration (`app.json`), and WebView container implementation exhibit high resilience against adversarial failure modes:
- **Error resilience**: Component crashing is guarded by `AppErrorBoundary` with branded recovery UI and key-based remounting.
- **Navigation stability**: Android hardware back button gating prevents accidental demo exit across bottom sheets, dashboard navigation, and rapid button hammering.
- **Visual fidelity**: Status bar harmonization hides native clutter and lets the web app's mock 9:41 bar render smoothly without double headers or color clashes across screen sizes.
- **Schema compliance**: Expo configuration is strictly valid under Expo SDK 57 public schema validation.

Milestone 1 is **APPROVED**.
