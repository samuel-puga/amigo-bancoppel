## 2026-09-25T15:29:46Z
You are Worker 2 for Milestone 1 Remediation (Iteration 2).
Your Working Directory: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/worker_m1_it2/
Project Root: c:/Users/Zam/amigo-coppel-mvp
Authoritative Request: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/ORIGINAL_REQUEST.md
Project Spec: c:/Users/Zam/amigo-coppel-mvp/PROJECT.md
Orchestrator Conversation ID: 4694922b-e10d-44a0-96b4-3b2da058bfec

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, and the three remediation reports before beginning:
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_m1_it2_1/report.md (Metro ESM import fix: expo/metro-config.js)
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_m1_it2_2/report.md (App.tsx syntax fix & tsconfig pass)
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_m1_it2_3/report.md (Bundler ESM export & authentic test suite file assertions)
Also review the Forensic Auditor report:
- c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/auditor_m1_1/report.md

Your mission:
Apply the exact fixes formulated by the remediation explorers to achieve a genuine, clean audit pass:
1. Fix `metro.config.js`:
   Line 1 must be:
   `import { getDefaultConfig } from "expo/metro-config.js";`
2. Fix `App.tsx`:
   Fix the syntax errors in `AppErrorBoundary` by defining explicit multi-line interfaces:
   ```tsx
   interface AppErrorBoundaryProps {
     children: React.ReactNode;
     fallback?: React.ReactNode;
   }
   interface AppErrorBoundaryState {
     hasError: boolean;
     error: Error | null;
   }
   ```
   and ensure all types are valid without missing semicolons/commas.
3. Fix TypeScript configuration and typing:
   - Ensure `tsconfig.json` includes `App.tsx` (e.g. `"include": ["src", "App.tsx"]`).
   - If `src/vite-env.d.ts` needs module augmentation (e.g. for `react-native-webview` or `expo-status-bar`), add it cleanly.
   - Run `cmd.exe /c "npx.cmd tsc --noEmit"` and verify it returns exit code 0 with ZERO errors. DO NOT claim it passes unless the command actually exits with 0!
4. Fix `scripts/generate-mobile-bundle.js`:
   Update the generation of `src-mobile/generated/webAppHtml.js` to use ESM:
   ```js
   export const webAppHtml = ${escapedHtml};
   export default webAppHtml;
   ```
5. Fix `tests/e2e/tier1-features.test.cjs`:
   Replace synthetic mock checks in F01-F04 tests with genuine assertions that inspect real files on disk (`App.tsx`, `metro.config.js`, `app.json`, `index.js`, `dist/index.singlefile.html`, `src-mobile/generated/webAppHtml.ts`) per Explorer 3's blueprint.
6. Run full verification:
   - `npm.cmd run bundle:mobile`
   - `cmd.exe /c "npx.cmd tsc --noEmit"`
   - `node tests/e2e/run-all.cjs`
   - `cmd.exe /c "npx.cmd expo export -p android --output-dir temp_export"` (verify Metro compiles the full bundle without crashing, then delete `temp_export`).
   - Document all verification commands and verbatim output honestly in `report.md` and `handoff.md`.

Message the orchestrator (ID: 4694922b-e10d-44a0-96b4-3b2da058bfec) when done.
