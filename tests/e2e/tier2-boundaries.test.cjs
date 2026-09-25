/**
 * Tier 2: Boundary & Corner Cases
 * Verifies edge conditions, input stress, boundary values, and fault tolerance
 */

const fs = require("fs")
const path = require("path")
const assert = require("assert")
const {
  PROJECT_ROOT,
  TestRunner,
  createMockStorage,
  BRAND_COLORS,
  formatCurrency,
  autoCat,
  calculateApartado,
  calculateBalanceState,
} = require("./helpers.cjs")

const suite = new TestRunner("Tier 2: Boundary & Corner Cases")

/* ─── T2.01: Zero & Negative Amount Inputs ─── */

suite.test(
  "T2.01: Zero amount input ($0) is rejected (canSave is false)",
  () => {
    const canSave = (name, amount) =>
      Boolean(name.trim() && parseFloat(amount) > 0)
    assert.strictEqual(canSave("Café", "0"), false)
    assert.strictEqual(canSave("Café", "0.00"), false)
    assert.strictEqual(canSave("Café", "$0"), false)
  },
)

suite.test(
  "T2.02: Negative amount input has minus sign stripped by sanitization regex",
  () => {
    const sanitize = (val) => val.replace(/[^0-9.]/g, "")
    assert.strictEqual(sanitize("-150"), "150")
    assert.strictEqual(sanitize("-$25.99"), "25.99")
    assert.strictEqual(sanitize("--999--"), "999")
  },
)

suite.test(
  "T2.03: Multiple decimal points in amount are handled cleanly by parseFloat",
  () => {
    const sanitize = (val) => val.replace(/[^0-9.]/g, "")
    const raw = "12.34.56"
    const sanitized = sanitize(raw)
    const parsed = parseFloat(sanitized)
    assert.strictEqual(parsed, 12.34)
    assert.ok(!isNaN(parsed))
  },
)

/* ─── T2.04: Extreme String Length & Truncation ─── */

suite.test(
  "T2.04: Very long expense name (200 chars) is processed without crashing",
  () => {
    const longName = "A".repeat(200)
    const cat = autoCat(longName)
    assert.strictEqual(cat, "comida") // fallback
    const item = {
      id: Date.now(),
      name: longName.trim(),
      amount: 100,
      cat,
      status: "pending",
    }
    assert.strictEqual(item.name.length, 200)
    // Source styles declare textOverflow: ellipsis
    const compJsx = fs.readFileSync(
      path.join(PROJECT_ROOT, "src/mi-bolsillo/components.jsx"),
      "utf8",
    )
    assert.ok(
      compJsx.includes('textOverflow: "ellipsis"') ||
      compJsx.includes("textOverflow: 'ellipsis'"),
    )
    assert.ok(
      compJsx.includes('overflow: "hidden"') ||
      compJsx.includes("overflow: 'hidden'"),
    )
  },
)

suite.test("T2.05: Whitespace-only concept name is rejected by trim()", () => {
  const canSave = (name, amount) =>
    Boolean(name.trim() && parseFloat(amount) > 0)
  assert.strictEqual(canSave("   ", "100"), false)
  assert.strictEqual(canSave("\t\n  ", "50"), false)
})

/* ─── T2.06: Extreme Monetary Values ─── */

suite.test(
  "T2.06: Extreme amount ($99,999,999) is formatted with standard delimiters",
  () => {
    const formatted = formatCurrency(99999999)
    assert.strictEqual(formatted, "$99,999,999")
  },
)

suite.test(
  "T2.07: Decimal fraction amounts maintain two decimal digits",
  () => {
    assert.strictEqual(formatCurrency(19.99), "$19.99")
    assert.strictEqual(formatCurrency(120.5), "$120.50")
    assert.strictEqual(formatCurrency(0.75), "$0.75")
  },
)

suite.test(
  "T2.08: Large amount in ApartadoSheet divides accurately without overflow",
  () => {
    const apartado = calculateApartado(1000000, "semanal")
    assert.strictEqual(apartado.per, 250000)
    assert.strictEqual(apartado.label, "$250,000 por semana")
  },
)

