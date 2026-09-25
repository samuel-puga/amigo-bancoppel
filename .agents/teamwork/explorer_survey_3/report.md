# R3 Survey Report: Feature Inventory, UI/UX Interaction Specification, Visual Fidelity & 4-Tier Test Suite

- **Date**: 2026-09-25
- **Agent**: Explorer 3 (Survey Phase)
- **Target Requirement**: R3 (Preservación Total de la Experiencia e Interactividad Demo) & Acceptance Criteria
- **Project Root**: `c:/Users/Zam/amigo-coppel-mvp`
- **Working Directory**: `c:/Users/Zam/amigo-coppel-mvp/.agents/teamwork/explorer_survey_3`

---

## 1. Executive Summary & Objective

The objective of Requirement R3 is to ensure that the Android application executing in Expo Go maintains **100% functional, visual, and interactive fidelity** with the existing React + Vite web application (`amigo-coppel-mvp`). The application is a financial management prototype branded for **BanCoppel** ("Amigo BanCoppel" / "Mi Bolsillo"), featuring an initial video splash screen, a 2-tab layout ("Bienvenido" and "Amigo BanCoppel"), interactive expense management, swipe-to-delete gestures, interactive balance breakdown with dynamic state calculation, bottom sheets for financial products (Apartados, Domiciliación con TDC, Recordatorios, Registro de Ingresos), contextual suggestions, and local persistence.

This document establishes the exhaustive feature inventory, technical contracts, visual design tokens, and the 4-tier test verification matrix required for the implementation and QA verification tracks.

---

## 2. Complete Screen & Component Catalog

### 2.1. Viewport Container & Shell (`src/App.tsx`)
- **Outer Shell**:
  - CSS: `minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A1A4A'`.
  - Serves as the backdrop on desktop or large viewports.
- **Mobile Device Frame**:
  - Dimensions: `width: '100%', maxWidth: 430px, height: '100dvh', maxHeight: 900px, overflow: 'hidden', position: 'relative'`.
  - Max width `430px` mimics standard flagship mobile devices (e.g., iPhone 14/15 Pro Max).
  - Contains `<MiBolsillo showStatusBar={true} trashMode="hover" />` and the conditional `<SplashScreen />` overlay.
- **Android / WebView Adaptation Note**:
  - On a native Android device inside Expo Go WebView, `width: 100%` and `height: 100dvh` must fill the device screen seamlessly without horizontal letterboxing or awkward double scrollbars.

---

### 2.2. Splash Screen (`src/App.tsx: SplashScreen`)
- **Asset**: `src/mi-bolsillo/assets/splash.mp4` (bundled video asset).
- **DOM Container**:
  - `position: 'absolute', inset: 0, zIndex: 9999, background: '#05297A', display: 'flex', alignItems: 'center', justifyContent: 'center'`.
  - Fading state: `opacity: fading ? 0 : 1`, `transition: 'opacity .5s ease'`, `pointerEvents: fading ? 'none' : 'auto'`.
- **Video Element Attributes**:
  - `muted: true` (critical for modern browser autoplay policies).
  - `playsInline: true` (prevents default full-screen takeover on mobile OS).
  - `style: { width: '100%', height: '100%', objectFit: 'cover' }`.
- **Playback & Lifecycle**:
  - Autoplay trigger: `useEffect` executes `videoRef.current.play().catch(() => finish())`.
  - Blocked autoplay fallback: If autoplay fails or is blocked by browser/webview security policies, `.catch()` immediately triggers `finish()`.
  - Normal finish trigger: `onEnded={finish}` event fired when video reaches its end.
  - Finish animation: Sets `fading = true`, waits `520ms` via `setTimeout`, then invokes `onDone()`.
- **Persistence & Session Storage**:
  - Controlled in `App.tsx` state: `sessionStorage.getItem('splash-seen') === '1'`.
  - `onDone` callback saves: `sessionStorage.setItem('splash-seen', '1')` and sets `splashDone = true`.
  - Guarantees that refreshing or soft navigation within the session will skip the splash screen, while a fresh app launch displays it.
- **Critical WebView Android Constraint**:
  - In `react-native-webview`, inline video autoplay requires configuration:
    - `allowsInlineMediaPlayback={true}`
    - `mediaPlaybackRequiresUserAction={false}`
    - `domStorageEnabled={true}` (to support `sessionStorage`).

---

### 2.3. Top Header & Navigation System (`src/mi-bolsillo/components.jsx: BrandHeader` & `StatusBar`)

#### A. Status Bar Component (`StatusBar`)
- **Layout**: Height 47px, `display: flex, alignItems: 'center', justifyContent: 'space-between', padding: '0 24px 0 32px'`.
- **Elements**:
  - Time indicator: `9:41` (font-weight 600, 16px, color `#FFFFFF`).
  - System icons:
    - Cellular signal bars (4-step SVG bars in `#FFFFFF`).
    - Wi-Fi icon (3 concentric arcs + dot SVG in `#FFFFFF`).
    - Battery icon (26x12px pill SVG with inner charge block and cathode terminal).
- **Integration Note with Expo Go / Android**:
  - Standard Android devices have physical status bars and camera notches.
  - To prevent a "double status bar" effect (native Android status bar displaying system time on top of the web 9:41 status bar), Expo's native status bar should be configured with `StatusBar style="light"` and either:
    1. Keep `showStatusBar={true}` for strict visual mockup fidelity if the native bar is hidden/translucent, OR
    2. Dynamically set `showStatusBar={false}` if the native Android status bar is active and occupying that space.

#### B. Brand Header (`BrandHeader`)
- **Props**: `tab` ('login' | 'bolsillo'), `collapsed` (boolean), `showNewDot` (boolean), `onTabChange` (fn).
- **States**:
  - **Expanded State**:
    - Top row (height 36px, marginBottom 16px, opacity 1):
      - BanCoppel Logo: `src/mi-bolsillo/assets/bancoppel-logo-white.png` (height 30px).
      - Header Bell icon button (36x36px circle, background `rgba(255,255,255,0.12)`, visible only when `tab === 'bolsillo'`).
  - **Collapsed State** (triggered when scrolling `scrollTop > 24px` inside "Amigo BanCoppel"):
    - Top row collapses to `height: 0, marginBottom: 0, opacity: 0, overflow: 'hidden'` with `.32s cubic-bezier(.2,.8,.2,1)`.
    - Left brand dots reveal: 3 BanCoppel yellow dots (`BrandDots`: big 16px, small 8px, small 8px, `#F0D225`), expanding width from 0 to 52px.
    - Right bell icon shrinks to header right (width 48px).
