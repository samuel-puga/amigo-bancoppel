# Reporte de Inspección y Análisis Técnico (Survey)
**Proyecto**: amigo-coppel-mvp  
**Fecha de Inspección**: 2026-09-25  
**Explorador**: Explorer 1 (`explorer_survey_1`)  
**Objetivo**: Inspección exhaustiva de la aplicación web React+Vite existente en `c:/Users/Zam/amigo-coppel-mvp` para su empaquetado y ejecución en Android mediante Expo Go con `react-native-webview`.

---

## 1. Análisis de Configuración, Dependencias y Scripts de Construcción

### 1.1 `package.json`
- **Nombre del proyecto**: `figma-make-app` (versión `1.0.0`, `"type": "module"`).
- **Dependencias de Producción (`dependencies`)**:
  - `react`: `^19.0.0` (instalado: `19.2.4`)
  - `react-dom`: `^19.0.0` (instalado: `19.2.4`)
- **Dependencias de Desarrollo (`devDependencies`)**:
  - `vite`: `^8.0.5` (instalado: `8.0.5`)
  - `@vitejs/plugin-react`: `^6.0.0` (instalado: `6.0.1`)
  - `tailwindcss`: `^4.0.0` (instalado: `4.2.2`)
  - `@tailwindcss/vite`: `^4.0.0` (instalado: `4.2.2`)
  - `typescript`: `^5.7.0` (instalado: `5.9.3`)
  - `@types/react`: `^19.0.0` (instalado: `19.2.14`)
  - `@types/react-dom`: `^19.0.0` (instalado: `19.2.3`)
  - `@types/node`: `^22.0.0` (instalado: `22.19.17`)
  - `oxfmt`: `^0.2.0`
- **Scripts definidos**:
  - `"dev": "vite"`
  - `"build": "vite build"`
  - `"preview": "vite preview"`
  - `"format": "oxfmt"`

### 1.2 Entorno de Ejecución del Sistema Host
- **Node.js**: `v24.21.0`
- **Gestores de paquetes**: `npm` 11.19.0, `pnpm` 12.6.0.
- **Hallazgo Crítico de Windows PowerShell**: La directiva de ejecución (`ExecutionPolicy`) de PowerShell en este sistema bloquea los scripts `.ps1` (`npm.ps1`, `pnpm.ps1`). Cualquier comando ejecutado en terminal debe invocar explícitamente `npm.cmd` o `npx.cmd` para evitar errores `SecurityError: UnauthorizedAccess`.
- **Configuración Mise (`.mise.toml`)**:
  - `node = "22"`
  - `"npm:pnpm" = "10.34.3"`

### 1.3 `vite.config.ts`
- **Base URL**:
  - Línea 15: `base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/'`
  - Por defecto compila con rutas absolutas (`/`).
- **Plugins integrados**:
  - `react()` (`@vitejs/plugin-react`)
  - `tailwindcss()` (`@tailwindcss/vite` v4)
  - `figmaSiteConfiguration()`: Inyecta metadatos desde `.figma/make/site.json` (`title: "Figma Make App"`, description, robots `noindex, nofollow`, reemplaza tags comentados `<!-- figma:lang -->`, etc.).
  - `figmaErrorOverlayReplay()`, `figmaReactRefreshBoundaryFallback()`, `figmaMakeKitPlugin()`: Plugins auxiliares dev-only (`apply: 'serve'`) para entornos Figma Make.
- **Alias de resolución**:
  - Líneas 29–31: `'@': path.resolve(__dirname, './src')`
- **Servidor Dev / Preview**:
  - `host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0'`
  - `port: parseInt(process.env.PORT || '8443')`
  - `strictPort: true`

### 1.4 `tsconfig.json`
- Target: `ES2020`, lib: `["ES2020", "DOM", "DOM.Iterable"]`, module: `ESNext`, moduleResolution: `bundler`.
- Alias `'@/*'` mapeado a `./src/*`.
- Strict mode activo, `noEmit: true`, JSX configurado en `react-jsx`.

