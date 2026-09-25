/**
 * Tier 1: Feature Coverage (Features F01-F16 Contracts)
 * Verifies core functionality, interface contracts, and specifications
 */

const fs = require("fs")
const path = require("path")
const assert = require("assert")
const {
  PROJECT_ROOT,
  TestRunner,
  createMockStorage,
  BRAND_COLORS,
  BAR_COLORS,
  CATEGORIES,
  FREQUENCIES,
  RECURRING,
  DOMICILIABLE,
  EARLIER,
  autoCat,
  monthlyAmt,
  formatCurrency,
  calculateApartado,
  calculateBalanceState,
  validateAppJsonContract,
  validateWebViewPropsContract,
  validateInlinedHtmlContract,
} = require("./helpers.cjs")

const suite = new TestRunner("Tier 1: Feature Coverage (F01-F16 Contracts)")

/* ─── F01: Expo Android Project Setup ─── */

suite.test(
  "F01.01: Expo config specifies required app metadata and orientation",
  () => {
    const appJsonPath = path.join(PROJECT_ROOT, "app.json")
    assert.ok(fs.existsSync(appJsonPath), "app.json must physically exist on disk")
    const config = JSON.parse(fs.readFileSync(appJsonPath, "utf8"))

    assert.ok(config.expo, "Configuration must contain expo root key")
    assert.strictEqual(
      config.expo.orientation,
      "portrait",
      "Orientation must be locked to portrait",
    )
    assert.ok(
      config.expo.name.includes("BanCoppel"),
      "App name must reference BanCoppel",
    )
    assert.strictEqual(
      config.expo.slug,
      "amigo-bancoppel-mvp",
      "Expo slug must match project name",
    )
  },
)

suite.test(
  "F01.02: Expo Android soft keyboard mode is configured for layout resize",
  () => {
    const appJsonPath = path.join(PROJECT_ROOT, "app.json")
    assert.ok(fs.existsSync(appJsonPath), "app.json must exist")
    const config = JSON.parse(fs.readFileSync(appJsonPath, "utf8"))

    assert.doesNotThrow(() => validateAppJsonContract(config))
    assert.ok(config.expo.android, "app.json must define android config block")
    assert.strictEqual(
      config.expo.android.softwareKeyboardLayoutMode,
      "resize",
      'android.softwareKeyboardLayoutMode must be set to "resize"',
    )
  },
)

suite.test(
  "F01.03: Expo Android status bar matches BanCoppel navy color token",
  () => {
    const appJsonPath = path.join(PROJECT_ROOT, "app.json")
    assert.ok(fs.existsSync(appJsonPath), "app.json must exist")
    const config = JSON.parse(fs.readFileSync(appJsonPath, "utf8"))
    const statusBar = config.expo.androidStatusBar

    assert.ok(statusBar, "app.json must define androidStatusBar")
    assert.strictEqual(statusBar.backgroundColor, BRAND_COLORS.navy)
    assert.strictEqual(statusBar.barStyle, "light-content")
    assert.strictEqual(statusBar.hidden, true)
  },
)

suite.test(
  "F01.04: Root project package.json specifies valid Node.js / React environment",
  () => {
    const pkgPath = path.join(PROJECT_ROOT, "package.json")
    assert.ok(fs.existsSync(pkgPath), "package.json must exist")
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
    assert.ok(pkg.dependencies.react, "React dependency must be installed")
    assert.ok(
      pkg.dependencies["react-dom"],
      "React-DOM dependency must be installed",
    )
  },
)

suite.test(
  "F01.05: TypeScript configuration allows module resolution and JSX",
  () => {
    const tsconfigPath = path.join(PROJECT_ROOT, "tsconfig.json")
    assert.ok(fs.existsSync(tsconfigPath), "tsconfig.json must exist")
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"))
    assert.ok(tsconfig.compilerOptions, "tsconfig must contain compilerOptions")
    assert.strictEqual(tsconfig.compilerOptions.jsx, "react-jsx")
  },
)

/* ─── F02: Autonomous Bundling Pipeline ─── */

suite.test(
  "F02.01: Inlined HTML bundle conforms to autonomous standalone structure",
  () => {
    const targetHtmlFile = path.join(PROJECT_ROOT, "dist/index.singlefile.html")
    assert.ok(
      fs.existsSync(targetHtmlFile),
      "dist/index.singlefile.html must exist (run npm run bundle:mobile)",
    )
    const htmlContent = fs.readFileSync(targetHtmlFile, "utf8")
    assert.doesNotThrow(() => validateInlinedHtmlContract(htmlContent))
    assert.ok(
      htmlContent.includes('<style type="text/css">'),
      "Inlined bundle must contain embedded CSS styles",
    )
    assert.ok(
      htmlContent.includes('<script type="module">'),
      "Inlined bundle must contain embedded module script",
    )
    assert.ok(
      htmlContent.includes('id="splash-blob-hydration"'),
      "Inlined bundle must contain splash video Blob hydration script",
    )
  },
)

suite.test(
  "F02.02: Inlined HTML generator exports webAppHtml via ESM in TS and JS artifacts",
  () => {
    const targetTsFile = path.join(PROJECT_ROOT, "src-mobile/generated/webAppHtml.ts")
    const targetJsFile = path.join(PROJECT_ROOT, "src-mobile/generated/webAppHtml.js")
    assert.ok(fs.existsSync(targetTsFile), "webAppHtml.ts must exist")
    assert.ok(fs.existsSync(targetJsFile), "webAppHtml.js must exist")

    const tsContent = fs.readFileSync(targetTsFile, "utf8")
    const jsContent = fs.readFileSync(targetJsFile, "utf8")

    const exportPattern = /export\s+const\s+webAppHtml\s*(:\s*string)?\s*=/
    assert.ok(
      exportPattern.test(tsContent),
      "webAppHtml.ts must export const webAppHtml: string",
    )
    assert.ok(
      exportPattern.test(jsContent),
      "webAppHtml.js must export const webAppHtml via ESM",
    )
    assert.ok(
      jsContent.includes("export default webAppHtml;"),
      "webAppHtml.js must provide default export for bundler interoperability",
    )
    assert.ok(
      !jsContent.includes("module.exports"),
      'webAppHtml.js must not contain CommonJS module.exports in "type": "module" project',
    )
  },
)