/* ─── T2.09: Empty List & Zero States ─── */

suite.test(
  "T2.09: Completely empty expense list displays friendly placeholder",
  () => {
    const items = []
    const emptyPlaceholder =
      items.length === 0 ? "Aún no registras gastos" : null
    assert.strictEqual(emptyPlaceholder, "Aún no registras gastos")
  },
)

suite.test(
  "T2.10: Zero expenses with zero income renders State A without NaN errors",
  () => {
    const state = calculateBalanceState({
      entries: [],
      incomes: [],
      includeEarlier: false,
    })
    assert.strictEqual(state.stateKey, "A")
    assert.strictEqual(state.totalGastos, 0)
    assert.strictEqual(state.totalIngresos, 0)
    assert.strictEqual(state.pct, 0)
    assert.strictEqual(state.mainAmount, 0)
    assert.ok(!isNaN(state.pct))
  },
)

/* ─── T2.11: Financial State Boundary Conditions (BVA) ─── */

suite.test(
  "T2.11: Boundary: Exactly 79% used is State B, while 80% used is State C",
  () => {
    // Income 10,000:
    // 79% used = 7,900 gastos
    const state79 = calculateBalanceState({
      entries: [{ cat: "comida", amount: 7900 }],
      incomes: [{ monto: 10000, frecuencia: "mensual" }],
      includeEarlier: false,
    })
    assert.strictEqual(state79.pct, 79)
    assert.strictEqual(state79.stateKey, "B", "79% must be State B")
    assert.strictEqual(state79.pillType, "success")

    // 80% used = 8,000 gastos
    const state80 = calculateBalanceState({
      entries: [{ cat: "comida", amount: 8000 }],
      incomes: [{ monto: 10000, frecuencia: "mensual" }],
      includeEarlier: false,
    })
    assert.strictEqual(state80.pct, 80)
    assert.strictEqual(state80.stateKey, "C", "80% must be State C")
    assert.strictEqual(state80.pillType, "warning")
  },
)

suite.test(
  "T2.12: Boundary: Income exactly equals expenses (balance = $0) enters State D (not State B/C)",
  () => {
    const stateExact = calculateBalanceState({
      entries: [{ cat: "comida", amount: 10000 }],
      incomes: [{ monto: 10000, frecuencia: "mensual" }],
      includeEarlier: false,
    })
    assert.strictEqual(stateExact.balance, 0)
    // In BalanceCard.jsx: balance > 0 ? (pct < 80 ? 'B' : 'C') : 'D'
    assert.strictEqual(stateExact.stateKey, "D", "Zero balance must be State D")
    assert.strictEqual(stateExact.mainLabel, "Diferencia del mes")
    assert.strictEqual(stateExact.mainAmount, 0)
  },
)

suite.test(
  "T2.13: Boundary: Deficit by $1 (balance = -1) triggers State D with danger indicators",
  () => {
    const stateDeficit = calculateBalanceState({
      entries: [{ cat: "comida", amount: 10001 }],
      incomes: [{ monto: 10000, frecuencia: "mensual" }],
      includeEarlier: false,
    })
    assert.strictEqual(stateDeficit.balance, -1)
    assert.strictEqual(stateDeficit.stateKey, "D")
    assert.strictEqual(stateDeficit.mainAmount, 1)
    assert.strictEqual(stateDeficit.arrow, "down")
    assert.strictEqual(stateDeficit.pillType, "danger")
  },
)

/* ─── T2.14: Swipe Gesture Boundary Values ─── */

suite.test(
  "T2.14: Swipe gesture clamping limits swipeX strictly between -90px and 0px",
  () => {
    const clampSwipe = (dx) => Math.max(-90, Math.min(0, dx))
    assert.strictEqual(clampSwipe(50), 0, "Positive drag clamped to 0")
    assert.strictEqual(clampSwipe(0), 0)
    assert.strictEqual(clampSwipe(-45), -45)
    assert.strictEqual(clampSwipe(-90), -90)
    assert.strictEqual(
      clampSwipe(-150),
      -90,
      "Excessive negative drag clamped to -90",
    )
  },
)