- **Tab Segmented Control**:
  - Pill background: `rgba(255,255,255,0.12)`, borderRadius 999, padding 4px.
  - Gliding indicator: White pill (`#FFFFFF`) with shadow `0 2px 8px rgba(0,0,0,0.18)`, width `calc(50% - 4px)`.
  - Transform animation: `translateX(0)` on "Bienvenido" -> `translateX(100%)` on "Amigo BanCoppel". Transition: `.32s cubic-bezier(.2,.8,.2,1)`.
  - Tab 1: **"Bienvenido"** (active color `#05297A`, inactive `rgba(255,255,255,0.8)`).
  - Tab 2: **"Amigo BanCoppel"** (active color `#05297A`, inactive `rgba(255,255,255,0.8)`).
    - Unread notification badge: 7x7px yellow circle (`#F0D225`) displayed if `!introSeen && tab !== 'bolsillo'`.

#### C. Horizontal Carousel Route Transition (`MiBolsillo.jsx: main`)
- **Container**: `position: 'relative', flex: 1, minHeight: 0, marginTop: -16px, borderRadius: '24px 24px 0 0', overflow: 'hidden', background: '#FFFFFF'`.
- **Slide Track**:
  - `display: 'flex', width: '200%', height: '100%'`.
  - Slide transform: `transform: onB ? 'translateX(-50%)' : 'translateX(0)'`.
  - Transition: `transform .38s cubic-bezier(.2,.8,.2,1)`.
  - Left 50% pane: `LoginForm` ("Bienvenido").
  - Right 50% pane: Scrollable dashboard ("Amigo BanCoppel").

---

### 2.4. Welcome Screen ("Bienvenido" / `LoginForm`)
- **Route**: Active when `tab === 'login'`.
- **Container**: `width: '50%', padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 14, background: '#FFFFFF'`.
- **Typography & Structure**:
  - Header Title: `"Ingresa a tu cuenta"` (Poppins, 28px, font-weight 800, color `#05297A`).
  - Header Subtitle: `"Usa tus datos de cliente BanCoppel"` (16px, regular, color `rgb(8,23,84)`).
- **Form Controls**:
  1. **User / CLABE Input**:
     - Label: `"Número de cliente o CLABE"` (14px, font-weight 600, color `#65676B`).
     - Input: Placeholder `"0000 0000 0000"`, `inputMode="numeric"`, `autoComplete="username"`.
     - Input Filter: Replaces any non-numeric and non-space characters: `e.target.value.replace(/[^0-9 ]/g, '')`.
     - Styling: Height 48px, background `#F0F2F5`, borderRadius 12px, border `1.5px solid transparent` (or `#DC2626` when validation fails). Focus state: border `#1C42E8`, background `#FFFFFF`.
  2. **Password Input**:
     - Label: `"Contraseña"` (14px, font-weight 600, color `#65676B`).
     - Input: Placeholder `"••••••••"`, type toggleable between `'password'` and `'text'`.
     - Inline Toggle: `"Mostrar"` / `"Ocultar"` button (color `#1C42E8`, font-size 12px, font-weight 600).
- **Validation & Submit Action**:
  - Trigger: Form submit or button click.
  - Validation: Requires both `user.trim()` and `pass` to be truthy. If empty, displays red alert message: `"Completa ambos campos para continuar"` and highlights field borders in `#DC2626`.
  - Submit State: Button text changes to `"Ingresando…"`, disabled, opacity 0.7.
  - Action Callback: Invokes `onSubmit?.({ user: user.replace(/\s/g, ''), pass })`.
- **Secondary Actions**:
  - `"¿Olvidaste tu contraseña?"` button (link style, Poppins 16px, color `#1C42E8`, invokes `onForgot`).
  - Divider: Horizontal line with centered `"o"` text.
  - `"Crear cuenta nueva"` button (pill outline button: height ~42px, border `1px solid #1C42E8`, text color `#1C42E8`, invokes `onCreateAccount`).
  - Product CTA: `"¿Quieres crédito? Ver nuestros productos"` (link style, invokes `onProducts`).

---

### 2.5. Main Dashboard ("Amigo BanCoppel" Panel)
- **Route**: Active when `tab === 'bolsillo'`.
- **Scroll Container**:
  - Class `mb-scroll`, `width: '50%', height: '100%', overflowY: 'auto', background: '#F0F2F5', padding: '16px 14px 110px', display: 'flex', flexDirection: 'column', gap: 14`.
  - Scrollbar hidden via CSS (`scrollbar-width: none; -webkit-scrollbar: display: none`).
  - Scroll listener: Fires `onPanelScroll`, updating `collapsed` when `scrollTop > 24px`.
- **Privacy Notice Banner**:
  - Flex row with centered lock icon SVG + text: `"Sin iniciar sesión · tus datos se guardan en este teléfono"` (11px, color `#65676B`).
- **Dashboard Sections**:
  1. Quick Expense Add Bar (`QuickAddBar`).
  2. Interactive Balance Card (`BalanceCard`).
  3. Interactive Expense List (`ExpenseListCard`).
  4. Footer Synchronization Prompt (`"Inicia sesión para sincronizar con tu cuenta BanCoppel"`).

---

### 2.6. Quick Expense Add Bar (`QuickAddBar`)
- **Card Styling**:
  - Background `#FFFFFF`, borderRadius 18px.
  - Border: `1.5px solid rgba(28,66,232,0.22)` default; becomes `1.5px solid #1C42E8` when focused or highlighted.
  - Box Shadow: Smooth expansion from subtle shadow to elevated glow `0 10px 32px rgba(28,66,232,0.18)` when open.
- **Top Input Row**:
  - Concept field: Input with placeholder `"¿Qué pagaste o gastaste?"`.
  - Vertical divider: 1px width, 22px height, `#E4E6EB`.
  - Amount field: Input with placeholder `"$0"`, `inputMode="decimal"`, Poppins 15px bold, right-aligned, color `#022A7A`. Filters non-numeric characters: `replace(/[^0-9.]/g, '')`.
  - Quick Add `+` Button: 42x42px square with 13px border radius, background `#1C42E8`, color `#FFFFFF`, font-size 26px, press animation (`transform: scale(0.94)`).