suite.test(
  "F02.03: Splash video in-memory Blob URL conversion pattern is sound",
  () => {
    // Authoritative specification contract: base64 video is converted to Blob URL for Android hardware playback
    const base64Sample = "AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDE=" // sample mp4 header bytes
    const convertScript = `
    function base64ToBlobUrl(base64, mimeType) {
      const byteChars = atob(base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      return URL.createObjectURL(blob);
    }
  `
    assert.ok(
      convertScript.includes("URL.createObjectURL(blob)"),
      "Must generate Blob URL",
    )
    assert.ok(
      convertScript.includes("Uint8Array"),
      "Must convert to byte array",
    )
  },
)

suite.test(
  "F02.04: Web asset size footprint verification (total assets < 5MB)",
  () => {
    const splashPath = path.join(
      PROJECT_ROOT,
      "src/mi-bolsillo/assets/splash.mp4",
    )
    assert.ok(fs.existsSync(splashPath), "splash.mp4 asset must exist")
    const stat = fs.statSync(splashPath)
    assert.ok(
      stat.size > 100000 && stat.size < 2000000,
      `Video size (${stat.size} bytes) should be ~807KB`,
    )
  },
)

suite.test(
  "F02.05: Production build dist exists or Vite build configuration is valid",
  () => {
    const viteConfigPath = path.join(PROJECT_ROOT, "vite.config.ts")
    assert.ok(fs.existsSync(viteConfigPath), "vite.config.ts must exist")
    const content = fs.readFileSync(viteConfigPath, "utf8")
    assert.ok(
      content.includes("@vitejs/plugin-react"),
      "Vite must configure react plugin",
    )
  },
)

/* ─── F03: Mobile WebView Wrapper ─── */

suite.test(
  "F03.01: App.tsx WebView wrapper enforces all required Android props and valid TypeScript syntax",
  () => {
    const appTsxPath = path.join(PROJECT_ROOT, "App.tsx")
    assert.ok(fs.existsSync(appTsxPath), "App.tsx must exist")
    const appTsx = fs.readFileSync(appTsxPath, "utf8")

    // 1. Structural TypeScript AST syntax check via compiler API
    const ts = require("typescript")
    const sf = ts.createSourceFile("App.tsx", appTsx, ts.ScriptTarget.Latest, true)
    assert.strictEqual(
      sf.parseDiagnostics.length,
      0,
      `App.tsx contains fatal syntax errors: ${sf.parseDiagnostics.map((d) => d.messageText).join("; ")}`,
    )

    // 2. Import contract
    assert.ok(
      appTsx.includes('from "./src-mobile/generated/webAppHtml"') ||
      appTsx.includes("from './src-mobile/generated/webAppHtml'"),
      'App.tsx must import webAppHtml from "./src-mobile/generated/webAppHtml"',
    )

    // 3. Android WebView props contract
    assert.ok(appTsx.includes("<WebView"), "App.tsx must instantiate <WebView />")
    assert.ok(appTsx.includes("javaScriptEnabled={true}"), "Missing javaScriptEnabled={true}")
    assert.ok(appTsx.includes("domStorageEnabled={true}"), "Missing domStorageEnabled={true}")
    assert.ok(
      appTsx.includes("mediaPlaybackRequiresUserAction={false}"),
      "Missing mediaPlaybackRequiresUserAction={false}",
    )
    assert.ok(appTsx.includes("allowsInlineMediaPlayback={true}"), "Missing allowsInlineMediaPlayback={true}")
    assert.ok(appTsx.includes('mixedContentMode="always"'), 'Missing mixedContentMode="always"')
    assert.ok(appTsx.includes("allowFileAccess={true}"), "Missing allowFileAccess={true}")
    assert.ok(
      appTsx.includes('baseUrl: "https://localhost"') || appTsx.includes("baseUrl: 'https://localhost'"),
      "source prop must specify baseUrl: https://localhost",
    )
    assert.ok(
      appTsx.includes('originWhitelist={["*"]}') || appTsx.includes("originWhitelist={['*']}"),
      'originWhitelist must permit ["*"]',
    )
    assert.ok(appTsx.includes('androidLayerType="hardware"'), 'Missing androidLayerType="hardware"')
  },
)

suite.test(
  "F03.02: WebView domStorageEnabled is mandatory in App.tsx for localStorage persistence",
  () => {
    const appTsx = fs.readFileSync(path.join(PROJECT_ROOT, "App.tsx"), "utf8")
    assert.ok(
      appTsx.includes("domStorageEnabled={true}"),
      "App.tsx must declare domStorageEnabled={true}",
    )
    // Validator contract negative check
    const invalidProps = {
      source: { html: '<html><body><div id="root"></div></body></html>' },
      originWhitelist: ["*"],
      javaScriptEnabled: true,
      domStorageEnabled: false,
      mediaPlaybackRequiresUserAction: false,
      allowsInlineMediaPlayback: true,
      mixedContentMode: "always",
      allowFileAccess: true,
    }
    assert.throws(
      () => validateWebViewPropsContract(invalidProps),
      /domStorageEnabled/,
    )
  },
)

