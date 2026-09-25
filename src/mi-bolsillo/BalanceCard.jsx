import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CATS, COLORS as C, EASE, fmt } from "./data"

const POPPINS = "'Poppins', sans-serif"
const FIGTREE = "'Figtree', 'Inter', system-ui, sans-serif"

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

const INCOME_TYPES = [
  { id: "sueldo", label: "Sueldo", emoji: "💼" },
  { id: "freelance", label: "Freelance", emoji: "💻" },
  { id: "negocio", label: "Negocio", emoji: "🏪" },
  { id: "otro", label: "Otro", emoji: "💵" },
]

const FREQS_LIST = [
  { id: "unica", label: "Una vez" },
  { id: "quincenal", label: "Quincenal" },
  { id: "mensual", label: "Mensual" },
]

function monthlyAmt(income) {
  return income.frecuencia === "quincenal" ? income.monto * 2 : income.monto
}

function usePersist(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const r = localStorage.getItem(key)
      return r != null ? JSON.parse(r) : init
    } catch {
      return init
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val))
    } catch {}
  }, [key, val])
  return [val, setVal]
}

/* ── Income Sheet ─────────────────────────────────────────────── */

function IncomeSheet({ open, income, onClose, onSave, onDelete }) {
  const [tipo, setTipo] = useState("sueldo")
  const [monto, setMonto] = useState("")
  const [frecuencia, setFrecuencia] = useState("mensual")
  const [nombre, setNombre] = useState("")
  const [nombreFocus, setNombreFocus] = useState(false)
  const [mounted, setMounted] = useState(false)
  const nombreRef = useRef(null)
  const isEdit = !!income

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    if (income) {
      setTipo(income.tipo)
      setMonto(String(income.monto))
      setFrecuencia(income.frecuencia)
      setNombre(income.nombre || "")
    } else {
      setTipo("sueldo")
      setMonto("")
      setFrecuencia("mensual")
      setNombre("")
    }
    setNombreFocus(false)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const amt = parseFloat(monto) || 0
  const canSave = amt > 0
  const monthly = frecuencia === "quincenal" ? amt * 2 : amt

  const pickLabel = (t) => {
    setTipo(t.id)
    setNombre(t.label)
    setNombreFocus(false)
    nombreRef.current?.blur()
  }

  const save = () => {
    if (!canSave) return
    onSave({
      id: income?.id || Date.now(),
      tipo,
      monto: amt,
      frecuencia,
      nombre: nombre.trim(),
    })
  }

  if (!mounted) return null
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: open ? "rgba(2,42,122,0.38)" : "transparent",
        pointerEvents: open ? "auto" : "none",
        transition: "background .28s",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 430,
          margin: "0 auto",
          background: "#fff",
          borderRadius: "26px 26px 0 0",
          padding: "0 20px 40px",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: `transform .35s ${EASE}`,
          maxHeight: "90svh",
          overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 6px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: "#DDE1EA",
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 20,
            paddingTop: 6,
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: C.navyDark,
              fontFamily: FIGTREE,
            }}
          >
            {isEdit ? "Editar ingreso" : "Agregar ingreso"}
          </span>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 6,
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke={C.text2}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 20 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.muted,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontFamily: FIGTREE,
            }}
          >
            Monto
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              border: `1.5px solid ${C.border}`,
              borderRadius: 14,
              padding: "0 16px",
              height: 64,
            }}
          >
            <span
              style={{
                fontFamily: POPPINS,
                fontSize: 30,
                fontWeight: 800,
                color: C.navyDark,
                lineHeight: 1,
              }}
            >
              $
            </span>
            <input
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              placeholder="0"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontFamily: POPPINS,
                fontSize: 30,
                fontWeight: 800,
                color: C.navyDark,
                background: "transparent",
                minWidth: 0,
              }}
            />
            <span
              style={{
                fontSize: 14,
                color: C.text2,
                fontWeight: 500,
                flexShrink: 0,
                fontFamily: FIGTREE,
              }}
            >
              MXN
            </span>
          </div>
        </div>

        {/* Frequency */}
        <div
          style={{
            marginBottom: frecuencia === "quincenal" && amt > 0 ? 10 : 20,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.muted,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontFamily: FIGTREE,
            }}
          >
            Frecuencia
          </span>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {FREQS_LIST.map((f) => (
              <button
                key={f.id}
                onClick={() => setFrecuencia(f.id)}
                style={{
                  flex: 1,
                  height: 42,
                  borderRadius: 10,
                  border: `1.5px solid ${
                    frecuencia === f.id ? C.primary : C.border
                  }`,
                  background: frecuencia === f.id ? C.primarySoft : "#fff",
                  color: frecuencia === f.id ? C.primary : C.text2,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all .15s",
                  fontFamily: FIGTREE,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quincenal helper */}
        {frecuencia === "quincenal" && amt > 0 && (
          <div
            style={{
              marginBottom: 20,
              padding: "10px 14px",
              background: "#E8F7EF",
              borderRadius: 10,
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "#157A45",
                fontWeight: 500,
                fontFamily: FIGTREE,
              }}
            >
              Recibes {fmt(amt)} dos veces al mes: cuenta como{" "}
              <strong style={{ fontWeight: 700 }}>{fmt(monthly)}</strong> en
              septiembre
            </span>
          </div>
        )}

        {/* Nombre + type chips on focus */}
        <div style={{ marginBottom: 24 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.muted,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontFamily: FIGTREE,
            }}
          >
            Nombre (opcional)
          </span>
          <div
            style={{
              marginTop: 8,
              border: `1.5px solid ${nombreFocus ? C.primary : C.border}`,
              borderRadius: 12,
              overflow: "hidden",
              transition: "border-color .18s",
            }}
          >
            <input
              ref={nombreRef}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onFocus={() => setNombreFocus(true)}
              onBlur={() => setTimeout(() => setNombreFocus(false), 120)}
              placeholder="Ej. Nómina Coppel"
              style={{
                width: "100%",
                boxSizing: "border-box",
                height: 46,
                border: "none",
                outline: "none",
                padding: "0 14px",
                fontSize: 14,
                color: C.text,
                fontFamily: FIGTREE,
                background: "#fff",
              }}
            />
            {/* Label chips — appear on focus */}
            <div
              style={{
                maxHeight: nombreFocus ? 60 : 0,
                opacity: nombreFocus ? 1 : 0,
                overflow: "hidden",
                transition: "max-height .28s, opacity .2s",
                borderTop: nombreFocus ? `1px solid ${C.border}` : "none",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {INCOME_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickLabel(t)}
                    style={{
                      height: 32,
                      padding: "0 12px",
                      borderRadius: 999,
                      border: `1.5px solid ${
                        tipo === t.id ? C.primary : C.border
                      }`,
                      background: tipo === t.id ? C.primarySoft : "#fff",
                      color: tipo === t.id ? C.primary : C.text2,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      transition: "all .15s",
                      fontFamily: FIGTREE,
                    }}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Show selected type when chips are hidden */}
          {!nombreFocus && tipo && (
            <div
              style={{
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span
                style={{ fontSize: 11, color: C.text2, fontFamily: FIGTREE }}
              >
                Tipo:
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.primary,
                  fontFamily: FIGTREE,
                }}
              >
                {INCOME_TYPES.find((t) => t.id === tipo)?.emoji}{" "}
                {INCOME_TYPES.find((t) => t.id === tipo)?.label}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={save}
          style={{
            width: "100%",
            height: 52,
            border: "none",
            borderRadius: 14,
            background: canSave ? C.primary : "#DDE2FB",
            color: canSave ? "#fff" : C.primary,
            fontSize: 15,
            fontWeight: 700,
            cursor: canSave ? "pointer" : "default",
            transition: "background .2s, color .2s",
            fontFamily: FIGTREE,
          }}
        >
          {canSave
            ? isEdit
              ? "Guardar cambios"
              : "Guardar ingreso"
            : "Escribe un monto mayor a $0 para guardar el ingreso."}
        </button>

        {isEdit && (
          <button
            onClick={() => {
              onDelete(income.id)
              onClose()
            }}
            style={{
              width: "100%",
              marginTop: 12,
              border: "none",
              background: "transparent",
              color: C.danger,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              padding: "10px 0",
              fontFamily: FIGTREE,
            }}
          >
            Eliminar ingreso
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ── Main component ───────────────────────────────────────────── */

export default function BalanceCard({
  entries = [],
  monthLabel = "Sep 2026",
  onToast,
  highlight = false,
}) {
  const [incomes, setIncomes] = usePersist("mb:incomes:v1", [])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState("gastos")
  const [ready, setReady] = useState(false)
  const desgloseRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  /* Computed */
  const catTotals = useMemo(() => {
    const totals = {}
    entries.forEach((i) => {
      totals[i.cat] = (totals[i.cat] || 0) + i.amount
    })
    return Object.keys(totals)
      .map((c) => ({ cat: c, amount: totals[c] }))
      .sort((a, b) => b.amount - a.amount)
  }, [entries])

  const totalGastos = useMemo(
    () => entries.reduce((s, i) => s + i.amount, 0),
    [entries],
  )
  const totalIngresos = useMemo(
    () => incomes.reduce((s, i) => s + monthlyAmt(i), 0),
    [incomes],
  )
  const balance = totalIngresos - totalGastos
  const pct =
    totalIngresos > 0 ? Math.round((totalGastos / totalIngresos) * 100) : 0
  const hasIncome = incomes.length > 0
  const isOver = hasIncome && balance < 0

  const stateKey = !hasIncome
    ? "A"
    : balance > 0 && pct < 80
      ? "B"
      : balance > 0
        ? "C"
        : "D"

  /* Helpers */
  const openSheet = (income = null) => {
    setEditingIncome(income)
    setSheetOpen(true)
  }
  const scrollToDesglose = () =>
    setTimeout(
      () =>
        desgloseRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        }),
      80,
    )

  const saveIncome = (income) => {
    setIncomes((prev) => {
      const idx = prev.findIndex((i) => i.id === income.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = income
        return next
      }
      return [...prev, income]
    })
    setSheetOpen(false)
    setExpanded(true)
    setActiveTab("ingresos")
    scrollToDesglose()
    onToast?.({
      emoji: "💰",
      title: "Ingreso agregado",
      sub: "Balance actualizado",
      action: null,
    })
  }

  const deleteIncome = (id) =>
    setIncomes((prev) => prev.filter((i) => i.id !== id))

  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    if (next) scrollToDesglose()
  }

  /* State-dependent display values */
  const cardTitle = hasIncome ? "Balance del mes" : "Gastado este mes"
  const maxBarVal = hasIncome
    ? Math.max(totalIngresos, totalGastos)
    : totalGastos || 1

  let mainLabel,
    mainAmount,
    pillBg,
    pillColor,
    pillText,
    showArrow,
    arrowUp,
    arrowBg,
    arrowColor

  if (stateKey === "A") {
    mainLabel = "Llevas gastado"
    mainAmount = totalGastos
    const top = catTotals[0]
    pillBg = "#F1F2F7"
    pillColor = "#555"
    pillText =
      top && totalGastos > 0
        ? `${CATS[top.cat].label} es el ${Math.round((top.amount / totalGastos) * 100)}% de tu gasto`
        : "Sin gastos aún"
    showArrow = false
  } else if (stateKey === "B") {
    mainLabel = "Te quedan"
    mainAmount = balance
    pillBg = "#E3F5EA"
    pillColor = "#157A45"
    pillText = `Usaste ${pct}% de tus ingresos`
    showArrow = true
    arrowUp = true
    arrowBg = "#E3F5EA"
    arrowColor = "#1E9E5A"
  } else if (stateKey === "C") {
    mainLabel = "Te quedan"
    mainAmount = balance
    pillBg = "#FDF1E2"
    pillColor = "#A35A0E"
    pillText = `Usaste ${pct}% de tus ingresos`
    showArrow = true
    arrowUp = true
    arrowBg = "#E3F5EA"
    arrowColor = "#1E9E5A"
  } else {
    mainLabel = "Diferencia del mes"
    mainAmount = Math.abs(balance)
    pillBg = "#F1F2F7"
    pillColor = "#555"
    pillText = "Tus gastos superaron tus ingresos"
    showArrow = true
    arrowUp = false
    arrowBg = "#FCE8E8"
    arrowColor = "#D93A3A"
  }

  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: highlight
          ? "0 0 0 3px rgba(28,66,232,0.18), 0 8px 28px rgba(28,66,232,0.16)"
          : "0 1px 6px rgba(0,0,0,0.08)",
        border: highlight ? "1.5px solid #1C42E8" : "1.5px solid transparent",
        transition: "box-shadow .3s, border-color .3s",
      }}
    >
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* 1 · Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: C.navyDark,
              fontFamily: FIGTREE,
            }}
          >
            {cardTitle}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.navyDark,
              background: "#F0F1F6",
              padding: "4px 10px",
              borderRadius: 10,
              fontFamily: FIGTREE,
            }}
          >
            {monthLabel}
          </span>
        </div>

        {/* 2 · Main block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 15, color: C.text2, fontFamily: FIGTREE }}>
            {mainLabel}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {showArrow && (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: arrowBg,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
                aria-label={arrowUp ? "Balance positivo" : "Balance negativo"}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  {arrowUp ? (
                    <path
                      d="M6 10V2M2 6l4-4 4 4"
                      stroke={arrowColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M6 2v8M10 6l-4 4-4-4"
                      stroke={arrowColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontFamily: POPPINS,
                  fontSize: 40,
                  fontWeight: 800,
                  color: "#13287A",
                  letterSpacing: -1.5,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {fmt(mainAmount)}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: C.text2,
                  fontWeight: 500,
                  fontFamily: FIGTREE,
                }}
              >
                MXN
              </span>
            </div>
          </div>

          {/* Status pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              alignSelf: "flex-start",
              padding: "5px 12px",
              borderRadius: 999,
              background: pillBg,
              marginTop: 2,
            }}
          >
            {stateKey === "D" && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M5 1v8M9 5l-4 4-4-4"
                  stroke="#D93A3A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: pillColor,
                fontFamily: FIGTREE,
              }}
            >
              {pillText}
            </span>
          </div>
        </div>

        {/* 3 · Bar */}
        <div
          style={{
            position: "relative",
            paddingTop: isOver && ready ? 22 : 0,
            transition: "padding .3s",
          }}
        >
          {isOver && ready && totalGastos > 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: `${Math.min(97, (totalIngresos / totalGastos) * 100)}%`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.text2,
                  whiteSpace: "nowrap",
                  fontFamily: FIGTREE,
                }}
              >
                Ingresos
              </span>
            </div>
          )}
          <div
            style={{
              position: "relative",
              height: 16,
              borderRadius: 8,
              overflow: "hidden",
              background: "#EEF0F4",
              display: "flex",
              gap: 2,
            }}
          >
            {catTotals.map(({ cat, amount }) => (
              <div
                key={cat}
                style={{
                  height: "100%",
                  flexShrink: 0,
                  width:
                    ready && maxBarVal > 0
                      ? `${(amount / maxBarVal) * 100}%`
                      : "0%",
                  background: BAR_COLORS[cat] || CATS[cat]?.color || "#ccc",
                  transition: `width .9s ${EASE}`,
                }}
              />
            ))}
            {hasIncome && balance > 0 && ready && (
              <div
                style={{
                  flex: 1,
                  height: "100%",
                  background:
                    "repeating-linear-gradient(-45deg, #CBEBD8, #CBEBD8 3px, #E6F6EC 3px, #E6F6EC 6px)",
                }}
              />
            )}
            {isOver && ready && totalGastos > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: `calc(${Math.min(97, (totalIngresos / totalGastos) * 100)}% - 1px)`,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: "#157A45",
                  zIndex: 3,
                }}
              />
            )}
          </div>
        </div>

        {/* 4 · Legend — only with incomes */}
        {hasIncome && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: C.navyDark,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ fontSize: 12, color: C.text2, fontFamily: FIGTREE }}
                >
                  Gastado
                </span>
              </div>
              <span
                style={{
                  fontFamily: POPPINS,
                  fontSize: 17,
                  fontWeight: 700,
                  color: C.navyDark,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(totalGastos)}
              </span>
              {stateKey === "D" && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    style={{ flexShrink: 0 }}
                  >
                    <path
                      d="M5 9V1M1 5l4-4 4 4"
                      stroke="#D93A3A"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#D93A3A",
                      fontFamily: FIGTREE,
                    }}
                  >
                    {pct - 100}% sobre tu ingreso
                  </span>
                </div>
              )}
            </div>
            {/* Ingresos — tappable, pencil icon */}
            <button
              onClick={() => {
                setExpanded(true)
                setActiveTab("ingresos")
                scrollToDesglose()
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 3,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "0 0 4px",
                minHeight: 44,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{ fontSize: 12, color: C.text2, fontFamily: FIGTREE }}
                >
                  Ingresos
                </span>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path
                    d="M9.5 1.5a1.414 1.414 0 0 1 2 2L4 11l-3 1 1-3 7.5-7.5z"
                    stroke={C.primary}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: POPPINS,
                  fontSize: 17,
                  fontWeight: 700,
                  color: C.navyDark,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(totalIngresos)}
              </span>
            </button>
          </div>
        )}

        {/* CTA — State A */}
        {stateKey === "A" && (
          <div
            style={{
              border: "1.5px dashed #B0BEFA",
              borderRadius: 14,
              background: "#F4F6FE",
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.navyDark,
                fontFamily: FIGTREE,
              }}
            >
              ¿Cuánto recibes al mes?
            </span>
            <span
              style={{
                fontSize: 13.5,
                color: C.text2,
                lineHeight: 1.4,
                fontFamily: FIGTREE,
              }}
            >
              Agrega tus ingresos y ve cuánto te queda.
            </span>
            <button
              onClick={() => openSheet()}
              style={{
                alignSelf: "flex-start",
                marginTop: 6,
                height: 40,
                padding: "0 20px",
                border: "none",
                borderRadius: 10,
                background: C.primary,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: FIGTREE,
              }}
            >
              Agregar
            </button>
          </div>
        )}

        {/* 5 · Footer */}
        <div
          style={{
            borderTop: "1px solid #F0F1F6",
            paddingTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={toggleExpanded}
            style={{
              border: "none",
              background: "transparent",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#2A44E0",
                fontFamily: FIGTREE,
              }}
            >
              Ver desglose
            </span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform .28s",
              }}
            >
              <path
                d="M2.5 5l4.5 4 4.5-4"
                stroke="#2A44E0"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {hasIncome && (
            <button
              onClick={() => openSheet()}
              style={{
                height: 36,
                padding: "0 14px",
                border: "none",
                borderRadius: 999,
                background: "#DDE2FB",
                color: C.primary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: FIGTREE,
              }}
            >
              + Ingreso
            </button>
          )}
        </div>
      </div>

      {/* 6 · Breakdown dropdown */}
      <div
        ref={desgloseRef}
        style={{
          maxHeight: expanded ? 9999 : 0,
          overflow: "hidden",
          transition: `max-height .45s ${EASE}`,
        }}
      >
        <div style={{ borderTop: "1px solid #F0F1F6" }}>
          {/* Segmented tabs */}
          {hasIncome && (
            <div style={{ padding: "14px 16px 8px" }}>
              <div
                style={{
                  display: "flex",
                  background: "#EDEEF3",
                  borderRadius: 12,
                  padding: 4,
                  gap: 3,
                }}
              >
                {[
                  ["gastos", `Gastos (${catTotals.length})`],
                  ["ingresos", `Ingresos (${incomes.length})`],
                ].map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      height: 36,
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: FIGTREE,
                      background: activeTab === tab ? "#fff" : "transparent",
                      color: activeTab === tab ? C.navyDark : C.text2,
                      boxShadow:
                        activeTab === tab
                          ? "0 1px 4px rgba(0,0,0,0.10)"
                          : "none",
                      transition:
                        "background .18s, color .18s, box-shadow .18s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Gastos rows */}
          {(!hasIncome || activeTab === "gastos") && (
            <div
              style={{
                padding: "4px 20px 16px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {catTotals.map(({ cat, amount }) => {
                const catData = CATS[cat]
                const barColor = BAR_COLORS[cat] || catData.color
                const pctVal =
                  totalIngresos > 0
                    ? Math.round((amount / totalIngresos) * 100)
                    : totalGastos > 0
                      ? Math.round((amount / totalGastos) * 100)
                      : 0
                return (
                  <div
                    key={cat}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 0",
                      borderBottom: "1px solid #F6F7FB",
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: barColor + "22",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        fontSize: 18,
                      }}
                    >
                      {catData.emoji}
                    </div>
                    {/* Name + bar */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: C.text,
                          fontFamily: FIGTREE,
                        }}
                      >
                        {catData.label}
                      </span>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 999,
                          background: "#EEF0F4",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: ready ? `${pctVal}%` : "0%",
                            background: barColor,
                            borderRadius: 999,
                            transition: `width .9s ${EASE}`,
                          }}
                        />
                      </div>
                    </div>
                    {/* Amount + % stacked right */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        flexShrink: 0,
                        gap: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: C.text,
                          fontVariantNumeric: "tabular-nums",
                          fontFamily: POPPINS,
                        }}
                      >
                        {fmt(amount)}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: C.text2,
                          fontFamily: FIGTREE,
                        }}
                      >
                        {pctVal}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Ingresos rows */}
          {hasIncome && activeTab === "ingresos" && (
            <div
              style={{
                padding: "8px 20px 16px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {incomes.map((income) => {
                const typeData =
                  INCOME_TYPES.find((t) => t.id === income.tipo) ||
                  INCOME_TYPES[3]
                const monthly = monthlyAmt(income)
                const freqLabel =
                  income.frecuencia === "quincenal"
                    ? `Quincenal · ${fmt(income.monto)} c/u`
                    : income.frecuencia === "mensual"
                      ? "Mensual"
                      : "Una vez"
                return (
                  <button
                    key={income.id}
                    onClick={() => openSheet(income)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      borderBottom: "1px solid #F6F7FB",
                      minHeight: 44,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "#E8F7EF",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        fontSize: 18,
                      }}
                    >
                      {typeData.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: C.text,
                          fontFamily: FIGTREE,
                        }}
                      >
                        {income.nombre || typeData.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: C.text2,
                          marginTop: 2,
                          fontFamily: FIGTREE,
                        }}
                      >
                        {freqLabel}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#157A45",
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                        fontFamily: POPPINS,
                      }}
                    >
                      +{fmt(monthly)}
                    </span>
                  </button>
                )
              })}
              <button
                onClick={() => openSheet()}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: "12px 0 4px",
                  color: C.primary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: FIGTREE,
                }}
              >
                + Agregar otro ingreso
              </button>
            </div>
          )}
        </div>
      </div>

      <IncomeSheet
        open={sheetOpen}
        income={editingIncome}
        onClose={() => setSheetOpen(false)}
        onSave={saveIncome}
        onDelete={deleteIncome}
      />
    </section>
  )
}
