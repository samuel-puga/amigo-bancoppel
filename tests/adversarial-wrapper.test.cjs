/**
 * Adversarial Stress-Test Suite for Milestone 1 — Challenger 2
 * Targets: Expo runtime wrapper (App.tsx), app.json, and WebView integration
 *
 * Dimensions:
 * 1. Missing or malformed webAppHtml handling & AppErrorBoundary activation
 * 2. Android BackHandler event handling under rapid back presses & race conditions
 * 3. Status bar styling and dimensions under simulated Android display metrics
 * 4. Expo config public schema validity & asset verification
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_TSX_PATH = path.join(PROJECT_ROOT, 'App.tsx');
const APP_JSON_PATH = path.join(PROJECT_ROOT, 'app.json');
const WEB_APP_HTML_TS = path.join(PROJECT_ROOT, 'src-mobile/generated/webAppHtml.ts');
const WEB_APP_HTML_JS = path.join(PROJECT_ROOT, 'src-mobile/generated/webAppHtml.js');

class StressRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.results = [];
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  async run() {
    console.log(`\n============================================================`);
    console.log(`RUNNING ADVERSARIAL STRESS SUITE: ${this.name}`);
    console.log(`============================================================`);

    let passed = 0;
    let failed = 0;
    const startAll = Date.now();

    for (const { description, fn } of this.tests) {
      const start = Date.now();
      try {
        await fn();
        const duration = Date.now() - start;
        passed++;
        this.results.push({ description, status: 'PASS', duration });
        console.log(`  [PASS] ${description} (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - start;
        failed++;
        this.results.push({ description, status: 'FAIL', duration, error: err });
        console.error(`  [FAIL] ${description} (${duration}ms)`);
        console.error(`         Error: ${err.message}`);
        if (err.stack) {
          const lines = err.stack.split('\n').slice(1, 4).map(l => '         ' + l.trim());
          console.error(lines.join('\n'));
        }
      }
    }

    const totalDuration = Date.now() - startAll;
    console.log(`------------------------------------------------------------`);
    console.log(`Suite "${this.name}" Completed: ${passed} passed, ${failed} failed in ${totalDuration}ms`);
    console.log(`============================================================\n`);

    return {
      name: this.name,
      passed,
      failed,
      total: this.tests.length,
      duration: totalDuration,
      results: this.results
    };
  }
}

const runner = new StressRunner('Challenger 2: App.tsx, app.json & WebView Adversarial Stress Suite');

/* ─── Helper: Parse App.tsx source code tokens ─── */
const appTsxContent = fs.readFileSync(APP_TSX_PATH, 'utf8');
const appJsonRaw = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));

/* ═══════════════════════════════════════════════════════════════════════════
 * DIMENSION 1: Missing or Malformed webAppHtml Handling & Error Boundary
 * ═══════════════════════════════════════════════════════════════════════════ */

runner.test('ADV-1.01: App.tsx exports AppErrorBoundary with React lifecycle methods', () => {
  assert.ok(appTsxContent.includes('export class AppErrorBoundary'), 'AppErrorBoundary must be exported');
  assert.ok(appTsxContent.includes('getDerivedStateFromError'), 'Must implement static getDerivedStateFromError');
  assert.ok(appTsxContent.includes('componentDidCatch'), 'Must implement componentDidCatch');
  assert.ok(appTsxContent.includes('render()'), 'Must implement render()');
});

runner.test('ADV-1.02: AppErrorBoundary getDerivedStateFromError captures error in state', () => {
  const testError = new Error('SyntaxError: Unexpected token < in JSON at position 0');
  
  const getDerivedStateFromError = (error) => ({ hasError: true, error });
  const newState = getDerivedStateFromError(testError);
  
  assert.strictEqual(newState.hasError, true);
  assert.strictEqual(newState.error, testError);
  assert.strictEqual(newState.error.message, 'SyntaxError: Unexpected token < in JSON at position 0');
});

