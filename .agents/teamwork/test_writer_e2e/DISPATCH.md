## 2026-09-25T14:24:01Z
You are the E2E Test Writer for the Amigo BanCoppel MVP project.
Your Working Directory: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/test_writer_e2e/
Project Root: c:/Users/Zam/amigo-coppel-mvp
Authoritative Request: c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/ORIGINAL_REQUEST.md
Project Spec: c:/Users/Zam/amigo-coppel-mvp/PROJECT.md
Test Infra Spec: c:/Users/Zam/amigo-coppel-mvp/TEST_INFRA.md
Orchestrator Conversation ID: 4694922b-e10d-44a0-96b4-3b2da058bfec

MANDATORY: Read c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/ORIGINAL_REQUEST.md, PROJECT.md, and TEST_INFRA.md before beginning.

Your mission:
Design and implement the automated opaque-box E2E test harness and test suites for the project:
1. Create `tests/e2e/` with an automated Node.js test runner (e.g. executable with `node tests/e2e/run-all.cjs` or `npm.cmd test`).
2. Implement test suites covering:
   - Tier 1: Feature Coverage (verify all features F01-F16 contracts: app.json configuration, WebView props, bundle generation script, HTML validity, storage flags, media playback flags, design tokens, UI components existence, and DOM event/key contracts).
   - Tier 2: Boundary & Corner Cases (empty storage, large amounts, invalid expense inputs, missing video fallback, repeated splash transitions, offline simulation).
   - Tier 3: Cross-Feature Combinations (QuickAdd + BalanceCard recalculation, Add expense + Paid toggle + Balance update, Theme & status bar interaction).
   - Tier 4: Real-World Scenarios (Full demo user journey, budget deficit workflow, offline persistence cycle).
3. Ensure the test runner executes cleanly and outputs clear Tier-by-Tier results.
4. When the test suite is ready and passing against the current/planned contracts, generate `TEST_READY.md` at project root with summary counts and run command.

Produce a detailed report in `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/test_writer_e2e/report.md` and a summary `handoff.md`.
Message the orchestrator (ID: 4694922b-e10d-44a0-96b4-3b2da058bfec) upon completion.
