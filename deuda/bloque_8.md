## Bloque 10 — Frontend: feature Inicio/Estadísticas

Revisión de `frontend/src/stats/*` (`StatsDashboard`, `StatsPanel`, `PeriodFilter`, tarjetas,
`ActivityHeatmap`, `SubjectBreakdown`, `useStats`).

### B10-1 · `StatsPanel` refiltra el periodo en cliente y carga todas las clases

`StatsPanel.jsx:19` llama a `useSessions({}, version)` (todas las clases) y luego, en
`StatsPanel.jsx:21-23`, filtra por `stats.period.from/to` **otra vez** en el navegador. Duplica
la lógica de periodos del backend y puede desincronizarse con `summary`; además transfiere más
datos de los necesarios.

**Mitigación:** pedir al backend las sesiones del periodo (`from`/`to`) y no refiltrar.

### B10-2 · `PERIOD_OPTIONS` duplica `PERIODS` del backend (refuerza B0-1)

`PeriodFilter.jsx:1-9` define la lista de periodos y etiquetas, mientras el backend tiene
`PERIODS` en `utils/date.js`. `StatsDashboard` además deriva `HEATMAP_OPTIONS` filtrando
`day`. Dos listas que pueden divergir.

**Mitigación:** fuente única de periodos.

**Resuelto (2026-11-17):** `PERIODS` y `PERIOD_OPTIONS` viven en `packages/domain-constants`;
`PeriodFilter.jsx` y `stats.service.js` importan de ahí y ya no hay listas duplicadas entre
capas. Evidencia: `packages/domain-constants/test/constants.test.js` (claves alineadas y sin
duplicados), verificado por mutación.

### B10-3 · Umbrales del heatmap (`level`) hardcodeados sin documentar

`ActivityHeatmap.jsx:4-10` fija los cortes de color en 60, 120 y `GOAL_MINUTES` (180). La escala
es arbitraria y solo el último corte se relaciona con la meta; no está en `AGENTS.md`.

**Mitigación:** definir la escala como constantes documentadas.

**Resuelto (2026-11-22):** la escala vive en `frontend/src/stats/heatmapLevel.js`, con
`HEATMAP_THRESHOLDS` documentado (60, 120 y la meta diaria), `HEATMAP_LEVEL_MAX`,
`HEATMAP_LEVEL_COUNT` y `heatmapLevel(minutes)`. `ActivityHeatmap` aplica la función a cada celda
y genera la leyenda desde el conteo de niveles, sin repetir el `4`. Evidencia:
`frontend/test/stats/heatmapLevel.test.js` (límite de cada nivel y coherencia de la escala) y dos
casos nuevos de `frontend/test/stats/ActivityHeatmap.test.jsx` (nivel por celda y una celda de
leyenda por nivel), verificados por mutación. Refactor sin cambio observable: no requiere spec.
También se eliminó el JSDoc huérfano de `frontend/src/utils/time.js` (resto de `46c0d4cb`).

### B10-4 · `buildColumns` asume serie contigua y no rellena la última semana

`ActivityHeatmap.jsx:13-46` solo rellena los huecos de la **primera** semana del lado izquierdo;
asume que los días llegan contiguos y en orden. Si el backend devolviera huecos, el calendario
se desalinearía (frágil, aunque hoy el backend siempre devuelve serie completa).

**Mitigación:** construir la rejilla por posición de fecha (día de la semana) en vez de asumir
contigüidad.

### B10-5 · Tarjetas con `?? 0` silencian cambios de forma del contrato

`StreakCard` y `GoalTodayCard` usan valores por defecto (`?? 0`) y `ActivityDaysCard`
parámetros por defecto, todo sobre los datos del backend. Si el contrato cambiara, mostrarían
`0` en vez de fallar (relacionado con **B0-6**).

**Mitigación:** validar el contrato en el borde.

**Resolución (2026-10-29):** la validación de B0-6 impide que las tarjetas reciban respuestas con
campos ausentes o renombrados; la vista muestra el error en vez de `0`. Los `?? 0` quedan como
defensa local, ya no como red que oculte una deriva del contrato.

### B10-6 · El error/estado de `useSessions` en `StatsPanel` no se muestra

`StatsPanel.jsx:19` desestructura solo `sessions` de `useSessions` (ignora su `error`/`loading`)
y pasa a `SessionList` el `loading`/`error` de `useStats`. Si falla la carga de **sesiones**,
`periodSessions` queda vacío y la lista dice "No hay clases" (incorrecto) en vez de mostrar el
error.

**Mitigación:** propagar también el estado de `useSessions`.

**Resuelto:** `StatsPanel` desestructura `loading`/`error` de `useSessions` y los combina con los
de `useStats` para `SessionList` (`loading || sessionsLoading`, `error || sessionsError`): si la
carga de sesiones falla, la lista muestra el error en vez de "No hay clases".
Test: `frontend/test/stats/StatsPanel.test.jsx`, verificado por mutación.

---