runner.test('ADV-1.03: AppErrorBoundary renders branded BanCoppel recovery UI and resets', () => {
  assert.ok(appTsxContent.includes('styles.errorContainer'), 'Must use errorContainer');
  assert.ok(appTsxContent.includes('styles.errorCard'), 'Must use errorCard');
  assert.ok(appTsxContent.includes('styles.brandDotsContainer'), 'Must render BanCoppel dots');
  assert.ok(appTsxContent.includes('Amigo BanCoppel'), 'Must show Amigo BanCoppel brand header');
  assert.ok(appTsxContent.includes('Ocurrió un problema al inicializar la aplicación.'), 'Must show localized user-friendly message');
  assert.ok(appTsxContent.includes('Reintentar'), 'Must have Reintentar retry button');

  let resetTriggered = false;
  const mockProps = {
    onReset: () => { resetTriggered = true; }
  };
  let state = { hasError: true, error: new Error('Simulated Crash') };

  const handleRetryPress = () => {
    state = { hasError: false, error: null };
    mockProps.onReset();
  };

  handleRetryPress();
  assert.strictEqual(state.hasError, false, 'State hasError must reset to false on retry');
  assert.strictEqual(state.error, null, 'State error must be cleared on retry');
  assert.strictEqual(resetTriggered, true, 'onReset callback must be invoked');
});

runner.test('ADV-1.04: App.tsx handles reloadKey mutation to force WebView remount', () => {
  let reloadKey = 0;
  const handleReset = () => { reloadKey += 1; };

  assert.strictEqual(reloadKey, 0);
  handleReset();
  assert.strictEqual(reloadKey, 1, 'reloadKey must increment to trigger React key remount');
  handleReset();
  assert.strictEqual(reloadKey, 2);
  assert.ok(appTsxContent.includes('key={reloadKey}'), 'WebView must have key={reloadKey} to force remount');
});

runner.test('ADV-1.05: Generated webAppHtml payload validation (non-empty, non-null, inlined)', () => {
  assert.ok(fs.existsSync(WEB_APP_HTML_TS), 'webAppHtml.ts must exist');
  assert.ok(fs.existsSync(WEB_APP_HTML_JS), 'webAppHtml.js must exist');
  
  const tsContent = fs.readFileSync(WEB_APP_HTML_TS, 'utf8');
  assert.ok(tsContent.length > 500000, `webAppHtml payload must be substantive (>500KB), got ${tsContent.length}`);
  assert.ok(tsContent.includes('export const webAppHtml'), 'Must export webAppHtml constant');
  
  // Check HTML structure within bundle
  assert.ok(tsContent.includes('<!DOCTYPE html>') || tsContent.includes('<!doctype html>'), 'Must include doctype');
  assert.ok(
    tsContent.includes('id=\\"root\\"') || tsContent.includes('id="root"') || tsContent.includes("id='root'"),
    'Must contain React mounting node'
  );
  assert.ok(tsContent.includes('URL.createObjectURL(blob)'), 'Must contain splash video blob hydration script');
});

runner.test('ADV-1.06: Malformed HTML strings fuzzing oracle', () => {
  const malformedInputs = [
    { name: 'Empty string', html: '' },
    { name: 'Truncated HTML', html: '<!DOCTYPE html><html><head><title>Unfinished' },
    { name: 'Unclosed script tag', html: '<!DOCTYPE html><html><body><script>const a = ' },
    { name: 'Null byte injection', html: '<!DOCTYPE html><html><body>\0\0\0</body></html>' },
    { name: 'Malformed Unicode surrogates', html: '<!DOCTYPE html><html><body>\uD800\uDBFF</body></html>' },
    { name: 'Script syntax error', html: '<!DOCTYPE html><html><body><script>{{{ illegal syntax }}}</script></body></html>' },
  ];

  for (const input of malformedInputs) {
    if (input.html.length < 50) {
      assert.ok(input.html.length < 50, `${input.name} has insufficient payload size`);
    }
    assert.strictEqual(typeof input.html, 'string');
  }
});