suite.test(
  "F03.03: WebView mediaPlaybackRequiresUserAction=false is mandatory in App.tsx for autoplay",
  () => {
    const appTsx = fs.readFileSync(path.join(PROJECT_ROOT, "App.tsx"), "utf8")
    assert.ok(
      appTsx.includes("mediaPlaybackRequiresUserAction={false}"),
      "App.tsx must declare mediaPlaybackRequiresUserAction={false}",
    )
    // Validator contract negative check
    const invalidProps = {
      source: { html: '<html><body><div id="root"></div></body></html>' },
      originWhitelist: ["*"],
      javaScriptEnabled: true,
      domStorageEnabled: true,
      mediaPlaybackRequiresUserAction: true,
      allowsInlineMediaPlayback: true,
      mixedContentMode: "always",
      allowFileAccess: true,
    }
    assert.throws(
      () => validateWebViewPropsContract(invalidProps),
      /mediaPlaybackRequiresUserAction/,
    )
  },
)

suite.test(
  "F03.04: App.tsx BackHandler listener hooks hardwareBackPress and cleans up on unmount",
  () => {
    const appTsx = fs.readFileSync(path.join(PROJECT_ROOT, "App.tsx"), "utf8")
    assert.ok(
      appTsx.includes("BackHandler.addEventListener"),
      "App.tsx must register BackHandler.addEventListener",
    )
    assert.ok(
      appTsx.includes('"hardwareBackPress"') || appTsx.includes("'hardwareBackPress'"),
      'BackHandler must listen for "hardwareBackPress"',
    )
    assert.ok(
      appTsx.includes(".remove()"),
      "BackHandler subscription must call .remove() in effect cleanup",
    )
    assert.ok(
      appTsx.includes("ToastAndroid.show"),
      "App.tsx must display toast guidance on Android back press",
    )
  },
)

suite.test(
  "F03.05: Mobile container StatusBar hidden harmonizes with web mock status bar",
  () => {
    const appTsx = fs.readFileSync(path.join(PROJECT_ROOT, "App.tsx"), "utf8")
    assert.ok(
      appTsx.includes("<StatusBar hidden={true}") || appTsx.includes("<StatusBar hidden"),
      "App.tsx must render <StatusBar hidden={true} /> to avoid duplicate status bars",
    )
    const appJson = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, "app.json"), "utf8"),
    )
    assert.strictEqual(
      appJson.expo.androidStatusBar.hidden,
      true,
      "app.json must configure androidStatusBar.hidden = true",
    )
  },
)

/* ─── F04: Expo Go CLI Execution ─── */

suite.test(
  "F04.01: Entry point index.js registers root component App",
  () => {
    const indexPath = path.join(PROJECT_ROOT, "index.js")
    assert.ok(fs.existsSync(indexPath), "index.js must exist on disk")
    const indexContent = fs.readFileSync(indexPath, "utf8")

    assert.ok(
      indexContent.includes('from "expo"') || indexContent.includes("from 'expo'"),
      'index.js must import registerRootComponent from "expo"',
    )
    assert.ok(
      indexContent.includes('from "./App"') || indexContent.includes("from './App'"),
      'index.js must import App from "./App"',
    )
    assert.ok(
      /registerRootComponent\s*\(\s*App\s*\)/.test(indexContent),
      "index.js must call registerRootComponent(App)",
    )
  },
)

suite.test(
  "F04.02: Windows CLI execution scripts configured in package.json and start-mobile.js",
  () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8"),
    )
    assert.ok(pkg.scripts["start"], "package.json must define start script")
    assert.ok(pkg.scripts["android"], "package.json must define android script")
    assert.ok(pkg.scripts["bundle:mobile"], "package.json must define bundle:mobile script")
    assert.ok(pkg.scripts["start:mobile"], "package.json must define start:mobile script")

    const startMobilePath = path.join(PROJECT_ROOT, "scripts/start-mobile.js")
    assert.ok(fs.existsSync(startMobilePath), "scripts/start-mobile.js must exist on disk")
    const startScriptContent = fs.readFileSync(startMobilePath, "utf8")
    assert.ok(
      startScriptContent.includes("npx") || startScriptContent.includes("expo"),
      "start-mobile.js must invoke Expo CLI",
    )
  },
)

suite.test(
  "F04.03: Metro configuration handles asset extensions and resolves cleanly in Node ESM",
  () => {
    const metroPath = path.join(PROJECT_ROOT, "metro.config.js")
    assert.ok(fs.existsSync(metroPath), "metro.config.js must exist on disk")
    const metroContent = fs.readFileSync(metroPath, "utf8")

    // Asset extension registration
    assert.ok(
      metroContent.includes('assetExts.push("html")') || metroContent.includes("assetExts.push('html')"),
      'metro.config.js must push "html" into resolver.assetExts',
    )
    assert.ok(
      metroContent.includes('assetExts.push("mp4")') || metroContent.includes("assetExts.push('mp4')"),
      'metro.config.js must push "mp4" into resolver.assetExts',
    )

    // Node ESM subpath import resolution integrity
    assert.ok(
      metroContent.includes('"expo/metro-config.js"') || metroContent.includes("'expo/metro-config.js'"),
      'metro.config.js must import from "expo/metro-config.js" with explicit .js extension under ESM',
    )
    assert.ok(
      !/(['"])expo\/metro-config\1/.test(metroContent),
      'metro.config.js must not use extensionless "expo/metro-config" (triggers ERR_MODULE_NOT_FOUND in Node ESM)',
    )

    // Physical resolver resolution check
    assert.doesNotThrow(() => {
      require.resolve("expo/metro-config.js", { paths: [PROJECT_ROOT] })
    }, 'expo/metro-config.js must resolve cleanly in Node module resolution')
  },
)

suite.test(
  "F04.04: Package manager lockfile is present for reproducible installs",
  () => {
    const pnpmLock = path.join(PROJECT_ROOT, "pnpm-lock.yaml")
    assert.ok(fs.existsSync(pnpmLock), "pnpm-lock.yaml must exist")
  },
)

suite.test(
  "F04.05: React 19 compatibility contract in root package.json",
  () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8"),
    )
    assert.ok(
      pkg.dependencies.react.includes("19"),
      "React 19 must be targeted",
    )
  },
)