---

## 2. Estructura de Código Fuente, Vistas, Rutas y Componentes

### 2.1 Puntos de Entrada
1. **`index.html`** (líneas 1–17):
   - Shell HTML con `<div id="root"></div>`.
   - Viewport: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`.
   - Script de entrada: `<script type="module" src="/src/main.tsx"></script>`.
2. **`src/main.tsx`** (líneas 1–11):
   - Importa `React`, `ReactDOM`, `./App` y `./index.css`.
   - Monta `<App />` en `document.getElementById('root')` bajo `<React.StrictMode>`.
3. **`src/index.css`** (líneas 1–3):
   - Carga fuentes tipográficas vía red: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600&display=swap');`
   - Importa Tailwind CSS v4: `@import 'tailwindcss';`

### 2.2 Componente Principal (`src/App.tsx`)
- **SplashScreen (`SplashScreen`, líneas 6–50)**:
  - Importa video: `import splashVideo from './mi-bolsillo/assets/splash.mp4'`.
  - Contenedor con `position: 'absolute', inset: 0, zIndex: 9999, background: '#05297A'`.
  - Elemento `<video>` con `muted`, `playsInline`, `objectFit: 'cover'`.
  - Autoplay en `useEffect` con fallback inmediato: `v.play().catch(() => finish())`. Si el navegador/WebView bloquea el autoplay, salta directamente al contenido.
  - Al terminar (`onEnded`), realiza un fade-out de 500ms y llama `onDone`.
- **Persistencia del Splash**:
  - `sessionStorage.getItem('splash-seen') === '1'` (línea 54). Al reproducirse una vez por sesión, guarda `'splash-seen' = '1'`.
- **Envolvente del Layout**:
  - Contenedor exterior: `minHeight: '100dvh'`, centrado flexbox, fondo azul marino oscuro `#0A1A4A`.
  - Marco del teléfono: `position: 'relative'`, `width: '100%'`, `maxWidth: 430`, `height: '100dvh'`, `maxHeight: 900`, `overflow: 'hidden'`.
  - Renderiza `<MiBolsillo showStatusBar={true} trashMode="hover" />`.

### 2.3 Arquitectura y Navegación de Vistas (`src/mi-bolsillo/MiBolsillo.jsx`)
No utiliza una librería de enrutamiento externa como `react-router` o `expo-router`; implementa una navegación por estado interno `tab`:
1. **`tab === 'login'` ("Bienvenido")**:
   - Componente `LoginForm` (`src/mi-bolsillo/components.jsx:96–145`):
     - Formulario de inicio de sesión con inputs para número de cliente/CLABE y contraseña.
     - Botón para mostrar/ocultar contraseña.
     - Botones de acción secundaria: "Olvidaste tu contraseña", "Crear cuenta nueva", "Ver nuestros productos".
2. **`tab === 'bolsillo'` ("Amigo BanCoppel")**:
   - Panel de control y gestión presupuestaria con transición fluida horizontal (`width: '200%'`, `transform: onB ? 'translateX(-50%)' : 'translateX(0)'`, `transition: 'transform .38s cubic-bezier(.2,.8,.2,1)'`).
   - Contenido scrolleable (`mb-scroll`) con colapso dinámico del header al hacer scroll hacia abajo (`scrollTop > 24`).

### 2.4 Componentes Principales (`src/mi-bolsillo/components.jsx` y `BalanceCard.jsx`)
- **`StatusBar`**: Barra de estado simulada (reloj 9:41, señal de red, wifi, icono de batería en SVG).
- **`BrandHeader`**: Barra superior con logotipo en PNG, botón de notificaciones/recordatorios y selector de pestañas ("Bienvenido" y "Amigo BanCoppel"). Al hacer scroll, se compacta con animación de alto y padding.
- **`QuickAddBar`**: Barra de registro rápido de gastos:
  - Input para concepto con motor de categorización automática por palabras clave (`autoCat` regex en línea 148: Netflix -> suscripciones, CFE -> servicios, Walmart -> despensa, etc.).
  - Input para importe monetario y botón `+`.
  - Botones secundarios interactivos con íconos: "Foto de ticket" (con badge "Se llena solo") y "Estado de cuenta" (con badge "Subir PDF").