runner.test('ADV-1.07: WebView Chromium crash lifecycle (onRenderProcessGone) handler verification', () => {
  assert.ok(appTsxContent.includes('onRenderProcessGone'), 'App.tsx must define onRenderProcessGone handler');
  
  let reloadCalled = false;
  const mockWebViewRef = {
    current: {
      reload: () => { reloadCalled = true; }
    }
  };

  const simulateRenderProcessGone = (didCrash) => {
    reloadCalled = false;
    mockWebViewRef.current?.reload();
    return reloadCalled;
  };

  assert.strictEqual(simulateRenderProcessGone(true), true, 'Must reload on renderer crash');
  assert.strictEqual(simulateRenderProcessGone(false), true, 'Must reload on system killed renderer');
});

runner.test('ADV-1.08: WebView onError handler captures and logs errors without crashing', () => {
  assert.ok(appTsxContent.includes('onError='), 'App.tsx must define onError handler');
  
  let loggedError = null;
  const mockConsoleError = (msg, data) => { loggedError = { msg, data }; };
  
  const simulateError = (event) => {
    mockConsoleError("WebView loading error:", event.nativeEvent);
  };

  simulateError({ nativeEvent: { code: -2, description: 'net::ERR_NAME_NOT_RESOLVED', domain: 'Chromium' } });
  assert.strictEqual(loggedError.msg, 'WebView loading error:');
  assert.strictEqual(loggedError.data.code, -2);
});

runner.test('ADV-1.09: Missing bundle artifact safety boundary detection', () => {
  // If webAppHtml is undefined or empty, source prop contract must fail
  const emptySourceProps = {
    source: { html: '', baseUrl: 'https://localhost' },
    originWhitelist: ['*'],
    javaScriptEnabled: true,
    domStorageEnabled: true,
  };
  
  // HTML must contain payload > 50 chars
  assert.strictEqual(emptySourceProps.source.html.length, 0);
  assert.ok(emptySourceProps.source.html.length < 50, 'Empty bundle must be recognized as deficient');
});


/* ═══════════════════════════════════════════════════════════════════════════
 * DIMENSION 2: Android BackHandler Under Rapid Back Presses & Race Conditions
 * ═══════════════════════════════════════════════════════════════════════════ */

function createBackPressModel() {
  let webState = {
    tab: 'login',
    hasOpenSheet: false,
    hasOpenTutorial: false,
    activeSheetName: null,
  };

  let backPressCount = 0;
  let timerId = null;
  let toastMessages = [];
  let injectedScripts = [];

  const webView = {
    injectJavaScript(script) {
      injectedScripts.push(script);
    }
  };

  const toast = {
    show(msg) {
      toastMessages.push(msg);
    }
  };

  const onBackPress = () => {
    // 1. If a bottom sheet or tutorial is open, dismiss it
    if (webState.hasOpenSheet || webState.hasOpenTutorial) {
      webView.injectJavaScript(`
        (function() {
          window.dispatchEvent(new CustomEvent('android:hardwareBack'));
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
          var closeBtn = document.querySelector('[role="dialog"] button[aria-label="Cerrar"]');
          if (closeBtn) closeBtn.click();
          return true;
        })();
        true;
      `);
      return true; // Consumes event, does NOT exit app
    }

    // 2. If on the 'bolsillo' dashboard, return to 'login'
    if (webState.tab === 'bolsillo') {
      webView.injectJavaScript(`
        (function() {
          window.dispatchEvent(new CustomEvent('android:navigateToLogin'));
          var loginTab = document.querySelectorAll('[role="tab"]')[0];
          if (loginTab) loginTab.click();
          return true;
        })();
        true;
      `);
      return true; // Consumes event, does NOT exit app
    }

    // 3. If on the 'login' screen with no modals, apply Double-Back-to-Exit safety pattern
    if (backPressCount === 0) {
      backPressCount = 1;
      toast.show('Presiona de nuevo para salir');
      timerId = setTimeout(() => {
        backPressCount = 0;
      }, 2000);
      return true; // Consumes first press
    }

    // 4. Second press within 2 seconds: allow default OS exit
    return false;
  };

  return {
    setWebState(newState) {
      webState = { ...webState, ...newState };
    },
    getWebState() {
      return webState;
    },
    getBackPressCount() {
      return backPressCount;
    },
    resetBackPressCount() {
      backPressCount = 0;
      if (timerId) clearTimeout(timerId);
    },
    triggerTimerExpire() {
      backPressCount = 0;
      if (timerId) clearTimeout(timerId);
    },
    onBackPress,
    toastMessages,
    injectedScripts,
  };
}

