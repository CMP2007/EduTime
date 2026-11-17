## Bloque 7 — Frontend: red y datos

Revisión de `frontend/src/api/client.js` (fetch genérico), `sessions/sessions.api.js`,
`stats/stats.api.js` (endpoints) y los hooks `useSessions.js` / `useStats.js` (estado de carga).

### B7-1 · `request` pierde el código de estado HTTP

`client.js:13-14` lanza `new Error(data.error || '...')`: solo conserva el **mensaje**, no el
`status`. El consumidor no puede distinguir un `404` de un `400`/`500` para reaccionar
distinto (p. ej. mostrar "no encontrado" frente a "error de red").

**Mitigación:** lanzar un error con `status` (clase propia o `error.status = response.status`).

**Resuelto:** clase `ApiError extends Error` con `status`, en su propio archivo
`frontend/src/api/ApiError.js`; `request` la lanza con el `status` de la respuesta. Los
consumidores actuales no cambian (usan `.message`) pero ya pueden distinguir 400/404/500.
Test: `frontend/test/api/client.test.js` (con `fetch` simulado), verificado por mutación.

### B7-2 · Sin cancelación ni orden de respuestas (race en los hooks)

`useSessions`/`useStats` no usan `AbortController` ni comprueban el orden de las respuestas. Si
dos recargas se solapan, una respuesta lenta puede **pisar** a una más nueva; además, se hace
`setState` sobre componentes ya desmontados. (Relacionado con **B0-5**.)

**Mitigación:** `AbortController` y/o descartar respuestas fuera de orden.

**Parcialmente resuelto (2026-11-17):** `useSessions`, `useStats` y `useThemes` ya descartan las
respuestas fuera de orden con `requestIdRef`. Evidencia:
`frontend/test/sessions/useSessions.test.jsx` (una respuesta antigua que llega tarde no pisa a la
nueva), verificado por mutación. Queda pendiente la **cancelación** de la petición en vuelo
(`AbortController`), que se abordará con B7-3 y B7-4.

### B7-3 · Merge de cabeceras frágil (`Content-Type` se puede borrar)

En `client.js:5-8` el orden `{ headers: {...}, ...options }` hace que, si un llamador pasa su
propio `headers`, se reemplace el objeto entero y se **pierda** `Content-Type`. Hoy ningún
llamador lo hace, pero es una trampa latente.

**Mitigación:** fusionar cabeceras explícitamente
(`headers: { 'Content-Type': '...', ...options.headers }`).

### B7-4 · `Content-Type` enviado también en peticiones `GET`

Se añade la cabecera `Content-Type` a todas las peticiones, incluidas las `GET` (que no tienen
cuerpo). Es inocuo, pero innecesario.

**Mitigación:** añadir la cabecera solo cuando hay body.

---

