/**
 * Amigo BanCoppel MVP - E2E Test Suite Helpers & Contract Oracles
 * Opaque-box requirement-driven test harness
 */

const fs = require("fs")
const path = require("path")
const assert = require("assert")

const PROJECT_ROOT = path.resolve(__dirname, "../..")

/* ─── Lightweight Test Harness ─── */

class TestRunner {
  constructor(name) {
    this.name = name
    this.tests = []
    this.results = []
  }

  test(description, fn) {
    this.tests.push({ description, fn })
  }

  async run() {
    console.log(
      `\n============================================================`,
    )
    console.log(`RUNNING SUITE: ${this.name}`)
    console.log(`============================================================`)

    let passed = 0
    let failed = 0
    const startAll = Date.now()

    for (const { description, fn } of this.tests) {
      const start = Date.now()
      try {
        await fn()
        const duration = Date.now() - start
        passed++
        this.results.push({ description, status: "PASS", duration })
        console.log(`  [PASS] ${description} (${duration}ms)`)
      } catch (err) {
        const duration = Date.now() - start
        failed++
        this.results.push({ description, status: "FAIL", duration, error: err })
        console.error(`  [FAIL] ${description} (${duration}ms)`)
        console.error(`         Error: ${err.message}`)
        if (err.stack) {
          const lines = err.stack
            .split("\n")
            .slice(1, 4)
            .map((l) => "         " + l.trim())
          console.error(lines.join("\n"))
        }
      }
    }

    const totalDuration = Date.now() - startAll
    console.log(`------------------------------------------------------------`)
    console.log(
      `Suite "${this.name}" Completed: ${passed} passed, ${failed} failed in ${totalDuration}ms`,
    )
    console.log(
      `============================================================\n`,
    )

    return {
      name: this.name,
      passed,
      failed,
      total: this.tests.length,
      duration: totalDuration,
      results: this.results,
    }
  }
}

/* ─── Mock Storage Implementation (F15) ─── */

function createMockStorage(initial = {}, options = {}) {
  let store = { ...initial }
  let quotaError = options.quotaError || false

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key)
        ? store[key]
        : null
    },
    setItem(key, value) {
      if (quotaError) {
        const err = new Error("QuotaExceededError: DOM Exception 22")
        err.name = "QuotaExceededError"
        err.code = 22
        throw err
      }
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key(index) {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    _getRawStore() {
      return { ...store }
    },
    _setQuotaError(flag) {
      quotaError = flag
    },
  }
}

/* ─── Authoritative Domain Calculations & Algorithms ─── */

// Category Definitions & Tokens (F16)
const BRAND_COLORS = {
  navy: "#05297A",
  navyDark: "#022A7A",
  primary: "#1C42E8",
  primaryPressed: "#1631B8",
  primarySoft: "#EEF1FE",
  yellow: "#F0D225",
  bg: "#F0F2F5",
  surface: "#FFFFFF",
  text: "#0F1419",
  text2: "#65676B",
  muted: "#9CA3AF",
  border: "#E4E6EB",
  success: "#16A34A",
  successBright: "#08BF50",
  warning: "#D97706",
  danger: "#DC2626",
}

const BAR_COLORS = {
  hogar: "#2A44E0",
  despensa: "#F2B35B",
  servicios: "#7B3FF2",
  transporte: "#4CB85C",
  suscripciones: "#F2A6EE",
  comida: "#F2D12E",
  salud: "#FF594D",
  ocio: "#022A7A",
}

const CATEGORIES = {
  comida: { label: "Comida", emoji: "🍔", color: "#F2D12E" },
  servicios: { label: "Servicios", emoji: "💡", color: "#7D42FF" },
  ocio: { label: "Ocio", emoji: "🎬", color: "#022A7A" },
  transporte: { label: "Transporte", emoji: "🚗", color: "#08BF50" },
  despensa: { label: "Despensa", emoji: "🛒", color: "#FFAE43" },
  salud: { label: "Salud", emoji: "💊", color: "#FF594D" },
  suscripciones: { label: "Suscripciones", emoji: "📱", color: "#FDA1FB" },
  hogar: { label: "Hogar", emoji: "🏠", color: "#1C42E8" },
}