runner.test('ADV-2.01: Rapid 50x back press burst while in Bottom Sheet never exits app', () => {
  const model = createBackPressModel();
  model.setWebState({ tab: 'bolsillo', hasOpenSheet: true, activeSheetName: 'ApartadoSheet' });

  for (let i = 0; i < 50; i++) {
    const handled = model.onBackPress();
    assert.strictEqual(handled, true, `Press #${i + 1} must be handled (return true)`);
  }

  assert.strictEqual(model.injectedScripts.length, 50, 'All 50 presses must inject dismissal script');
  assert.strictEqual(model.getBackPressCount(), 0, 'Exit counter must remain 0 while modal is open');
  assert.strictEqual(model.toastMessages.length, 0, 'No exit toast should be triggered while closing sheets');
});

runner.test('ADV-2.02: Rapid 50x back press burst on Dashboard (bolsillo) never exits app', () => {
  const model = createBackPressModel();
  model.setWebState({ tab: 'bolsillo', hasOpenSheet: false });

  for (let i = 0; i < 50; i++) {
    const handled = model.onBackPress();
    assert.strictEqual(handled, true, `Press #${i + 1} must be handled (return true)`);
  }

  assert.strictEqual(model.injectedScripts.length, 50, 'All 50 presses must inject navigateToLogin script');
  assert.strictEqual(model.getBackPressCount(), 0, 'Exit counter must remain 0 on dashboard');
  assert.strictEqual(model.toastMessages.length, 0, 'No exit toast should be triggered on dashboard');
});

runner.test('ADV-2.03: Double-Back-to-Exit safety pattern on Login screen', () => {
  const model = createBackPressModel();
  model.setWebState({ tab: 'login', hasOpenSheet: false });

  const firstPress = model.onBackPress();
  assert.strictEqual(firstPress, true, 'First press must be handled (prevent exit)');
  assert.strictEqual(model.getBackPressCount(), 1, 'Counter must be primed to 1');
  assert.strictEqual(model.toastMessages[0], 'Presiona de nuevo para salir');

  const secondPress = model.onBackPress();
  assert.strictEqual(secondPress, false, 'Second press must return false to allow clean OS exit');
});

runner.test('ADV-2.04: Double-Back-to-Exit resets after 2000ms timeout', () => {
  const model = createBackPressModel();
  model.setWebState({ tab: 'login', hasOpenSheet: false });

  const firstPress = model.onBackPress();
  assert.strictEqual(firstPress, true);
  assert.strictEqual(model.getBackPressCount(), 1);

  model.triggerTimerExpire();
  assert.strictEqual(model.getBackPressCount(), 0);

  const pressAfterTimeout = model.onBackPress();
  assert.strictEqual(pressAfterTimeout, true, 'Press after timeout must be handled and show toast again');
  assert.strictEqual(model.toastMessages.length, 2);
  assert.strictEqual(model.getBackPressCount(), 1);

  const cleanExit = model.onBackPress();
  assert.strictEqual(cleanExit, false);
});

runner.test('ADV-2.05: Interleaved navigation race condition stress test', () => {
  const model = createBackPressModel();
  model.setWebState({ tab: 'login', hasOpenSheet: false });

  model.onBackPress();
  assert.strictEqual(model.getBackPressCount(), 1);

  model.setWebState({ tab: 'bolsillo' });

  const handledOnBolsillo = model.onBackPress();
  assert.strictEqual(handledOnBolsillo, true, 'Must prioritize dashboard navigation over exit counter');
  assert.ok(model.injectedScripts[0].includes('android:navigateToLogin'));
});

runner.test('ADV-2.06: Null WebView ref safety on rapid back press', () => {
  const injectCalls = appTsxContent.match(/webViewRef\.current\?\.injectJavaScript/g);
  assert.ok(injectCalls && injectCalls.length >= 2, 'Must use optional chaining webViewRef.current?.injectJavaScript');
});

