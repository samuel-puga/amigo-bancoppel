# E2E Test Infra: Amigo BanCoppel MVP

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | F01 Expo Project Setup | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | F02 Autonomous Bundler | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 3 | F03 Mobile WebView Wrapper | ORIGINAL_REQUEST §R1, R2 | 5 | 5 | ✓ |
| 4 | F04 Expo Go CLI Execution | ORIGINAL_REQUEST §AC1 | 5 | 5 | ✓ |
| 5 | F05 Splash Video Autoplay | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 6 | F06 Bienvenido Login View | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 7 | F07 Amigo BanCoppel View | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 8 | F08 200% Horizontal Slide Navigation | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 9 | F09 Status Bar Harmonization | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 10 | F10 QuickAdd Expense Registration | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 11 | F11 BalanceCard Dynamic States | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 12 | F12 Expense List & Paid Toggles | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 13 | F13 Swipe-to-Delete & Undo | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 14 | F14 Bottom Sheets Catalog | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 15 | F15 Device Data Persistence | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 16 | F16 BanCoppel Visual Fidelity | ORIGINAL_REQUEST §R3, AC2 | 5 | 5 | ✓ |
| 17 | F17 E2E Regression | ORIGINAL_REQUEST §AC | 5 | 5 | ✓ |
| 18 | F18 Adversarial Hardening | Tier 5 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: automated Node.js test runner running with `node` / `npm.cmd test`
- Test case format: automated assertions checking build artifacts, expo configuration, html bundle validity, webview configuration, dom storage flags, and UI element contracts.
- Directory layout: `tests/e2e/`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full User Demo Journey (Splash -> Login -> Navigation -> Add Expense -> Toggle Paid) | F05, F06, F07, F08, F10, F12 | High |
| 2 | Budget Deficit Real-World Flow (Add high expense -> Verify State D & deficit styling) | F10, F11, F12 | Medium |
| 3 | Offline Persistence & Reload Journey (Store items -> Reload bundle -> Verify items intact) | F03, F15 | High |
| 4 | Bottom Sheets & Form Interactions (Open Intro, Apartado, Domiciliación, Reminder) | F07, F14 | Medium |
| 5 | Expense Swipe-to-Delete & Undo Recovery Flow | F12, F13 | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature (where boundaries exist)
- Tier 3: pairwise coverage of major feature interactions
- Tier 4: ≥5 realistic application scenarios
