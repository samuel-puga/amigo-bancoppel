import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CATS, QUICK_ORDER, FREQS, COLORS as C, EASE, fmt } from "./data"
import logoWhite from "./assets/bancoppel-logo-white.png"

const POPPINS = "'Poppins', sans-serif"

const BellIcon = ({ size = 17, stroke = "#FFFFFF" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

const CloseIcon = ({ size = 16, stroke = C.navyDark }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth="2.4"
    strokeLinecap="round"
  >
    <path d="M5 5l14 14M19 5L5 19" />
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12">
    <path
      d="M2.5 6.2l2.3 2.3 4.7-5"
      stroke="#FFFFFF"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export function BrandDots({ big = 16, small = 8, gap = 3 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap, height: 40 }}>
      <span
        style={{
          width: big,
          height: big,
          borderRadius: "50%",
          background: C.yellow,
          flex: "none",
        }}
      />
      <span
        style={{
          width: small,
          height: small,
          borderRadius: "50%",
          background: C.yellow,
          flex: "none",
        }}
      />
      <span
        style={{
          width: small,
          height: small,
          borderRadius: "50%",
          background: C.yellow,
          flex: "none",
        }}
      />
    </div>
  )
}

export function StatusBar() {
  return (
    <div
      style={{
        height: 47,
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px 0 32px",
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 16, color: "#FFFFFF" }}>
        9:41
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="18" height="11" viewBox="0 0 18 11" fill="#FFFFFF">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="5" y="5" width="3" height="6" rx="1" />
          <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="15" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11">
          <path
            d="M1 4a10 10 0 0 1 14 0"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M3.8 6.8a6 6 0 0 1 8.4 0"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="8" cy="9.6" r="1.4" fill="#FFFFFF" />
        </svg>
        <svg width="26" height="12" viewBox="0 0 26 12">
          <rect
            x="0.5"
            y="0.5"
            width="22"
            height="11"
            rx="3.5"
            stroke="#FFFFFF"
            opacity="0.5"
            fill="none"
          />
          <rect x="2" y="2" width="19" height="8" rx="2" fill="#FFFFFF" />
          <rect
            x="24"
            y="4"
            width="1.5"
            height="4"
            rx="0.75"
            fill="#FFFFFF"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  )
}

function HeaderBell({ style }) {
  return (
    <button
      aria-label="Recordatorios"
      style={{
        width: 36,
        height: 36,
        flex: "none",
        borderRadius: "50%",
        border: "none",
        background: "rgba(255,255,255,0.12)",
        display: "grid",
        placeItems: "center",
        padding: 0,
        cursor: "pointer",
        ...style,
      }}
    >
      <BellIcon />
    </button>
  )
}

function TabButton({ active, onClick, children, style: extraStyle }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        position: "relative",
        height: 40,
        border: "none",
        background: "transparent",
        fontFamily: POPPINS,
        fontSize: 14,
        fontWeight: 600,
        color: active ? C.navy : "rgba(255,255,255,0.8)",
        cursor: "pointer",
        transition: "color .3s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        ...extraStyle,
      }}
    >
      {children}
    </button>
  )
}