- **Real-Time Auto-Categorization Algorithm (`autoCat`)**:
  - Evaluates concept text case-insensitively:
    - `/netflix|spotify|disney|hbo|amazon|crunchyroll|apple tv|paramount/` -> `suscripciones` 📱
    - `/\bluz\b|cfe|\bgas\b|\bagua\b|telmex|telcel|internet|izzi|sky|megacable/` -> `servicios` 💡
    - `/walmart|oxxo|chedraui|superama|bodega|costco|sams|soriana|comer/` -> `despensa` 🛒
    - `/uber|didi|\btaxi\b|gasolina|metro|camion|transporte|autobus/` -> `transporte` 🚗
    - `/\brenta\b|mantenimiento|plomero|electricista|\bhogar\b/` -> `hogar` 🏠
    - `/doctor|farmacia|medicamento|hospital|dentista|consulta/` -> `salud` 💊
    - `/cine|concierto|teatro|museo|estadio/` -> `ocio` 🎬
    - `/restaurante|taqueria|\bcomida\b|pizza|hamburguesa|cafe|\btacos\b|sushi/` -> `comida` 🍔
    - Fallback: defaults to `'comida'`.
- **Category Pill Display**:
  - When concept is typed and bar is open, renders pill: `Categoría: [Emoji] [Label]` (background `#EEF1FE`, text `#1C42E8`, font-size 11px, font-weight 700).
- **Expandable Document Capture Options**:
  - Smooth expansion (`maxHeight: isOpen ? 180 : 0`).
  - Label: `"O REGÍSTRALO CON UN DOCUMENTO"` (11px, font-weight 700, tracking 1px, `#9CA3AF`).
  - 2-column grid:
    1. **"Foto de ticket" / "Se llena solo"**: Camera icon SVG, card height 108px, rounded 16px.
    2. **"Estado de cuenta" / "Subir PDF"**: Document icon SVG, card height 108px, rounded 16px.
- **Submission Action**:
  - Condition: Validates `canSave = name.trim() && parseFloat(amount) > 0`.
  - Keyboard trigger: Pressing `Enter` in either concept or amount input.
  - Effect: Creates expense record `{ id: Date.now(), name, cat, amount, date: 'Hoy', status: 'pending', reminder: false, isNew: true }`.
  - Inserts at top of `items` array.
  - Clears inputs, closes expansion, blurs active element.
  - Triggers toast with category emoji, name, and formatted amount.

---

### 2.7. Interactive Balance Card (`BalanceCard.jsx`)
The `BalanceCard` dynamically computes month financial health using all registered expenses (`items`) + historical benchmark (`EARLIER: transporte $230`) against registered incomes (`incomes` from `localStorage`).

#### A. Income Frequency & Monthly Normalization (`monthlyAmt`)
- Quincenal income: `monto * 2` (computed as monthly base).
- Mensual income: `monto * 1`.
- Única income: `monto * 1`.

#### B. The 4 Dynamic Financial States
| State | Condition | Card Title | Primary Metric Label | Status Pill Color & Text | Arrow Indicator |
|---|---|---|---|---|---|
| **State A** | `incomes.length === 0` | `"Gastado este mes"` | `"Llevas gastado"` | Gray `#F1F2F7` / `#555`: `"{TopCat} es el X% de tu gasto"` | None |
| **State B** | `balance > 0 && pct < 80%` | `"Balance del mes"` | `"Te quedan"` | Green `#E3F5EA` / `#157A45`: `"Usaste X% de tus ingresos"` | Up Arrow (Green `#1E9E5A`) |
| **State C** | `balance > 0 && pct >= 80%` | `"Balance del mes"` | `"Te quedan"` | Orange `#FDF1E2` / `#A35A0E`: `"Usaste X% de tus ingresos"` | Up Arrow (Green `#1E9E5A`) |
| **State D** | `balance <= 0` (Déficit) | `"Balance del mes"` | `"Diferencia del mes"` | Red `#F1F2F7` / `#555` + Red Arrow: `"Tus gastos superaron tus ingresos"` | Down Arrow (Red `#D93A3A`) |

#### C. Visual Multi-Segment Bar
- Height: 16px, background `#EEF0F4`, borderRadius 8px.
- Category segments colored by `BAR_COLORS` (e.g. hogar `#2A44E0`, despensa `#F2B35B`, servicios `#7B3FF2`, transporte `#4CB85C`, etc.).
- Animated transition on load/change: `width .9s cubic-bezier(.2,.8,.2,1)`.
- **Surplus Pattern**: If `hasIncome && balance > 0`, unspent portion shows green diagonal hatch pattern: `repeating-linear-gradient(-45deg, #CBEBD8, #CBEBD8 3px, #E6F6EC 3px, #E6F6EC 6px)`.
- **Deficit Threshold Line**: In State D, a vertical marker line in `#157A45` (width 2px) marks the 100% income limit with floating text `"Ingresos"` above it.

#### D. Income Setup CTA (State A)
- Dashed box (`border: 1.5px dashed #B0BEFA`, background `#F4F6FE`, borderRadius 14px).
- Title: `"¿Cuánto recibes al mes?"`, Subtitle: `"Agrega tus ingresos y ve cuánto te queda."`.
- Button: `"Agregar"` -> Opens `IncomeSheet`.

#### E. Expandable Breakdown Drawer ("Ver desglose")
- Tap triggers accordion expansion (`maxHeight: expanded ? 9999 : 0`, transition `.45s cubic-bezier(.2,.8,.2,1)`).
- Chevron icon rotates 180°.
- Segmented sub-tabs (when incomes exist):
  - Tab 1: `"Gastos (N)"` -> Lists each expense category, colored emoji icon, label, percentage progress bar, amount, and percentage of income.
  - Tab 2: `"Ingresos (M)"` -> Lists each registered income (emoji, label, frequency, monthly sum `+$X`). Tap opens `IncomeSheet` in edit mode. Includes `"+ Agregar otro ingreso"` button.

#### F. Income Registration Modal Sheet (`IncomeSheet`)
- Rendered via `createPortal` to `document.body` with backdrop `rgba(2,42,122,0.38)`.
- Input 1: Monto (large currency display with `$` and `MXN`, `inputMode="decimal"`).
- Input 2: Frecuencia (3-way segmented button: `"Una vez"` / `"Quincenal"` / `"Mensual"`).
  - Quincenal helper callout: `"Recibes $X dos veces al mes: cuenta como $2X en septiembre"`.
