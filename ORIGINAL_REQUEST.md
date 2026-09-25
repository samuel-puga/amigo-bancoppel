# Original User Request

## 2026-09-25T14:10:08Z

Convertir la aplicación web React+Vite existente en una aplicación Android ejecutable en Expo Go mediante un WebView wrapper que sirva la build localmente, preservando el 100% de la interfaz visual e interactiva para una presentación demo ante público.

Working directory: c:/Users/Zam/amigo-coppel-mvp
Integrity mode: demo

## Requirements

### R1. Aplicación Expo Android con WebView
Configurar el entorno de Expo para Android con react-native-webview asegurando arranque inmediato y compatibilidad total con Expo Go.

### R2. Servidor o Empaquetado Local Autónomo
Empaquetar o servir localmente la build de producción de la aplicación web existente (dist/ o bundle local) dentro del entorno de la aplicación móvil, de modo que el WebView cargue de forma autónoma sin depender de configuración manual de red en cada ejecución.

### R3. Preservación Total de la Experiencia e Interactividad Demo
Mantener intacto el aspecto visual original: video de splash screen, navegación fluida entre "Bienvenido" y "Amigo BanCoppel", registro de gastos, tarjetas interactivas, sheets inferiores y persistencia de datos en el dispositivo.

## Acceptance Criteria

### Ejecución en Expo Go
- [ ] La aplicación compila e inicia sin errores mediante el comando de Expo (npx expo start).
- [ ] La app es escaneable y corre en Expo Go en un dispositivo o emulador Android sin errores de bundling ni pantallas en blanco.

### Fidelidad Visual y Funcional
- [ ] La interfaz en Android coincide al 100% con la versión web original (layout, fuentes, colores BanCoppel y proporciones).
- [ ] El splash screen con video se reproduce y transiciona al contenido principal.
- [ ] Las interacciones clave (cambio de tabs, formulario, agregar gasto rápido, toggles de estado pagado y sheets) operan sin fallos.