export function BrandHeader({ tab, collapsed, showNewDot, onTabChange }) {
  const onB = tab === "bolsillo"
  const col = collapsed && onB
  const t = `.32s ${EASE}`
  return (
    <header
      data-variant={col ? "collapsed" : "expanded"}
      style={{
        flex: "none",
        padding: `4px 20px ${col ? 24 : 32}px`,
        display: "flex",
        flexDirection: "column",
        transition: `padding ${t}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: col ? 0 : 36,
          marginBottom: col ? 0 : 16,
          opacity: col ? 0 : 1,
          overflow: "hidden",
          transition: `height ${t}, margin ${t}, opacity .2s`,
        }}
      >
        <img
          src={logoWhite}
          alt="BanCoppel"
          style={{ height: 30, display: "block" }}
        />
        <HeaderBell
          style={{
            opacity: onB ? 1 : 0,
            pointerEvents: onB ? "auto" : "none",
            transition: "opacity .3s",
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          aria-label="BanCoppel"
          style={{
            flex: "none",
            width: col ? 52 : 0,
            opacity: col ? 1 : 0,
            overflow: "hidden",
            transition: `width ${t}, opacity .25s`,
          }}
        >
          <BrandDots />
        </div>
        <div
          role="tablist"
          style={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            padding: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 4,
              bottom: 4,
              left: 4,
              width: "calc(50% - 4px)",
              borderRadius: 999,
              background: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              transform: onB ? "translateX(100%)" : "translateX(0)",
              transition: `transform ${t}`,
            }}
          />
          <TabButton active={!onB} onClick={() => onTabChange("login")}>
            Bienvenido
          </TabButton>
          <TabButton
            active={onB}
            onClick={() => onTabChange("bolsillo")}
            style={{ rowGap: 7, columnGap: 0, width: "100%" }}
          >
            Amigo BanCoppel
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.yellow,
                opacity: showNewDot && !onB ? 1 : 0,
                transition: "opacity .3s",
              }}
            />
          </TabButton>
        </div>
        <div
          style={{
            flex: "none",
            width: col ? 48 : 0,
            opacity: col ? 1 : 0,
            overflow: "hidden",
            display: "flex",
            justifyContent: "flex-end",
            transition: `width ${t}, opacity .25s`,
          }}
        >
          <HeaderBell />
        </div>
      </div>
    </header>
  )
}

export function LoginForm({ onSubmit, onForgot, onCreateAccount, onProducts }) {
  const [user, setUser] = useState("")
  const [pass, setPass] = useState("")
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!user.trim() || !pass) return setErr(true)
    setErr(false)
    setLoading(true)
    try {
      await onSubmit?.({ user: user.replace(/\s/g, ""), pass })
    } finally {
      setLoading(false)
    }
  }
  const input = (bad) => ({
    height: 48,
    borderRadius: 12,
    border: `1.5px solid ${bad ? C.danger : "transparent"}`,
    background: C.bg,
    padding: "0 14px",
    fontFamily: "inherit",
    fontSize: 14,
    color: C.text,
    outline: "none",
    width: "100%",
  })
  const label = { fontSize: 12, fontWeight: 600, color: C.text2 }
  const link = {
    border: "none",
    background: "transparent",
    padding: 0,
    fontSize: 13,
    fontWeight: 600,
    color: C.primary,
    cursor: "pointer",
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      style={{
        width: "50%",
        padding: "26px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background: "#FFFFFF",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            fontFamily: POPPINS,
            fontSize: 28,
            fontWeight: 800,
            color: "rgb(5,41,122)",
          }}
        >
          Ingresa a tu cuenta
        </span>
        <span style={{ fontSize: 16, color: "rgb(8,23,84)", marginBottom: 24 }}>
          Usa tus datos de cliente BanCoppel
        </span>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ ...label, fontSize: 14 }}>
          Número de cliente o CLABE
        </span>
        <input
          className="mb-input"
          value={user}
          onChange={(e) => {
            setUser(e.target.value.replace(/[^0-9 ]/g, ""))
            setErr(false)
          }}
          inputMode="numeric"
          autoComplete="username"
          placeholder="0000 0000 0000"
          style={input(err && !user.trim())}
        />
      </label>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          height: "100%",
        }}
      >
        <span style={{ ...label, fontSize: 14 }}>Contraseña</span>
        <div style={{ position: "relative" }}>
          <input
            className="mb-input"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value)
              setErr(false)
            }}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            style={{ ...input(err && !pass), paddingRight: 80 }}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            style={{
              position: "absolute",
              right: 6,
              top: 8,
              height: 32,
              padding: "0 10px",
              border: "none",
              background: "transparent",
              color: C.primary,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {show ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </label>
      {err && (
        <span
          role="alert"
          style={{ fontSize: 12, color: C.danger, marginTop: -4 }}
        >
          Completa ambos campos para continuar
        </span>
      )}
      <button
        type="submit"
        className="mb-primary"
        disabled={loading}
        style={{
          height: "fit-content",
          paddingTop: 16,
          paddingBottom: 16,
          border: "none",
          borderRadius: 999,
          background: C.primary,
          color: "#FFFFFF",
          fontFamily: POPPINS,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          marginTop: 4,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Ingresando…" : "Iniciar sesión"}
      </button>
      <button
        type="button"
        onClick={onForgot}
        style={{
          ...link,
          alignSelf: "center",
          fontFamily: POPPINS,
          fontSize: 16,
        }}
      >
        ¿Olvidaste tu contraseña?
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 12, color: C.muted }}>o</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>
      <button
        type="button"
        className="mb-outline"
        onClick={onCreateAccount}
        style={{
          height: "fit-content",
          paddingTop: 12,
          paddingBottom: 12,
          marginBottom: 16,
          border: `1px solid ${C.primary}`,
          borderRadius: 999,
          background: "#FFFFFF",
          color: C.primary,
          fontFamily: POPPINS,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Crear cuenta nueva
      </button>
      <span
        style={{
          fontSize: 16,
          color: C.text2,
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        ¿Quieres crédito?{" "}
        <button
          type="button"
          onClick={onProducts}
          style={{ ...link, fontSize: 16 }}
        >
          Ver nuestros productos
        </button>
      </span>
    </form>
  )
}

function autoCat(text) {
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

export function QuickAddBar({
  onAdd,
  forceExpanded = false,
  hlDoc = false,
  hlCam = false,
  highlight = false,
}) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [active, setActive] = useState(false)
  const wrapRef = useRef(null)

  const isOpen = active || forceExpanded
  const detectedCat = name.trim() ? autoCat(name) : null
  const canSave = name.trim() && parseFloat(amount) > 0

  const submit = () => {
    if (!canSave) return
    onAdd({
      name: name.trim(),
      amount: parseFloat(amount),
      cat: detectedCat || "comida",
    })
    setName("")
    setAmount("")
    setActive(false)
    document.activeElement?.blur()
  }
  const onKey = (e) => {
    if (e.key === "Enter") submit()
  }

  return (
    <div
      ref={wrapRef}
      onFocus={() => setActive(true)}
      onBlur={(e) => {
        if (!forceExpanded && !wrapRef.current?.contains(e.relatedTarget))
          setActive(false)
      }}
      style={{
        background: "#FFFFFF",
        borderRadius: 18,
        border: `1.5px solid ${
          isOpen || highlight ? C.primary : "rgba(28,66,232,0.22)"
        }`,
        boxShadow: highlight
          ? `0 0 0 3px rgba(28,66,232,0.18), 0 8px 28px rgba(28,66,232,0.16)`
          : isOpen
            ? `0 10px 32px rgba(28,66,232,0.18), 0 2px 8px rgba(28,66,232,0.10)`
            : `0 6px 22px rgba(28,66,232,0.13), 0 1px 4px rgba(0,0,0,0.06)`,
        transition: `box-shadow .28s ${EASE}, border-color .22s`,
      }}
    >
      {/* Input row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 6px 8px 14px",
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKey}
          placeholder="¿Qué pagaste o gastaste?"
          aria-label="Concepto"
          style={{
            flex: 1,
            minWidth: 0,
            height: 42,
            border: "none",
            background: "transparent",
            outline: "none",
            fontFamily: "inherit",
            fontSize: 14,
            color: C.text,
          }}
        />
        <div
          style={{ width: 1, height: 22, background: C.border, flex: "none" }}
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          onKeyDown={onKey}
          inputMode="decimal"
          placeholder="$0"
          aria-label="Monto"
          style={{
            width: 62,
            flex: "none",
            height: 42,
            border: "none",
            background: "transparent",
            outline: "none",
            fontFamily: POPPINS,
            fontSize: 15,
            fontWeight: 700,
            textAlign: "right",
            color: C.navyDark,
          }}
        />
        <button
          onClick={submit}
          aria-label="Agregar gasto"
          className="mb-press"
          style={{
            width: 42,
            height: 42,
            flex: "none",
            borderRadius: 13,
            border: "none",
            background: C.primary,
            color: "#FFFFFF",
            fontSize: 26,
            lineHeight: 1,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            padding: "0 0 2px",
            boxShadow: "rgba(28, 66, 232, 0.2) 0px 2px 8px 0px",
            opacity: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Chip de categoría detectada */}
      {detectedCat && isOpen && (
        <div
          style={{
            padding: "0 14px 10px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 11, color: C.text2 }}>Categoría:</span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: C.primary,
              background: C.primarySoft,
              padding: "3px 8px",
              borderRadius: 999,
            }}
          >
            {CATS[detectedCat].emoji} {CATS[detectedCat].label}
          </span>
        </div>
      )}

      <div
        style={{
          maxHeight: isOpen ? 180 : 0,
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition: `max-height .32s ${EASE}, opacity .25s`,
        }}
      >
        <div
          style={{
            borderTop: `1px solid ${C.bg}`,
            padding: "12px 14px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              color: C.muted,
              textTransform: "uppercase",
            }}
          >
            O regístralo con un documento
          </span>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            {/* Foto de ticket */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              style={{
                height: 108,
                borderRadius: 16,
                border: "none",
                background: hlCam ? C.primarySoft : "#F5F6FC",
                boxShadow: hlCam ? `0 0 0 2px ${C.primary}` : "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 0,
                transition: "background .2s, box-shadow .2s",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={hlCam ? C.primary : C.navyDark}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: hlCam ? C.primary : C.navyDark,
                  }}
                >
                  Foto de ticket
                </span>
                <span style={{ fontSize: 10, color: C.text2 }}>
                  Se llena solo
                </span>
              </div>
            </button>
            {/* Estado de cuenta */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              style={{
                height: 108,
                borderRadius: 16,
                border: "none",
                background: hlDoc ? C.primarySoft : "#F5F6FC",
                boxShadow: hlDoc ? `0 0 0 2px ${C.primary}` : "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 0,
                transition: "background .2s, box-shadow .2s",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={hlDoc ? C.primary : C.navyDark}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: hlDoc ? C.primary : C.navyDark,
                  }}
                >
                  Estado de cuenta
                </span>
                <span style={{ fontSize: 10, color: C.text2 }}>Subir PDF</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const CALLOUT_CONTENT = [
  {
    tag: "Estado de cuenta",
    title: "La forma más rápida de registrar",
    text: "Sube tu PDF del banco y registramos automáticamente todos tus movimientos del mes.",
  },
  {
    tag: "Foto de ticket",
    title: "Captura en segundos",
    text: "Fotografía cualquier ticket y la app extrae el monto y lo clasifica sola.",
  },
  {
    tag: "Balance del mes",
    title: "Tu situación en tiempo real",
    text: "Registra tu ingreso y ve cuánto llevas gastado, cuánto queda y en qué se va.",
  },
  {
    tag: "Pagos y gastos",
    title: "Todo bajo control",
    text: "Marca como pagado de un toque, pon recordatorios o desliza para eliminar.",
  },
]

function TutorialCalloutCard({ step, onNext, onSkip }) {
  const s = CALLOUT_CONTENT[step]
  const isLast = step === CALLOUT_CONTENT.length - 1
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: -7,
          left: 20,
          width: 0,
          height: 0,
          borderLeft: "7px solid transparent",
          borderRight: "7px solid transparent",
          borderBottom: `7px solid ${C.navyDark}`,
        }}
      />
      <div
        style={{
          background: C.navyDark,
          borderRadius: 16,
          padding: "14px 16px",
          boxShadow: "0 12px 32px rgba(2,42,122,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.9,
              color: "#F5C518",
              textTransform: "uppercase",
            }}
          >
            {s.tag}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            {step + 1} de {CALLOUT_CONTENT.length}
          </span>
        </div>
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 4,
          }}
        >
          {s.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          {s.text}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 5 }}>
            {CALLOUT_CONTENT.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 20 : 5,
                  height: 5,
                  borderRadius: 999,
                  background: i === step ? "#F5C518" : "rgba(255,255,255,0.22)",
                  transition: `width .3s ${EASE}`,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!isLast && (
              <button
                onClick={onSkip}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "rgba(255,255,255,0.38)",
                  fontSize: 11,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Saltar
              </button>
            )}
            <button
              onClick={onNext}
              style={{
                height: 34,
                padding: "0 16px",
                border: "none",
                borderRadius: 999,
                background: "#F5C518",
                color: C.navyDark,
                fontFamily: POPPINS,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {isLast ? "¡Listo!" : "Siguiente"}
              {!isLast && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6h8M7 3l3 3-3 3"
                    stroke={C.navyDark}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TutorialSpotlight({ rect, step, visible, onNext, onSkip }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted || step === null) return null

  const pad = 12
  const calloutTop = rect
    ? Math.min(rect.bottom + pad + 10, window.innerHeight - 190)
    : 0
  const calloutLeft = rect ? rect.left : 14
  const calloutWidth = rect ? rect.width : 320

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9990,
        opacity: visible ? 1 : 0,
        transition: "opacity .35s",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* Spotlight: transparent div with huge box-shadow creates the dark frame */}
      {rect && (
        <div
          style={{
            position: "absolute",
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            borderRadius: 18,
            boxShadow: "0 0 0 9999px rgba(2,18,72,0.80)",
            border: "1.5px solid rgba(255,255,255,0.12)",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Callout card positioned below spotlight */}
      {rect && (
        <div
          style={{
            position: "absolute",
            left: calloutLeft,
            width: calloutWidth,
            top: calloutTop,
            zIndex: 9991,
          }}
        >
          <TutorialCalloutCard step={step} onNext={onNext} onSkip={onSkip} />
        </div>
      )}
    </div>,
    document.body,
  )
}

export function SpendingChart({ entries, monthLabel = "Sep 2026" }) {
  const [selected, setSelected] = useState(null)
  const [ready, setReady] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const desgloseRef = useRef(null)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    if (next) {
      setTimeout(() => {
        desgloseRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        })
      }, 80)
    }
  }

  const { total, sorted } = useMemo(() => {
    const totals = {}
    entries.forEach((i) => {
      totals[i.cat] = (totals[i.cat] || 0) + i.amount
    })
    const total = Object.values(totals).reduce((a, b) => a + b, 0)
    const sorted = Object.keys(totals)
      .map((c) => ({ cat: c, amount: totals[c], frac: totals[c] / total }))
      .sort((a, b) => b.amount - a.amount)
    return { total, sorted }
  }, [entries])

  const sel = sorted.find((x) => x.cat === selected) || null
  const toggle = (c) => setSelected((s) => (s === c ? null : c))
  const pct = (f) => Math.round(f * 100) + "%"
  const top = sorted[0]

  let lead = "Registra tu primer gasto para ver",
    strong = "en qué se va tu dinero"
  if (sel) {
    lead = `${CATS[sel.cat].label} representa`
    strong = `${pct(sel.frac)} de lo que gastaste`
  } else if (top) {
    lead =
      top.frac >= 0.5 ? "Más de la mitad se va en" : "La mayor parte se va en"
    strong = `${CATS[top.cat].label} (${pct(top.frac)})`
  }

  return (
    <section
      aria-label="Gastos por categoría"
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
      }}
    >
      {/* ── Siempre visible: resumen + barra ── */}
      <div
        style={{
          padding: "18px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: C.text2,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: sel ? CATS[sel.cat].color : C.navyDark,
                  transition: "background .25s",
                }}
              />
              {sel ? `Gastado en ${CATS[sel.cat].label}` : "Gastado este mes"}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span
                style={{
                  fontFamily: POPPINS,
                  fontSize: 30,
                  fontWeight: 600,
                  color: C.navyDark,
                  letterSpacing: -0.5,
                }}
              >
                {fmt(sel ? sel.amount : total)}
              </span>
              <span style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>
                MXN
              </span>
            </div>
          </div>
          <span
            style={{
              flex: "none",
              fontSize: 11,
              fontWeight: 600,
              color: C.navyDark,
              background: C.primarySoft,
              padding: "5px 10px",
              borderRadius: 999,
            }}
          >
            {monthLabel}
          </span>
        </div>

        <div style={{ display: "flex", gap: 3, height: 44 }}>
          {sorted.map((x) => {
            const on = sel?.cat === x.cat
            return (
              <button
                key={x.cat}
                onClick={() => toggle(x.cat)}
                aria-label={CATS[x.cat].label}
                aria-pressed={on}
                style={{
                  flexGrow: ready ? x.amount : 0.0001,
                  flexBasis: 0,
                  minWidth: 0,
                  border: "none",
                  padding: 0,
                  borderRadius: 10,
                  background: CATS[x.cat].color,
                  opacity: sel && !on ? 0.25 : 1,
                  transform: on ? "scaleY(1.14)" : "scaleY(1)",
                  transition: `flex-grow .9s ${EASE}, opacity .25s, transform .25s`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 17,
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                {ready && x.frac >= 0.12 ? CATS[x.cat].emoji : ""}
              </button>
            )
          })}
        </div>

        <div
          style={{
            background: "#F6F7FB",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 12,
            lineHeight: 1.4,
            color: C.text,
          }}
        >
          {lead} <strong style={{ fontWeight: 700 }}>{strong}</strong>
        </div>

        {/* Toggle desglose */}
        <div
          onClick={toggleExpanded}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            cursor: "pointer",
            paddingBottom: 2,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>
            {expanded ? "Ocultar desglose" : "Ver desglose"}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform .28s",
            }}
          >
            <path
              d="M2.5 5l4.5 4 4.5-4"
              stroke={C.primary}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ── Dropdown: desglose por categoría ── */}
      <div
        ref={desgloseRef}
        style={{
          maxHeight: expanded ? 9999 : 0,
          overflow: "hidden",
          transition: `max-height .45s ${EASE}`,
          borderRadius: "0 0 16px 16px",
        }}
      >
        <div
          style={{ borderTop: `1px solid #F0F1F6`, padding: "6px 8px 12px" }}
        >
          {sorted.map((x) => {
            const on = sel?.cat === x.cat,
              cat = CATS[x.cat]
            return (
              <button
                key={x.cat}
                onClick={() => toggle(x.cat)}
                aria-pressed={on}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 8px",
                  border: "none",
                  borderRadius: 12,
                  background: on ? "#F3F5FE" : "transparent",
                  opacity: sel && !on ? 0.4 : 1,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "opacity .25s, background .25s",
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    flex: "none",
                    borderRadius: "50%",
                    background: cat.color + "26",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 16,
                  }}
                >
                  {cat.emoji}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.text,
                    }}
                  >
                    <span>{cat.label}</span>
                    <span>{fmt(x.amount)}</span>
                  </span>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        flex: 1,
                        height: 5,
                        borderRadius: 999,
                        background: "#EEF0F4",
                        overflow: "hidden",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          height: "100%",
                          width: ready ? `${(x.frac * 100).toFixed(1)}%` : "0%",
                          borderRadius: 999,
                          background: cat.color,
                          transition: `width .9s ${EASE}`,
                        }}
                      />
                    </span>
                    <span
                      style={{
                        width: 30,
                        textAlign: "right",
                        fontSize: 11,
                        fontWeight: 600,
                        color: C.text2,
                      }}
                    >
                      {pct(x.frac)}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function ExpenseListCard({
  items,
  trashMode,
  suggestionFor,
  onToggle,
  onBell,
  onDelete,
  highlight = false,
}) {
  const paid = items.filter((i) => i.status === "paid").length

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        boxShadow: highlight
          ? "0 0 0 3px rgba(28,66,232,0.18), 0 8px 28px rgba(28,66,232,0.16)"
          : "0 1px 6px rgba(0,0,0,0.08)",
        border: highlight
          ? `1.5px solid ${C.primary}`
          : "1.5px solid transparent",
        transition: "box-shadow .3s, border-color .3s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px 10px",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: C.navyDark }}>
          Pagos y gastos
        </span>
        {items.length > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.primary,
              background: C.primarySoft,
              padding: "3px 8px",
              borderRadius: 999,
            }}
          >
            {items.length}
            {paid > 0 ? ` · ${paid} pagado${paid > 1 ? "s" : ""}` : ""}
          </span>
        )}
      </div>
      <div
        style={{
          padding: "0 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              padding: "16px 0",
              textAlign: "center",
              fontSize: 13,
              color: C.muted,
            }}
          >
            Aún no registras gastos
          </div>
        ) : (
          items.map((item) => (
            <ExpenseCard
              key={item.id}
              item={item}
              trashAlways={trashMode === "always"}
              suggestion={suggestionFor(item)}
              onToggle={() => onToggle(item)}
              onBell={() => onBell(item)}
              onDelete={() => onDelete(item)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SuggestionPanel({ open, text, ctaLabel, onCta, onClose, onOptOut }) {
  return (
    <div
      aria-hidden={!open}
      style={{
        maxHeight: open ? 220 : 0,
        opacity: open ? 1 : 0,
        marginTop: open ? -12 : 0,
        overflow: "hidden",
        transition: `max-height .45s ${EASE}, opacity .3s, margin .3s`,
      }}
    >
      <div
        role="note"
        style={{
          background: "#F3F5FE",
          border: "1px solid #DCE3FD",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: "22px 12px 12px 14px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            flex: "none",
            borderRadius: 9,
            background: C.navyDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: C.yellow,
            }}
          />
          <span
            style={{
              width: 4.5,
              height: 4.5,
              borderRadius: "50%",
              background: C.yellow,
            }}
          />
          <span
            style={{
              width: 4.5,
              height: 4.5,
              borderRadius: "50%",
              background: C.yellow,
            }}
          />
        </span>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.6,
              color: C.navyDark,
            }}
          >
            SUGERENCIA BANCOPPEL
          </span>
          <span style={{ fontSize: 12, lineHeight: 1.45, color: C.text }}>
            {text}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 4,
            }}
          >
            <button
              onClick={onCta}
              tabIndex={open ? 0 : -1}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 0",
                fontSize: 12,
                fontWeight: 700,
                color: C.primary,
                cursor: "pointer",
              }}
            >
              {ctaLabel}
            </button>
            <button
              onClick={onOptOut}
              tabIndex={open ? 0 : -1}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 0",
                fontSize: 12,
                fontWeight: 500,
                color: C.text2,
                cursor: "pointer",
              }}
            >
              No me interesa
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          aria-label="Cerrar sugerencia"
          style={{
            width: 26,
            height: 26,
            flex: "none",
            border: "none",
            background: "transparent",
            padding: 0,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            margin: "-4px -4px 0 0",
          }}
        >
          <CloseIcon size={12} stroke={C.text2} />
        </button>
      </div>
    </div>
  )
}

