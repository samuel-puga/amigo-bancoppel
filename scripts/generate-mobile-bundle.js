#!/usr/bin/env node
import { build } from "vite"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")

const splashVideoPath = path.resolve(
  rootDir,
  "src/mi-bolsillo/assets/splash.mp4",
)
const targetTsFile = path.resolve(rootDir, "src-mobile/generated/webAppHtml.ts")
const targetJsFile = path.resolve(rootDir, "src-mobile/generated/webAppHtml.js")
const targetHtmlFile = path.resolve(rootDir, "dist/index.singlefile.html")

function mobileVideoBlobPlugin() {
  return {
    name: "mobile-video-blob-plugin",
    enforce: "pre",
    load(id) {
      if (id.endsWith(".mp4")) {
        return `
          const getSplashUrl = () => {
            if (typeof window !== 'undefined' && window.__SPLASH_BLOB_URL__) {
              return window.__SPLASH_BLOB_URL__;
            }
            return '';
          };
          const splashUrl = getSplashUrl();
          export default splashUrl;
        `
      }
      return null
    },
  }
}

async function generateMobileBundle() {
  const startTime = Date.now()
  console.log("[MobileBundler] Starting autonomous bundle compilation...")

  if (!fs.existsSync(splashVideoPath)) {
    throw new Error(`Splash video not found at: ${splashVideoPath}`)
  }

  // 1. Read splash video and encode to base64
  console.log("[MobileBundler] Reading splash.mp4 asset...")
  const splashBuffer = fs.readFileSync(splashVideoPath)
  const splashBase64 = splashBuffer.toString("base64")
  console.log(
    `[MobileBundler] Splash video encoded: ${splashBuffer.length} bytes -> ${splashBase64.length} base64 chars`,
  )

  // 2. Programmatic Vite build with Rolldown / codeSplitting: false
  console.log("[MobileBundler] Compiling React+Vite web app...")
  const result = await build({
    root: rootDir,
    configFile: path.resolve(rootDir, "vite.config.ts"),
    plugins: [mobileVideoBlobPlugin()],
    build: {
      write: false,
      assetsInlineLimit: 2000000, // 2 MB limit forces images/assets inline
      sourcemap: false,
      minify: true,
      rollupOptions: {
        output: {
          codeSplitting: false,
        },
      },
    },
  })

  const bundle = Array.isArray(result) ? result[0] : result
  let htmlAsset = null
  const jsChunks = []
  const cssAssets = []

  for (const item of bundle.output) {
    if (item.fileName === "index.html") {
      htmlAsset = item
    } else if (item.type === "chunk" && item.fileName.endsWith(".js")) {
      jsChunks.push(item)
    } else if (item.type === "asset" && item.fileName.endsWith(".css")) {
      cssAssets.push(item)
    }
  }

  if (!htmlAsset) {
    throw new Error(
      "[MobileBundler] index.html not found in Vite build output.",
    )
  }

  // 3. Assemble monolithic single-file HTML
  let html = htmlAsset.source.toString()
  const cssContent = cssAssets.map((c) => c.source.toString()).join("\n")
  const jsContent = jsChunks
    .map((j) => j.code.replace(/<\/script>/gi, "<\\/script>"))
    .join("\n")

  // Strip external asset links
  html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, "")
  html = html.replace(
    /<script[^>]*type=["']module["'][^>]*src=["'][^"']*assets\/[^"']*["'][^>]*><\/script>/gi,
    "",
  )

  // Inject CSS with replacer function to avoid pattern replacement traps ($', $`, $&)
  html = html.replace(
    "</head>",
    () => `<style type="text/css">\n${cssContent}\n</style>\n</head>`,
  )

  // Inject synchronous Blob hydration script in <head>
  const splashInlineScript = `
<script id="splash-blob-hydration">
(function() {
  try {
    var b64 = "${splashBase64}";
    var binary = atob(b64);
    var len = binary.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    var blob = new Blob([bytes], { type: 'video/mp4' });
    var blobUrl = URL.createObjectURL(blob);
    window.__SPLASH_BLOB_URL__ = blobUrl;

    var origDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    if (origDesc && origDesc.set) {
      Object.defineProperty(HTMLMediaElement.prototype, 'src', {
        get: function() { return origDesc.get.call(this); },
        set: function(val) {
          if (typeof val === 'string' && (val.indexOf('data:video/mp4') === 0 || val.indexOf('splash') !== -1)) {
            return origDesc.set.call(this, blobUrl);
          }
          return origDesc.set.call(this, val);
        },
        configurable: true
      });
    }
  } catch(e) {
    console.error('[SplashHydration] Failed to create Blob URL:', e);
  }
})();
</script>`

  html = html.replace("</head>", () => `${splashInlineScript}\n</head>`)

  // Inject JS bundle at bottom of <body> with replacer function
  html = html.replace(
    "</body>",
    () => `<script type="module">\n${jsContent}\n</script>\n</body>`,
  )

  // 4. Serialize and write outputs
  const outputDir = path.dirname(targetTsFile)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const distDir = path.resolve(rootDir, "dist")
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }

  // Safe string serialization escaping line terminators
  const escapedHtml = JSON.stringify(html)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")

  const tsContent =
    `// Auto-generated by scripts/generate-mobile-bundle.js - DO NOT EDIT MANUALLY\n` +
    `export const webAppHtml: string = ${escapedHtml};\n`

  const jsModuleContent =
    `// Auto-generated by scripts/generate-mobile-bundle.js - DO NOT EDIT MANUALLY\n` +
    `export const webAppHtml = ${escapedHtml};\n` +
    `export default webAppHtml;\n`

  fs.writeFileSync(targetTsFile, tsContent, "utf8")
  fs.writeFileSync(targetJsFile, jsModuleContent, "utf8")
  fs.writeFileSync(targetHtmlFile, html, "utf8")

  const duration = Date.now() - startTime
  console.log(`[MobileBundler] Bundle successfully generated in ${duration}ms!`)
  console.log(
    `  - HTML output: ${targetHtmlFile} (${(html.length / 1024 / 1024).toFixed(2)} MB)`,
  )
  console.log(
    `  - TypeScript output: ${targetTsFile} (${(tsContent.length / 1024 / 1024).toFixed(2)} MB)`,
  )
  console.log(`  - JavaScript output: ${targetJsFile}`)
}

generateMobileBundle().catch((err) => {
  console.error("[MobileBundler] Build failed:", err)
  process.exit(1)
})