- Input 3: Nombre (text field) + dynamic suggestion chips appearing on focus: `💼 Sueldo`, `💻 Freelance`, `🏪 Negocio`, `💵 Otro`.
- Action Button: `"Guardar ingreso"` / `"Guardar cambios"`. Disabled if amount <= 0.
- Delete Button: `"Eliminar ingreso"` (only visible in edit mode).
- Toast on save: `"💰 Ingreso agregado · Balance actualizado"`.

---

### 2.8. Interactive Expense List & Cards (`ExpenseListCard` & `ExpenseCard`)

#### A. Header
- Title: `"Pagos y gastos"` (font-size 13px, bold, color `#05297A`).
- Count pill: `"{total} · {paidCount} pagado(s)"` (background `#EEF1FE`, color `#1C42E8`, borderRadius 999).
- Empty state: Displays `"Aún no registras gastos"` if `items.length === 0`.

#### B. Expense Card Structure (`ExpenseCard`)
- **Status Styles**:
  - `pending`: Background `#FFFFFF`, border-left `3px solid transparent` (or `#08BF50` if newly added `isNew`).
  - `overdue`: Background `#FFFBF2`, amber badge `"⚠ Vencido · 10 sep"`, alert triangle SVG.
  - `paid`: Background `#FAFBFC`, strikethrough text on name, text color muted `#9CA3AF`.
- **Payment Checkbox Toggle**:
  - Circular checkbox: 22x22px.
  - Unchecked: `border: 2px solid #E4E6EB`, background transparent.
  - Checked: `border: 2px solid #16A34A`, background `#16A34A`, animated checkmark SVG.
  - State behavior:
    - Toggling to paid: Updates `status: 'paid'`, saves previous status in `orig`.
    - If category is in `RECURRING` (`['servicios', 'suscripciones', 'hogar']`) and user hasn't opted out: schedules Apartado suggestion after 550ms!
    - Toggling from paid: Restores `status: orig || 'pending'`. Dismisses any active suggestion.
- **Reminder Bell Button**:
  - Bell SVG icon button (26x26px, opacity 0.35 inactive, opacity 1 and filled with `#1C42E8` when active).
  - Only visible when item is not paid (`!paid`).
  - Tap opens `ReminderSheet`.
  - If reminder enabled on a pending item in `DOMICILIABLE` (`['servicios', 'suscripciones']`): schedules Domiciliación suggestion after 450ms!
- **Swipe-to-Delete Gesture**:
  - Implemented with touch events (`onTouchStart`, `onTouchMove`, `onTouchEnd`).
  - Delta X clamped between `-90px` and `0px`.
  - Underlay: Red container (`#DC2626`) revealing a centered white trash can SVG.
  - Threshold logic: If swipe exceeds `-60px` on touch end, card deletes immediately. Otherwise, smoothly snaps back to 0px via `.3s cubic-bezier(.2,.8,.2,1)`.
  - On delete: Removes item from `items`, saves reference in `lastDeleted`, and fires undo toast.

#### C. Contextual BanCoppel Suggestion Banners (`SuggestionPanel`)
- Renders directly attached below the relevant expense card.
- Styling: Background `#F3F5FE`, border `1px solid #DCE3FD`, rounded bottom corners `12px`.
- BanCoppel Logo Badge: 30x30px dark navy container with 3 yellow dots.
- Heading: `"SUGERENCIA BANCOPPEL"` (10px, uppercase, bold).
- **Rule 1: TDC Suggestion for Subscriptions**:
  - Condition: `item.cat === 'suscripciones' && item.status !== 'paid' && !optOut && !dismissedTDC.includes(item.id)`.
  - Copy: `"Domicilia {name} a una Tarjeta de Crédito BanCoppel y se cobra sola cada mes. Sin recordatorios, sin cargos por olvido — tú solo disfruta."`.
  - CTA: `"Solicitar mi TDC BanCoppel ›"` (invokes `onApplyCard` or navigates to login).
  - Dismiss: Adds item id to `dismissedTDC`.
- **Rule 2: Apartado Suggestion for Recurring Payments**:
  - Condition: Triggered 550ms after marking a `servicios`, `suscripciones`, or `hogar` item as paid.
  - Copy: `"¿Y si el próximo pago de {name} ya estuviera apartado? Separa ${amount} poco a poco con tu Cuenta Digital BanCoppel."`.
  - CTA: `"Crear un apartado ›"` -> Opens `ApartadoSheet`.
- **Rule 3: Domiciliación Suggestion for Reminders**:
  - Condition: Triggered 450ms after setting a reminder on a pending `servicios` or `suscripciones` item.
  - Copy: `"¿Prefieres no depender del recordatorio? Domicilia {name} a una Tarjeta de Crédito BanCoppel y se paga sola cada mes."`.
  - CTA: `"Domiciliar mis servicios ›"` -> Opens `DomiciliacionSheet`.
- **Opt-Out Control**:
  - Clicking `"No me interesa"` sets `optOut = true`, permanently suppressing all suggestions and showing a confirmation toast: `"👍 Entendido · No te mostraremos más sugerencias"`.

---

### 2.9. Bottom Sheets Catalog (5 Modal Sheets)

#### 1. Introduction Sheet (`IntroSheet`)
- **Trigger**: Rendered when `sheet === 'intro'` (or for first-time onboarding).
- **Content**:
  - Tag: `"¡Nuevo!"` (solid primary blue).
  - Title: `"Mi Bolsillo"`, Badge: `"Sin registro"` (green pill `#08A046`).
  - Subtitle: `"Organiza tus gastos y pagos sin necesitar una cuenta. Gratis, sin letra chica."`.
  - 3 Value Propositions:
    1. 📊 `"Ve en qué se va tu dinero"` - Gráfica por categoría al instante.
    2. 🔔 `"Recordatorios de pago"` - Te avisamos antes de cada vencimiento.
    3. 🔒 `"Tus datos se quedan aquí"` - Se guardan solo en este teléfono.
  - Action Button: `"Empezar a registrar"` (primary blue pill button).
  - Legal footnote: `"Al convertirte en cliente BanCoppel, tus datos se sincronizan y recibes ofertas personalizadas según tus gastos reales."`.

