import { build } from "vite"
import fs from "node:fs"
import path from "node:path"

function mobileVideoPatternAPlugin() {
  return {
    name: "mobile-video-pattern-a-plugin",
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

async function testPatternA() {
  console.log("Testing Pattern A...")
  const splashBuffer = fs.readFileSync(
    path.resolve("src/mi-bolsillo/assets/splash.mp4"),
  )
  const splashBase64 = splashBuffer.toString("base64")
  console.log(
    "Splash raw bytes:",
    splashBuffer.length,
    "Base64 length:",
    splashBase64.length,
  )

  const result = await build({
    configFile: path.resolve("vite.config.ts"),
    plugins: [mobileVideoPatternAPlugin()],
    build: {
      write: false,
      assetsInlineLimit: 2000000,
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
    if (item.fileName === "index.html") htmlAsset = item
    else if (item.type === "chunk" && item.fileName.endsWith(".js"))
      jsChunks.push(item)
    else if (item.type === "asset" && item.fileName.endsWith(".css"))
      cssAssets.push(item)
  }

  let html = htmlAsset.source.toString()
  const cssContent = cssAssets.map((c) => c.source.toString()).join("\n")
  html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, "")
  html = html.replace(
    "</head>",
    () => `<style>\n${cssContent}\n</style>\n</head>`,
  )

  const jsContent = jsChunks
    .map((j) => j.code.replace(/<\/script>/gi, "<\\/script>"))
    .join("\n")
  html = html.replace(
    /<script[^>]*type=["']module["'][^>]*src=["'][^"']*assets\/[^"']*["'][^>]*><\/script>/gi,
    "",
  )

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
    window.__SPLASH_BLOB_URL__ = URL.createObjectURL(blob);
    console.log('[SplashHydration] Created Blob URL:', window.__SPLASH_BLOB_URL__);
  } catch(e) {
    console.error('[SplashHydration] Error creating Blob URL:', e);
  }
})();
</script>`

  html = html.replace("</head>", () => `${splashInlineScript}\n</head>`)
  html = html.replace(
    "</body>",
    () => `<script type="module">\n${jsContent}\n</script>\n</body>`,
  )

  console.log(
    "Pattern A generated HTML size:",
    html.length,
    "bytes (~" + (html.length / 1024 / 1024).toFixed(2) + " MB)",
  )
  console.log("JS chunk size (clean!):", jsChunks[0].code.length, "bytes")
  console.log(
    "Contains splash hydration script:",
    html.includes('id="splash-blob-hydration"'),
  )
  console.log(
    "Contains window.__SPLASH_BLOB_URL__:",
    html.includes("window.__SPLASH_BLOB_URL__"),
  )
}

testPatternA().catch(console.error)