const DAYS_ES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"]
const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

function MiniCalendar({ value, onChange }) {
  const todayObj = new Date()
  const sel = value ? new Date(value + "T12:00:00") : null
  const [view, setView] = useState(() => {
    const d = sel || todayObj
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const firstDay = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () =>
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))
  const nextMonth = () =>
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))

  const isToday = (d) =>
    d &&
    todayObj.getFullYear() === view.y &&
    todayObj.getMonth() === view.m &&
    todayObj.getDate() === d
  const isSel = (d) =>
    d &&
    sel &&
    sel.getFullYear() === view.y &&
    sel.getMonth() === view.m &&
    sel.getDate() === d
  const isPast = (d) => {
    if (!d) return false
    const t = new Date(view.y, view.m, d)
    const ref = new Date(
      todayObj.getFullYear(),
      todayObj.getMonth(),
      todayObj.getDate(),
    )
    return t < ref
  }

  const pick = (d) => {
    if (!d || isPast(d)) return
    const mm = String(view.m + 1).padStart(2, "0")
    const dd = String(d).padStart(2, "0")
    onChange(`${view.y}-${mm}-${dd}`)
  }

  return (
    <div
      style={{
        background: "#F7F8FC",
        borderRadius: 14,
        padding: "14px 12px 10px",
        userSelect: "none",
      }}
    >
      {/* Month nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke={C.navyDark}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.navyDark,
            fontFamily: "inherit",
          }}
        >
          {MONTHS_ES[view.m]} {view.y}
        </span>
        <button
          onClick={nextMonth}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke={C.navyDark}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {/* Day headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          marginBottom: 6,
        }}
      >
        {DAYS_ES.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 700,
              color: C.muted,
              padding: "2px 0",
              letterSpacing: 0.5,
            }}
          >
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "2px 0",
        }}
      >
        {cells.map((d, i) => {
          const selected = isSel(d)
          const today = isToday(d)
          const past = isPast(d)
          return (
            <button
              key={i}
              onClick={() => pick(d)}
              disabled={!d || past}
              style={{
                height: 34,
                border: "none",
                cursor: d && !past ? "pointer" : "default",
                borderRadius: 8,
                background: selected
                  ? C.primary
                  : today
                    ? C.primarySoft
                    : "transparent",
                color: selected
                  ? "#fff"
                  : past
                    ? "#D1D5DB"
                    : today
                      ? C.primary
                      : C.navyDark,
                fontSize: 13,
                fontWeight: selected || today ? 700 : 400,
                transition: "background .15s",
                outline: "none",
              }}
            >
              {d || ""}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ReminderSheet({ item, open, onClose, onSave }) {
  const today = new Date().toISOString().split("T")[0]
  const [nombre, setNombre] = useState("")
  const [date, setDate] = useState(today)
  const [recur, setRecur] = useState("once")
  const [calOpen, setCalOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    if (open) {
      setNombre("")
      setDate(today)
      setRecur("once")
      setSaved(false)
      setCalOpen(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const friendlyDate = (d) =>
    d
      ? new Date(d + "T12:00:00").toLocaleDateString("es-MX", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : "Seleccionar fecha"

  const handleSave = () => {
    onSave({ nombre: nombre.trim(), date, recur })
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1600)
  }

  if (!mounted) return null
  return createPortal(
    <div
      onClick={!saved ? onClose : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: open ? "rgba(2,42,122,0.32)" : "transparent",
        pointerEvents: open ? "auto" : "none",
        transition: "background .28s",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 430,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "8px 20px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: `transform .35s ${EASE}`,
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "8px 0 2px",
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
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: C.navyDark }}>
            {saved ? "¡Recordatorio guardado!" : `Recordatorio · ${item?.name}`}
          </span>
          {!saved && (
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                minWidth: 44,
                minHeight: 44,
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
          )}
        </div>

        {/* Success state */}
        {saved ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "16px 0 8px",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#E8F7EF",
                display: "grid",
                placeItems: "center",
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M6 16l8 8 12-14"
                  stroke="#157A45"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#157A45" }}>
                ¡Listo!
              </div>
              <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>
                Te avisamos el{" "}
                {new Date(date + "T12:00:00").toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Single input: nombre + calendar icon */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: `1.5px solid ${calOpen ? C.primary : C.border}`,
                  borderRadius: 12,
                  background: "#fff",
                  transition: "border-color .18s",
                }}
              >
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={`Pagar ${item?.name || "este gasto"}`}
                  style={{
                    flex: 1,
                    height: 48,
                    border: "none",
                    outline: "none",
                    padding: "0 0 0 14px",
                    fontSize: 14,
                    color: C.text,
                    fontFamily: "inherit",
                    background: "transparent",
                    minWidth: 0,
                  }}
                />
                {/* Divider */}
                <div
                  style={{
                    width: 1,
                    height: 24,
                    background: C.border,
                    flexShrink: 0,
                  }}
                />
                {/* Calendar icon button */}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setCalOpen((o) => !o)}
                  style={{
                    width: 48,
                    height: 48,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                  aria-label="Seleccionar fecha"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect
                      x="1.5"
                      y="3"
                      width="15"
                      height="13.5"
                      rx="2.5"
                      stroke={calOpen ? C.primary : C.text2}
                      strokeWidth="1.6"
                    />
                    <path
                      d="M5.5 1.5v3M12.5 1.5v3M1.5 7.5h15"
                      stroke={calOpen ? C.primary : C.text2}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Date chip — shows when date selected and calendar is closed */}
              {date && !calOpen && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 14px",
                    background: C.primarySoft,
                    borderRadius: 10,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                    <rect
                      x="1.5"
                      y="3"
                      width="15"
                      height="13.5"
                      rx="2.5"
                      stroke={C.primary}
                      strokeWidth="1.6"
                    />
                    <path
                      d="M5.5 1.5v3M12.5 1.5v3M1.5 7.5h15"
                      stroke={C.primary}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: C.primary }}
                  >
                    {new Date(date + "T12:00:00").toLocaleDateString("es-MX", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              )}

              {/* Inline calendar — expands in flow, no clipping */}
              <div
                style={{
                  maxHeight: calOpen ? 360 : 0,
                  overflow: "hidden",
                  transition: `max-height .36s ${EASE}`,
                  borderRadius: 14,
                }}
              >
                <div
                  style={{
                    background: "#F7F8FC",
                    borderRadius: 14,
                    border: `1.5px solid ${C.primary}22`,
                    boxShadow: "0 4px 18px rgba(28,66,232,0.10)",
                    marginTop: 2,
                  }}
                >
                  <MiniCalendar
                    value={date}
                    onChange={(d) => {
                      setDate(d)
                      setCalOpen(false)
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recurrence */}
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
                ["once", "Una vez"],
                ["weekly", "Semanal"],
                ["monthly", "Mensual"],
              ].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setRecur(val)}
                  style={{
                    flex: 1,
                    height: 36,
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 700,
                    background: recur === val ? "#fff" : "transparent",
                    color: recur === val ? C.navyDark : C.text2,
                    boxShadow:
                      recur === val ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                    transition: "background .18s, color .18s, box-shadow .18s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSave}
              style={{
                height: 50,
                border: "none",
                borderRadius: 14,
                background: C.primary,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(28,66,232,0.3)",
              }}
            >
              Guardar recordatorio
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function ExpenseCard({
  item,
  suggestion,
  trashAlways,
  onToggle,
  onBell,
  onDelete,
}) {
  const paid = item.status === "paid",
    over = item.status === "overdue",
    cat = CATS[item.cat]
  const dueToday = item.dueToday && !paid
  const dateText = over
    ? `⚠ Vencido · ${item.date}`
    : dueToday
      ? "Vence hoy"
      : paid && item.dueToday
        ? "Pagado hoy"
        : item.date

  // Swipe to delete
  const [swipeX, setSwipeX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const touchStart = useRef(0)
  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX
    setDragging(true)
  }
  const onTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStart.current
    setSwipeX(Math.max(-90, Math.min(0, dx)))
  }
  const onTouchEnd = () => {
    setDragging(false)
    if (swipeX < -60) {
      onDelete()
    } else {
      setSwipeX(0)
    }
  }

  // Reminder sheet
  const [reminderOpen, setReminderOpen] = useState(false)

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}
      >
        {/* Fondo rojo con basurero — solo visible al deslizar */}
        {swipeX < 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: C.danger,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: 20,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
        )}
        {/* Card deslizable */}
        <div
          data-status={item.status}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: paid ? "#FAFBFC" : over ? "#FFFBF2" : "#FFFFFF",
            borderRadius: 12,
            boxShadow: item.isNew
              ? "0 8px 22px rgba(2,42,122,0.12)"
              : over
                ? "0 1px 6px rgba(217,119,6,0.13)"
                : "0 1px 6px rgba(0,0,0,0.08)",
            padding: "12px 13px",
            borderLeft: `3px solid ${
              item.isNew ? C.successBright : "transparent"
            }`,
            transform: `translateX(${swipeX}px)`,
            transition: dragging ? "none" : `transform .3s ${EASE}`,
          }}
        >
          <button
            onClick={onToggle}
            role="checkbox"
            aria-checked={paid}
            aria-label={`Marcar ${item.name} como pagado`}
            style={{
              width: 22,
              height: 22,
              flex: "none",
              borderRadius: "50%",
              border: `2px solid ${paid ? C.success : C.border}`,
              background: paid ? C.success : "transparent",
              display: "grid",
              placeItems: "center",
              padding: 0,
              cursor: "pointer",
              transition: "background .15s, border-color .15s",
            }}
          >
            <span style={{ opacity: paid ? 1 : 0, display: "grid" }}>
              <CheckIcon />
            </span>
          </button>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: paid ? C.muted : C.text,
                textDecoration: paid ? "line-through" : "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 500,
                  color: C.text2,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: cat.color,
                  }}
                />
                {cat.label}
              </span>
              {over ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#92400E",
                    background: "#FEF3C7",
                    padding: "2px 7px",
                    borderRadius: 999,
                  }}
                >
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M5 1L1 9h8L5 1z"
                      stroke="#92400E"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 4v2"
                      stroke="#92400E"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                    <circle cx="5" cy="7.5" r="0.5" fill="#92400E" />
                  </svg>
                  Vencido · {item.date}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: dueToday ? C.warning : C.muted,
                    fontWeight: dueToday ? 700 : 400,
                  }}
                >
                  {dateText}
                </span>
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 6,
              flex: "none",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: paid ? C.muted : C.text,
              }}
            >
              {fmt(item.amount)}
            </span>
            {!paid && (
              <button
                onClick={() => setReminderOpen(true)}
                aria-pressed={item.reminder}
                aria-label="Programar recordatorio"
                style={{
                  width: 26,
                  height: 26,
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  opacity: item.reminder ? 1 : 0.35,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24">
                  <path
                    d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
                    fill={item.reminder ? C.primary : "none"}
                    stroke={item.reminder ? C.primary : C.text2}
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
                    stroke={item.reminder ? C.primary : C.text2}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      <SuggestionPanel open={!!suggestion} {...(suggestion || {})} />
      <ReminderSheet
        item={item}
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        onSave={() => onBell(item)}
      />
    </div>
  )
}

/* ─── Tutorial coach marks ─── */

const TUTORIAL_STEPS = [
  {
    bg: "#EEF1FE",
    accent: "#1C42E8",
    tag: "Novedad · Registro inteligente",
    title: "Automatiza tus gastos",
    sub: "Sube tu estado de cuenta PDF y registramos todos tus movimientos del mes.",
    visual: () => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 210,
            background: "#fff",
            borderRadius: 14,
            padding: "11px 12px 12px",
            boxShadow: "0 6px 20px rgba(28,66,232,0.13)",
            border: `1.5px solid rgba(28,66,232,0.18)`,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              color: "#9CA3AF",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            O regístralo con un documento
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {/* Foto ticket — dimmed */}
            <div
              style={{
                height: 66,
                borderRadius: 10,
                background: "#F5F6FC",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                opacity: 0.35,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#05297A"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#05297A" }}>
                Foto de ticket
              </span>
            </div>
            {/* Estado de cuenta — highlighted */}
            <div
              style={{
                position: "relative",
                height: 66,
                borderRadius: 10,
                background: "#EEF1FE",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                boxShadow: "0 0 0 2px #1C42E8",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1C42E8"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#1C42E8" }}>
                Estado de cuenta
              </span>
              <div
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#1C42E8",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <svg width="9" height="9" viewBox="0 0 9 9">
                  <path
                    d="M2 4.5l2 2 3-3.5"
                    stroke="#fff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: "#1C42E8",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M6.5 1.5v8M3.5 6.5l3 3 3-3"
              stroke="#1C42E8"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Subir PDF · se llena solo
        </div>
      </div>
    ),
  },
  {
    bg: "#FFF8EC",
    accent: "#D97706",
    tag: "Novedad · Captura rápida",
    title: "Foto a tus tickets",
    sub: "Fotografía un ticket y lo clasificamos y registramos automáticamente.",
    visual: () => (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            background: "#FFF3DC",
            display: "grid",
            placeItems: "center",
            boxShadow: "0 8px 24px rgba(217,119,6,0.18)",
            flexShrink: 0,
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D97706"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "10px 14px",
            boxShadow: "0 3px 14px rgba(0,0,0,0.09)",
            display: "flex",
            flexDirection: "column",
            gap: 5,
            minWidth: 130,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#05297A" }}>
              Walmart
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#05297A" }}>
              $284
            </span>
          </div>
          <div style={{ height: 1, background: "#E4E6EB" }} />
          {["Leche · $28", "Pan · $45", "Jabón · $38"].map((t) => (
            <div key={t} style={{ fontSize: 10, color: "#9CA3AF" }}>
              {t}
            </div>
          ))}
          <div
            style={{
              marginTop: 2,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 700,
              color: "#D97706",
              background: "#FFF3DC",
              padding: "2px 7px",
              borderRadius: 999,
              alignSelf: "flex-start",
            }}
          >
            🛒 Despensa
          </div>
        </div>
      </div>
    ),
  },
  {
    bg: "#F0FDF4",
    accent: "#16A34A",
    tag: "Novedad · Balance",
    title: "Tu balance en tiempo real",
    sub: "Registra tu ingreso y mira al instante cuánto te queda del mes.",
    visual: () => (
      <div
        style={{
          width: 210,
          background: "#fff",
          borderRadius: 14,
          padding: "14px 14px 12px",
          boxShadow: "0 6px 20px rgba(22,163,74,0.13)",
        }}
      >
        <div style={{ fontSize: 10, color: "#65676B", marginBottom: 2 }}>
          Balance del mes
        </div>
        <div
          style={{
            fontFamily: POPPINS,
            fontSize: 26,
            fontWeight: 700,
            color: "#05297A",
            letterSpacing: -0.6,
            marginBottom: 10,
          }}
        >
          $8,600
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: "#F0F1F6",
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          <div
            style={{
              height: "100%",
              width: "68%",
              borderRadius: 999,
              background: "linear-gradient(90deg,#2A44E0,#4B6EFF)",
              transition: "width 1s",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9.5,
            color: "#65676B",
          }}
        >
          <span>
            Gastado: <strong style={{ color: "#05297A" }}>$11,400</strong>
          </span>
          <span>
            Ingreso: <strong style={{ color: "#16A34A" }}>$20,000</strong>
          </span>
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          {[
            ["Hogar", "#2A44E0", 45],
            ["Servicios", "#7B3FF2", 25],
            ["Despensa", "#F2B35B", 20],
            ["Otros", "#4CB85C", 10],
          ].map(([l, c, w]) => (
            <div
              key={l}
              style={{ flex: w, height: 5, borderRadius: 999, background: c }}
            />
          ))}
        </div>
        <div
          style={{ marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {[
            ["Hogar", "#2A44E0"],
            ["Servicios", "#7B3FF2"],
            ["Despensa", "#F2B35B"],
          ].map(([l, c]) => (
            <div
              key={l}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontSize: 9,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: c,
                }}
              />
              <span style={{ color: "#65676B" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    bg: "#EFF6FF",
    accent: "#1C42E8",
    tag: "Novedad · Pagos y gastos",
    title: "Gestiona tus pagos",
    sub: "Marca pagados, activa recordatorios o desliza para eliminar.",
    visual: () => (
      <div
        style={{ display: "flex", flexDirection: "column", gap: 7, width: 210 }}
      >
        {[
          {
            name: "Netflix",
            amt: "$219",
            paid: true,
            bell: false,
            swipe: false,
          },
          {
            name: "Telmex",
            amt: "$599",
            paid: false,
            bell: true,
            swipe: false,
          },
          { name: "CFE", amt: "$780", paid: false, bell: false, swipe: true },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 10,
            }}
          >
            {item.swipe && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 10,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
            )}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                background: "#fff",
                borderRadius: 10,
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                transform: item.swipe ? "translateX(-28px)" : "none",
              }}
            >
              <div
                style={{
                  width: 17,
                  height: 17,
                  borderRadius: "50%",
                  border: `2px solid ${item.paid ? "#16A34A" : "#E4E6EB"}`,
                  background: item.paid ? "#16A34A" : "transparent",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {item.paid && (
                  <svg width="9" height="9" viewBox="0 0 9 9">
                    <path
                      d="M2 4.5l2 2 3-3.5"
                      stroke="#fff"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                )}
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontWeight: 600,
                  color: item.paid ? "#9CA3AF" : "#111827",
                  textDecoration: item.paid ? "line-through" : "none",
                }}
              >
                {item.name}
              </span>
              {item.bell && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="#1C42E8"
                  stroke="#1C42E8"
                  strokeWidth="1.2"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path
                    d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
                    fill="none"
                    stroke="#1C42E8"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: item.paid ? "#9CA3AF" : "#05297A",
                }}
              >
                {item.amt}
              </span>
            </div>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            color: "#9CA3AF",
            paddingLeft: 2,
            marginTop: 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 7H3M3 7l3-3M3 7l3 3"
              stroke="#9CA3AF"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Desliza para eliminar
        </div>
      </div>
    ),
  },
]

export function Toast({ toast, visible, onAction, onDismiss }) {
  const [progress, setProgress] = useState(100)
  useEffect(() => {
    if (!visible || !toast) return
    setProgress(100)
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setProgress(0)),
    )
    const t = setTimeout(onDismiss, toast.duration)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [toast?.id, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const t = toast || {}
  const actionLabel =
    t.action === "undo" ? "Deshacer" : t.action === "saved" ? "Guardado" : ""
  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDismiss}
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 28,
        zIndex: 4,
        background: C.navyDark,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(2,42,122,0.3)",
        transform: visible ? "translateY(0)" : "translateY(140%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: `transform .3s ${EASE}, opacity .3s`,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
        }}
      >
        <span style={{ fontSize: 22 }}>{t.emoji}</span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>
            {t.title}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
            {t.sub}
          </span>
        </div>
        {actionLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (t.action === "undo") onAction?.()
            }}
            style={{
              border: "none",
              background: "transparent",
              padding: "6px 0 6px 8px",
              fontSize: 12,
              fontWeight: 700,
              color: t.action === "undo" ? "#9DB1FF" : C.successBright,
              cursor: "pointer",
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
      <div style={{ height: 2.5, background: "rgba(255,255,255,0.1)" }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: C.successBright,
            transition:
              progress === 0 ? `width ${t.duration || 0}ms linear` : "none",
          }}
        />
      </div>
    </div>
  )
}

export function Sheet({
  open,
  onClose,
  tag,
  tagSolid = false,
  title,
  badge,
  body,
  children,
  footnote,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          background: "rgba(2,42,122,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .3s",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label={title}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 6,
          background: "#FFFFFF",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
          padding: "8px 24px 34px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          transform: open ? "translateY(0)" : "translateY(105%)",
          transition: `transform .38s ${EASE}`,
          visibility: open ? "visible" : "hidden",
          transitionProperty: "transform, visibility",
          transitionDelay: open ? "0s" : "0s, .38s",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: "#D0D5DD",
              alignSelf: "center",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: tagSolid ? "#FFFFFF" : C.navyDark,
                background: tagSolid ? C.primary : C.primarySoft,
                padding: "4px 9px",
                borderRadius: 6,
              }}
            >
              {tag}
            </span>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="mb-icon-btn"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                display: "grid",
                placeItems: "center",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontFamily: POPPINS,
                  fontSize: 22,
                  fontWeight: 600,
                  color: C.navyDark,
                  letterSpacing: -0.3,
                }}
              >
                {title}
              </span>
              {badge}
            </div>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: C.text2 }}>
              {body}
            </span>
          </div>
          {children}
          {footnote && (
            <span
              style={{
                fontSize: 11,
                lineHeight: 1.5,
                color: C.muted,
                textAlign: "center",
                marginTop: -8,
              }}
            >
              {footnote}
            </span>
          )}
        </div>
      </div>
    </>
  )
}

