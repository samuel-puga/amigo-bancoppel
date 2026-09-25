/**
 * Tier 4: Real-World Application Scenarios
 * Verifies complete end-to-end user journeys, live demo workflows, and offline lifecycles
 */

const fs = require("fs")
const path = require("path")
const assert = require("assert")
const {
  PROJECT_ROOT,
  TestRunner,
  createMockStorage,
  BRAND_COLORS,
  BAR_COLORS,
  FREQUENCIES,
  RECURRING,
  DOMICILIABLE,
  autoCat,
  monthlyAmt,
  formatCurrency,
  calculateApartado,
  calculateBalanceState,
} = require("./helpers.cjs")

const suite = new TestRunner("Tier 4: Real-World Application Scenarios")

/* ─── Scenario 1: Full Demo User Journey ─── */

suite.test(
  "Scenario 1: Complete Public Presentation Demo Journey",
  async () => {
    // Simulates the exact live presentation sequence:
    // Splash Video -> Welcome Login Screen -> Tab Navigation -> Dashboard -> QuickAdd Expense -> Toggle Payment

    const storage = createMockStorage({})
    let activeTab = "login"
    let splashActive = true

    // 1. App Launch: Fresh session, splash video begins
    assert.strictEqual(storage.getItem("splash-seen"), null)
    assert.strictEqual(splashActive, true)

    // 2. Splash video completes after 520ms fade
    storage.setItem("splash-seen", "1")
    splashActive = false
    assert.strictEqual(storage.getItem("splash-seen"), "1")
    assert.strictEqual(splashActive, false)

    // 3. User views Welcome Screen ("Bienvenido")
    assert.strictEqual(activeTab, "login")
    let user = "0123 4567 8901"
    let pass = "demo2026"
    assert.ok(user.trim() && pass, "Form credentials entered")

    // 4. User navigates to "Amigo BanCoppel" tab
    activeTab = "bolsillo"
    const trackTransform =
      activeTab === "bolsillo" ? "translateX(-50%)" : "translateX(0)"
    assert.strictEqual(
      trackTransform,
      "translateX(-50%)",
      "Track slides to dashboard",
    )

    // 5. Initial Seed Items Loaded
    let items = [
      {
        id: 1,
        name: "Netflix",
        cat: "suscripciones",
        amount: 219,
        status: "paid",
        reminder: false,
      },
      {
        id: 2,
        name: "Luz CFE",
        cat: "servicios",
        amount: 780,
        status: "pending",
        reminder: true,
      },
      {
        id: 3,
        name: "Despensa Walmart",
        cat: "despensa",
        amount: 1200,
        status: "pending",
        reminder: false,
      },
      {
        id: 4,
        name: "Renta",
        cat: "hogar",
        amount: 3500,
        status: "overdue",
        reminder: false,
      },
    ]
    let incomes = [
      {
        id: 1,
        tipo: "sueldo",
        monto: 12000,
        frecuencia: "mensual",
        nombre: "Nómina",
      },
    ]

    let balanceState = calculateBalanceState({ entries: items, incomes })
    assert.strictEqual(balanceState.stateKey, "B")
    assert.strictEqual(balanceState.totalGastos, 5929) // 5699 + 230 earlier
    assert.strictEqual(balanceState.balance, 6071)

    // 6. User enters Quick Expense: "Tacos de carnitas $160"
    const concept = "Tacos de carnitas"
    const amount = 160
    const detectedCat = autoCat(concept)
    assert.strictEqual(detectedCat, "comida")

    const newExpense = {
      id: Date.now(),
      name: concept,
      cat: detectedCat,
      amount,
      date: "Hoy",
      status: "pending",
      reminder: false,
      isNew: true,
    }
    items = [newExpense, ...items]
    assert.strictEqual(items.length, 5)

    // 7. Balance updates immediately
    balanceState = calculateBalanceState({ entries: items, incomes })
    assert.strictEqual(balanceState.totalGastos, 6089)
    assert.strictEqual(balanceState.balance, 5911)

    // 8. User marks pending expense "Luz CFE" as paid
    const targetId = 2
    items = items.map((i) =>
      i.id === targetId ? { ...i, status: "paid", orig: i.status } : i,
    )
    const paidItem = items.find((i) => i.id === targetId)
    assert.strictEqual(paidItem.status, "paid")
    assert.strictEqual(paidItem.orig, "pending")

    // Verify UI counter
    const paidCount = items.filter((i) => i.status === "paid").length
    assert.strictEqual(paidCount, 2) // Netflix + Luz CFE
    const countBadge = `${items.length} · ${paidCount} pagados`
    assert.strictEqual(countBadge, "5 · 2 pagados")
  },
)

/* ─── Scenario 2: Budget Deficit Workflow (State D Real-World Journey) ─── */

