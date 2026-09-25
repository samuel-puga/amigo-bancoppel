#!/usr/bin/env node
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")
const generatedFile = path.resolve(
  rootDir,
  "src-mobile/generated/webAppHtml.ts",
)

async function main() {
  console.log("[StartMobile] Verifying mobile bundle status...")
  const needsBuild =
    !fs.existsSync(generatedFile) || process.argv.includes("--rebuild")

  if (needsBuild) {
    console.log("[StartMobile] Generating fresh mobile bundle...")
    const bundler = spawn(
      process.execPath,
      [path.resolve(rootDir, "scripts/generate-mobile-bundle.js")],
      {
        stdio: "inherit",
        cwd: rootDir,
      },
    )
    await new Promise((resolve, reject) => {
      bundler.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`Bundler exited with code ${code}`)),
      )
    })
  } else {
    console.log("[StartMobile] Existing webAppHtml bundle detected.")
  }

  console.log("[StartMobile] Starting Expo CLI...")
  const isWindows = process.platform === "win32"
  const expoCmd = isWindows ? "npx.cmd" : "npx"
  const args = [
    "expo",
    "start",
    ...process.argv.slice(2).filter((a) => a !== "--rebuild"),
  ]

  const expo = spawn(expoCmd, args, {
    stdio: "inherit",
    cwd: rootDir,
    shell: isWindows,
  })

  expo.on("close", (code) => process.exit(code || 0))
}

main().catch((err) => {
  console.error("[StartMobile] Startup failure:", err)
  process.exit(1)
})