const primaryBtn = {
  height: 50,
  border: "none",
  borderRadius: 999,
  background: C.primary,
  color: "#FFFFFF",
  fontFamily: POPPINS,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
}
const ghostBtn = {
  height: 40,
  border: "none",
  background: "transparent",
  color: C.primary,
  fontFamily: POPPINS,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
}

function Benefit({ icon, title, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          width: 38,
          height: 38,
          flex: "none",
          borderRadius: 10,
          background: C.primarySoft,
          display: "grid",
          placeItems: "center",
          fontSize: 17,
        }}
      >
        {icon}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 12, color: C.text2 }}>{sub}</span>
      </div>
    </div>
  )
}

export function IntroSheet({ open, onClose }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      tag="¡Nuevo!"
      tagSolid
      title="Mi Bolsillo"
      badge={
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#08A046",
            background: "rgba(8,191,80,0.1)",
            border: "1px solid rgba(8,191,80,0.35)",
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          Sin registro
        </span>
      }
      body="Organiza tus gastos y pagos sin necesitar una cuenta. Gratis, sin letra chica."
      footnote="Al convertirte en cliente BanCoppel, tus datos se sincronizan y recibes ofertas personalizadas según tus gastos reales."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Benefit
          icon="📊"
          title="Ve en qué se va tu dinero"
          sub="Gráfica por categoría al instante"
        />
        <Benefit
          icon="🔔"
          title="Recordatorios de pago"
          sub="Te avisamos antes de cada vencimiento"
        />
        <Benefit
          icon="🔒"
          title="Tus datos se quedan aquí"
          sub="Se guardan solo en este teléfono"
        />
      </div>
      <button onClick={onClose} className="mb-primary" style={primaryBtn}>
        Empezar a registrar
      </button>
    </Sheet>
  )
}