- **`BalanceCard` (`src/mi-bolsillo/BalanceCard.jsx`)**:
  - Gestión y visualización de ingresos del usuario (`mb:incomes:v1`).
  - Tarjeta de balance total (Ingresos vs Gastos).
  - Hoja modal `IncomeSheet` montada vía portal (`createPortal(..., document.body)`) para registrar/editar ingresos (Sueldo, Freelance, Negocio, Otro; Única, Quincenal, Mensual).
  - Gráfica de barras de desglose por categoría (`SpendingChart`).
- **`ExpenseListCard` & `ExpenseCard`**:
  - Listado de gastos clasificados por estado: Pendientes (`pending`), Pagados (`paid`), y Vencidos (`overdue`).
  - Checkbox interactivo para marcar gasto como pagado con retroalimentación sonora/visual y sugerencia automática de apartado.
  - Campana para activar/desactivar recordatorio con apertura de `ReminderSheet` (montada vía portal a `document.body`).
  - Eliminación con deslizamiento y opción de deshacer en toast.
- **Sugerencias Inteligentes Integradas (Cross-selling BanCoppel)**:
  - **Sugerencia TDC para Suscripciones**: Ofrece domiciliar con Tarjeta de Crédito BanCoppel.
  - **Sugerencia Apartado**: Al pagar un servicio recurrente, sugiere crear un apartado en Cuenta Digital BanCoppel.
  - **Sugerencia Domiciliación**: Al marcar recordatorio en servicios, sugiere domiciliación automática.
- **Hojas Inferiores (Bottom Sheets)**:
  - `IntroSheet`: Información de bienvenida a Mi Bolsillo (privacidad local, sin registro).
  - `ApartadoSheet`: Simulador de aportaciones periódicas (semanal, quincenal, mensual) para cubrir gastos recurrentes.
  - `DomiciliacionSheet`: Selector de servicios para domiciliar en paquete a Tarjeta de Crédito BanCoppel.
- **`Toast`**: Notificación flotante inferior animada con barra de progreso temporizada (4000ms a 5000ms) para acciones como gasto guardado o eliminación revertible.
- **`TutorialSpotlight`**: Recorrido guiado de 4 pasos con máscara oscura tipo spotlight (`boxShadow: 0 0 0 9999px ...`) que mide dinámicamente las coordenadas del DOM (`getBoundingClientRect()`) y resalta QuickAdd, Foto ticket, Balance y Lista de gastos.

---

## 3. Catálogo de Recursos y Assets

| Recurso | Tipo | Ubicación en Disco | Tamaño | Cómo se importa / referencia |
|---|---|---|---|---|
| **Video Splash** | Video MP4 | `src/mi-bolsillo/assets/splash.mp4` | 807,239 B (~807 KB) | `import splashVideo from './mi-bolsillo/assets/splash.mp4'` en `src/App.tsx:4` |
| **Logotipo BanCoppel** | Imagen PNG | `src/mi-bolsillo/assets/bancoppel-logo-white.png` | 9,619 B (~9.6 KB) | `import logoWhite from './assets/bancoppel-logo-white.png'` en `src/mi-bolsillo/components.jsx:4` |
| **Íconos de Categoría** | Emojis Unicode | Definidos en `src/mi-bolsillo/data.js` | N/A | Objeto `CATS`: 🍔 Comida, 💡 Servicios, 🎬 Ocio, 🚗 Transporte, 🛒 Despensa, 💊 Salud, 📱 Suscripciones, 🏠 Hogar |
| **Íconos de Interfaz** | SVG Inline | `src/mi-bolsillo/components.jsx` y `BalanceCard.jsx` | N/A | Componentes funcionales React (`BellIcon`, `CloseIcon`, `CheckIcon`, iconos de batería/wifi, cámara, calendario, etc.) |
| **Tipografías** | Web Fonts | Google Fonts CDN | N/A | `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600&display=swap')` en `src/index.css:1` |
| **Estilos Globales** | CSS | `src/index.css` | 144 B | Importado en `src/main.tsx:4` (`@import 'tailwindcss';`) |
| **Estilos Específicos** | CSS | `src/mi-bolsillo/mi-bolsillo.css` | 873 B | Importado en `src/mi-bolsillo/MiBolsillo.jsx:8` |