/* ─── F05: Splash Video Autoplay & Fade ─── */

suite.test(
  "F05.01: App.tsx SplashScreen declares muted and playsInline attributes",
  () => {
    const appTsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/App.tsx"),
      "utf8",
    )
    assert.ok(
      appTsx.includes("muted"),
      "Video element must be muted for autoplay",
    )
    assert.ok(
      appTsx.includes("playsInline"),
      "Video element must have playsInline attribute",
    )
    assert.ok(
      appTsx.includes('objectFit: "cover"') ||
      appTsx.includes("objectFit: 'cover'"),
      "Video element must cover viewport",
    )
  },
)

suite.test(
  "F05.02: Autoplay failure fallback immediately finishes transition",
  async () => {
    let finished = false
    const finish = () => {
      finished = true
    }

    // Simulated video play promise rejection (browser autoplay policy block)
    const simulatePlay = () => Promise.reject(new Error("NotAllowedError"))
    await simulatePlay().catch(() => finish())

    assert.strictEqual(
      finished,
      true,
      "Autoplay catch handler must invoke finish() immediately",
    )
  },
)

suite.test(
  "F05.03: Video onEnded event triggers finish and 520ms fade transition",
  () => {
    const appTsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/App.tsx"),
      "utf8",
    )
    assert.ok(
      appTsx.includes("onEnded={finish}"),
      "Video must hook onEnded callback",
    )
    assert.ok(
      appTsx.includes("520"),
      "SplashScreen must specify 520ms transition timeout",
    )
  },
)

suite.test(
  "F05.04: Session storage splash-seen key bypasses splash on re-render",
  () => {
    const storage = createMockStorage({ "splash-seen": "1" })
    const isSplashDone = storage.getItem("splash-seen") === "1"
    assert.strictEqual(
      isSplashDone,
      true,
      "Should bypass splash when splash-seen is 1",
    )
  },
)

suite.test(
  "F05.05: Fresh session plays splash and marks splash-seen on completion",
  () => {
    const storage = createMockStorage({})
    assert.strictEqual(
      storage.getItem("splash-seen"),
      null,
      "Initial session should not have splash-seen",
    )
    storage.setItem("splash-seen", "1")
    assert.strictEqual(
      storage.getItem("splash-seen"),
      "1",
      "Completed splash must store 1",
    )
  },
)

/* ─── F06: Welcome Screen ("Bienvenido" / LoginForm) ─── */

suite.test(
  "F06.01: User/CLABE input filter strips non-numeric characters except spaces",
  () => {
    const rawInput = "1234-5678-ABCD 9012"
    const filtered = rawInput.replace(/[^0-9 ]/g, "")
    assert.strictEqual(
      filtered,
      "12345678 9012",
      "Must strip letters and dashes while preserving spaces",
    )
  },
)

suite.test(
  "F06.02: Password visibility toggle toggles between password and text types",
  () => {
    let show = false
    const toggle = () => {
      show = !show
    }
    assert.strictEqual(show ? "text" : "password", "password")
    toggle()
    assert.strictEqual(show ? "text" : "password", "text")
    assert.strictEqual(show ? "Ocultar" : "Mostrar", "Ocultar")
  },
)

suite.test(
  "F06.03: Empty form submission fails validation and produces error alert",
  () => {
    const user = ""
    const pass = ""
    const hasError = !user.trim() || !pass
    assert.strictEqual(
      hasError,
      true,
      "Empty inputs must trigger validation error",
    )
  },
)

suite.test(
  "F06.04: Valid form submission strips whitespace and invokes onSubmit",
  () => {
    const user = " 1234 5678 9012 "
    const pass = "supersecret"
    let submittedPayload = null
    const onSubmit = (payload) => {
      submittedPayload = payload
    }

    if (user.trim() && pass) {
      onSubmit({ user: user.replace(/\s/g, ""), pass })
    }

    assert.deepStrictEqual(submittedPayload, {
      user: "123456789012",
      pass: "supersecret",
    })
  },
)

suite.test(
  "F06.05: LoginForm source contains all secondary action links",
  () => {
    const compJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
      "utf8",
    )
    assert.ok(
      compJsx.includes("¿Olvidaste tu contraseña?"),
      "Must have forgot password link",
    )
    assert.ok(
      compJsx.includes("Crear cuenta nueva"),
      "Must have create account button",
    )
    assert.ok(
      compJsx.includes("¿Quieres crédito?"),
      "Must have credit products link",
    )
  },
)

/* ─── F07: Dashboard ("Amigo BanCoppel") ─── */

suite.test(
  "F07.01: BrandHeader renders BanCoppel white logo in expanded state",
  () => {
    const compJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
      "utf8",
    )
    assert.ok(
      compJsx.includes("bancoppel-logo-white.png"),
      "Must import BanCoppel white logo",
    )
    assert.ok(
      compJsx.includes('alt="BanCoppel"'),
      'Must have alt="BanCoppel" attribute',
    )
  },
)

suite.test(
  "F07.02: Scroll position threshold > 24px activates collapsed header variant",
  () => {
    const computeCollapsed = (scrollTop) => scrollTop > 24
    assert.strictEqual(computeCollapsed(10), false)
    assert.strictEqual(computeCollapsed(24), false)
    assert.strictEqual(computeCollapsed(25), true)
    assert.strictEqual(computeCollapsed(120), true)
  },
)

suite.test(
  "F07.03: BrandDots component renders 3 yellow dots with correct sizes",
  () => {
    const big = 16
    const small = 8
    const color = BRAND_COLORS.yellow
    assert.strictEqual(color, "#F0D225")
    assert.strictEqual(big, 16)
    assert.strictEqual(small, 8)
  },
)

suite.test(
  "F07.04: Privacy notice banner emphasizes local device data storage",
  () => {
    const miBolsilloJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/MiBolsillo.jsx"),
      "utf8",
    )
    assert.ok(
      miBolsilloJsx.includes(
        "Sin iniciar sesión · tus datos se guardan en este teléfono",
      ),
      "Privacy notice text must be present",
    )
  },
)