export function ApartadoSheet({ open, item, onClose, onOpenAccount }) {
  const [freq, setFreq] = useState("semanal")
  const f = FREQS[freq]
  const amount = item?.amount || 0
  const per = Math.ceil(amount / f.n)
  const hint =
    f.n > 1
      ? `En ${f.n} ${f.unit} juntas ${fmt(amount)} para tu próximo pago`
      : `Un solo apartado de ${fmt(amount)} antes del vencimiento`

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tag="Producto BanCoppel"
      title="Aparta para tu próximo pago"
      body="Con los apartados de tu Cuenta Digital BanCoppel separas dinero para cada pago sin mezclarlo con tu saldo disponible."
      footnote="Tus gastos siguen guardados solo en este teléfono. Esta sugerencia se calcula aquí, sin enviar tus datos."
    >
      <div
        style={{
          background: "#F3F5FE",
          borderRadius: 16,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <span style={{ color: C.text2 }}>{item?.name}</span>
          <span style={{ fontWeight: 600 }}>{fmt(amount)} por pago</span>
        </div>
        <div
          role="radiogroup"
          aria-label="Frecuencia"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
            padding: 3,
            borderRadius: 999,
            background: "#E3E8FB",
          }}
        >
          {Object.keys(FREQS).map((k) => {
            const on = k === freq
            return (
              <button
                key={k}
                role="radio"
                aria-checked={on}
                onClick={() => setFreq(k)}
                style={{
                  height: 32,
                  border: "none",
                  borderRadius: 999,
                  background: on ? "#FFFFFF" : "transparent",
                  color: on ? C.navyDark : C.text2,
                  boxShadow: on ? "0 1px 4px rgba(2,42,122,0.15)" : "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background .2s, color .2s",
                }}
              >
                {FREQS[k].short}
              </button>
            )
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 12, color: C.text2 }}>Aparta</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                fontFamily: POPPINS,
                fontSize: 28,
                fontWeight: 600,
                color: C.navyDark,
                letterSpacing: -0.4,
              }}
            >
              {fmt(per)}
            </span>
            <span style={{ fontSize: 13, color: C.text2 }}>{f.label}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {Array.from({ length: f.n }, (_, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 999,
                background: C.primary,
                opacity: 0.35 + (0.65 * (i + 1)) / f.n,
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 12, color: C.text, marginTop: -4 }}>
          {hint}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={() => onOpenAccount({ item, freq, perPayment: per })}
          className="mb-primary"
          style={primaryBtn}
        >
          Abrir mi Cuenta Digital
        </button>
        <button onClick={onClose} style={ghostBtn}>
          Ahora no
        </button>
      </div>
    </Sheet>
  )
}

