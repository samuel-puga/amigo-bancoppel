import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  CATS,
  RECURRING,
  DOMICILIABLE,
  INITIAL_ITEMS,
  EARLIER,
  COLORS as C,
  EASE,
  fmt,
} from "./data"
import {
  StatusBar,
  BrandHeader,
  LoginForm,
  QuickAddBar,
  ExpenseCard,
  ExpenseListCard,
  Toast,
  IntroSheet,
  ApartadoSheet,
  DomiciliacionSheet,
  TutorialSpotlight,
} from "./components"
import BalanceCard from "./BalanceCard"
import "./mi-bolsillo.css"

function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw != null ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full */
    }
  }, [key, value])
  return [value, setValue]
}

export default function MiBolsillo({
  onLogin,
  onForgotPassword,
  onCreateAccount,
  onProducts,
  onOpenAccount,
  onApplyCard,
  trashMode = "hover",
  showStatusBar = true,
  storageKey = "mi-bolsillo:v3",
}) {
  const [tab, setTab] = useState("login")
  const [collapsed, setCollapsed] = useState(false)

  const [items, setItems] = usePersistentState(
    `${storageKey}:items`,
    INITIAL_ITEMS,
  )
  const [introSeen, setIntroSeen] = usePersistentState(
    `${storageKey}:introSeen`,
    true,
  )
  const [tutorialSeen, setTutorialSeen] = usePersistentState(
    `${storageKey}:tutorialSeen`,
    false,
  )
  const [tutorialStep, setTutorialStep] = useState(null)
  const [spotRect, setSpotRect] = useState(null)
  const quickAddRef = useRef(null)
  const balanceRef = useRef(null)
  const expenseRef = useRef(null)
  const [optOut, setOptOut] = usePersistentState(`${storageKey}:optOut`, false)
  const [dismissedTDC, setDismissedTDC] = usePersistentState(
    `${storageKey}:dismissedTDC`,
    [],
  )

  const [sheet, setSheet] = useState(null)
  const [apartadoFor, setApartadoFor] = useState(null)
  const [domSelected, setDomSelected] = useState({})

  const [suggestion, setSuggestion] = useState(null)
  const shown = useRef({ apartado: false, domiciliar: false })

  const [toast, setToast] = useState(null)
  const [toastOn, setToastOn] = useState(false)
  const lastDeleted = useRef(null)
  const timers = useRef({})
  const toastId = useRef(0)

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])
  const later = (name, fn, ms) => {
    clearTimeout(timers.current[name])
    timers.current[name] = setTimeout(fn, ms)
  }

  const showToast = useCallback((t, duration = 4000) => {
    toastId.current += 1
    setToast({ ...t, id: toastId.current, duration })
    setToastOn(true)
  }, [])
  const dismissToast = useCallback(() => {
    setToastOn(false)
    setItems((list) => list.map((i) => (i.isNew ? { ...i, isNew: false } : i)))
  }, [setItems])

  const updateItem = (id, fn) =>
    setItems((list) => list.map((i) => (i.id === id ? fn(i) : i)))

  const goTab = (next) => {
    if (next === tab) return
    setTab(next)
    if (next === "login") {
      setSheet(null)
      return
    }
    if (!tutorialSeen && next === "bolsillo") {
      later(
        "tutorial",
        () => {
          setTutorialStep(0)
          setTutorialSeen(true)
        },
        600,
      )
    }
  }
  const onPanelScroll = (e) => {
    const c = e.currentTarget.scrollTop > 24
    if (c !== collapsed) setCollapsed(c)
  }

  const addExpense = ({ name, amount, cat }) => {
    const e = {
      id: Date.now(),
      name,
      cat,
      amount,
      date: "Hoy",
      status: "pending",
      reminder: false,
      isNew: true,
    }
    setItems((list) => [e, ...list.map((i) => ({ ...i, isNew: false }))])
    showToast({
      emoji: CATS[cat].emoji,
      title: name,
      sub: `${fmt(amount)} MXN`,
      action: "saved",
    })
  }

  const togglePaid = (item) => {
    if (item.status === "paid") {
      updateItem(item.id, (i) => ({ ...i, status: i.orig || "pending" }))
      if (suggestion?.id === item.id) setSuggestion(null)
      return
    }
    updateItem(item.id, (i) => ({ ...i, status: "paid", orig: i.status }))
    if (!shown.current.apartado && !optOut && RECURRING.includes(item.cat)) {
      later(
        "suggest",
        () => {
          shown.current.apartado = true
          setSuggestion({ id: item.id, type: "apartado" })
        },
        550,
      )
    }
  }

  const toggleBell = (item) => {
    const on = !item.reminder
    updateItem(item.id, (i) => ({ ...i, reminder: on }))
    if (!on) {
      if (suggestion?.id === item.id && suggestion.type === "domiciliar")
        setSuggestion(null)
      return
    }
    if (
      !shown.current.domiciliar &&
      !optOut &&
      DOMICILIABLE.includes(item.cat) &&
      item.status === "pending"
    ) {
      later(
        "suggest",
        () => {
          shown.current.domiciliar = true
          setSuggestion({ id: item.id, type: "domiciliar" })
        },
        450,
      )
    }
  }

  const deleteItem = (item) => {
    const index = items.findIndex((i) => i.id === item.id)
    lastDeleted.current = { item, index }
    setItems((list) => list.filter((i) => i.id !== item.id))
    if (suggestion?.id === item.id) setSuggestion(null)
    showToast(
      {
        emoji: "🗑️",
        title: `${item.name} eliminado`,
        sub: `${
          item.status === "paid" ? "Pagado · " : ""
        }${fmt(item.amount)} MXN`,
        action: "undo",
      },
      5000,
    )
  }

  const undoDelete = () => {
    const ld = lastDeleted.current
    if (!ld) return
    setItems((list) => {
      const next = [...list]
      next.splice(Math.min(ld.index, next.length), 0, ld.item)
      return next
    })
    lastDeleted.current = null
    setToastOn(false)
  }

  const declineSuggestions = () => {
    setOptOut(true)
    setSuggestion(null)
    showToast({
      emoji: "👍",
      title: "Entendido",
      sub: "No te mostraremos más sugerencias",
      action: null,
    })
  }

  const domServices = items.filter((i) => DOMICILIABLE.includes(i.cat))
  const openDomiciliacion = () => {
    setDomSelected(Object.fromEntries(domServices.map((s) => [s.id, true])))
    setSheet("domiciliar")
  }
  const closeSheet = useCallback(() => setSheet(null), [])
  const toLoginAfterSheet = () => {
    setSheet(null)
    later("toLogin", () => goTab("login"), 280)
  }

  const suggestionFor = (item) => {
    // Sugerencia TDC para suscripciones no pagadas
    if (
      item.cat === "suscripciones" &&
      item.status !== "paid" &&
      !optOut &&
      !dismissedTDC.includes(item.id)
    ) {
      return {
        text: `Domicilia ${item.name} a una Tarjeta de Crédito BanCoppel y se cobra sola cada mes. Sin recordatorios, sin cargos por olvido — tú solo disfruta.`,
        ctaLabel: "Solicitar mi TDC BanCoppel ›",
        onCta: () =>
          onApplyCard ? onApplyCard({ item }) : toLoginAfterSheet(),
        onClose: () => setDismissedTDC((d) => [...d, item.id]),
        onOptOut: declineSuggestions,
      }
    }
    if (suggestion?.id !== item.id) return null
    const isDom = suggestion.type === "domiciliar"
    return {
      text: isDom
        ? `¿Prefieres no depender del recordatorio? Domicilia ${item.name} a una Tarjeta de Crédito BanCoppel y se paga sola cada mes.`
        : `¿Y si el próximo pago de ${item.name} ya estuviera apartado? Separa ${fmt(item.amount)} poco a poco con tu Cuenta Digital BanCoppel.`,
      ctaLabel: isDom ? "Domiciliar mis servicios ›" : "Crear un apartado ›",
      onCta: () =>
        isDom
          ? openDomiciliacion()
          : (setApartadoFor(item), setSheet("apartado")),
      onClose: () => setSuggestion(null),
      onOptOut: declineSuggestions,
    }
  }

  const closeTutorial = useCallback(() => {
    setTutorialStep(null)
    setSpotRect(null)
  }, [])
  const nextTutorialStep = useCallback(() => {
    setTutorialStep((s) => (s >= 3 ? null : s + 1))
  }, [])

  useEffect(() => {
    if (tutorialStep === null) {
      setSpotRect(null)
      return
    }
    const ref =
      tutorialStep <= 1
        ? quickAddRef
        : tutorialStep === 2
          ? balanceRef
          : expenseRef
    // Scroll to section first, then measure after animation settles
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    const t = setTimeout(
      () => {
        const r = ref.current?.getBoundingClientRect()
        if (r)
          setSpotRect({
            left: r.left,
            top: r.top,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          })
      },
      tutorialStep === 0 ? 520 : 400,
    )
    return () => clearTimeout(t)
  }, [tutorialStep])

  const onB = tab === "bolsillo"

  return (
    <div
      className="mb-root"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 430,
        height: "100%",
        minHeight: 640,
        overflow: "hidden",
        background: C.navy,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: C.text,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {showStatusBar && <StatusBar />}
      <BrandHeader
        tab={tab}
        collapsed={collapsed}
        showNewDot={!introSeen}
        onTabChange={goTab}
      />

      <main
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          marginTop: -16,
          borderRadius: "24px 24px 0 0",
          overflow: "hidden",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "200%",
            height: "100%",
            transform: onB ? "translateX(-50%)" : "translateX(0)",
            transition: `transform .38s ${EASE}`,
          }}
        >
          <LoginForm
            onSubmit={onLogin}
            onForgot={onForgotPassword}
            onCreateAccount={onCreateAccount}
            onProducts={onProducts}
          />

          <div
            className="mb-scroll"
            onScroll={onPanelScroll}
            aria-hidden={!onB}
            style={{
              width: "50%",
              height: "100%",
              overflowY: "auto",
              background: C.bg,
              padding: "16px 14px 110px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 11,
                color: C.text2,
                flex: "none",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke={C.text2}
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span>
                Sin iniciar sesión · tus datos se guardan en este teléfono
              </span>
            </div>

            <div ref={quickAddRef}>
              <QuickAddBar
                onAdd={addExpense}
                forceExpanded={tutorialStep === 0 || tutorialStep === 1}
                hlDoc={tutorialStep === 0}
                hlCam={tutorialStep === 1}
                highlight={tutorialStep === 0 || tutorialStep === 1}
              />
            </div>

            {onB && (
              <div ref={balanceRef}>
                <BalanceCard
                  entries={[...items, ...EARLIER]}
                  onToast={showToast}
                  highlight={tutorialStep === 2}
                />
              </div>
            )}

            <div ref={expenseRef}>
              <ExpenseListCard
                items={items}
                trashMode={trashMode}
                suggestionFor={suggestionFor}
                onToggle={togglePaid}
                onBell={toggleBell}
                onDelete={deleteItem}
                highlight={tutorialStep === 3}
              />
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: C.text2,
                lineHeight: 1.5,
                padding: "4px 20px 0",
              }}
            >
              <button
                onClick={() => goTab("login")}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  color: C.primary,
                  textDecoration: "underline",
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Inicia sesión
              </button>{" "}
              para sincronizar con tu cuenta BanCoppel
            </div>
          </div>
        </div>
      </main>

      <Toast
        toast={toast}
        visible={toastOn}
        onAction={undoDelete}
        onDismiss={dismissToast}
      />

      <TutorialSpotlight
        rect={spotRect}
        step={tutorialStep}
        visible={tutorialStep !== null && spotRect !== null}
        onNext={nextTutorialStep}
        onSkip={closeTutorial}
      />
      <IntroSheet open={sheet === "intro"} onClose={closeSheet} />
      <ApartadoSheet
        open={sheet === "apartado"}
        item={apartadoFor}
        onClose={closeSheet}
        onOpenAccount={(payload) =>
          onOpenAccount
            ? (setSheet(null), onOpenAccount(payload))
            : toLoginAfterSheet()
        }
      />
      <DomiciliacionSheet
        open={sheet === "domiciliar"}
        services={domServices}
        selected={domSelected}
        onToggle={(id) => setDomSelected((s) => ({ ...s, [id]: !s[id] }))}
        onClose={closeSheet}
        onApply={(picked) =>
          onApplyCard
            ? (setSheet(null), onApplyCard(picked))
            : toLoginAfterSheet()
        }
      />
    </div>
  )
}