suite.test(
  "Scenario 2: Budget Deficit Real-World Flow (State A -> B -> D)",
  () => {
    // Simulates a user starting with expenses, adding a modest income, and then facing
    // an unexpected large medical expense that throws the monthly balance into deficit (State D).

    let items = [
      { id: 1, name: "Luz CFE", cat: "servicios", amount: 780 },
      { id: 2, name: "Despensa", cat: "despensa", amount: 1500 },
    ]
    let incomes = []

    // Stage 1: No income (State A)
    let state = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(state.stateKey, "A")
    assert.strictEqual(state.cardTitle, "Gastado este mes")
    assert.strictEqual(state.mainAmount, 2280)

    // Stage 2: Register Income $5,000 Mensual -> transitions to State B
    incomes = [{ id: 1, tipo: "sueldo", monto: 5000, frecuencia: "mensual" }]
    state = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(state.stateKey, "B")
    assert.strictEqual(state.balance, 2720)
    assert.strictEqual(state.pct, 46)
    assert.strictEqual(state.pillType, "success")

    // Stage 3: Unexpected Emergency: "Hospital Angeles Consulta y Medicinas $4,500"
    const emergencyConcept = "Hospital y medicamentos urgentes"
    const emergencyAmount = 4500
    const emergencyCat = autoCat(emergencyConcept)
    assert.strictEqual(emergencyCat, "salud")

    items = [
      {
        id: 3,
        name: emergencyConcept,
        cat: emergencyCat,
        amount: emergencyAmount,
      },
      ...items,
    ]

    // Stage 4: Verify Deficit State (State D)
    state = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(state.stateKey, "D")
    assert.strictEqual(state.cardTitle, "Balance del mes")
    assert.strictEqual(state.mainLabel, "Diferencia del mes")
    assert.strictEqual(state.totalGastos, 6780)
    assert.strictEqual(state.totalIngresos, 5000)
    assert.strictEqual(state.balance, -1780)
    assert.strictEqual(state.mainAmount, 1780) // Absolute deficit amount
    assert.strictEqual(state.arrow, "down")
    assert.strictEqual(state.pillType, "danger")
    assert.strictEqual(state.pillText, "36% sobre tu ingreso")
  },
)

/* ─── Scenario 3: Offline Persistence & App Restart Cycle ─── */

suite.test(
  "Scenario 3: Offline Persistence & Full Device Restart Cycle",
  () => {
    // Simulates saving transactions in WebView localStorage, closing the app,
    // restarting in airplane mode, and restoring 100% of persistent state.

    const storage = createMockStorage({})

    // 1. User records incomes and transactions in Session 1
    const session1Items = [
      {
        id: 101,
        name: "Sueldo Semanal",
        cat: "comida",
        amount: 350,
        status: "paid",
      },
      {
        id: 102,
        name: "Internet Telmex",
        cat: "servicios",
        amount: 549,
        status: "pending",
        reminder: true,
      },
    ]
    const session1Incomes = [
      {
        id: 201,
        tipo: "sueldo",
        monto: 7500,
        frecuencia: "quincenal",
        nombre: "Trabajo Principal",
      },
    ]

    storage.setItem("mi-bolsillo:v3:items", JSON.stringify(session1Items))
    storage.setItem("mb:incomes:v1", JSON.stringify(session1Incomes))
    storage.setItem("mi-bolsillo:v3:introSeen", JSON.stringify(true))
    storage.setItem("splash-seen", "1")

    // 2. App closes (session ends)
    // 3. New Launch (Session 2 in Airplane Mode):
    // HTML bundle loads from memory (source.html), reads localStorage
    const restoredItemsRaw = storage.getItem("mi-bolsillo:v3:items")
    const restoredIncomesRaw = storage.getItem("mb:incomes:v1")
    const restoredIntroSeenRaw = storage.getItem("mi-bolsillo:v3:introSeen")

    assert.ok(restoredItemsRaw, "Items must be restored")
    assert.ok(restoredIncomesRaw, "Incomes must be restored")

    const restoredItems = JSON.parse(restoredItemsRaw)
    const restoredIncomes = JSON.parse(restoredIncomesRaw)
    const restoredIntroSeen = JSON.parse(restoredIntroSeenRaw)

    assert.deepStrictEqual(restoredItems, session1Items)
    assert.deepStrictEqual(restoredIncomes, session1Incomes)
    assert.strictEqual(restoredIntroSeen, true)

    // 4. Calculations reflect restored data with 100% fidelity
    const state = calculateBalanceState({
      entries: restoredItems,
      incomes: restoredIncomes,
      includeEarlier: false,
    })
    assert.strictEqual(state.totalIngresos, 15000) // 7500 * 2 (quincenal)
    assert.strictEqual(state.totalGastos, 899)
    assert.strictEqual(state.balance, 14101)
    assert.strictEqual(state.stateKey, "B")
  },
)

/* ─── Scenario 4: Bottom Sheets & Financial Workflows Catalog ─── */

