## Bloque 8 — Frontend: utilidades y componentes base

Revisión de `frontend/src/utils/time.js`, `frontend/src/utils/date.js` y los componentes
`frontend/src/components/{Card,Modal,ConfirmDialog,Tabs}.jsx`.

### B8-1 · Formateadores de fecha sin validar (producen `Invalid Date`)

`fromDateString` (`date.js:18-21`) construye un `Date` a partir de un string sin comprobar su
formato. Con un valor mal formado, el `Date` queda inválido y `formatDateLong` devuelve texto
con `NaN` ("NaN undefined NaN") **sin lanzar error**. Es el mismo patrón de validación de fechas
ausente que en **B3-2** y **B4-4**.

**Resuelto (2026-11-10, `specs/004-validacion-fechas/`):** `fromDateString` devuelve `null` con
valores inválidos; `formatDateLong`, `formatDateShort` y `formatDateRange` devuelven `''` (si
falla cualquiera de los extremos, todo el rango queda vacío) y `weekdayIndex` devuelve `null`.
`ActivityHeatmap` filtra los días inválidos antes de `buildColumns`, sin inventar el lunes.
Tests: `frontend/test/utils/date.test.js` y `frontend/test/stats/ActivityHeatmap.test.jsx`.

### B8-2 · `Modal` sin focus trap, sin restaurar foco ni bloquear scroll

El `Modal` cierra con Escape y clic en el fondo, pero **no atrapa el foco** (se puede tabular
fuera), **no devuelve el foco** al elemento que lo abrió al cerrarse y **no bloquea el scroll**
del fondo. Funciona visualmente, pero es incompleto en accesibilidad.

**Mitigación:** focus trap (o librería de diálogos), restaurar foco al cerrar y `overflow` del
`body`.

**Resuelto (22/10/2026, spec `specs/001-modal-accesible/`):** `Modal` enfoca al abrir el primer
campo editable, si no el primer botón del cuerpo y, si no, el contenedor; atrapa Tab/Shift+Tab
(saltando deshabilitados y `[hidden]`); al desmontar devuelve el foco al disparador o, si ya no
existe, a `main` (`tabIndex={-1}`); bloquea el scroll del `body` y restaura el `overflow` previo;
y el fondo ya **no** cierra el diálogo. Se retiró el `autoFocus` de `SessionForm` para que la
regla viva solo en `Modal`. Sin dependencias nuevas. Tests: `frontend/test/components/Modal.test.jsx`
(15 casos), verificados por mutación (foco inicial, trampa, restauración, fallback, scroll y
cierre por fondo e interior).

### B8-3 · `goalProgress` sin límite inferior (acepta negativos)

`time.js:27-29` hace `Math.min(100, Math.round((minutes || 0) / GOAL_MINUTES * 100))` pero **no**
aplica `Math.max(0, …)`. Con minutos negativos (dato corrupto) el porcentaje sería negativo.
`formatMinutes` sí normaliza a 0; aquí falta la guarda.

**Mitigación:** añadir `Math.max(0, …)`.

**Resuelto (2026-11-18):** `goalProgress` acota el resultado a 0–100 con
`Math.max(0, Math.min(100, …))`, así que unos minutos negativos (dato corrupto) no producen un
porcentaje negativo en `aria-valuenow` ni en el ancho de la barra. Evidencia:
`frontend/test/utils/time.test.js` (dos casos nuevos; el del límite inferior se comprobó por
mutación). Defensa sin cambio observable con datos válidos: no requiere spec.

### B8-4 · Lógica "lunes = 0" duplicada (`formatDateLong` vs `weekdayIndex`)

`formatDateLong` (`date.js:34`) calcula en línea `(date.getDay() + 6) % 7`, cuando ya existe
`weekdayIndex` (`date.js:70-72`) para exactamente esa regla. Duplicación que puede
desincronizarse.

**Mitigación:** reutilizar `weekdayIndex` dentro de `formatDateLong`.

**Resuelto (2026-11-18):** la fórmula vive en un único helper interno,
`weekdayIndexFromDate` (`(date.getDay() + 6) % 7`), que usan `formatDateLong` y `weekdayIndex`.
Se evita el doble parseo que supondría llamar a `weekdayIndex(value)` desde `formatDateLong`,
porque este ya tiene el `Date` validado. Evidencia: `frontend/test/utils/date.test.js` (test de
coherencia entre ambas funciones), verificado por mutación (con `date.getDay() % 7` fallan los
tests de las dos funciones). Refactor sin cambio observable: no requiere spec.

### B8-5 · `combineDuration` convierte valores inválidos en `0` en silencio

`time.js:22-24` usa `Number(hours) || 0` y `Number(minutes) || 0`, de modo que un valor no
numérico se convierte en `0` sin avisar, enmascarando posibles errores de entrada.

**Mitigación:** validar y señalar la entrada inválida en lugar de asumir `0`.

> **Notas menores de accesibilidad/cohesión** (sin ID, no accionables por separado): `Tabs`
> usa `role="tab"` sin `aria-controls`/`tabpanel`; `Card` no enlaza su título como encabezado.

---