#### 2. Apartados Sheet (`ApartadoSheet`)
- **Trigger**: Click on `"Crear un apartado ›"` in suggestion banner.
- **Content**:
  - Tag: `"Producto BanCoppel"`, Title: `"Aparta para tu próximo pago"`.
  - Expense details: Shows item name and total amount per payment.
  - Frequency Selector (Pill Segmented): `"Semanal"` (n=4), `"Quincenal"` (n=2), `"Mensual"` (n=1).
  - Dynamic Calculation: `per = Math.ceil(amount / f.n)`. Displays large formatted amount: e.g., `"$195 por semana"`.
  - Visual Step Bar: Segmented bar showing 4, 2, or 1 segments with ascending opacity gradients.
  - Dynamic Explanation: `"En 4 semanas juntas $780 para tu próximo pago"`.
  - Action Buttons:
    - Primary: `"Abrir mi Cuenta Digital"` (invokes `onOpenAccount`).
    - Ghost: `"Ahora no"` (dismisses sheet).

#### 3. Domiciliación Sheet (`DomiciliacionSheet`)
- **Trigger**: Click on `"Domiciliar mis servicios ›"` in suggestion banner.
- **Content**:
  - Tag: `"Producto BanCoppel"`, Title: `"Tus servicios, en automático"`.
  - Subtitle: `"Domicilia tus pagos recurrentes a una Tarjeta de Crédito BanCoppel y deja de estar al pendiente de cada fecha."`.
  - Services Checklist: Iterates over all items in `items` matching `DOMICILIABLE` categories.
    - Checkbox toggle per service with category emoji, service name, and monthly cost.
  - Dynamic Total Footer: Shows count of picked services and real-time monthly total: e.g., `"2 servicios en automático · $999/mes"`.
  - Action Buttons:
    - Primary: `"Solicitar mi Tarjeta de Crédito"` (disabled/dimmed if 0 services selected; invokes `onApplyCard`).
    - Ghost: `"Ahora no"` (dismisses sheet).

#### 4. Reminder Sheet (`ReminderSheet`)
- **Trigger**: Tap bell icon on any unpaid expense card.
- **Content**:
  - Title: `"Recordatorio · {item.name}"`.
  - Single Integrated Input: Custom name field + calendar icon button.
  - Inline Mini Calendar (`MiniCalendar`):
    - Month navigation (< / >).
    - Grid of days with day-of-week headers (Do, Lu, Ma, Mi, Ju, Vi, Sá).
    - Disables past days.
    - Highlights current day and selected day.
  - Selected Date Chip: Formatted in Spanish (e.g., `"viernes, 25 de septiembre"`).
  - Recurrence Selector: `"Una vez"` / `"Semanal"` / `"Mensual"`.
  - Action Button: `"Guardar recordatorio"`.
  - Success Feedback Animation: Replaces form with green circle checkmark SVG and text `"¡Listo! Te avisamos el {fecha}"`, auto-closing after 1600ms.

#### 5. Income Registration Sheet (`IncomeSheet`)
- Detailed in Section 2.7 (F).

---

### 2.10. Tutorial Spotlight Coach Marks (`TutorialSpotlight` & `TutorialCalloutCard`)
- **Trigger**: When first switching to `"Amigo BanCoppel"` and `tutorialSeen === false` (delayed by 600ms).
- **Structure**:
  - Rendered via React Portal onto `document.body`.
  - Full-screen dark mask: `boxShadow: '0 0 0 9999px rgba(2,18,72,0.80)'`.
  - Cutout spotlight rectangle dynamically bounding target element with 12px padding.
- **4 Guided Steps**:
  1. **Step 0 ("Estado de cuenta")**: Highlights document button in QuickAddBar. Title: `"La forma más rápida de registrar"`.
  2. **Step 1 ("Foto de ticket")**: Highlights camera button in QuickAddBar. Title: `"Captura en segundos"`.
  3. **Step 2 ("Balance del mes")**: Highlights BalanceCard. Title: `"Tu situación en tiempo real"`.
  4. **Step 3 ("Pagos y gastos")**: Highlights ExpenseListCard. Title: `"Todo bajo control"`.
- **Navigation Controls**:
  - Progress dots (4 steps).
  - `"Saltar"` button (exits tutorial immediately, sets `tutorialSeen = true`).
  - `"Siguiente"` / `"¡Listo!"` button (advances to next step or completes).

---

### 2.11. Toast System (`Toast`)
- **Layout**: Positioned at bottom (`left: 16px, right: 16px, bottom: 28px, zIndex: 4`).
- **Styling**: Background `#022A7A`, rounded corners 14px, elevated shadow.
- **Elements**:
  - Emoji icon (22px).
  - Title (13px, font-weight 700, `#FFFFFF`).
  - Subtitle (11px, `rgba(255,255,255,0.6)`).
  - Optional action button:
    - `"Deshacer"` in `#9DB1FF` (restores deleted item).
    - `"Guardado"` in `#08BF50`.
  - Bottom progress bar: 2.5px green bar (`#08BF50`) that shrinks linearly over the toast duration (4000ms or 5000ms).
- **Undo Logic**: Restores deleted item to its exact previous index in `items`.

---

## 3. Data Persistence Architecture & Schema

All persistent state operates through `localStorage` with fail-safe `try/catch` wrappers. In addition, session flags operate via `sessionStorage`.

### 3.1. Storage Keys & Types
```typescript
// LocalStorage Keys
const STORAGE_KEYS = {
  ITEMS: 'mi-bolsillo:v3:items',
  INTRO_SEEN: 'mi-bolsillo:v3:introSeen',
  TUTORIAL_SEEN: 'mi-bolsillo:v3:tutorialSeen',
  OPT_OUT: 'mi-bolsillo:v3:optOut',
  DISMISSED_TDC: 'mi-bolsillo:v3:dismissedTDC',
  INCOMES: 'mb:incomes:v1',
  SPLASH_SEEN: 'splash-seen', // sessionStorage
};
```

### 3.2. TypeScript Data Schemas
```typescript
export type CategoryKey =
  | 'comida'
  | 'servicios'
  | 'ocio'
  | 'transporte'
  | 'despensa'
  | 'salud'
  | 'suscripciones'
  | 'hogar';

export type ExpenseStatus = 'pending' | 'paid' | 'overdue';

export interface ExpenseItem {
  id: number;                 // Unique identifier (Date.now() or 1..4)
  name: string;               // Display title (e.g. 'Luz CFE')
  cat: CategoryKey;           // Category identifier
  amount: number;             // Monetary value in MXN
  date: string;               // Display date ('Hoy', '15 sep', '10 sep')
  status: ExpenseStatus;      // Current status
  orig?: 'pending' | 'overdue'; // Original status saved when toggled to 'paid'
  reminder: boolean;          // Bell reminder toggle state
  dueToday?: boolean;         // Indicator for due today
  isNew?: boolean;            // Ephemeral highlight flag for newly added items
}

export type IncomeType = 'sueldo' | 'freelance' | 'negocio' | 'otro';
export type IncomeFrequency = 'unica' | 'quincenal' | 'mensual';

export interface IncomeItem {
  id: number;                 // Unique timestamp identifier
  tipo: IncomeType;           // Classification type
  monto: number;              // Raw amount input
  frecuencia: IncomeFrequency;// Frequency multiplier
  nombre: string;             // Custom descriptor (e.g. 'Nómina Coppel')
}
```