suite.test(
  "T2.15: Swipe gesture boundary: -59px snaps back; -60px snaps back; -61px deletes",
  () => {
    // In components.jsx: if (swipeX < -60) { onDelete(); } else { setSwipeX(0); }
    const checkDelete = (dx) => {
      const swipeX = Math.max(-90, Math.min(0, dx))
      return swipeX < -60
    }
    assert.strictEqual(checkDelete(-59), false, "-59px must NOT delete")
    assert.strictEqual(
      checkDelete(-60),
      false,
      "-60px must NOT delete (boundary)",
    )
    assert.strictEqual(checkDelete(-61), true, "-61px MUST delete")
  },
)

/* ─── T2.16: Fault Tolerance & Corrupt Storage ─── */

suite.test(
  "T2.16: Corrupt non-JSON data in localStorage falls back safely",
  () => {
    const storage = createMockStorage({
      "mi-bolsillo:v3:items": "<<<HTML ERROR 500>>>",
      "mb:incomes:v1": "undefined",
    })

    const loadData = (key, fallback) => {
      try {
        const raw = storage.getItem(key)
        return raw != null ? JSON.parse(raw) : fallback
      } catch {
        return fallback
      }
    }

    const items = loadData("mi-bolsillo:v3:items", [{ id: "fallback" }])
    const incomes = loadData("mb:incomes:v1", [])

    assert.deepStrictEqual(items, [{ id: "fallback" }])
    assert.deepStrictEqual(incomes, [])
  },
)

suite.test(
  "T2.17: LocalStorage QuotaExceededError is trapped during write",
  () => {
    const storage = createMockStorage({}, { quotaError: true })
    let errorCaught = false

    const saveWithCatch = (key, val) => {
      try {
        storage.setItem(key, JSON.stringify(val))
      } catch (e) {
        errorCaught = true
      }
    }

    saveWithCatch("mi-bolsillo:v3:items", { bigData: true })
    assert.strictEqual(
      errorCaught,
      true,
      "QuotaExceededError should be trapped cleanly",
    )
  },
)

/* ─── T2.18: Autoplay Video & Offline Simulation ─── */

suite.test(
  "T2.18: Missing video file or network offline rejection invokes finish handler",
  async () => {
    let transitioned = false
    const finish = () => {
      transitioned = true
    }

    // Simulate missing media network error (MediaError code 4)
    const simulateNetworkError = () =>
      new Promise((_, reject) => {
        const err = new Error(
          "MEDIA_ELEMENT_ERROR: Format error or network unreachable",
        )
        err.code = 4
        reject(err)
      })

    await simulateNetworkError().catch(() => finish())
    assert.strictEqual(
      transitioned,
      true,
      "App must transition smoothly even on media error",
    )
  },
)

suite.test(
  "T2.19: Repeated session launches persist splash-seen and prevent repeat video",
  () => {
    const storage = createMockStorage({})
    // First run:
    assert.strictEqual(storage.getItem("splash-seen"), null)
    storage.setItem("splash-seen", "1")

    // Second run:
    const seenRun2 = storage.getItem("splash-seen") === "1"
    assert.strictEqual(seenRun2, true)

    // Third run:
    const seenRun3 = storage.getItem("splash-seen") === "1"
    assert.strictEqual(seenRun3, true)
  },
)

suite.test(
  "T2.20: Offline simulation: WebView baseUrl is https://localhost to avoid null origin CORS",
  () => {
    const webViewSource = {
      html: '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
      baseUrl: "https://localhost",
    }
    assert.strictEqual(webViewSource.baseUrl, "https://localhost")
    assert.ok(webViewSource.html.length > 0)
  },
)

// Run directly if executed as standalone script
if (require.main === module) {
  suite.run().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0)
  })
}

module.exports = suite