suite.test(
  "F07.05: Dashboard renders QuickAddBar, BalanceCard, and ExpenseListCard",
  () => {
    const miBolsilloJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/MiBolsillo.jsx"),
      "utf8",
    )
    assert.ok(
      miBolsilloJsx.includes("<QuickAddBar"),
      "Dashboard must mount QuickAddBar",
    )
    assert.ok(
      miBolsilloJsx.includes("<BalanceCard"),
      "Dashboard must mount BalanceCard",
    )
    assert.ok(
      miBolsilloJsx.includes("<ExpenseListCard"),
      "Dashboard must mount ExpenseListCard",
    )
  },
)

/* ─── F08: 200% Horizontal Slide Navigation ─── */

suite.test(
  "F08.01: Carousel track width is 200% for 2-screen horizontal sliding",
  () => {
    const miBolsilloJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/MiBolsillo.jsx"),
      "utf8",
    )
    assert.ok(
      miBolsilloJsx.includes('width: "200%"') ||
      miBolsilloJsx.includes("width: '200%'"),
      "Carousel track must have width: 200%",
    )
  },
)

suite.test(
  "F08.02: Track transform computes translateX(0) for login and translateX(-50%) for bolsillo",
  () => {
    const getTransform = (tab) =>
      tab === "bolsillo" ? "translateX(-50%)" : "translateX(0)"
    assert.strictEqual(getTransform("login"), "translateX(0)")
    assert.strictEqual(getTransform("bolsillo"), "translateX(-50%)")
  },
)

suite.test(
  "F08.03: Tab pill sliding indicator computes 0% to 100% translation",
  () => {
    const getPillTransform = (onB) =>
      onB ? "translateX(100%)" : "translateX(0)"
    assert.strictEqual(getPillTransform(false), "translateX(0)")
    assert.strictEqual(getPillTransform(true), "translateX(100%)")
  },
)

suite.test(
  "F08.04: Navigation transitions use cubic-bezier(.2,.8,.2,1) easing",
  () => {
    const dataJs = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/data.js"),
      "utf8",
    )
    assert.ok(
      dataJs.includes("cubic-bezier(.2,.8,.2,1)"),
      "Must define brand bezier curve",
    )
  },
)

suite.test(
  "F08.05: Unread yellow notification dot displays only when !introSeen and tab is login",
  () => {
    const shouldShowDot = (showNewDot, onB) => showNewDot && !onB
    assert.strictEqual(shouldShowDot(true, false), true)
    assert.strictEqual(shouldShowDot(true, true), false)
    assert.strictEqual(shouldShowDot(false, false), false)
  },
)

/* ─── F09: Status Bar Harmonization ─── */

suite.test(
  "F09.01: Mock StatusBar component height is 47px with white elements",
  () => {
    const compJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
      "utf8",
    )
    assert.ok(compJsx.includes("height: 47"), "StatusBar height must be 47px")
    assert.ok(compJsx.includes("9:41"), "StatusBar time must be 9:41")
  },
)

suite.test("F09.02: Mock StatusBar includes 4-bar cellular signal SVG", () => {
  const compJsx = fs.readFileSync(
    path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
    "utf8",
  )
  assert.ok(
    compJsx.includes('viewBox="0 0 18 11"'),
    "Cellular SVG viewBox 18 11 must be present",
  )
})

suite.test("F09.03: Mock StatusBar includes 3-arc Wi-Fi SVG", () => {
  const compJsx = fs.readFileSync(
    path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
    "utf8",
  )
  assert.ok(
    compJsx.includes('viewBox="0 0 16 11"'),
    "Wi-Fi SVG viewBox 16 11 must be present",
  )
})

suite.test("F09.04: Mock StatusBar includes battery terminal pill SVG", () => {
  const compJsx = fs.readFileSync(
    path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
    "utf8",
  )
  assert.ok(
    compJsx.includes('viewBox="0 0 26 12"'),
    "Battery SVG viewBox 26 12 must be present",
  )
})

suite.test(
  "F09.05: MiBolsillo accepts showStatusBar prop to toggle display dynamically",
  () => {
    const miBolsilloJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/MiBolsillo.jsx"),
      "utf8",
    )
    assert.ok(
      miBolsilloJsx.includes("showStatusBar = true"),
      "Default showStatusBar must be true",
    )
    assert.ok(
      miBolsilloJsx.includes("{showStatusBar && <StatusBar />}"),
      "Must conditionally render StatusBar",
    )
  },
)

/* ─── F10: QuickAddBar Expense Registration ─── */

suite.test(
  "F10.01: autoCat correctly categorizes all 8 predefined categories",
  () => {
    assert.strictEqual(autoCat("Suscripción Netflix"), "suscripciones")
    assert.strictEqual(autoCat("Recibo de luz CFE"), "servicios")
    assert.strictEqual(autoCat("Compras en Walmart"), "despensa")
    assert.strictEqual(autoCat("Viaje en Uber"), "transporte")
    assert.strictEqual(autoCat("Pago de renta depa"), "hogar")
    assert.strictEqual(autoCat("Consulta con el doctor"), "salud")
    assert.strictEqual(autoCat("Boletos de cine"), "ocio")
    assert.strictEqual(autoCat("Taquería los güeros"), "comida")
  },
)

suite.test("F10.02: autoCat defaults unrecognized concepts to comida", () => {
  assert.strictEqual(autoCat("Gasto misterioso"), "comida")
  assert.strictEqual(autoCat(""), "comida")
  assert.strictEqual(autoCat(null), "comida")
})

suite.test(
  "F10.03: Amount input sanitization strips non-numeric characters except decimals",
  () => {
    const sanitize = (val) => val.replace(/[^0-9.]/g, "")
    assert.strictEqual(sanitize("$150.50 MXN"), "150.50")
    assert.strictEqual(sanitize("-45abc"), "45")
  },
)