### 3.3. Initial Seed / Mock Data (`INITIAL_ITEMS` & `EARLIER`)
```javascript
export const INITIAL_ITEMS = [
  { id: 1, name: 'Netflix', cat: 'suscripciones', amount: 219, date: '15 sep', status: 'paid', orig: 'pending', reminder: false },
  { id: 2, name: 'Luz CFE', cat: 'servicios', amount: 780, date: 'hoy', status: 'pending', reminder: true, dueToday: true },
  { id: 3, name: 'Despensa Walmart', cat: 'despensa', amount: 1200, date: '18 sep', status: 'pending', reminder: false },
  { id: 4, name: 'Renta', cat: 'hogar', amount: 3500, date: '10 sep', status: 'overdue', reminder: false },
];

export const EARLIER = [
  { cat: 'transporte', amount: 230 }
];
```

---

## 4. BanCoppel Design System & Visual Fidelity Specification

### 4.1. Color Tokens (`COLORS`)
| Token Name | Hex Code | Visual Role |
|---|---|---|
| `navy` | `#05297A` | BanCoppel Brand Navy: Header, root container, splash background |
| `navyDark` | `#022A7A` | Dark Navy: Bottom sheet titles, toast background, ocio category, high-contrast headings |
| `primary` | `#1C42E8` | Brand Blue: Action buttons, active tabs, focus borders, active bell |
| `primaryPressed`| `#1631B8` | Button active/pressed state |
| `primarySoft` | `#EEF1FE` | Soft blue: Selected badges, category chips, highlight backgrounds |
| `yellow` | `#F0D225` | BanCoppel Yellow: Brand dots, unread dot, tutorial accents |
| `bg` | `#F0F2F5` | Neutral Background: Amigo BanCoppel canvas, input inactive background |
| `surface` | `#FFFFFF` | Card surface, modal sheet backgrounds, active tab pill |
| `text` | `#0F1419` | Primary text: Headings, expense names, main amounts |
| `text2` | `#65676B` | Secondary text: Subtitles, helper text, dates |
| `muted` | `#9CA3AF` | Inactive icons, input placeholders, disabled elements |
| `border` | `#E4E6EB` | Dividers, card borders, subtle separators |
| `success` | `#16A34A` | Green: Checkbox fill, positive balance text |
| `successBright`| `#08BF50` | Vibrant green: New expense highlight border, toast progress bar |
| `warning` | `#D97706` | Amber: Overdue indicators, due today notice |
| `danger` | `#DC2626` | Red: Delete swipe underlay, form error alert, deficit balance |

### 4.2. Category Palette
| Category | Emoji | Color Hex | Bar Color Hex |
|---|---|---|---|
| Comida | 🍔 | `#F2D12E` | `#F2D12E` |
| Servicios | 💡 | `#7D42FF` | `#7B3FF2` |
| Ocio | 🎬 | `#022A7A` | `#022A7A` |
| Transporte | 🚗 | `#08BF50` | `#4CB85C` |
| Despensa | 🛒 | `#FFAE43` | `#F2B35B` |
| Salud | 💊 | `#FF594D` | `#FF594D` |
| Suscripciones | 📱 | `#FDA1FB` | `#F2A6EE` |
| Hogar | 🏠 | `#1C42E8` | `#2A44E0` |

### 4.3. Typography & Font Families
- **Header & Metric Font**: `'Poppins', sans-serif` (weights: 600, 700, 800)
  - Used for: Brand tabs, main balance amounts (`$8,600`), large headings (`"Ingresa a tu cuenta"`), action buttons.
- **Card & Data Font**: `'Figtree', 'Inter', system-ui, sans-serif`
  - Used for: Balance card labels, breakdown rows, status pills.
- **Body & Controls**: `'Inter', system-ui, sans-serif` (weights: 400, 500, 600)
  - Used for: Form inputs, general text, explanations, footnotes.
- **Tabular Numbers**: `fontVariantNumeric: 'tabular-nums'` applied to monetary metrics for strict vertical decimal alignment.

### 4.4. Motion & Animation Timing
- Global Easing: `EASE = cubic-bezier(.2, .8, .2, 1)`.
- Tab Transition: `.38s EASE`.
- Header Collapse: `.32s EASE`.
- Sheet Entry/Exit: `.35s - .38s EASE`.
- Progress Bars & Chart Segments: `.9s EASE`.
- Button Press Response: `transform: scale(0.94)` via `.mb-press:active`.
- Accessibility: `@media (prefers-reduced-motion: reduce)` sets transitions and animations to `0s !important`.

---

## 5. Concrete 4-Tier Verification Suite

This matrix outlines every test scenario across the 4 required tiers, specifying input conditions, expected behaviors, and automated verification methods.

### 5.1. Tier 1: Feature Coverage (Core Feature Verification)