const FREQUENCIES = {
  semanal: { n: 4, short: "Semanal", label: "por semana", unit: "semanas" },
  quincenal: {
    n: 2,
    short: "Quincenal",
    label: "por quincena",
    unit: "quincenas",
  },
  mensual: { n: 1, short: "Mensual", label: "al mes", unit: "mes" },
}

const RECURRING = ["servicios", "suscripciones", "hogar"]
const DOMICILIABLE = ["servicios", "suscripciones"]
const EARLIER = [{ cat: "transporte", amount: 230 }]

// Auto-categorization algorithm (F10)
function autoCat(text) {
  if (!text || typeof text !== "string") return "comida"
  const t = text.toLowerCase()
  if (
    /netflix|spotify|disney|hbo|amazon|crunchyroll|apple tv|paramount/.test(t)
  )
    return "suscripciones"
  if (
    /\bluz\b|cfe|\bgas\b|\bagua\b|telmex|telcel|internet|izzi|sky|megacable/.test(
      t,
    )
  )
    return "servicios"
  if (/walmart|oxxo|chedraui|superama|bodega|costco|sams|soriana|comer/.test(t))
    return "despensa"
  if (/uber|didi|\btaxi\b|gasolina|metro|camion|transporte|autobus/.test(t))
    return "transporte"
  if (/\brenta\b|mantenimiento|plomero|electricista|\bhogar\b/.test(t))
    return "hogar"
  if (/doctor|farmacia|medicamento|hospital|dentista|consulta/.test(t))
    return "salud"
  if (/cine|concierto|teatro|museo|estadio/.test(t)) return "ocio"
  if (
    /restaurante|taqueria|\bcomida\b|pizza|hamburguesa|cafe|\btacos\b|sushi/.test(
      t,
    )
  )
    return "comida"
  return "comida"
}

// Income normalization (F11)
function monthlyAmt(income) {
  if (!income) return 0
  return income.frecuencia === "quincenal" ? income.monto * 2 : income.monto
}

// Currency formatter (F16)
function formatCurrency(n) {
  if (typeof n !== "number" || isNaN(n)) return "$0"
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: n % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    })
  )
}

// Apartado calculation (F14)
function calculateApartado(amount, frequencyKey) {
  const f = FREQUENCIES[frequencyKey] || FREQUENCIES.semanal
  const per = Math.ceil(amount / f.n)
  return {
    per,
    frequency: f,
    total: amount,
    label: `${formatCurrency(per)} ${f.label}`,
    description: `En ${f.n} ${f.unit} juntas ${formatCurrency(amount)} para tu próximo pago`,
  }
}

