import { build } from "vite"
import fs from "node:fs"
import path from "node:path"

function mobileVideoBlobPlugin() {
  return {
    name: "mobile-video-blob-plugin",
    enforce: "pre",
    load(id) {
      if (id.endsWith(".mp4")) {
        const buffer = fs.readFileSync(id)
        const b64 = buffer.toString("base64")
        return `
          const b64 = ${JSON.stringify(b64)};
          let blobUrl = '';
          try {
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const blob = new Blob([bytes], { type: 'video/mp4' });
            blobUrl = URL.createObjectURL(blob);
            if (typeof window !== 'undefined') {
              window.__SPLASH_BLOB_URL__ = blobUrl;
            }
          } catch(e) {
            console.error('Blob URL creation error:', e);
          }
          export default blobUrl;
        `
      }
      return null
    },
  }
}

async function verify() {
  const result = await build({
    configFile: path.resolve("vite.config.ts"),
    plugins: [mobileVideoBlobPlugin()],
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
  html = html.replace("</head>", `<style>\n${cssContent}\n</style>\n</head>`)

  const jsContent = jsChunks
    .map((j) => j.code.replace(/<\/script>/gi, "<\\/script>"))
    .join("\n")
  html = html.replace(
    /<script[^>]*type=["']module["'][^>]*src=["'][^"']*assets\/[^"']*["'][^>]*><\/script>/gi,
    "",
  )
  html = html.replace(
    "</body>",
    `<script type="module">\n${jsContent}\n</script>\n</body>`,
  )

  console.log("--- VERIFICATION CHECKS ---")
  console.log("1. DOCTYPE present:", html.includes("<!doctype html>"))
  console.log("2. Root div present:", html.includes('<div id="root"></div>'))
  console.log(
    "3. CSS present:",
    html.includes("<style>") && cssContent.length > 5000,
  )
  console.log(
    "4. JS module script present:",
    html.includes('<script type="module">'),
  )
  console.log(
    "5. Logo inlined as base64:",
    html.includes("data:image/png;base64"),
  )
  console.log(
    "6. Video blob conversion present:",
    html.includes("URL.createObjectURL(blob)"),
  )
  console.log("7. Total bundle length (bytes):", html.length)
  console.log(
    "8. No external script/css links remaining:",
    !html.includes("/assets/index-"),
  )
}

verify().catch(console.error)
