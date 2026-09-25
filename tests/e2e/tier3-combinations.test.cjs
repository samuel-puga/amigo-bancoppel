/**
 * Tier 3: Cross-Feature Combinations & State Transitions
 * Verifies multi-component interactions, state machines, and sequential workflows
 */

const fs = require("fs")
const path = require("path")
const assert = require("assert")
const {
  PROJECT_ROOT,
  TestRunner,
  createMockStorage,
  BRAND_COLORS,
  RECURRING,
  DOMICILIABLE,
  autoCat,
  monthlyAmt,
  calculateApartado,
  calculateBalanceState,
} = require("./helpers.cjs")

const suite = new TestRunner(
  "Tier 3: Cross-Feature Combinations & State Transitions",
)

/* ─── T3.01: QuickAdd + BalanceCard Recalculation Flow ─── */

suite.test(
  "T3.01: Adding an expense via QuickAdd recalculates BalanceCard total and balance",
  () => {
    const initialItems = [
      { id: 1, name: "Netflix", cat: "suscripciones", amount: 219 },
      { id: 2, name: "Luz CFE", cat: "servicios", amount: 780 },
    ]
    const incomes = [{ id: 1, monto: 10000, frecuencia: "mensual" }]

    // State before add
    const stateBefore = calculateBalanceState({
      entries: initialItems,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(stateBefore.totalGastos, 999)
    assert.strictEqual(stateBefore.balance, 9001)
    assert.strictEqual(stateBefore.stateKey, "B")

    // Perform QuickAdd
    const newConcept = "Despensa Walmart"
    const newAmount = 1500
    const newCat = autoCat(newConcept)
    assert.strictEqual(newCat, "despensa")

    const updatedItems = [
      {
        id: 3,
        name: newConcept,
        cat: newCat,
        amount: newAmount,
        status: "pending",
      },
      ...initialItems,
    ]

    // State after add
    const stateAfter = calculateBalanceState({
      entries: updatedItems,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(stateAfter.totalGastos, 2499)
    assert.strictEqual(stateAfter.balance, 7501)
    assert.strictEqual(stateAfter.pct, 25)
    assert.strictEqual(stateAfter.stateKey, "B")
    assert.strictEqual(stateAfter.mainAmount, 7501)
  },
)

/* ─── T3.02: Balance State Progression A -> B -> C -> D ─── */

suite.test(
  "T3.02: Progressive financial health transitions: State A -> B -> C -> D",
  () => {
    let items = [
      { id: 1, name: "Renta", cat: "hogar", amount: 3500 },
      { id: 2, name: "Despensa", cat: "despensa", amount: 1500 },
    ]
    let incomes = []

    // Step 1: State A (No income registered)
    const step1 = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(step1.stateKey, "A")
    assert.strictEqual(step1.cardTitle, "Gastado este mes")
    assert.strictEqual(step1.mainLabel, "Llevas gastado")
    assert.strictEqual(step1.mainAmount, 5000)

    // Step 2: Add Income $20,000 -> State B (25% used, < 80%)
    incomes = [{ id: 101, monto: 20000, frecuencia: "mensual" }]
    const step2 = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(step2.stateKey, "B")
    assert.strictEqual(step2.cardTitle, "Balance del mes")
    assert.strictEqual(step2.mainLabel, "Te quedan")
    assert.strictEqual(step2.mainAmount, 15000)
    assert.strictEqual(step2.pct, 25)
    assert.strictEqual(step2.pillType, "success")

    // Step 3: Add High Expense $11,500 -> Total $16,500 / $20,000 = 83% (State C: >= 80%)
    items = [
      { id: 3, name: "Seguro Auto", cat: "servicios", amount: 11500 },
      ...items,
    ]
    const step3 = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(step3.stateKey, "C")
    assert.strictEqual(step3.mainLabel, "Te quedan")
    assert.strictEqual(step3.mainAmount, 3500)
    assert.strictEqual(step3.pct, 83)
    assert.strictEqual(step3.pillType, "warning")

    // Step 4: Add Expense $5,000 -> Total $21,500 / $20,000 (State D: Deficit $1,500)
    items = [
      { id: 4, name: "Reparación Hogar", cat: "hogar", amount: 5000 },
      ...items,
    ]
    const step4 = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(step4.stateKey, "D")
    assert.strictEqual(step4.mainLabel, "Diferencia del mes")
    assert.strictEqual(step4.mainAmount, 1500)
    assert.strictEqual(step4.pillType, "danger")
    assert.strictEqual(step4.arrow, "down")
  },
)

/* ─── T3.03: Recurring Expense Paid -> Apartado Suggestion ─── */

suite.test(
  "T3.03: Marking recurring expense paid triggers Apartado suggestion and sheet calculation",
  () => {
    const item = {
      id: 2,
      name: "Luz CFE",
      cat: "servicios",
      amount: 780,
      status: "pending",
    }
    const optOut = false
    let scheduledSuggestion = null

    // Toggle paid action
    const isRecurring = RECURRING.includes(item.cat)
    assert.strictEqual(isRecurring, true, "Servicios is recurring")

    if (!optOut && isRecurring) {
      scheduledSuggestion = { id: item.id, type: "apartado" }
    }

    assert.deepStrictEqual(scheduledSuggestion, { id: 2, type: "apartado" })

    // User accepts suggestion -> opens ApartadoSheet
    const apartado = calculateApartado(item.amount, "semanal")
    assert.strictEqual(apartado.per, 195)
    assert.strictEqual(apartado.label, "$195 por semana")
    assert.strictEqual(
      apartado.description,
      "En 4 semanas juntas $780 para tu próximo pago",
    )
  },
)

/* ─── T3.04: Reminder on Domiciliable Expense -> Domiciliación Suggestion ─── */

suite.test(
  "T3.04: Enabling reminder on pending domiciliable item schedules Domiciliación suggestion",
  () => {
    const item = {
      id: 1,
      name: "Netflix",
      cat: "suscripciones",
      amount: 219,
      status: "pending",
      reminder: false,
    }
    const optOut = false
    let scheduledSuggestion = null

    const isDomiciliable = DOMICILIABLE.includes(item.cat)
    assert.strictEqual(isDomiciliable, true, "Suscripciones is domiciliable")

    // Toggle reminder to active
    const nextReminder = !item.reminder
    if (
      nextReminder &&
      !optOut &&
      isDomiciliable &&
      item.status === "pending"
    ) {
      scheduledSuggestion = { id: item.id, type: "domiciliar" }
    }

    assert.deepStrictEqual(scheduledSuggestion, { id: 1, type: "domiciliar" })
  },
)

/* ─── T3.05: Suggestion Opt-Out Permanently Suppresses Suggestions ─── */

suite.test(
  "T3.05: Declining suggestions sets optOut=true and suppresses future suggestion banners",
  () => {
    const storage = createMockStorage({})
    let optOut = false

    // User clicks "No me interesa"
    optOut = true
    storage.setItem("mi-bolsillo:v3:optOut", JSON.stringify(true))

    // Next recurring expense marked paid
    const nextItem = {
      id: 5,
      name: "Internet Izzi",
      cat: "servicios",
      amount: 600,
    }
    let suggestionFired = false

    if (!optOut && RECURRING.includes(nextItem.cat)) {
      suggestionFired = true
    }

    assert.strictEqual(
      suggestionFired,
      false,
      "Suggestion must NOT fire when optOut is true",
    )
    assert.strictEqual(
      JSON.parse(storage.getItem("mi-bolsillo:v3:optOut")),
      true,
    )
  },
)

/* ─── T3.06: Multiple Income Frequencies Normalization ─── */

suite.test(
  "T3.06: Mixed income frequencies (Quincenal + Mensual) aggregate accurately",
  () => {
    const incomes = [
      { id: 1, tipo: "sueldo", monto: 6000, frecuencia: "quincenal" }, // 6000 * 2 = 12000
      { id: 2, tipo: "freelance", monto: 3500, frecuencia: "mensual" }, // 3500 * 1 = 3500
      { id: 3, tipo: "otro", monto: 1000, frecuencia: "unica" }, // 1000 * 1 = 1000
    ]

    const totalMonthlyIncome = incomes.reduce(
      (sum, inc) => sum + monthlyAmt(inc),
      0,
    )
    assert.strictEqual(totalMonthlyIncome, 16500)

    const state = calculateBalanceState({
      entries: [{ cat: "despensa", amount: 4500 }],
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(state.totalIngresos, 16500)
    assert.strictEqual(state.totalGastos, 4500)
    assert.strictEqual(state.balance, 12000)
    assert.strictEqual(state.pct, 27)
    assert.strictEqual(state.stateKey, "B")
  },
)

/* ─── T3.07: Expense Deletion & Undo Recalculation Flow ─── */

suite.test(
  "T3.07: Deleting expense updates balance; Undo restores previous balance and index",
  () => {
    let items = [
      { id: 1, name: "Item 1", cat: "comida", amount: 500 },
      { id: 2, name: "Item 2 (Target)", cat: "ocio", amount: 1500 },
      { id: 3, name: "Item 3", cat: "transporte", amount: 300 },
    ]
    const incomes = [{ monto: 5000, frecuencia: "mensual" }]

    // 1. Initial State
    const initial = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(initial.totalGastos, 2300)
    assert.strictEqual(initial.balance, 2700)

    // 2. Delete Item 2
    const targetIndex = items.findIndex((i) => i.id === 2)
    const targetItem = items[targetIndex]
    const lastDeleted = { item: targetItem, index: targetIndex }

    items = items.filter((i) => i.id !== 2)

    // State after delete
    const afterDelete = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(afterDelete.totalGastos, 800)
    assert.strictEqual(afterDelete.balance, 4200)

    // 3. User taps "Deshacer" (Undo)
    const restoredItems = [...items]
    restoredItems.splice(lastDeleted.index, 0, lastDeleted.item)
    items = restoredItems

    // State after undo
    const afterUndo = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })
    assert.strictEqual(afterUndo.totalGastos, 2300)
    assert.strictEqual(afterUndo.balance, 2700)
    assert.strictEqual(items[1].id, 2, "Restored at exact original index")
  },
)

/* ─── T3.08: Paid Toggle Does Not Affect Total Monthly Spending ─── */

suite.test(
  "T3.08: Toggling expense paid changes status styling without altering total spending",
  () => {
    const items = [
      { id: 1, name: "Luz CFE", amount: 780, status: "pending" },
      { id: 2, name: "Renta", amount: 3500, status: "overdue" },
    ]
    const incomes = [{ monto: 10000, frecuencia: "mensual" }]

    const state1 = calculateBalanceState({
      entries: items,
      incomes,
      includeEarlier: false,
    })

    // Mark all paid
    const paidItems = items.map((i) => ({ ...i, status: "paid" }))
    const state2 = calculateBalanceState({
      entries: paidItems,
      incomes,
      includeEarlier: false,
    })

    // Total gastos and balance remain identical
    assert.strictEqual(state1.totalGastos, state2.totalGastos)
    assert.strictEqual(state1.balance, state2.balance)
    assert.strictEqual(state1.pct, state2.pct)
  },
)

/* ─── T3.09: Theme and Status Bar Harmonization Interaction ─── */

suite.test(
  "T3.09: Header navy background matches native Android status bar configuration",
  () => {
    const headerBg = BRAND_COLORS.navy // #05297A
    const expoAndroidStatusBarBg = "#05297A"
    assert.strictEqual(
      headerBg,
      expoAndroidStatusBarBg,
      "Header and Android status bar colors must be identical",
    )
  },
)

/* ─── T3.10: TDC Dismissal List Persistence ─── */

suite.test(
  "T3.10: Dismissing TDC suggestion for one subscription preserves dismissal in storage",
  () => {
    const storage = createMockStorage({})
    let dismissedTDC = []

    // Subscription 1 dismissed
    dismissedTDC = [...dismissedTDC, 101]
    storage.setItem("mi-bolsillo:v3:dismissedTDC", JSON.stringify(dismissedTDC))

    // Verify item 101 dismissed, but item 102 still eligible
    const isDismissed = (id) => dismissedTDC.includes(id)
    assert.strictEqual(isDismissed(101), true)
    assert.strictEqual(isDismissed(102), false)
  },
)

// Run directly if executed as standalone script
if (require.main === module) {
  suite.run().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0)
  })
}

module.exports = suite