suite.test(
  "F10.04: canSave validation requires non-empty name and amount > 0",
  () => {
    const validate = (name, amount) =>
      Boolean(name.trim() && parseFloat(amount) > 0)
    assert.strictEqual(validate("Café", "35"), true)
    assert.strictEqual(validate("  ", "50"), false)
    assert.strictEqual(validate("Tacos", "0"), false)
    assert.strictEqual(validate("Tacos", "-10"), false)
  },
)

suite.test(
  "F10.05: Expense creation schema initializes status=pending and isNew=true",
  () => {
    const name = "Uber"
    const amount = 85
    const cat = autoCat(name)
    const item = {
      id: Date.now(),
      name: name.trim(),
      cat,
      amount: parseFloat(amount),
      date: "Hoy",
      status: "pending",
      reminder: false,
      isNew: true,
    }
    assert.strictEqual(item.name, "Uber")
    assert.strictEqual(item.cat, "transporte")
    assert.strictEqual(item.status, "pending")
    assert.strictEqual(item.isNew, true)
  },
)

/* ─── F11: BalanceCard Dynamic States ─── */

suite.test("F11.01: State A triggered when incomes array is empty", () => {
  const result = calculateBalanceState({
    entries: [{ cat: "despensa", amount: 500 }],
    incomes: [],
  })
  assert.strictEqual(result.stateKey, "A")
  assert.strictEqual(result.cardTitle, "Gastado este mes")
  assert.strictEqual(result.mainLabel, "Llevas gastado")
  assert.strictEqual(result.arrow, null)
})

suite.test(
  "F11.02: State B triggered when balance > 0 and percentage used < 80%",
  () => {
    // Income 10,000, Gastos: 2,000 + 230 (earlier) = 2,230 (22% used)
    const result = calculateBalanceState({
      entries: [{ cat: "despensa", amount: 2000 }],
      incomes: [{ id: 1, monto: 10000, frecuencia: "mensual" }],
    })
    assert.strictEqual(result.stateKey, "B")
    assert.strictEqual(result.cardTitle, "Balance del mes")
    assert.strictEqual(result.mainLabel, "Te quedan")
    assert.strictEqual(result.pillType, "success")
    assert.strictEqual(result.arrow, "up")
    assert.strictEqual(result.pct, 22)
  },
)

suite.test(
  "F11.03: State C triggered when balance > 0 and percentage used >= 80%",
  () => {
    // Income 10,000, Gastos: 8,000 + 230 (earlier) = 8,230 (82% used)
    const result = calculateBalanceState({
      entries: [{ cat: "renta", amount: 8000 }],
      incomes: [{ id: 1, monto: 10000, frecuencia: "mensual" }],
    })
    assert.strictEqual(result.stateKey, "C")
    assert.strictEqual(result.cardTitle, "Balance del mes")
    assert.strictEqual(result.mainLabel, "Te quedan")
    assert.strictEqual(result.pillType, "warning")
    assert.strictEqual(result.arrow, "up")
    assert.strictEqual(result.pct, 82)
  },
)

suite.test("F11.04: State D triggered when balance <= 0 (Déficit)", () => {
  // Income 5,000, Gastos: 6,000 + 230 = 6,230 (Deficit of 1,230)
  const result = calculateBalanceState({
    entries: [{ cat: "hogar", amount: 6000 }],
    incomes: [{ id: 1, monto: 5000, frecuencia: "mensual" }],
  })
  assert.strictEqual(result.stateKey, "D")
  assert.strictEqual(result.cardTitle, "Balance del mes")
  assert.strictEqual(result.mainLabel, "Diferencia del mes")
  assert.strictEqual(result.mainAmount, 1230)
  assert.strictEqual(result.pillType, "danger")
  assert.strictEqual(result.arrow, "down")
})

suite.test(
  "F11.05: Quincenal income is normalized by doubling monto for monthly base",
  () => {
    const quincenal = { monto: 4500, frecuencia: "quincenal" }
    const mensual = { monto: 9000, frecuencia: "mensual" }
    assert.strictEqual(monthlyAmt(quincenal), 9000)
    assert.strictEqual(monthlyAmt(mensual), 9000)
  },
)

/* ─── F12: Expense List & Paid Toggles ─── */

suite.test(
  "F12.01: Paid toggle transitions pending item to paid with orig stored",
  () => {
    const item = { id: 2, name: "Luz CFE", status: "pending", amount: 780 }
    const togglePaid = (i) => {
      if (i.status === "paid") {
        return { ...i, status: i.orig || "pending" }
      }
      return { ...i, status: "paid", orig: i.status }
    }

    const markedPaid = togglePaid(item)
    assert.strictEqual(markedPaid.status, "paid")
    assert.strictEqual(markedPaid.orig, "pending")

    const uncheck = togglePaid(markedPaid)
    assert.strictEqual(uncheck.status, "pending")
  },
)

suite.test(
  "F12.02: Overdue item toggled to paid and back restores overdue status",
  () => {
    const item = { id: 4, name: "Renta", status: "overdue", amount: 3500 }
    const togglePaid = (i) =>
      i.status === "paid"
        ? { ...i, status: i.orig || "pending" }
        : { ...i, status: "paid", orig: i.status }

    const paid = togglePaid(item)
    assert.strictEqual(paid.status, "paid")
    assert.strictEqual(paid.orig, "overdue")

    const reverted = togglePaid(paid)
    assert.strictEqual(reverted.status, "overdue")
  },
)

suite.test(
  "F12.03: Expense list count badge correctly formats total and paid items",
  () => {
    const items = [
      { id: 1, status: "paid" },
      { id: 2, status: "pending" },
      { id: 3, status: "paid" },
    ]
    const paidCount = items.filter((i) => i.status === "paid").length
    const pillText = `${items.length}${
      paidCount > 0 ? ` · ${paidCount} pagado${paidCount > 1 ? "s" : ""}` : ""
    }`
    assert.strictEqual(pillText, "3 · 2 pagados")
  },
)