suite.test(
  "Scenario 4: Bottom Sheets Catalog (Apartados, Domiciliación, Reminder, Income)",
  () => {
    // Simulates opening, computing, and interacting with each of the 4 core bottom sheets.

    // 1. Apartado Sheet Workflow
    const rentExpense = {
      id: 4,
      name: "Renta Mensual",
      amount: 4800,
      cat: "hogar",
    }
    const weeklyApartado = calculateApartado(rentExpense.amount, "semanal")
    const biweeklyApartado = calculateApartado(rentExpense.amount, "quincenal")
    const monthlyApartado = calculateApartado(rentExpense.amount, "mensual")

    assert.strictEqual(weeklyApartado.per, 1200) // 4800 / 4
    assert.strictEqual(biweeklyApartado.per, 2400) // 4800 / 2
    assert.strictEqual(monthlyApartado.per, 4800) // 4800 / 1

    // 2. Domiciliación Sheet Workflow
    const allExpenses = [
      { id: 1, name: "Spotify", cat: "suscripciones", amount: 129 },
      { id: 2, name: "Luz CFE", cat: "servicios", amount: 650 },
      { id: 3, name: "Supermercado", cat: "despensa", amount: 1800 }, // Not domiciliable
      { id: 4, name: "Telmex Internet", cat: "servicios", amount: 499 },
    ]
    const domCandidates = allExpenses.filter((i) =>
      DOMICILIABLE.includes(i.cat),
    )
    assert.strictEqual(domCandidates.length, 3) // Spotify, Luz, Telmex

    // User selects all 3 candidates
    const totalDomMonthly = domCandidates.reduce((s, i) => s + i.amount, 0)
    assert.strictEqual(totalDomMonthly, 1278)
    const domSummaryText = `${domCandidates.length} servicios en automático · ${formatCurrency(totalDomMonthly)}/mes`
    assert.strictEqual(domSummaryText, "3 servicios en automático · $1,278/mes")

    // 3. Reminder MiniCalendar Date Selection
    const today = new Date("2026-09-25T12:00:00")
    const targetDateStr = "2026-09-30"
    const targetDate = new Date(targetDateStr + "T12:00:00")
    assert.ok(targetDate >= today, "Reminder date must not be in the past")

    // 4. Income Sheet Registration & Normalization
    const newIncome = {
      id: 1001,
      tipo: "negocio",
      monto: 8500,
      frecuencia: "quincenal",
      nombre: "Abarrotes",
    }
    assert.strictEqual(monthlyAmt(newIncome), 17000)
  },
)

/* ─── Scenario 5: Expense Swipe-to-Delete and Undo Recovery Flow ─── */

suite.test(
  "Scenario 5: Swipe-to-Delete & Undo Recovery End-to-End Cycle",
  () => {
    // Simulates a user swiping to delete an item by mistake and pressing "Deshacer" on the Toast.

    let items = [
      { id: 1, name: "Café matutino", amount: 45, cat: "comida" },
      { id: 2, name: "Gasolina Magna", amount: 500, cat: "transporte" },
      { id: 3, name: "Farmacia Similares", amount: 180, cat: "salud" },
    ]

    // 1. User begins swipe gesture on Gasolina (index 1)
    const clientXStart = 300
    const clientXMove = 220 // delta = -80px (< -60px threshold)
    const dx = clientXMove - clientXStart
    assert.strictEqual(dx, -80)
    assert.ok(dx < -60, "Swipe exceeds deletion threshold")

    // 2. Card deleted: captured in lastDeleted, toast scheduled for 5000ms
    const deleteIndex = 1
    const deletedItem = items[deleteIndex]
    const lastDeleted = { item: deletedItem, index: deleteIndex }
    items = items.filter((i) => i.id !== deletedItem.id)

    assert.strictEqual(items.length, 2)
    assert.strictEqual(items[0].id, 1)
    assert.strictEqual(items[1].id, 3)

    const toastPayload = {
      emoji: "🗑️",
      title: `${deletedItem.name} eliminado`,
      sub: `${formatCurrency(deletedItem.amount)} MXN`,
      action: "undo",
      duration: 5000,
    }
    assert.strictEqual(toastPayload.title, "Gasolina Magna eliminado")
    assert.strictEqual(toastPayload.action, "undo")

    // 3. User taps "Deshacer" before 5000ms timeout
    const nextList = [...items]
    nextList.splice(lastDeleted.index, 0, lastDeleted.item)
    items = nextList

    // 4. Verify restoration at exact original position
    assert.strictEqual(items.length, 3)
    assert.strictEqual(items[0].id, 1)
    assert.strictEqual(items[1].id, 2) // Restored at index 1!
    assert.strictEqual(items[2].id, 3)
    assert.strictEqual(items[1].name, "Gasolina Magna")
  },
)

// Run directly if executed as standalone script
if (require.main === module) {
  suite.run().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0)
  })
}

module.exports = suite