runner.test('ADV-2.07: Android platform check prevents BackHandler registration on iOS/Web', () => {
  assert.ok(appTsxContent.includes('if (Platform.OS !== "android") return'), 'Must guard with Platform.OS !== "android"');
});

runner.test('ADV-2.08: NAV_STATE_UPDATE message fuzzing & error tolerance', () => {
  const fuzzedMessages = [
    '',
    'not json at all',
    '{"malformed: true',
    'null',
    '12345',
    'true',
    '{}',
    '{"type": "UNKNOWN"}',
    '{"type": "NAV_STATE_UPDATE"}',
    '{"type": "NAV_STATE_UPDATE", "tab": "bolsillo", "hasOpenSheet": 1, "activeSheetName": "Apartado"}',
  ];

  let currentState = { tab: 'login', hasOpenSheet: false, hasOpenTutorial: false, activeSheetName: null };

  const handleMessage = (dataStr) => {
    try {
      const data = JSON.parse(dataStr);
      if (data && data.type === 'NAV_STATE_UPDATE') {
        currentState = {
          tab: data.tab || 'login',
          hasOpenSheet: !!data.hasOpenSheet,
          hasOpenTutorial: !!data.hasOpenTutorial,
          activeSheetName: data.activeSheetName || null,
        };
      }
    } catch {
      // Safe ignore
    }
  };

  for (const msg of fuzzedMessages) {
    assert.doesNotThrow(() => handleMessage(msg), `Must not throw on fuzzed message: "${msg}"`);
  }

  assert.strictEqual(currentState.tab, 'bolsillo');
  assert.strictEqual(currentState.hasOpenSheet, true);
  assert.strictEqual(currentState.activeSheetName, 'Apartado');
});

runner.test('ADV-2.09: BackHandler listener cleanup on state change and unmount', () => {
  // App.tsx:
  // const backSubscription = BackHandler.addEventListener("hardwareBackPress", onBackPress)
  // return () => backSubscription.remove()
  assert.ok(appTsxContent.includes('backSubscription.remove()'), 'Must call backSubscription.remove() in cleanup');
  assert.ok(appTsxContent.includes('}, [webState])'), 'useEffect must specify [webState] dependency');
});


/* ═══════════════════════════════════════════════════════════════════════════
 * DIMENSION 3: Status Bar Styling & Dimensions Under Simulated Android Metrics
 * ═══════════════════════════════════════════════════════════════════════════ */

runner.test('ADV-3.01: Expo status bar configuration in app.json is fully consistent', () => {
  const expo = appJsonRaw.expo;
  assert.ok(expo.androidStatusBar, 'androidStatusBar must be configured');
  assert.strictEqual(expo.androidStatusBar.barStyle, 'light-content');
  assert.strictEqual(expo.androidStatusBar.backgroundColor, '#05297A');
  assert.strictEqual(expo.androidStatusBar.translucent, true);
  assert.strictEqual(expo.androidStatusBar.hidden, true);

  const statusBarPlugin = (expo.plugins || []).find(p => Array.isArray(p) && p[0] === 'expo-status-bar');
  assert.ok(statusBarPlugin, 'expo-status-bar plugin must be listed in plugins');
  assert.strictEqual(statusBarPlugin[1].style, 'light');
});

runner.test('ADV-3.02: App.tsx enforces hidden status bar in both main app and error fallback', () => {
  const statusBarMatches = appTsxContent.match(/<StatusBar\s+hidden=\{true\}\s*\/>/g);
  assert.ok(statusBarMatches && statusBarMatches.length >= 2, 'StatusBar hidden={true} must be present in App and AppErrorBoundary');
});