> **Nota sobre archivos en `src/assets/` y `src/imports/`**:
> - `src/assets/img[1-6].png`: Son archivos residuales de texto/código renombrados con extensión `.png` provenientes de una exportación previa de Figma Make. **No son utilizados ni importados** por ningún archivo del código activo.
> - `src/imports/`: Contiene una copia previa/backup de los archivos de `mi-bolsillo`. Ningún archivo de la aplicación importa desde esta carpeta.

---

## 4. Gestión del Estado y Persistencia de Datos

La aplicación utiliza dos mecanismos de almacenamiento web para garantizar que el prototipo conserve todos los datos sin necesidad de backend:

### 4.1 `sessionStorage`
- **Clave**: `'splash-seen'`
- **Propósito**: Registra si el video de splash ya fue visualizado durante la sesión activa del navegador (`App.tsx:54–58`). Si es `'1'`, se omite el video en recargas subsecuentes de la misma sesión.

### 4.2 `localStorage`
Implementado a través de dos hooks de sincronización reactiva:
1. `usePersistentState(key, initial)` en `src/mi-bolsillo/MiBolsillo.jsx:10–16`:
   - Lee de `localStorage.getItem(key)` en el montaje; escribe vía `useEffect` con `JSON.stringify(value)` cada vez que el estado cambia.
   - Envuelto en bloques `try/catch` para mitigar bloqueos o almacenamiento lleno.
2. `usePersist(key, init)` en `src/mi-bolsillo/BalanceCard.jsx:31–37`:
   - Mismo patrón para los ingresos del usuario.

### 4.3 Claves Almacenadas en `localStorage`
- **`mi-bolsillo:v3:items`**: Array de objetos de gastos (`id`, `name`, `cat`, `amount`, `date`, `status`, `reminder`, `orig`, `dueToday`, `isNew`). Inicializado con `INITIAL_ITEMS` (4 gastos iniciales: Netflix, Luz CFE, Despensa Walmart, Renta).
- **`mi-bolsillo:v3:introSeen`**: Booleano. Indica si la hoja informativa introductoria ya fue vista (inicial: `true`).
- **`mi-bolsillo:v3:tutorialSeen`**: Booleano. Controla si se dispara el tutorial onboarding (`TutorialSpotlight`) de 4 pasos al entrar por primera vez a la pestaña "Amigo BanCoppel" (inicial: `false`).
- **`mi-bolsillo:v3:optOut`**: Booleano. Si es `true`, el usuario desactivó las sugerencias comerciales de BanCoppel (inicial: `false`).
- **`mi-bolsillo:v3:dismissedTDC`**: Array de IDs de gastos descartados para la recomendación de TDC (inicial: `[]`).
- **`mb:incomes:v1`**: Array de objetos de ingresos (`id`, `tipo`, `monto`, `frecuencia`, `nombre`) manejados por `BalanceCard.jsx` (inicial: `[]`).

---

## 5. Inspección del Proceso y Salida de Compilación (`npm run build`)

Al ejecutar `npm run build` (`vite build`), Vite genera la siguiente estructura en la carpeta `dist/`:

```
dist/
├── robots.txt                                  0.02 kB
├── index.html                                  0.91 kB
└── assets/
    ├── bancoppel-logo-white-BlWxxP3_.png        9.61 kB
    ├── splash-B73liuBk.mp4                    807.23 kB
    ├── index-CNYmMtR8.css                      10.64 kB
    └── index-CF7Cgnm0.js                      264.14 kB
```