| Test ID | Feature / Component | Action / Input | Expected Result | Verification Method |
|---|---|---|---|---|
| **T1.01** | Splash Video | Mount `App` with empty session storage | Video plays muted and inline. On end, fades out in 520ms and reveals main view. | DOM event test: verify `play()` invoked, simulate `ended`, assert `sessionStorage['splash-seen'] === '1'`. |
| **T1.02** | Splash Autoplay Fallback | Mount with rejected `play()` promise | Catches rejection and immediately finishes transition without hanging or blank screen. | Mock `HTMLVideoElement.prototype.play` to reject; assert `onDone` is called. |
| **T1.03** | Navigation Tabs | Click `"Amigo BanCoppel"` then `"Bienvenido"` | Sliding indicator translates `0px` <-> `100%`; carousel slides `0%` <-> `-50%`. | Inspect tab `aria-selected` and track transform CSS. |
| **T1.04** | Header Scroll Collapse | Scroll dashboard panel past 24px | Header top row collapses (height 0); BanCoppel 3 dots reveal on left; Bell moves right. | Trigger scroll event `scrollTop = 30` on `.mb-scroll`; verify `BrandHeader` variant is `'collapsed'`. |
| **T1.05** | Login Form Validation | Submit with empty fields | Displays red alert message; inputs receive red border (`#DC2626`). | Click submit button; assert alert element with `role="alert"` exists. |
| **T1.06** | Login Form Submission | Fill user: `"1234 5678"`, pass: `"secret"` | Form calls `onSubmit` with cleaned user `"12345678"`. Button shows `"Ingresando…"`. | Trigger submit; assert mock callback args and button text. |
| **T1.07** | Quick Add (Manual) | Type `"Tacos 150"` -> Enter | Adds item to top: name `"Tacos"`, cat `'comida'`, amount `150`, status `'pending'`, date `'Hoy'`. Shows toast. | Assert `items[0]` properties and Toast rendered with 🍔. |
| **T1.08** | Auto-Categorization | Type `"Recibo Telmex"` | Detected category chip immediately shows `💡 Servicios`. | Query category chip text content while QuickAdd is focused. |
| **T1.09** | Payment Toggle | Click checkbox on item 2 (Luz CFE) | Status changes from `'pending'` to `'paid'`; checkmark renders; text crossed out; counter updates. | Click checkbox; assert `data-status="paid"` and line-through style. |
| **T1.10** | Card Deletion & Undo | Swipe card left past 60px / click delete | Card removed from list; Toast appears with `"Deshacer"`. Clicking `"Deshacer"` restores item at original index. | Call `deleteItem(item)`; verify removed; trigger `onAction()`; verify item restored. |
| **T1.11** | Reminder Setting | Click bell on item 3 -> select date -> Save | Shows success animation `"¡Listo!"`; card bell icon turns active blue. | Open `ReminderSheet`, trigger `onSave`, verify bell state. |
| **T1.12** | BalanceCard State A | View with 0 incomes | Title shows `"Gastado este mes"`, displays CTA banner `"¿Cuánto recibes al mes?"`. | Mount BalanceCard with empty incomes; assert stateKey `'A'`. |
| **T1.13** | Income Registration | Add income: Sueldo $10,000 Mensual | Income saved to `localStorage`; BalanceCard transitions from State A to State B (`"Te quedan"`). | Submit `IncomeSheet`; assert `mb:incomes:v1` updated and balance recalculated. |
| **T1.14** | Breakdown Drawer | Click `"Ver desglose"` | Drawer expands (`maxHeight: 9999`); displays category bars or income list. | Click toggle button; verify `maxHeight !== '0px'` and chevron rotated. |
| **T1.15** | Apartado Sheet | Trigger apartado suggestion -> click CTA | `ApartadoSheet` opens with expense name, frequency selector, and weekly share calculation. | Verify sheet open state and calculation: `Math.ceil(amount / f.n)`. |
| **T1.16** | Domiciliación Sheet | Trigger domiciliación suggestion -> click CTA | `DomiciliacionSheet` lists all domiciliary services with checkboxes and live total. | Verify service checklist and total aggregation. |
| **T1.17** | Tutorial Coach Marks | Navigate to dashboard with `tutorialSeen === false` | Spotlight renders overlay, step 1 card highlights document capture. Step through to completion. | Assert portal exists; click `"Siguiente"` 4 times; verify `tutorialSeen === true`. |

---

### 5.2. Tier 2: Boundary & Corner Cases

| Test ID | Scenario | Input / Condition | Expected Result | Verification Method |
|---|---|---|---|---|
| **T2.01** | Zero Amount Add | Concept: `"Café"`, Amount: `"$0"` | Submit is disabled (`canSave === false`). Item is not added. | Attempt submit; assert `items.length` unchanged. |
| **T2.02** | Negative / Non-numeric Amount | Input: `"-50abc"` into amount field | Input regex sanitizes value to `"50"`. Negative sign is stripped. | Fire change event with `"-50abc"`; assert input value is `"50"`. |
| **T2.03** | Very Long Expense Name | Concept with 100 characters | Card layout does not break; title truncates with ellipsis (`textOverflow: ellipsis`). | Check card title computed style `text-overflow: ellipsis` and `overflow: hidden`. |
| **T2.04** | Extreme Amount Formatting | Expense amount: `$99,999,999` | Currency formatter outputs `"$99,999,999"`; numbers do not wrap into separate lines. | Assert `fmt(99999999) === '$99,999,999'` and tabular nums preserved. |
| **T2.05** | Empty Expense List | User deletes all items in list | Renders centered empty message: `"Aún no registras gastos"`. App does not crash. | Set `items = []`; assert empty placeholder rendered. |
| **T2.06** | Income Exactly Equals Expenses | Total expenses = $5,000, Total income = $5,000 | Balance shows `$0 MXN`; State B/C handles zero balance without division by zero errors. | Set matching income/expense; assert calculated `pct === 100%`. |
| **T2.07** | Deficit State (State D) | Income = $5,000, Expenses = $8,000 | State D displays `"Diferencia del mes: $3,000 MXN"`, red pill, down arrow, and `"60% sobre tu ingreso"`. | Set expenses > income; assert State D texts and red color `#D93A3A`. |
| **T2.08** | Incomplete Swipe Gesture | Swipe card left by 35px (< 60px) and release | Card snaps back smoothly to `translateX(0px)`; item is NOT deleted. | Simulate touch sequence dx = -35; assert `swipeX` resets to 0 and item exists. |
| **T2.09** | Sheet Dismiss by Backdrop & ESC | Bottom sheet open -> click backdrop or press ESC | Sheet dismisses smoothly (`open = false`). | Dispatch `keydown` with `Escape` or click backdrop; assert sheet closed. |
| **T2.10** | LocalStorage Quota Exceeded | `localStorage.setItem` throws `QuotaExceededError` | Application catches error silently without unhandled exception crashing the UI. | Mock `localStorage.setItem` to throw; perform action; verify UI remains stable. |

---

### 5.3. Tier 3: Combinations & State Transitions

