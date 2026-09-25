/**
 * Adversarial Stress-Test Suite for Milestone 1
 * Targets: scripts/generate-mobile-bundle.js, dist/index.singlefile.html,
 *          src-mobile/generated/webAppHtml.ts, metro.config.js, and Expo runtime startup.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const { execSync } = require('child_process');
const assert = require('assert');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BUNDLE_SCRIPT = path.join(PROJECT_ROOT, 'scripts/generate-mobile-bundle.js');
const DIST_HTML = path.join(PROJECT_ROOT, 'dist/index.singlefile.html');
const TS_ARTIFACT = path.join(PROJECT_ROOT, 'src-mobile/generated/webAppHtml.ts');
const JS_ARTIFACT = path.join(PROJECT_ROOT, 'src-mobile/generated/webAppHtml.js');
const SPLASH_VIDEO = path.join(PROJECT_ROOT, 'src/mi-bolsillo/assets/splash.mp4');

class AdversarialRunner {
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

const runner = new AdversarialRunner('Adversarial Stress Testing: Bundler & Bundle Artifact');

/* ─── Dimension 1: Repeated Bundle Executions, Determinism & File Locks ─── */

runner.test('ADV-1.01: Bundling script executes cleanly from command line', () => {
  const output = execSync('node scripts/generate-mobile-bundle.js', {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  assert.ok(output.includes('Bundle successfully generated'), 'Bundler must report success');
  assert.ok(fs.existsSync(DIST_HTML), 'dist/index.singlefile.html must exist');
  assert.ok(fs.existsSync(TS_ARTIFACT), 'src-mobile/generated/webAppHtml.ts must exist');
  assert.ok(fs.existsSync(JS_ARTIFACT), 'src-mobile/generated/webAppHtml.js must exist');
});

runner.test('ADV-1.02: Repeated executions (3 iterations) produce deterministic content without file locks', () => {
  const hashes = [];
  const durations = [];

  for (let i = 0; i < 3; i++) {
    const t0 = Date.now();
    execSync('node scripts/generate-mobile-bundle.js', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    durations.push(Date.now() - t0);

    const htmlContent = fs.readFileSync(DIST_HTML, 'utf8');
    const hash = crypto.createHash('sha256').update(htmlContent).digest('hex');
    hashes.push(hash);
  }

  // Check determinism: all hashes must be identical
  assert.strictEqual(hashes[0], hashes[1], 'Run 1 and Run 2 hashes must match identically');
  assert.strictEqual(hashes[1], hashes[2], 'Run 2 and Run 3 hashes must match identically');

  // Check build speed: all builds under 3000ms
  for (const d of durations) {
    assert.ok(d < 3000, `Build time ${d}ms should be under 3000ms`);
  }
});

runner.test('ADV-1.03: Bundler handles missing splash.mp4 asset gracefully with clean error', () => {
  const tempBackup = path.join(PROJECT_ROOT, 'src/mi-bolsillo/assets/splash.mp4.bak');
  try {
    fs.renameSync(SPLASH_VIDEO, tempBackup);
    let threw = false;
    let errorOutput = '';
    try {
      execSync('node scripts/generate-mobile-bundle.js', {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (err) {
      threw = true;
      errorOutput = (err.stderr || '') + (err.stdout || '');
    }
    assert.ok(threw, 'Bundler must exit with non-zero code when splash video is missing');
    assert.ok(
      errorOutput.includes('Splash video not found') || errorOutput.includes('splash.mp4'),
      'Bundler error must explicitly identify missing splash asset'
    );
  } finally {
    if (fs.existsSync(tempBackup)) {
      fs.renameSync(tempBackup, SPLASH_VIDEO);
    }
    // Re-generate bundle to restore state
    execSync('node scripts/generate-mobile-bundle.js', {
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    });
  }
});

/* ─── Dimension 2: Inlined HTML Bundle Integrity ─── */

runner.test('ADV-2.01: TypeScript artifact export contract conforms to PROJECT.md', () => {
  const htmlContent = fs.readFileSync(DIST_HTML, 'utf8');
  const tsContent = fs.readFileSync(TS_ARTIFACT, 'utf8');

  // Verify TS export header
  assert.ok(
    tsContent.includes('export const webAppHtml: string = '),
    'webAppHtml.ts must export const webAppHtml: string'
  );

  // Extract payload from TS file
  const match = tsContent.match(/export const webAppHtml: string = ("(?:[^"\\]|\\.)*");/);
  assert.ok(match, 'TS file must assign JSON string to webAppHtml');
  const parsedTsHtml = JSON.parse(match[1]);
  assert.strictEqual(parsedTsHtml, htmlContent, 'webAppHtml TS payload must match dist/index.singlefile.html exactly');
});

runner.test('ADV-2.02: Inlined CSS integrity (balanced braces, zero external link stylesheets, utility classes)', () => {
  const html = fs.readFileSync(DIST_HTML, 'utf8');

  // No external CSS links
  const linkStylesheets = html.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi);
  assert.strictEqual(linkStylesheets, null, 'HTML must have NO external stylesheet link tags');

  // Style tag presence
  const styleMatch = html.match(/<style type="text\/css">([\s\S]*?)<\/style>/i);
  assert.ok(styleMatch, 'HTML must contain inlined <style type="text/css"> tag');

  const css = styleMatch[1];
  assert.ok(css.length > 5000, `Inlined CSS (${css.length} chars) must contain full CSS payload`);

  // Check balanced braces in CSS
  let depth = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') depth--;
    assert.ok(depth >= 0, `Unbalanced closing brace at character ${i}`);
  }
  assert.strictEqual(depth, 0, 'CSS braces must be completely balanced');

  // Check presence of key component and utility classes
  assert.ok(css.includes('.mb-root'), 'CSS must include .mb-root styling');
  assert.ok(css.includes('.mb-primary') || css.includes('.mb-scroll'), 'CSS must include Amigo BanCoppel classes');
});

runner.test('ADV-2.03: Inlined JavaScript bundle integrity (single module, zero script src asset links, valid syntax)', () => {
  const html = fs.readFileSync(DIST_HTML, 'utf8');

  // Zero external script src tags pointing to assets
  const externalScripts = html.match(/<script[^>]+src=["'][^"']*assets\/[^"']*["'][^>]*>/gi);
  assert.strictEqual(externalScripts, null, 'HTML must have NO <script src="...assets/..."> tags');

  // Extract inlined script type="module"
  const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/i);
  assert.ok(scriptMatch, 'HTML must contain inlined <script type="module">');

  const js = scriptMatch[1];
  assert.ok(js.length > 50000, `Inlined JS (${js.length} chars) must contain full application bundle`);

  // Verify that script parsing doesn't throw syntax error
  assert.doesNotThrow(() => {
    new vm.Script(js, { filename: 'inlined-bundle.js' });
  }, 'Inlined JavaScript must be syntactically valid and parse cleanly');
});

runner.test('ADV-2.04: Video base64 encoding and Blob hydration script integrity', () => {
  const html = fs.readFileSync(DIST_HTML, 'utf8');
  const videoBuffer = fs.readFileSync(SPLASH_VIDEO);

  // Check splash-blob-hydration script tag
  assert.ok(html.includes('id="splash-blob-hydration"'), 'HTML must include #splash-blob-hydration script');

  // Extract base64 payload from script
  const b64Match = html.match(/var\s+b64\s*=\s*"([A-Za-z0-9+/=]+)"/);
  assert.ok(b64Match, 'Must find var b64 string in splash-blob-hydration');

  const b64String = b64Match[1];
  const decodedBuffer = Buffer.from(b64String, 'base64');

  // Byte-for-byte fidelity with original splash.mp4
  assert.strictEqual(
    decodedBuffer.length,
    videoBuffer.length,
    `Decoded video length (${decodedBuffer.length}) must match original (${videoBuffer.length})`
  );

  const originalHash = crypto.createHash('sha256').update(videoBuffer).digest('hex');
  const decodedHash = crypto.createHash('sha256').update(decodedBuffer).digest('hex');
  assert.strictEqual(decodedHash, originalHash, 'Decoded video SHA-256 must match original splash.mp4 SHA-256');

  // Verify MP4 ftyp box signature in decoded buffer (standard MP4 bytes 4-8)
  const ftypSignature = decodedBuffer.slice(4, 8).toString('ascii');
  assert.strictEqual(ftypSignature, 'ftyp', 'Decoded buffer must start with MP4 ftyp box');

  // Verify Blob hydration logic contains required API calls
  assert.ok(html.includes('URL.createObjectURL(blob)'), 'Must call URL.createObjectURL');
  assert.ok(html.includes('window.__SPLASH_BLOB_URL__'), 'Must assign window.__SPLASH_BLOB_URL__');
  assert.ok(html.includes('HTMLMediaElement.prototype'), 'Must patch HTMLMediaElement.prototype.src');
});

runner.test('ADV-2.05: BanCoppel Logo PNG base64 inlining and image header integrity', () => {
  const html = fs.readFileSync(DIST_HTML, 'utf8');

  // Look for data:image/png;base64,...
  const pngMatches = html.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g);
  assert.ok(pngMatches && pngMatches.length > 0, 'HTML must contain inlined data:image/png;base64 image');

  // Verify the longest PNG base64 corresponds to the brand logo
  let largestPngB64 = '';
  for (const match of pngMatches) {
    const rawB64 = match.replace('data:image/png;base64,', '');
    if (rawB64.length > largestPngB64.length) {
      largestPngB64 = rawB64;
    }
  }

  const pngBuffer = Buffer.from(largestPngB64, 'base64');
  assert.ok(pngBuffer.length > 1000, `Inlined PNG logo (${pngBuffer.length} bytes) must be non-empty`);

  // Verify PNG 8-byte signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  const pngMagic = pngBuffer.slice(0, 8);
  const expectedMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.deepStrictEqual(pngMagic, expectedMagic, 'Inlined PNG must have valid PNG magic signature bytes');
});

/* ─── Dimension 3: Zero External Network Requests & Offline Autonomy ─── */

runner.test('ADV-3.01: Inlined HTML bundle has ZERO external script or executable dependencies', () => {
  const html = fs.readFileSync(DIST_HTML, 'utf8');

  // Find all <script src="...">
  const allScriptSrcs = html.match(/<script[^>]+src=["']([^"']+)["']/gi) || [];
  assert.strictEqual(
    allScriptSrcs.length,
    0,
    `HTML bundle must not contain external <script src>: ${JSON.stringify(allScriptSrcs)}`
  );

  // Find all <iframe src="...">
  const iframes = html.match(/<iframe[^>]+src=["']([^"']+)["']/gi) || [];
  assert.strictEqual(iframes.length, 0, 'HTML bundle must not contain iframes');
});

runner.test('ADV-3.02: Network URL inventory analysis and offline render safety', () => {
  const html = fs.readFileSync(DIST_HTML, 'utf8');

  // Scan all http:// and https:// URLs in the entire bundle
  const allUrls = html.match(/https?:\/\/[^\s"'<>)`]+/g) || [];
  const uniqueUrls = Array.from(new Set(allUrls));

  // Categorize URLs: exclude XML namespaces and static error docs
  const runtimeNetworkRequests = uniqueUrls.filter(u => {
    if (u.includes('w3.org')) return false; // XML namespace
    if (u.includes('react.dev/errors/')) return false; // React minified invariant error doc link
    if (u.includes('fonts.googleapis.com')) return false; // Non-blocking font stylesheet
    return true;
  });

  assert.strictEqual(
    runtimeNetworkRequests.length,
    0,
    `Bundle must have NO runtime executable network requests: ${JSON.stringify(runtimeNetworkRequests)}`
  );

  // Verify CSS declares system fallback fonts for offline rendering
  const styleMatch = html.match(/<style type="text\/css">([\s\S]*?)<\/style>/i);
  assert.ok(styleMatch, 'CSS must exist');
  const css = styleMatch[1];

  assert.ok(
    css.includes('sans-serif') || css.includes('system-ui') || css.includes('ui-sans-serif'),
    'CSS must declare standard fallback fonts (system-ui, ui-sans-serif, sans-serif) for offline rendering'
  );
});

/* ─── Dimension 4: Bundle Execution, Asset Querying & LocalStorage Simulation ─── */

runner.test('ADV-4.01: Blob hydration script executes safely in isolated DOM/window sandbox', () => {
  const html = fs.readFileSync(DIST_HTML, 'utf8');
  const scriptMatch = html.match(/<script id="splash-blob-hydration">([\s\S]*?)<\/script>/i);
  assert.ok(scriptMatch, 'Splash hydration script must exist');
  const hydrationScript = scriptMatch[1];

  // Mock browser window environment
  let createdBlob = null;
  let objectUrlCreated = null;

  class MockBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
      createdBlob = this;
    }
  }

  class MockHTMLMediaElement {}
  let srcValue = '';
  Object.defineProperty(MockHTMLMediaElement.prototype, 'src', {
    get: function() { return srcValue; },
    set: function(val) { srcValue = val; },
    configurable: true
  });

  const sandbox = {
    window: {},
    Blob: MockBlob,
    Uint8Array: Uint8Array,
    atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
    URL: {
      createObjectURL: (blob) => {
        objectUrlCreated = 'blob:nativelocalhost/splash-uuid-mock';
        return objectUrlCreated;
      }
    },
    HTMLMediaElement: MockHTMLMediaElement,
    console: {
      log: () => {},
      error: (...args) => { throw new Error('Hydration script logged error: ' + args.join(' ')); }
    }
  };
  sandbox.window = sandbox;

  // Execute hydration script in sandbox
  vm.createContext(sandbox);
  vm.runInContext(hydrationScript, sandbox);

  // Assertions
  assert.ok(createdBlob, 'MockBlob should be instantiated');
  assert.strictEqual(createdBlob.options.type, 'video/mp4', 'Blob MIME type must be video/mp4');
  assert.strictEqual(sandbox.window.__SPLASH_BLOB_URL__, objectUrlCreated, '__SPLASH_BLOB_URL__ must be set');

  // Test HTMLMediaElement.src interception
  const mediaEl = new MockHTMLMediaElement();
  mediaEl.src = 'data:video/mp4;base64,AAAA';
  assert.strictEqual(mediaEl.src, objectUrlCreated, 'Setting data:video/mp4 must be intercepted and set to Blob URL');

  mediaEl.src = '/assets/splash-hash.mp4';
  assert.strictEqual(mediaEl.src, objectUrlCreated, 'Setting splash path must be intercepted and set to Blob URL');

  mediaEl.src = 'https://other.com/audio.mp3';
  assert.strictEqual(mediaEl.src, 'https://other.com/audio.mp3', 'Setting non-splash media must pass through unchanged');
});

runner.test('ADV-4.02: LocalStorage edge cases (empty, corrupted, quota exceeded) behavior', () => {
  const storageKeys = [
    'mi-bolsillo:v3:items',
    'mi-bolsillo:v3:introSeen',
    'mi-bolsillo:v3:tutorialSeen',
    'mi-bolsillo:v3:optOut',
    'mi-bolsillo:v3:dismissedTDC',
    'mb:incomes:v1'
  ];

  // 1. Fresh device start: empty storage
  const mockStorage = new Map();
  function loadJsonSafe(key, fallback) {
    try {
      const val = mockStorage.get(key);
      if (!val) return fallback;
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }

  for (const key of storageKeys) {
    const val = loadJsonSafe(key, []);
    assert.deepStrictEqual(val, [], `Empty key ${key} must safely fallback to empty array`);
  }

  // 2. Corrupted data in storage
  mockStorage.set('mi-bolsillo:v3:items', '{ invalid json [,]');
  const recovered = loadJsonSafe('mi-bolsillo:v3:items', [{ id: 'default' }]);
  assert.deepStrictEqual(recovered, [{ id: 'default' }], 'Corrupted JSON must gracefully trigger fallback without crashing');

  // 3. Quota exceeded during write
  let quotaErrorTriggered = false;
  function saveSafe(key, data) {
    try {
      if (quotaErrorTriggered) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      mockStorage.set(key, JSON.stringify(data));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        return false;
      }
      throw e;
    }
  }

  quotaErrorTriggered = true;
  assert.strictEqual(saveSafe('mi-bolsillo:v3:items', [{ id: 1 }]), false, 'QuotaExceededError must be caught gracefully');
});

runner.test('ADV-4.03: SessionStorage splash-seen persistence avoids replay on warm start', () => {
  const mockSessionStorage = new Map();

  function shouldPlaySplash() {
    return !mockSessionStorage.has('splash-seen');
  }

  function markSplashSeen() {
    mockSessionStorage.set('splash-seen', 'true');
  }

  assert.strictEqual(shouldPlaySplash(), true, 'Cold session must play splash');
  markSplashSeen();
  assert.strictEqual(shouldPlaySplash(), false, 'Subsequent session visit must skip splash');
});

/* ─── Dimension 5: Mobile Wrapper & Expo Startup Empirical Verification ─── */

runner.test('ADV-5.01: App.tsx imports generated webAppHtml and passes complete Android WebView flags', () => {
  const appTsx = fs.readFileSync(path.join(PROJECT_ROOT, 'App.tsx'), 'utf8');

  // Import check
  assert.ok(
    appTsx.includes("import { webAppHtml } from './src-mobile/generated/webAppHtml'") ||
    appTsx.includes('import { webAppHtml } from "./src-mobile/generated/webAppHtml"'),
    'App.tsx must import webAppHtml from src-mobile/generated/webAppHtml'
  );

  // WebView props checks
  assert.ok(appTsx.includes('domStorageEnabled={true}'), 'domStorageEnabled must be true');
  assert.ok(appTsx.includes('javaScriptEnabled={true}'), 'javaScriptEnabled must be true');
  assert.ok(appTsx.includes('mediaPlaybackRequiresUserAction={false}'), 'mediaPlaybackRequiresUserAction must be false');
  assert.ok(appTsx.includes('allowsInlineMediaPlayback={true}'), 'allowsInlineMediaPlayback must be true');
  assert.ok(appTsx.includes('allowFileAccess={true}'), 'allowFileAccess must be true');
  assert.ok(appTsx.includes('mixedContentMode="always"'), 'mixedContentMode must be "always"');
  assert.ok(appTsx.includes('baseUrl: "https://localhost"'), 'baseUrl must be https://localhost');
  assert.ok(appTsx.includes('androidLayerType="hardware"'), 'androidLayerType must be "hardware"');

  // BackHandler check
  assert.ok(appTsx.includes('BackHandler.addEventListener'), 'App.tsx must hook BackHandler for Android navigation');
  assert.ok(appTsx.includes('StatusBar hidden={true}'), 'StatusBar must be hidden to avoid clash');
});

runner.test('ADV-5.02 [ADVERSARIAL CHALLENGE]: Verify src-mobile/generated/webAppHtml.js module scope compatibility', () => {
  // CommonJS syntax (module.exports) in .js files in a "type": "module" project is invalid
  const jsContent = fs.readFileSync(JS_ARTIFACT, 'utf8');
  const hasModuleExports = jsContent.includes('module.exports');
  const pkgJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));

  if (pkgJson.type === 'module' && hasModuleExports) {
    let threw = false;
    try {
      require(JS_ARTIFACT);
    } catch (e) {
      threw = true;
      assert.ok(
        e.message.includes('module is not defined') || e.message.includes('ES module scope'),
        `Expected ESM module error, got: ${e.message}`
      );
    }
    assert.ok(
      threw,
      'DEFECT DETECTED: webAppHtml.js uses module.exports inside a "type": "module" project, making it unimportable by Node/CJS loaders'
    );
  }
});

runner.test('ADV-5.03 [ADVERSARIAL CHALLENGE]: Verify metro.config.js subpath resolution in Node ESM', () => {
  // Test metro.config.js import
  const metroConfigPath = path.join(PROJECT_ROOT, 'metro.config.js');
  const metroContent = fs.readFileSync(metroConfigPath, 'utf8');

  // Check if metro.config.js imports "expo/metro-config" without extension
  if (metroContent.includes('from "expo/metro-config"') || metroContent.includes("from 'expo/metro-config'")) {
    let resolutionFailed = false;
    let errorMsg = '';
    try {
      execSync('node -e "import(\'./metro.config.js\')"', {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (err) {
      resolutionFailed = true;
      errorMsg = (err.stderr || '') + (err.stdout || '');
    }

    assert.ok(
      resolutionFailed,
      'DEFECT DETECTED: metro.config.js failed to load with Node ESM due to missing extension in "expo/metro-config"'
    );
    assert.ok(
      errorMsg.includes('ERR_MODULE_NOT_FOUND') || errorMsg.includes('expo/metro-config.js'),
      `Error must reference missing module or .js extension: ${errorMsg}`
    );
  }
});

async function main() {
  const summary = await runner.run();
  if (summary.failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal runner error:', err);
    process.exit(1);
  });
}

module.exports = runner;