### 5.1 Hashing de Assets
Vite asigna hashes de contenido únicos de 8 caracteres alfabéticos a cada asset (ej. `-BlWxxP3_`, `-B73liuBk`, `-CNYmMtR8`, `-CF7Cgnm0`).

### 5.2 Rutas Absolutas vs Relativas
- **Compilación Estándar (`base: '/'`)**:
  - En `dist/index.html`:
    - `<script type="module" crossorigin src="/assets/index-CF7Cgnm0.js"></script>`
    - `<link rel="stylesheet" crossorigin href="/assets/index-CNYmMtR8.css">`
  - En el código compilado JS:
    - Las referencias al video y al logo se resuelven como rutas absolutas raíz: `"/assets/splash-B73liuBk.mp4"` y `"/assets/bancoppel-logo-white-BlWxxP3_.png"`.
  - **Impacto**: Si se intenta cargar `dist/index.html` bajo el protocolo `file:///`, estas rutas absolutas fallan catastróficamente porque apuntan a la raíz del sistema de archivos (`file:///assets/...`).
- **Compilación con Base Relativa (`vite build --base=./`)**:
  - En `dist/index.html`:
    - `<script type="module" crossorigin src="./assets/index-B3Cn4qLM.js"></script>`
    - `<link rel="stylesheet" crossorigin href="./assets/index-CNYmMtR8.css">`
  - En el código compilado JS:
    - Las referencias a recursos utilizan resolución dinámica relativa a la URL del módulo: `new URL('splash-B73liuBk.mp4', import.meta.url).href`.

---

## 6. Obstáculos y Riesgos Críticos al Empaquetar/Servir en Expo Go con `react-native-webview`

### Obstáculo 1: Restricciones Nativas de Expo Go (Sin Módulos Nativos Personalizados)
- **Problema**: Expo Go es un cliente precompilado que solo soporta la API estándar de Expo y paquetes de la SDK compatible. Librerías tradicionales de Node/React Native para montar servidores HTTP locales en el dispositivo (tales como `react-native-http-bridge`, `react-native-static-server` o servidores C/Rust embebidos) **NO funcionan en Expo Go** porque requieren código nativo que no está compilado en Expo Go.
- **Alternativas Viables**:
  1. **Servidor HTTP Local en Host con Auto-detección**: En el entorno Expo, el servidor Metro ya corre en la máquina de desarrollo (o se puede correr un servidor estático concurrente en el host). La app móvil en Expo Go puede detectar automáticamente la IP del host mediante `Constants.expoConfig?.hostUri` o `process.env.EXPO_PUBLIC_*`, cargando la build a través de HTTP (`http://<LAN_IP>:<PORT>`) sin que el usuario configure IPs manualmente en pantalla.
  2. **Single-file Inlining en Memoria (`source={{ html }}`)**: Compilar o empaquetar el bundle web en un único string HTML embebido (con CSS y JS incrustados) y alimentarlo al WebView con `<WebView source={{ html: inlineHtmlContent, baseUrl: 'https://localhost' }} />`. Esto elimina cualquier dependencia de red y corre 100% offline dentro de Expo Go. Para el video de 807 KB, se puede referenciar en base64 o cargar vía `expo-asset` / servidor local.
  3. **Metro Middleware / Servidor de Desarrollo**: Configurar Metro o un script de inicio conjunto que sirva la carpeta `dist/` en una ruta estática servida por el propio puerto de desarrollo de Expo.

### Obstáculo 2: Bloqueo de Autoplay del Video en Android WebView
- **Problema**: El WebView de Android bloquea por defecto la reproducción automática de elementos HTML5 `<video>` sin interacción física táctil previa del usuario (`UserGestureIndicator`). En `src/App.tsx`, el `v.play().catch(() => finish())` capturará el error de autoplay y finalizará el splash screen de inmediato, haciendo que el video nunca se reproduzca en la demo.
- **Solución requerida en `react-native-webview`**:
  - `mediaPlaybackRequiresUserAction={false}`
  - `allowsInlineMediaPlayback={true}`