| Test ID | Multi-Step Scenario | Actions | Expected Result | Verification Method |
|---|---|---|---|---|
| **T3.01** | Expense Creation -> Payment -> Apartado Suggestion Flow | 1. Add recurring expense (`"Renta Depa $4000"`).<br>2. Toggle paid checkbox.<br>3. Wait 550ms.<br>4. Click `"Crear un apartado ›"`. | 1. Concept categorized as `hogar`.<br>2. Item marked paid.<br>3. Apartado suggestion banner appears.<br>4. `ApartadoSheet` opens with $4,000 divided across frequencies. | End-to-end component sequence test with fake timers. |
| **T3.02** | Reminder -> Domiciliación Suggestion Flow | 1. Tap bell on pending `"Luz CFE"`.<br>2. Save reminder.<br>3. Wait 450ms.<br>4. Click `"Domiciliar mis servicios ›"`. | 1. Reminder saved.<br>2. Domiciliación banner appears.<br>3. `DomiciliacionSheet` opens with Luz CFE pre-selected and live monthly sum. | End-to-end component sequence test with fake timers. |
| **T3.03** | Suggestion Opt-Out ("No me interesa") | 1. Trigger suggestion.<br>2. Click `"No me interesa"`.<br>3. Add/toggle another recurring expense. | 1. Suggestion closes.<br>2. `optOut` persisted as `true`.<br>3. Toast `"No te mostraremos más sugerencias"`.<br>4. Subsequent payments NEVER trigger suggestions. | Assert `optOut` in `localStorage`; toggle second item; assert no suggestion appears. |
| **T3.04** | Balance State Progression (A -> B -> C -> D) | 1. Start with State A ($0 income, $5,700 expenses).<br>2. Add income $20,000 (State B: 29% used).<br>3. Add expense $12,000 (State C: 88% used).<br>4. Add expense $5,000 (State D: 113% used, deficit). | State correctly transitions A -> B -> C -> D with proper labels, colors, and bar indicators at each step. | Multi-action state calculation test checking `stateKey` progression. |
| **T3.05** | Multiple Income Frequencies | Add 1 Quincenal ($5,000) + 1 Mensual ($3,000) | Total monthly income calculated as $(5,000 * 2) + 3,000 = $13,000. | Assert `totalIngresos === 13000`. |
| **T3.06** | Session Splash Re-entry | 1. Load app (splash plays).<br>2. Refresh / soft reload. | Second load immediately displays main UI without splash video delay. | Assert `splashDone === true` when `sessionStorage['splash-seen'] === '1'`. |

---

### 5.4. Tier 4: Real-World Scenarios & Expo Go Android Integration

| Test ID | Real-World Condition | Environment / Constraint | Expected Result | Verification Method |
|---|---|---|---|---|
| **T4.01** | Android Back Button Navigation | User opens a Bottom Sheet (e.g. `IncomeSheet`) and presses physical/virtual Android Back button | The bottom sheet closes (`sheet = null`); app does not exit to Android home screen. | In WebView, intercept Android `hardwareBackPress` in React Native shell and postMessage to close active sheet. |
| **T4.02** | Soft Keyboard Avoidance | User focuses on CLABE or Concept input with soft keyboard open | Keyboard does not cover active inputs or break fixed layout containers (`100dvh` / `window.innerHeight`). | WebView configured with `android:windowSoftInputMode="adjustResize"`; verify inputs scroll into view. |
| **T4.03** | Autonomous Local Bundle Serving | Android device in Airplane Mode (no Wi-Fi, no mobile data) | Expo Go loads the web app bundle and assets (video, fonts, images) completely from local origin without network errors. | Verify all asset URLs are relative (`./`) or served via local HTTP server (`localhost:PORT`); test with network disabled. |
| **T4.04** | Gesture Disambiguation | Vertical dashboard scrolling vs horizontal card swipe-to-delete | Diagonal touch movements do not accidentally delete cards; horizontal swipe requires deliberate dx < -60px. | Verify touch movement thresholding in `ExpenseCard`. |
| **T4.05** | High-DPI & Font Scaling | Android device with display density 2.5x - 3.5x and 120% font scaling | Text remains sharp, tabular numbers don't clip, card padding stays proportional. | Inspect WebView rendering on standard Android screen densities (hdpi, xhdpi, xxhdpi). |
| **T4.06** | Video Autoplay Policies in Android WebView | Android WebView default blocks media autoplay without user gesture | `react-native-webview` flags enable immediate autoplay: `mediaPlaybackRequiresUserAction={false}` and `allowsInlineMediaPlayback={true}`. | Confirm WebView props in Expo root component; verify video plays automatically on clean launch. |

---

## 6. Implementation Architecture Recommendations for R3

To fulfill Requirement R3 and pass Acceptance Criteria seamlessly:

1. **Asset Bundling & Relative Paths**:
   - The Vite build (`dist/`) must use `base: './'` so that all chunk imports, CSS assets, fonts, and the `splash.mp4` video are resolved relatively or from the local server origin without relying on external CDNs.
2. **WebView Configuration**:
   - The React Native WebView wrapper component must specify:
     ```tsx
     <WebView
       source={{ uri: localServerUri }} // or local html file
       javaScriptEnabled={true}
       domStorageEnabled={true}
       allowsInlineMediaPlayback={true}
       mediaPlaybackRequiresUserAction={false}
       originWhitelist={['*']}
       scalesPageToFit={true}
       bounces={false}
       overScrollMode="never"
     />
     ```
3. **Android Status Bar Harmonization**:
   - In `App.tsx`, `MiBolsillo` receives `showStatusBar={true}` by default.
   - On Android in Expo Go, configure Expo's native `<StatusBar style="light" backgroundColor="#05297A" translucent={false} />` to match BanCoppel Navy `#05297A`, avoiding layout collisions with the native Android notification shade.
4. **Hardware Back Button Handling**:
   - Bridge Android Back Button events via `BackHandler.addEventListener('hardwareBackPress', ...)` in the Expo root, messaging the WebView or executing history navigation.

---

## 7. Verification & Deliverable Sign-Off Checklist
- [x] Every screen and view documented (Splash, Bienvenido, Amigo BanCoppel).
- [x] Header, status bar, and segmented tab navigation transition detailed.
- [x] Quick add bar and full auto-categorization regex cataloged.
- [x] BalanceCard dynamic state computation (A, B, C, D) and breakdown drawer fully mapped.
- [x] All 5 bottom sheets and coach mark spotlight cataloged.
- [x] Persistence schema, key names, and initial mock datasets specified.
- [x] BanCoppel color hex codes, typography, layout dimensions, and easings recorded.
- [x] Comprehensive 4-Tier test suite articulated with specific verification commands and methods.
