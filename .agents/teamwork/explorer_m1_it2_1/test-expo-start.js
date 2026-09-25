import { spawn } from "node:child_process"
import path from "node:path"

const isWindows = process.platform === "win32"
const cmd = isWindows ? "npx.cmd" : "npx"
const overrideConfig = path.resolve(".agents/teamwork/explorer_m1_it2_1/metro.config.remediation.js")

console.log("[TestExpoStart] Spawning Expo start with override config:", overrideConfig)

const child = spawn(cmd, ["expo", "start", "--offline"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    EXPO_OVERRIDE_METRO_CONFIG: overrideConfig,
    CI: "1", // Non-interactive mode
  },
  shell: isWindows,
})

let output = ""
let errorOutput = ""
let resolved = false

function cleanup(exitCode) {
  if (resolved) return
  resolved = true
  try {
    if (isWindows) {
      spawn("taskkill", ["/pid", child.pid.toString(), "/f", "/t"])
    } else {
      child.kill("SIGTERM")
    }
  } catch {}
  process.exit(exitCode)
}

child.stdout.on("data", (data) => {
  const str = data.toString()
  output += str
  process.stdout.write("[EXPO STDOUT] " + str)

  // Success indicators
  if (
    str.includes("Waiting on") ||
    str.includes("Metro waiting on") ||
    str.includes("Expo Go") ||
    str.includes("Scan the QR code") ||
    str.includes("Metro ready") ||
    str.includes("Opening on") ||
    str.includes("Logs for your project will appear below")
  ) {
    console.log("\n[TestExpoStart] SUCCESS: Expo dev server started cleanly without crashing!")
    cleanup(0)
  }
})

child.stderr.on("data", (data) => {
  const str = data.toString()
  errorOutput += str
  process.stderr.write("[EXPO STDERR] " + str)

  if (str.includes("ERR_MODULE_NOT_FOUND")) {
    console.error("\n[TestExpoStart] FAILURE: ERR_MODULE_NOT_FOUND detected!")
    cleanup(1)
  }
})

child.on("close", (code) => {
  if (!resolved) {
    console.log(`\n[TestExpoStart] Process closed with exit code ${code}`)
    cleanup(code || 0)
  }
})

// Max timeout 20s
setTimeout(() => {
  if (!resolved) {
    console.log("\n[TestExpoStart] TIMEOUT (20s) reached.")
    console.log("[TestExpoStart] Total Output:\n" + output)
    console.log("[TestExpoStart] Total Error Output:\n" + errorOutput)
    cleanup(output.includes("ERR_MODULE_NOT_FOUND") ? 1 : 0)
  }
}, 20000)