### Obstáculo 3: Desactivación por Defecto de `localStorage` y `sessionStorage` en Android WebView
- **Problema**: Por especificación de Android WebView, el almacenamiento DOM (`domStorage`) está desactivado por omisión. Si se instancia `<WebView />` sin configuración explícita, `localStorage.getItem` y `setItem` fallarán o lanzarán `SecurityError`, provocando que los gastos agregados, ingresos y el tutorial spotlight no persistan entre reinicios de la app.
- **Solución requerida en `react-native-webview`**:
  - `domStorageEnabled={true}`
  - `javaScriptEnabled={true}`

### Obstáculo 4: Restricciones de CORS en Protocolo `file:///` con Módulos ES
- **Problema**: Si se intenta cargar `dist/index.html` directamente desde el sistema de archivos local (`file:///android_asset/...` o carpeta de caché de Expo), el motor Chromium de Android WebView bloquea los scripts `<script type="module">` por políticas de Same-Origin en `file://`.
- **Solución**: Servir los archivos mediante protocolo HTTP (servidor estático local auto-descubierto) o mediante `source={{ html: ... }}` con `baseUrl: 'http://localhost'`.

### Obstáculo 5: Duplicidad de Barras de Estado (Android Native vs Web 9:41)
- **Problema**: `MiBolsillo` renderiza por defecto una barra de estado falsa (hora 9:41, batería, wifi) cuando `showStatusBar={true}` (establecido en `App.tsx:78`). Si la aplicación Android en Expo Go muestra la barra de estado del sistema operativo, el usuario verá dos barras de estado superpuestas.
- **Solución**: En Expo Android, se puede ocultar la barra nativa mediante `<StatusBar hidden />` de `expo-status-bar` para una presentación full-screen limpia y congruente con el diseño web original, o ajustar `showStatusBar={false}`.

### Obstáculo 6: Proporciones de Pantalla y Contenedor Máximo (Letterboxing)
- **Problema**: En `src/App.tsx` (líneas 63–81), el contenedor tiene `maxWidth: 430px`, `maxHeight: 900px` con un fondo exterior azul oscuro `#0A1A4A`. En dispositivos Android modernos con pantallas más anchas o con ratios de aspecto 20:9 (más de 900px de altura), pueden aparecer barras azules en los bordes.
- **Solución**: Asegurar que para la vista móvil en WebView, el contenedor ocupe el 100% del viewport del dispositivo sin restricciones artificiales de `maxHeight: 900`.

### Obstáculo 7: Dependencia de Fuentes Externas (Google Fonts)
- **Problema**: `Inter` y `Poppins` se descargan desde `https://fonts.googleapis.com`. Si el dispositivo móvil carece de acceso a internet en el momento de la demo, las fuentes recurrirán a la fuente del sistema (Roboto).
- **Solución**: Verificar conectividad a internet o incluir las fuentes WOFF2 locales si se requiere autonomía 100% offline.

---

## 7. Conclusión y Recomendación para la Siguiente Fase

La aplicación React+Vite existente está completamente contenida, libre de dependencias de backend externas para su lógica esencial (toda la persistencia y reglas de negocio residen en React y `localStorage`), y compila velozmente en ~500ms.

Para la fase de implementación de la app Expo Android con `react-native-webview`, la arquitectura recomendada es:
1. Una aplicación Expo configurada para Android compatible con Expo Go.
2. Un componente `<WebView />` con los flags indispensables configurados (`domStorageEnabled={true}`, `mediaPlaybackRequiresUserAction={false}`, `allowsInlineMediaPlayback={true}`, `javaScriptEnabled={true}`).
3. Un mecanismo de entrega local robusto: servir la build de producción (`dist/`) mediante un servidor HTTP local que resuelva dinámicamente la IP del host de desarrollo a través de `Constants.expoConfig?.hostUri`, garantizando arranque inmediato, compatibilidad con reproducción de video MP4 y persistencia total sin configuración manual.
