import { build } from "vite"
import fs from "node:fs"
import path from "node:path"

async function test() {
  console.log("Testing programmatic Vite build with inlining...")
  const result = await build({
    configFile: path.resolve("vite.config.ts"),
    build: {
      write: false,
      assetsInlineLimit: 2000000,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
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
  }
}

test().catch((err) => console.error(err))