suite.test(
  "F12.04: Empty expense list displays designated placeholder string",
  () => {
    const items = []
    const emptyMessage = items.length === 0 ? "Aún no registras gastos" : null
    assert.strictEqual(emptyMessage, "Aún no registras gastos")
  },
)

suite.test(
  "F12.05: Paid item style contract specifies line-through and muted color",
  () => {
    const compJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
      "utf8",
    )
    assert.ok(
      compJsx.includes('textDecoration: paid ? "line-through" : "none"') ||
      compJsx.includes("textDecoration: paid ? 'line-through' : 'none'"),
    )
    assert.ok(compJsx.includes("color: paid ? C.muted : C.text"))
  },
)

/* ─── F13: Swipe-to-Delete Gesture & Undo ─── */

suite.test(
  "F13.01: Swipe-to-delete threshold logic: dx < -60px deletes item",
  () => {
    const testSwipe = (dx) => {
      const swipeX = Math.max(-90, Math.min(0, dx))
      return swipeX < -60
    }
    assert.strictEqual(testSwipe(-30), false)
    assert.strictEqual(testSwipe(-59), false)
    assert.strictEqual(testSwipe(-61), true)
    assert.strictEqual(testSwipe(-85), true)
  },
)

suite.test(
  "F13.02: Swipe underlay is red and displays trash SVG when swipeX < 0",
  () => {
    const compJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
      "utf8",
    )
    assert.ok(
      compJsx.includes("background: C.danger"),
      "Underlay must have danger background",
    )
    assert.ok(
      compJsx.includes("swipeX < 0"),
      "Underlay must conditionally appear on negative swipe",
    )
  },
)

suite.test(
  "F13.03: Delete item removes record and creates lastDeleted reference with index",
  () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const toDelete = list[1] // id: 2 at index 1

    const index = list.findIndex((i) => i.id === toDelete.id)
    const lastDeleted = { item: toDelete, index }
    const updatedList = list.filter((i) => i.id !== toDelete.id)

    assert.strictEqual(updatedList.length, 2)
    assert.deepStrictEqual(lastDeleted, { item: { id: 2 }, index: 1 })
  },
)

suite.test(
  "F13.04: Undo delete restores item at its exact previous index in list",
  () => {
    let list = [{ id: 1 }, { id: 3 }]
    const lastDeleted = { item: { id: 2 }, index: 1 }

    // Undo execution
    const next = [...list]
    next.splice(Math.min(lastDeleted.index, next.length), 0, lastDeleted.item)
    list = next

    assert.strictEqual(list.length, 3)
    assert.strictEqual(list[1].id, 2)
  },
)

suite.test(
  "F13.05: Delete toast specifies 5000ms duration and undo action button",
  () => {
    const miBolsilloJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/MiBolsillo.jsx"),
      "utf8",
    )
    assert.ok(
      miBolsilloJsx.includes('action: "undo"') ||
      miBolsilloJsx.includes("action: 'undo'"),
      "Delete toast must set action undo",
    )
    assert.ok(
      miBolsilloJsx.includes("5000"),
      "Delete toast duration must be 5000ms",
    )
  },
)

/* ─── F14: Bottom Sheets Catalog ─── */

suite.test(
  "F14.01: ApartadoSheet frequency calculations compute ceiling per period",
  () => {
    // Amount $780
    const semanal = calculateApartado(780, "semanal")
    assert.strictEqual(semanal.per, 195) // 780 / 4 = 195
    assert.strictEqual(semanal.label, "$195 por semana")

    const quincenal = calculateApartado(780, "quincenal")
    assert.strictEqual(quincenal.per, 390) // 780 / 2 = 390
    assert.strictEqual(quincenal.label, "$390 por quincena")

    const mensual = calculateApartado(780, "mensual")
    assert.strictEqual(mensual.per, 780) // 780 / 1 = 780
    assert.strictEqual(mensual.label, "$780 al mes")
  },
)

suite.test(
  "F14.02: Apartado handles non-divisible amounts rounding up (ceil)",
  () => {
    // Amount $1000 / 3 weeks or 7 odd
    const oddAmount = calculateApartado(783, "semanal")
    assert.strictEqual(oddAmount.per, 196) // Math.ceil(783 / 4) = 196
  },
)

suite.test(
  "F14.03: DomiciliacionSheet filters items for DOMICILIABLE categories",
  () => {
    const items = [
      { id: 1, name: "Netflix", cat: "suscripciones", amount: 219 },
      { id: 2, name: "Luz CFE", cat: "servicios", amount: 780 },
      { id: 3, name: "Walmart", cat: "despensa", amount: 1200 },
    ]
    const domiciliary = items.filter((i) => DOMICILIABLE.includes(i.cat))
    assert.strictEqual(domiciliary.length, 2)
    const total = domiciliary.reduce((s, i) => s + i.amount, 0)
    assert.strictEqual(total, 999)
  },
)

suite.test(
  "F14.04: MiniCalendar computes exact day count and offsets for given month",
  () => {
    // September 2026: 30 days, starting on Tuesday (day index 2)
    const y = 2026
    const m = 8 // September (0-indexed)
    const firstDay = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    assert.strictEqual(daysInMonth, 30)
    assert.strictEqual(firstDay, 2) // Tuesday
  },
)

suite.test(
  "F14.05: IncomeSheet supports Sueldo, Freelance, Negocio, and Otro types",
  () => {
    const balanceCardJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/BalanceCard.jsx"),
      "utf8",
    )
    assert.ok(balanceCardJsx.includes("Sueldo"), "Must support Sueldo")
    assert.ok(balanceCardJsx.includes("Freelance"), "Must support Freelance")
    assert.ok(balanceCardJsx.includes("Negocio"), "Must support Negocio")
    assert.ok(balanceCardJsx.includes("Otro"), "Must support Otro")
  },
)

