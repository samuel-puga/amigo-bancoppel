# Mi Bolsillo v3 · React

Versión 3 del prototipo: header compacto al hacer scroll + sugerencias BanCoppel (apartados y domiciliación con TDC).

## Archivos
- `MiBolsillo.jsx` — componente principal: estado, navegación y reglas de sugerencias.
- `components.jsx` — piezas de UI: BrandHeader, LoginForm, QuickAddBar, SpendingChart, ExpenseCard, Toast, Sheet (whats-new-sheet), IntroSheet, ApartadoSheet, DomiciliacionSheet.
- `data.js` — colores, categorías, datos de ejemplo y formato de moneda.
- `mi-bolsillo.css` — placeholders, scrollbars, estados :active/:focus y movimiento reducido.
- `assets/bancoppel-logo-white.png` — logotipo (recortado de captura; sustituir por SVG oficial).

## Uso
```jsx
import MiBolsillo from './mi-bolsillo-v3/MiBolsillo';

<div style={{ height: '100dvh' }}>
  <MiBolsillo
    showStatusBar={false}
    onLogin={async ({ user, pass }) => api.login(user, pass)}
    onOpenAccount={({ item, freq, perPayment }) => router.push('/cuenta-digital')}
    onApplyCard={services => router.push('/tdc/solicitud')}
  />
</div>
```
Requiere React 18+ y un bundler que importe CSS e imágenes (Vite, CRA, Next.js). Fuentes: Inter y Poppins (Google Fonts).

## Reglas de sugerencias
- **Apartado**: al marcar como pagado un gasto de Servicios, Suscripciones u Hogar.
- **Domiciliación**: al activar el recordatorio de un Servicio o Suscripción pendiente.
- Máximo una de cada tipo por sesión; nunca en gastos vencidos.
- "No me interesa" las apaga (persistido en `localStorage`).

## Pendientes para producción
- Los gastos se guardan en `localStorage`; en app nativa usar almacenamiento seguro del dispositivo.
- `EARLIER` y `INITIAL_ITEMS` son datos de ejemplo; iniciar con `[]`.
- Textos de apartados y crédito pendientes de validación legal.