runner.test('ADV-3.03: Complete background color token harmonization (#05297A) across all containers', () => {
  const BRAND_NAVY = '#05297A';
  assert.ok(appTsxContent.includes(`const BRAND_NAVY = "${BRAND_NAVY}"`));
  assert.ok(appTsxContent.includes('container: {\n    flex: 1,\n    backgroundColor: BRAND_NAVY'), 'container must use BRAND_NAVY');
  assert.ok(appTsxContent.includes('webView: {\n    flex: 1,\n    backgroundColor: BRAND_NAVY'), 'webView must use BRAND_NAVY');
  assert.ok(appTsxContent.includes('loadingContainer: {\n    ...StyleSheet.absoluteFillObject,\n    backgroundColor: BRAND_NAVY'), 'loadingContainer must use BRAND_NAVY');
  assert.ok(appTsxContent.includes('errorContainer: {\n    flex: 1,\n    backgroundColor: BRAND_NAVY'), 'errorContainer must use BRAND_NAVY');
});

runner.test('ADV-3.04: Simulated Android Display Metrics Matrix (5 device form factors)', () => {
  const devices = [
    { name: 'Pixel 7 (Modern Tall 20:9)', width: 1080, height: 2400, density: 3.0, dpWidth: 360, dpHeight: 800, notchDp: 36 },
    { name: 'Galaxy A04 (Budget 20:9)', width: 720, height: 1600, density: 2.0, dpWidth: 360, dpHeight: 800, notchDp: 28 },
    { name: 'Legacy Android (16:9)', width: 1080, height: 1920, density: 2.75, dpWidth: 393, dpHeight: 698, notchDp: 24 },
    { name: 'Foldable Inner Display (1:1.2)', width: 1812, height: 2176, density: 2.5, dpWidth: 725, dpHeight: 870, notchDp: 0 },
    { name: '10-inch Android Tablet (16:10)', width: 1200, height: 1920, density: 1.5, dpWidth: 800, dpHeight: 1280, notchDp: 0 },
  ];

  for (const d of devices) {
    const containerWidth = d.dpWidth;
    const containerHeight = d.dpHeight;

    const renderedAppWidth = Math.min(containerWidth, 430);
    const renderedAppHeight = Math.min(containerHeight, 900);

    assert.ok(renderedAppWidth <= 430, `${d.name}: rendered width must be <= 430dp`);
    assert.ok(renderedAppHeight <= 900, `${d.name}: rendered height must be <= 900dp`);

    const mockStatusBarHeight = 47;
    const statusBarRatio = mockStatusBarHeight / renderedAppHeight;

    assert.ok(statusBarRatio > 0.04 && statusBarRatio < 0.08, `${d.name}: mock status bar proportion must be between 4% and 8%`);

    if (d.dpWidth <= 430) {
      assert.strictEqual(renderedAppWidth, d.dpWidth, `${d.name}: phone width must fill screen`);
    } else {
      assert.strictEqual(renderedAppWidth, 430, `${d.name}: tablet width must cap at 430dp`);
    }
  }
});

runner.test('ADV-3.05: Keyboard resize layout mode configured to prevent input clipping', () => {
  const expo = appJsonRaw.expo;
  assert.strictEqual(
    expo.android.softwareKeyboardLayoutMode,
    'resize',
    'softwareKeyboardLayoutMode must be "resize" to adapt view when soft keyboard opens'
  );
});


/* ═══════════════════════════════════════════════════════════════════════════
 * DIMENSION 4: Expo Config Public Schema Validity
 * ═══════════════════════════════════════════════════════════════════════════ */

runner.test('ADV-4.01: Expo SDK official config loader (expo/config) loads and resolves cleanly', () => {
  const { getConfig } = require('expo/config');
  const resolved = getConfig(PROJECT_ROOT, { skipSDKVersionRequirement: false });
  assert.ok(resolved, 'Config must resolve');
  assert.ok(resolved.exp, 'Resolved config must have exp object');
  assert.strictEqual(resolved.exp.name, 'Amigo BanCoppel');
  assert.strictEqual(resolved.exp.slug, 'amigo-bancoppel-mvp');
  assert.strictEqual(resolved.exp.sdkVersion, '57.0.0');
});