// BalanceCard financial state calculation (F11)
function calculateBalanceState({
  entries = [],
  incomes = [],
  includeEarlier = true,
}) {
  const allEntries = includeEarlier ? [...entries, ...EARLIER] : [...entries]
  const totalGastos = allEntries.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  )
  const totalIngresos = incomes.reduce((sum, inc) => sum + monthlyAmt(inc), 0)
  const balance = totalIngresos - totalGastos
  const pct =
    totalIngresos > 0 ? Math.round((totalGastos / totalIngresos) * 100) : 0
  const hasIncome = incomes.length > 0

  let stateKey
  let cardTitle
  let mainLabel
  let mainAmount
  let pillText
  let pillType // 'neutral' | 'success' | 'warning' | 'danger'
  let arrow // null | 'up' | 'down'

  if (!hasIncome) {
    stateKey = "A"
    cardTitle = "Gastado este mes"
    mainLabel = "Llevas gastado"
    mainAmount = totalGastos
    pillText = "Agrega tus ingresos y ve cuánto te queda"
    pillType = "neutral"
    arrow = null
  } else if (balance > 0 && pct < 80) {
    stateKey = "B"
    cardTitle = "Balance del mes"
    mainLabel = "Te quedan"
    mainAmount = balance
    pillText = `Usaste ${pct}% de tus ingresos`
    pillType = "success"
    arrow = "up"
  } else if (balance > 0 && pct >= 80) {
    stateKey = "C"
    cardTitle = "Balance del mes"
    mainLabel = "Te quedan"
    mainAmount = balance
    pillText = `Usaste ${pct}% de tus ingresos`
    pillType = "warning"
    arrow = "up"
  } else {
    // balance <= 0 (Déficit)
    stateKey = "D"
    cardTitle = "Balance del mes"
    mainLabel = "Diferencia del mes"
    mainAmount = Math.abs(balance)
    const overPct =
      totalIngresos > 0
        ? Math.round(((totalGastos - totalIngresos) / totalIngresos) * 100)
        : 0
    pillText =
      overPct > 0
        ? `${overPct}% sobre tu ingreso`
        : "Tus gastos superaron tus ingresos"
    pillType = "danger"
    arrow = "down"
  }

  // Category totals
  const totals = {}
  allEntries.forEach((item) => {
    totals[item.cat] = (totals[item.cat] || 0) + (Number(item.amount) || 0)
  })
  const catBreakdown = Object.keys(totals)
    .map((c) => ({
      cat: c,
      amount: totals[c],
      fraction: totalGastos > 0 ? totals[c] / totalGastos : 0,
      pctOfIncome:
        totalIngresos > 0
          ? Math.round((totals[c] / totalIngresos) * 100)
          : null,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    stateKey,
    hasIncome,
    totalGastos,
    totalIngresos,
    balance,
    pct,
    cardTitle,
    mainLabel,
    mainAmount,
    pillText,
    pillType,
    arrow,
    catBreakdown,
  }
}

/* ─── Contract Validators ─── */

function validateAppJsonContract(appJson) {
  assert.ok(appJson, "app.json configuration object must be present")
  const expo = appJson.expo || appJson
  assert.ok(expo.name, "app.json must specify expo.name")
  assert.strictEqual(
    expo.orientation,
    "portrait",
    "app.json orientation must be portrait",
  )

  if (expo.android) {
    assert.strictEqual(
      expo.android.softwareKeyboardLayoutMode,
      "resize",
      'android.softwareKeyboardLayoutMode must be "resize"',
    )
  }

  return true
}

function validateWebViewPropsContract(props) {
  assert.ok(props, "WebView props object must be provided")
  assert.strictEqual(
    props.javaScriptEnabled,
    true,
    "WebView must have javaScriptEnabled={true}",
  )
  assert.strictEqual(
    props.domStorageEnabled,
    true,
    "WebView must have domStorageEnabled={true}",
  )
  assert.strictEqual(
    props.mediaPlaybackRequiresUserAction,
    false,
    "WebView must have mediaPlaybackRequiresUserAction={false} for video autoplay",
  )
  assert.strictEqual(
    props.allowsInlineMediaPlayback,
    true,
    "WebView must have allowsInlineMediaPlayback={true}",
  )
  assert.strictEqual(
    props.allowFileAccess,
    true,
    "WebView must have allowFileAccess={true}",
  )
  assert.strictEqual(
    props.mixedContentMode,
    "always",
    'WebView must have mixedContentMode="always"',
  )

  // Origin whitelist
  assert.ok(
    Array.isArray(props.originWhitelist),
    "originWhitelist must be an array",
  )
  assert.ok(
    props.originWhitelist.includes("*"),
    'originWhitelist must include "*"',
  )

  // Source configuration
  assert.ok(props.source, "source prop must be defined")
  if (props.source.html) {
    assert.strictEqual(
      typeof props.source.html,
      "string",
      "source.html must be a string",
    )
    assert.ok(
      props.source.html.length > 50,
      "source.html bundle must contain payload",
    )
  } else if (props.source.uri) {
    assert.strictEqual(
      typeof props.source.uri,
      "string",
      "source.uri must be a string",
    )
  }

  return true
}

function validateInlinedHtmlContract(html) {
  assert.ok(
    html && typeof html === "string",
    "HTML bundle must be a non-empty string",
  )
  assert.ok(
    html.includes("<!DOCTYPE html>") || html.includes("<!doctype html>"),
    "HTML must declare doctype",
  )
  assert.ok(
    html.includes('<meta name="viewport"'),
    "HTML must include mobile viewport meta tag",
  )
  assert.ok(
    html.includes('<div id="root">') || html.includes('id="root"'),
    "HTML must contain root container",
  )
  return true
}

module.exports = {
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
}
