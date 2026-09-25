#!/usr/bin/env node

/**
 * Master E2E Test Runner for Amigo BanCoppel MVP
 * Executes Tiers 1-4 suites, aggregates metrics, and formats clear tier-by-tier report.
 */

const tier1 = require("./tier1-features.test.cjs")
const tier2 = require("./tier2-boundaries.test.cjs")
const tier3 = require("./tier3-combinations.test.cjs")
const tier4 = require("./tier4-scenarios.test.cjs")

async function main() {
  console.log(
    `\n================================================================================`,
  )
  console.log(
    ` AMIGO BANCOPPEL MVP — AUTOMATED OPAQUE-BOX E2E TEST SUITE RUNNER`,
  )
  console.log(` Target Platform: Android (Expo Go WebView wrapper)`)
  console.log(
    ` Methodology: Category-Partition + BVA + Pairwise + Workload Scenarios`,
  )
  console.log(` Timestamp: ${new Date().toISOString()}`)
  console.log(
    `================================================================================\n`,
  )

  const startTime = Date.now()
  const suites = [tier1, tier2, tier3, tier4]
  const summaries = []

  for (const suite of suites) {
    const res = await suite.run()
    summaries.push(res)
  }

  const totalDuration = Date.now() - startTime
  const totalPassed = summaries.reduce((sum, s) => sum + s.passed, 0)
  const totalFailed = summaries.reduce((sum, s) => sum + s.failed, 0)
  const totalTests = summaries.reduce((sum, s) => sum + s.total, 0)

  console.log(
    `\n================================================================================`,
  )
  console.log(` AGGREGATED E2E TEST EXECUTION SUMMARY`)
  console.log(
    `================================================================================`,
  )
  console.log(
    ` ${"Tier / Suite Name".padEnd(55)} | ${"Pass".padStart(5)} | ${"Fail".padStart(5)} | ${"Total".padStart(5)} | ${"Time".padStart(8)}`,
  )
  console.log(
    `--------------------------------------------------------------------------------`,
  )

  for (const s of summaries) {
    const statusMark = s.failed === 0 ? "✓" : "✗"
    console.log(
      ` ${statusMark} ${s.name.padEnd(53)} | ${String(s.passed).padStart(5)} | ${String(s.failed).padStart(5)} | ${String(s.total).padStart(5)} | ${String(s.duration + "ms").padStart(8)}`,
    )
  }

  console.log(
    `================================================================================`,
  )
  console.log(
    ` TOTAL VERIFIED: ${totalPassed} / ${totalTests} PASSED (${totalFailed} FAILED) in ${totalDuration}ms`,
  )
  console.log(
    ` RESULT: ${
      totalFailed === 0
        ? "ALL TIERS PASSING - TEST READY"
        : "TEST FAILURES DETECTED"
    }`,
  )
  console.log(
    `================================================================================\n`,
  )

  if (totalFailed > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Fatal error during test run:", err)
  process.exit(1)
})