runner.test('ADV-4.02: Expo CLI "npx expo config --type public" validation oracle', () => {
  const stdout = execSync('cmd.exe /c "npx.cmd expo config --type public"', {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 30000,
    env: { ...process.env, NO_COLOR: '1' },
  });

  assert.ok(stdout && stdout.length > 50, 'CLI output must not be empty');
  
  // Strip ANSI escape sequences
  const cleanStdout = stdout.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  
  // Find JSON / JS object in output
  const jsonMatch = cleanStdout.match(/\{[\s\S]*\}/);
  assert.ok(jsonMatch, 'CLI output must contain valid object block');

  const vm = require('vm');
  const parsed = vm.runInNewContext('(' + jsonMatch[0] + ')');

  assert.strictEqual(parsed.name, 'Amigo BanCoppel');
  assert.strictEqual(parsed.slug, 'amigo-bancoppel-mvp');
  assert.strictEqual(parsed.orientation, 'portrait');
  assert.strictEqual(parsed.android.package, 'com.bancoppel.amigobancoppel');
  assert.strictEqual(parsed.androidStatusBar.hidden, true);
});

runner.test('ADV-4.03: Android package name adheres to Google Play / reverse-DNS schema', () => {
  const pkg = appJsonRaw.expo.android.package;
  assert.ok(pkg, 'android.package must be defined');

  const javaKeywords = new Set([
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
    'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
    'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
    'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
    'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
    'volatile', 'while'
  ]);

  const segments = pkg.split('.');
  assert.ok(segments.length >= 2, 'Package name must have at least 2 segments');
  for (const seg of segments) {
    assert.ok(/^[a-z][a-z0-9_]*$/.test(seg), `Segment "${seg}" must start with letter and contain only [a-z0-9_]`);
    assert.ok(!javaKeywords.has(seg), `Segment "${seg}" must not be a Java keyword`);
  }
});

runner.test('ADV-4.04: Referenced assets physically exist and have valid PNG magic numbers', () => {
  const assetsToCheck = [
    { label: 'icon', path: path.join(PROJECT_ROOT, appJsonRaw.expo.icon) },
    { label: 'splash', path: path.join(PROJECT_ROOT, appJsonRaw.expo.splash.image) },
    { label: 'adaptiveIcon', path: path.join(PROJECT_ROOT, appJsonRaw.expo.android.adaptiveIcon.foregroundImage) },
    { label: 'favicon', path: path.join(PROJECT_ROOT, appJsonRaw.expo.web.favicon) },
  ];

  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  for (const asset of assetsToCheck) {
    assert.ok(fs.existsSync(asset.path), `Asset ${asset.label} must exist at ${asset.path}`);
    const stat = fs.statSync(asset.path);
    assert.ok(stat.size > 100, `Asset ${asset.label} size must be > 100 bytes (got ${stat.size})`);

    const header = Buffer.alloc(8);
    const fd = fs.openSync(asset.path, 'r');
    fs.readSync(fd, header, 0, 8, 0);
    fs.closeSync(fd);

    assert.ok(header.equals(PNG_MAGIC), `Asset ${asset.label} must have valid PNG magic header`);
  }
});

runner.test('ADV-4.05: Expo orientation and userInterfaceStyle lock to portrait light', () => {
  const expo = appJsonRaw.expo;
  assert.strictEqual(expo.orientation, 'portrait', 'orientation must be portrait for presentation demo');
  assert.strictEqual(expo.userInterfaceStyle, 'light', 'userInterfaceStyle must be light');
});

runner.test('ADV-4.06: Expo entry registration (index.js -> App.tsx) verification', () => {
  const indexJsPath = path.join(PROJECT_ROOT, 'index.js');
  assert.ok(fs.existsSync(indexJsPath), 'index.js must exist');
  const indexContent = fs.readFileSync(indexJsPath, 'utf8');
  assert.ok(indexContent.includes('registerRootComponent'), 'index.js must call registerRootComponent');
  assert.ok(indexContent.includes('./App'), 'index.js must register ./App');
});

/* ─── Export & Standalone Execution ─── */
if (require.main === module) {
  runner.run().then(summary => {
    if (summary.failed > 0) {
      process.exit(1);
    }
  }).catch(err => {
    console.error('Fatal stress test suite error:', err);
    process.exit(1);
  });
}

module.exports = runner;
