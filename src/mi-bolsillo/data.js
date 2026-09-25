export const COLORS = {
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

export const EASE = "cubic-bezier(.2,.8,.2,1)"

export const CATS = {
  comida: { label: "Comida", emoji: "🍔", color: "#F2D12E" },
  servicios: { label: "Servicios", emoji: "💡", color: "#7D42FF" },
  ocio: { label: "Ocio", emoji: "🎬", color: "#022A7A" },
  transporte: { label: "Transporte", emoji: "🚗", color: "#08BF50" },
  despensa: { label: "Despensa", emoji: "🛒", color: "#FFAE43" },
  salud: { label: "Salud", emoji: "💊", color: "#FF594D" },
  suscripciones: { label: "Suscripciones", emoji: "📱", color: "#FDA1FB" },
  hogar: { label: "Hogar", emoji: "🏠", color: "#1C42E8" },
}

export const QUICK_ORDER = [
  "servicios",
  "despensa",
  "transporte",
  "comida",
  "suscripciones",
  "salud",
  "ocio",
  "hogar",
]

export const RECURRING = ["servicios", "suscripciones", "hogar"]
export const DOMICILIABLE = ["servicios", "suscripciones"]

export const FREQS = {
  semanal: { n: 4, short: "Semanal", label: "por semana", unit: "semanas" },
  quincenal: {
    n: 2,
    short: "Quincenal",
    label: "por quincena",
    unit: "quincenas",
  },
  mensual: { n: 1, short: "Mensual", label: "al mes", unit: "mes" },
}

export const INITIAL_ITEMS = [
  {
    id: 1,
    name: "Netflix",
    cat: "suscripciones",
    amount: 219,
    date: "15 sep",
    status: "paid",
    orig: "pending",
    reminder: false,
  },
  {
    id: 2,
    name: "Luz CFE",
    cat: "servicios",
    amount: 780,
    date: "hoy",
    status: "pending",
    reminder: true,
    dueToday: true,
  },
  {
    id: 3,
    name: "Despensa Walmart",
    cat: "despensa",
    amount: 1200,
    date: "18 sep",
    status: "pending",
    reminder: false,
  },
  {
    id: 4,
    name: "Renta",
    cat: "hogar",
    amount: 3500,
    date: "10 sep",
    status: "overdue",
    reminder: false,
  },
]

export const EARLIER = [{ cat: "transporte", amount: 230 }]

export const fmt = (n) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })
