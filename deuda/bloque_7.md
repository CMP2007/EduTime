## Bloque 9 — Frontend: feature Historial

Revisión de `frontend/src/sessions/*` (`HistoryView`, `SessionFilters`, `SessionForm`,
`SessionList`, `SessionRow`).

### B9-1 · Validación de dominio duplicada en `SessionForm` (refuerza B0-1)

`SessionForm.jsx:6-8` redefine `TITLE_MAX = 80`, `NOTES_MAX = 500` y `MIN_DURATION = 15`, las
mismas reglas que valida el backend (`sessions.service.js`). Al no compartir fuente, ambas
capas pueden divergir sin que nada avise.

**Mitigación:** compartir las reglas desde un módulo común.

### B9-2 · Búsqueda sin `debounce` (una petición por pulsación)

`SessionFilters` → `HistoryView.filters` → `useSessions`: cada tecla en "Buscar" cambia `q`,
`reload` cambia y el `useEffect` dispara una petición. Escribir "Matemáticas" son ~11 llamadas.

**Mitigación:** `debounce` (o búsqueda al enviar).

### B9-3 · Límite de duración: el mensaje no coincide con el máximo real (front y back sí coinciden)

> **Corrección (auditoría del código):** una lectura previa afirmaba que el front permitía
> 23h59m y el backend solo 23h. **Es incorrecto.** `SessionForm.jsx` limita a `max="23"` h y
> `max="59"` m, y el backend calcula `DURATION_MAX = HOURS_MAX * 60 + MINUTES_MAX = 1439` min
> (23h 59m). **Ambas capas coinciden**; no hay inconsistencia de límites.

Lo que sí queda como debilidad:

- El mensaje de error del backend (`sessions.service.js:30`) dice "no puede superar las 23
  horas", pero en realidad admite hasta 23h 59m: el texto no describe el límite real.
- `SessionForm.jsx:59` **solo** valida el mínimo en JS; el máximo se delega al atributo HTML
  `max`, no a una comprobación explícita. Si ese atributo se saltara (navegador permisivo,
  pegado, scripts), el cliente no lo detectaría.

**Mitigación:** alinear el texto del mensaje con el límite real (o cambiar el límite) y validar
el máximo también en JavaScript.

### B9-4 · Mensajes de error del formulario sin rol accesible

`SessionForm.jsx:143` pinta `<p className="error">` sin `role="alert"` ni `aria-describedby`
asociado al campo. Los lectores de pantalla pueden no anunciar el error.

**Mitigación:** `role="alert"` y asociar el mensaje al campo.

### B9-5 · Filtros `from`/`to` sin comprobar rango invertido

`SessionFilters` permite elegir `from > to`; la lista queda vacía sin explicar por qué. Mismo
vacío de validación de fechas que **B3-2** / **B4-4**, ahora en el cliente.

**Resuelto (2026-11-10, `specs/004-validacion-fechas/`):** `useSessions` calcula
`hasInvertedRange` solo cuando ambos extremos son fechas válidas; en ese caso invalida la
petición en vuelo, no consulta la API, termina `loading` y conserva listado y error.
`HistoryView` muestra un `StatusNotice` (`role="status"`, clase `.notice`) y oculta el error
anterior mientras el rango siga invertido. Un filtro mal formado no activa la guarda: la API lo
rechaza con 400. Tests: `frontend/test/sessions/HistoryView.test.jsx`.

### B9-6 · `Number(...) || 0` enmascara entradas inválidas del formulario

`SessionForm.jsx:69-70` usa `Number(form.hours) || 0` (mismo patrón que **B8-5**).

**Mitigación:** validar la entrada en vez de asumir `0`.

---