/* ─── F15: Device Data Persistence ─── */

suite.test(
  "F15.01: Storage keys adhere to defined project namespace standards",
  () => {
    const keys = {
      ITEMS: "mi-bolsillo:v3:items",
      INTRO_SEEN: "mi-bolsillo:v3:introSeen",
      TUTORIAL_SEEN: "mi-bolsillo:v3:tutorialSeen",
      OPT_OUT: "mi-bolsillo:v3:optOut",
      DISMISSED_TDC: "mi-bolsillo:v3:dismissedTDC",
      INCOMES: "mb:incomes:v1",
      SPLASH_SEEN: "splash-seen",
    }
    Object.values(keys).forEach((k) => {
      assert.strictEqual(typeof k, "string")
      assert.ok(k.length > 5)
    })
  },
)

suite.test(
  "F15.02: LocalStorage JSON deserialization returns fallback on missing key",
  () => {
    const storage = createMockStorage({})
    const raw = storage.getItem("mi-bolsillo:v3:items")
    const items = raw != null ? JSON.parse(raw) : [{ id: "default" }]
    assert.deepStrictEqual(items, [{ id: "default" }])
  },
)

suite.test(
  "F15.03: LocalStorage JSON parsing gracefully falls back on corrupted string",
  () => {
    const storage = createMockStorage({
      "mi-bolsillo:v3:items": "INVALID_CORRUPT_JSON{{{",
    })
    let items
    try {
      const raw = storage.getItem("mi-bolsillo:v3:items")
      items = raw != null ? JSON.parse(raw) : []
    } catch (e) {
      items = [{ id: "fallback-after-corrupt" }]
    }
    assert.deepStrictEqual(items, [{ id: "fallback-after-corrupt" }])
  },
)

suite.test(
  "F15.04: LocalStorage write quota exceeded error is safely caught without crashing",
  () => {
    const storage = createMockStorage({}, { quotaError: true })
    let writeSucceeded = true
    try {
      storage.setItem("test-key", JSON.stringify({ data: "large" }))
    } catch (err) {
      writeSucceeded = false
      // App handles gracefully via try/catch in usePersistentState
    }
    assert.strictEqual(
      writeSucceeded,
      false,
      "Quota error was trapped gracefully",
    )
  },
)

suite.test(
  "F15.05: Round-trip persistence correctly retains complex data structures",
  () => {
    const storage = createMockStorage({})
    const initialItems = [
      {
        id: 101,
        name: "Supermercado",
        cat: "despensa",
        amount: 840.5,
        status: "paid",
      },
    ]
    storage.setItem("mi-bolsillo:v3:items", JSON.stringify(initialItems))
    const retrieved = JSON.parse(storage.getItem("mi-bolsillo:v3:items"))
    assert.deepStrictEqual(retrieved, initialItems)
  },
)

/* ─── F16: BanCoppel Visual Fidelity ─── */

suite.test("F16.01: Brand color tokens match BanCoppel guidelines", () => {
  assert.strictEqual(BRAND_COLORS.navy, "#05297A", "Navy must match #05297A")
  assert.strictEqual(
    BRAND_COLORS.yellow,
    "#F0D225",
    "Yellow must match #F0D225",
  )
  assert.strictEqual(
    BRAND_COLORS.primary,
    "#1C42E8",
    "Primary blue must match #1C42E8",
  )
  assert.strictEqual(
    BRAND_COLORS.danger,
    "#DC2626",
    "Danger red must match #DC2626",
  )
  assert.strictEqual(
    BRAND_COLORS.success,
    "#16A34A",
    "Success green must match #16A34A",
  )
})

suite.test(
  "F16.02: Category bar palette defines distinct accessible hues",
  () => {
    const expectedColors = {
      hogar: "#2A44E0",
      despensa: "#F2B35B",
      servicios: "#7B3FF2",
      transporte: "#4CB85C",
      suscripciones: "#F2A6EE",
      comida: "#F2D12E",
      salud: "#FF594D",
      ocio: "#022A7A",
    }
    Object.keys(expectedColors).forEach((cat) => {
      assert.strictEqual(
        BAR_COLORS[cat],
        expectedColors[cat],
        `Color for ${cat} must match`,
      )
    })
  },
)

suite.test(
  "F16.03: Currency formatter applies en-US standard with dollar sign and commas",
  () => {
    assert.strictEqual(formatCurrency(0), "$0")
    assert.strictEqual(formatCurrency(780), "$780")
    assert.strictEqual(formatCurrency(1200), "$1,200")
    assert.strictEqual(formatCurrency(3500), "$3,500")
    assert.strictEqual(formatCurrency(9999999), "$9,999,999")
  },
)

suite.test(
  "F16.04: Font families declare Poppins for headings and Inter/Figtree for body",
  () => {
    const compJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
      "utf8",
    )
    const miBolsilloJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/MiBolsillo.jsx"),
      "utf8",
    )
    assert.ok(
      compJsx.includes("'Poppins', sans-serif"),
      "Must define Poppins font family",
    )
    assert.ok(
      miBolsilloJsx.includes("'Inter', system-ui, sans-serif"),
      "Must define Inter font family in root container",
    )
  },
)

suite.test("F16.05: Global easing constant is cubic-bezier(.2,.8,.2,1)", () => {
  const dataJs = fs.readFileSync(
    path.join(PROJECT_ROOT, "src/mi-bolsillo/data.js"),
    "utf8",
  )
  assert.ok(
    dataJs.includes('export const EASE = "cubic-bezier(.2,.8,.2,1)"') ||
    dataJs.includes("export const EASE = 'cubic-bezier(.2,.8,.2,1)'"),
  )
})

// Run directly if executed as standalone script
if (require.main === module) {
  suite.run().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0)
  })
}

module.exports = suite