export function DomiciliacionSheet({
  open,
  services,
  selected,
  onToggle,
  onClose,
  onApply,
}) {
  const picked = services.filter((s) => selected[s.id])
  const total = picked.reduce((a, s) => a + s.amount, 0)
  return (
    <Sheet
      open={open}
      onClose={onClose}
      tag="Producto BanCoppel"
      title="Tus servicios, en automático"
      body="Domicilia tus pagos recurrentes a una Tarjeta de Crédito BanCoppel y deja de estar al pendiente de cada fecha."
      footnote="Sujeto a aprobación de crédito. Tus gastos siguen guardados solo en este teléfono."
    >
      <div
        style={{
          background: "#F3F5FE",
          borderRadius: 16,
          padding: "6px 16px 14px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {services.map((s) => {
          const on = !!selected[s.id]
          return (
            <button
              key={s.id}
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                border: "none",
                borderBottom: "1px solid #E3E8FB",
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  flex: "none",
                  borderRadius: 6,
                  border: `2px solid ${on ? C.primary : "#C9D1E6"}`,
                  background: on ? C.primary : "#FFFFFF",
                  display: "grid",
                  placeItems: "center",
                  transition: "background .15s, border-color .15s",
                }}
              >
                <span style={{ opacity: on ? 1 : 0, display: "grid" }}>
                  <CheckIcon />
                </span>
              </span>
              <span style={{ fontSize: 16 }}>{CATS[s.cat].emoji}</span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                }}
              >
                {s.name}
              </span>
              <span style={{ fontSize: 13, color: C.text2 }}>
                {fmt(s.amount)}/mes
              </span>
            </button>
          )
        })}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            paddingTop: 12,
          }}
        >
          <span style={{ fontSize: 12, color: C.text2 }}>
            {picked.length === 1 ? "1 servicio" : `${picked.length} servicios`}{" "}
            en automático
          </span>
          <span
            style={{
              fontFamily: POPPINS,
              fontSize: 20,
              fontWeight: 600,
              color: C.navyDark,
            }}
          >
            {fmt(total)}
            <span
              style={{
                fontFamily: "inherit",
                fontSize: 12,
                fontWeight: 500,
                color: C.text2,
              }}
            >
              {" "}
              /mes
            </span>
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={() => onApply(picked)}
          disabled={!picked.length}
          className="mb-primary"
          style={{ ...primaryBtn, opacity: picked.length ? 1 : 0.45 }}
        >
          Solicitar mi Tarjeta de Crédito
        </button>
        <button onClick={onClose} style={ghostBtn}>
          Ahora no
        </button>
      </div>
    </Sheet>
  )
}
