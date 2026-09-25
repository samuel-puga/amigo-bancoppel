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

async function test() {
  console.log("Testing Vite build with mobileVideoBlobPlugin...")
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
  console.log("Output files count:", bundle.output.length)
  for (const item of bundle.output) {
    console.log(
      `- ${item.fileName} (${item.type}) size: ${
        item.source
          ? item.source.length
          : item.code
            ? item.code.length
            : "unknown"
      }`,
    )
    if (item.type === "chunk" && item.fileName.endsWith(".js")) {
      const hasBlobCreate = item.code.includes("createObjectURL")
      const hasAtob = item.code.includes("atob")
      console.log(
        `  Contains createObjectURL: ${hasBlobCreate}, contains atob: ${hasAtob}`,
      )
    }
  }
}

test().catch((err) => console.error(err))
