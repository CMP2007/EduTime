## Bloque 6 — Frontend: arranque y orquestación

Revisión de `frontend/src/main.jsx` (montaje de React) y `frontend/src/App.jsx`
(contenedor/orquestador y modales globales).

### B6-1 · Sin Error Boundary (un error deja la pantalla en blanco)

`main.jsx` envuelve `<App/>` en `StrictMode`, pero **no** en un *Error Boundary*. Si cualquier
vista lanza durante el render, React desmonta todo el árbol y el usuario ve una pantalla en
blanco sin mensaje ni opción de recuperación.

**Mitigación:** añadir un *Error Boundary* (clase con `componentDidCatch`) o
`react-error-boundary` alrededor de las vistas.

**Resuelto:** nuevo `frontend/src/components/ErrorBoundary.jsx` (clase: React lo exige, los hooks
no cubren `componentDidCatch`; excepción documentada a "sin clases") con fallback en español
(`role="alert"` + botón "Recargar página"), envolviendo el `<main>` de `App.jsx` con `key={tab}`:
la cabecera y las pestañas siguen utilizables y **cambiar de pestaña reinicia el límite de error**.
Sin `react-error-boundary` (regla 1: sin dependencias innecesarias).
Tests: `frontend/test/components/ErrorBoundary.test.jsx`, verificado por mutación.

### B6-2 · Error de borrado no gestionado (se traga el fallo)

`App.jsx:49-59`, `handleConfirmDelete` tiene `try/finally` pero **sin `catch`**. Si
`sessionsApi.remove` falla, la promesa rechazada queda **sin manejar**: el diálogo no muestra
error, permanece abierto y no se informa al usuario.

**Mitigación:** capturar el error y mostrarlo (p. ej. pasarlo a `ConfirmDialog`), o notificar
con un aviso.

**Resuelto:** `handleConfirmDelete` (`App.jsx`) añade `catch` que guarda el mensaje en
`deleteError` y lo pasa al `ConfirmDialog` (nuevo prop `error`, pintado con `role="alert"`);
el diálogo queda **abierto** para reintentar o cancelar y el error se limpia al cancelar o al
volver a intentar (mismo patrón inline que `SessionForm`). Tests:
`frontend/test/App.test.jsx` y `frontend/test/components/ConfirmDialog.test.jsx`, verificados
por mutación.

### B6-3 · Sin enrutado/URL (recargar siempre vuelve a Inicio)

La pestaña activa es solo estado en memoria (`tab`). No hay router ni sincronización con la
URL: no se puede compartir un enlace a "Estadísticas" y recargar la página siempre vuelve a
Inicio. Tampoco hay navegación atrás/adelante entre pestañas.

**Mitigación:** sincronizar `tab` con `location.hash` o introducir un router ligero.

### B6-4 · `App` accede a la API directamente (mezcla capas)

`App.jsx` importa `sessionsApi` y llama a `create`/`update`/`remove` dentro de sus handlers,
mientras que las lecturas pasan por hooks. Mezcla orquestación de UI con acceso a datos.

**Mitigación:** centralizar las mutaciones en un hook/servicio de datos para que `App` solo
orqueste.

### B6-5 · Fecha cruda `YYYY-MM-DD` en el diálogo de borrado

El mensaje de `ConfirmDialog` interpola `toDelete.date` tal cual, en lugar de usar
`formatDateLong` como el resto de la app (inconsistencia de formato para el usuario).

**Mitigación:** formatear la fecha con `formatDateLong`.

---

