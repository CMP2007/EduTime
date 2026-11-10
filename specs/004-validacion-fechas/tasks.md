# Tasks 004 — Validación de fechas de entrada

> Spec: specs/004-validacion-fechas/spec.md · Plan: specs/004-validacion-fechas/plan.md
> Estado: completada (2026-11-10) · T1–T10 en verde

Cada tarea es un cambio pequeño y verificable. El campo «Test» indica qué prueba debe existir
antes de dar la tarea por hecha; si el test no falla al revertir el cambio, la tarea no está
terminada.

## T1 — Crear `packages/domain-dates` y enlazarlo

- [x] Escribir primero `packages/domain-dates/test/dates.test.js` con:
  - fechas válidas (`2026-10-15`, `2024-02-29`, `1990-01-01`, `9999-12-31`);
  - inválidas (`2026-02-31`, `2025-02-29`, `2026-13-01`, `2026-1-1`, ` 2026-10-15 `,
    `1989-12-31`, `null`, `undefined`, número, objeto, lista);
  - comparación numérica con `1990-01-01`, `9999-12-31`, `1989-12-31` y `10000-01-02`;
  - recorte de `1989-01-01`→`1990-01-01`, `10000-01-02`→`9999-12-31`, rangos interiores sin
    recorte y separación entre recorte de inicio y de fin.
- [x] Crear `packages/domain-dates/package.json` (`"type": "module"`, `main`/`exports`,
  `"test": "node --test"`) sin dependencias externas.
- [x] Implementar en `packages/domain-dates/index.js` `DATE_YEAR_MIN`, `DATE_YEAR_MAX`,
  `DATE_MIN`, `DATE_MAX`, `MAX_RANGE_DAYS`, `RANGE_CLAMP_NOTICE`, `isValidDateString`,
  `compareDateStrings` y `clampDateRange`.
- [x] Validar la fecha real con `Date.UTC` comparando año, mes y día; comparar y recortar por
  tupla numérica, nunca por texto.
- [x] Ejecutar `npm install` desde la raíz, comprobar que `node_modules/domain-dates` apunta al
  paquete y revisar que `package-lock.json` solo añade el workspace.
- Test: RF-8 y RF-10 (base compartida).
- Hecho cuando: `npm test --workspace domain-dates` está en verde, el paquete se importa desde
  backend y frontend y el diff del lockfile no contiene dependencias de terceros.
- Evidencia: `npm test --workspace domain-dates` → 12 tests OK; `npm test` en raíz → exit 0
  (frontend, backend 73, domain-contracts 17, domain-dates 12); `npx eslint packages/domain-dates`
  sin errores; `node_modules/domain-dates` enlaza al workspace y el lockfile solo añade el
  paquete.

## T2 — Endurecer las utilidades de fecha del backend

- [x] Escribir primero en `backend/test/date.test.js`: `fromDateString` lanza `RangeError` con
  fechas inválidas; `enumerateDays('1990-01-01', '2000-12-13')` enumera 4000 días y
  `enumerateDays('1990-01-01', '2000-12-14')` lanza `RangeError`; un rango invertido devuelve
  `[]`; `2024-02-29` sigue siendo válido.
- [x] En `backend/src/utils/date.js`, importar `isValidDateString`, `compareDateStrings` y
  `MAX_RANGE_DAYS` de `domain-dates`.
- [x] Hacer que `fromDateString` valide antes de construir el `Date` y lance `RangeError`.
- [x] Reescribir `enumerateDays`: validar extremos, calcular el número de días con `Date.UTC` y
  lanzar `RangeError` si supera `MAX_RANGE_DAYS`; no truncar en silencio.
- [x] Mantener `addDays`, `addMonths`, `startOfWeek`, `endOfWeek`, `startOfMonth`,
  `endOfMonth` y `getRange` con el mismo comportamiento para fechas válidas.
- Test: RF-8 y RF-9.
- Hecho cuando: `npm test --workspace backend` pasa y quitar la comprobación de 4000 o la
  validación de `fromDateString` pone el test en rojo.
- Evidencia (2026-11-10): `backend/test/date.test.js` recupera los `describe` de `toDateString`,
  `addDays`, `addMonths`, semanas, meses, `enumerateDays`, `isValidPeriod` y `getRange`, y añade
  tres tests de DST (marzo completo, tres meses y días consecutivos); `npm test --workspace
  backend` → 105 OK; `TZ=Europe/Madrid npm test --workspace backend` → 105 OK; mutación del
  cálculo local (`toDate - fromDate`) → 2 tests en rojo.

## T3 — Validar la fecha de clase y los filtros del historial

- [x] Escribir primero en `backend/test/sessions.service.test.js`:
  - `create`/`update` con `2026-02-31`, `2026-1-1`, `1989-12-31`, ` 2026-10-15 `, `''`, `null`
    y número fallan y no llaman a `insert`/`update`;
  - `list` con `from`/`to` inválidos, no textuales o repetidos (`['a','b']`) lanza
    `ValidationError` antes de `findAll`;
  - `list` con rango invertido lanza `ValidationError` antes de `findAll`;
  - `from`/`to` vacíos o ausentes no filtran; una fecha de clase vacía sigue siendo inválida.
- [x] En `backend/src/sessions/sessions.service.js`, sustituir `DATE_PATTERN` y `Date.parse`
  por `isValidDateString` y eliminar el `trim` de la fecha.
- [x] En `update`, distinguir `date === undefined` (campo omitido, se conserva la fecha
  existente) de `date === null` (valor presente pero inválido, se rechaza); no usar `??` para
  la fecha.
- [x] Añadir un normalizador de filtros opcionales: `undefined` o `''` → sin filtro; cualquier
  otro valor no textual o no válido → `ValidationError`.
- [x] Validar `from` y `to` antes de leer del repositorio; rechazar el rango invertido con
  `compareDateStrings`.
- [x] Usar los mensajes previstos: `El filtro «desde» no es una fecha válida.`,
  `El filtro «hasta» no es una fecha válida.` y
  `El rango de fechas está invertido: «desde» es posterior a «hasta».`
- Test: RF-1, RF-3, RF-4 y RF-5.
- Hecho cuando: `npm test --workspace backend` pasa y revertir la validación o la guarda de
  inversión pone los tests en rojo.
- Evidencia (2026-11-10): `sessions.service.test.js` cubre `create`/`update` con siete fechas
  inválidas (`2026-02-31`, `2026-1-1`, `1989-12-31`, ` 2026-10-15 `, `''`, `null`, número),
  filtros inválidos, no textuales, repetidos e invertidos, y `from`/`to` vacíos; los tests usan
  `mock.method(sessionsRepository, …)` y comprueban `insert`/`update`/`findAll` con
  `callCount() === 0`; se restauran los tests de contrato `assertSession`/`assertSessionList`.
  Mutaciones: quitar `normalizeFilter` → 2 tests en rojo; quitar `isValidDateString` de
  `validate` → 4 tests en rojo.

## T4 — Validar y recortar fechas en estadísticas, y añadir `notice` al contrato

- [x] Escribir primero en `backend/test/stats.service.test.js`:
  - `date`/`heatmapDate` inválidos, no textuales o repetidos lanzan `ValidationError` antes de
    `findAll`; vacíos usan hoy o la fecha de referencia;
  - `1990-01-01` con `12m` devuelve `period.from === '1990-01-01'` y `notice` con el mensaje
    exacto;
  - `9999-12-31` con `week` devuelve `heatmap.to === '9999-12-31'` y `notice`;
  - el recorte de periodo y calendario se evalúa por separado;
  - un rango interior devuelve `notice: null`.
- [x] Actualizar `packages/domain-contracts/test/contracts.test.js` y
  `frontend/test/fixtures/contracts.js` con `notice: null`, un caso con `notice` de texto y un
  caso sin el campo.
- [x] En `packages/domain-contracts/index.js`, añadir `@property {string|null} notice` al
  typedef `Stats` y `notice: nullable(STRING)` a `STATS`.
- [x] En `backend/src/stats/stats.service.js`, normalizar `date`/`heatmapDate`, calcular los
  rangos con `getRange`, recortarlos con `clampDateRange` y devolver `notice` con
  `RANGE_CLAMP_NOTICE` o `null`.
- [x] Calcular `buildHeatmap` con el rango ya recortado y mantener `date`/`today` con la fecha
  de referencia validada.
- [x] Usar los mensajes `La fecha de referencia no es válida.` y
  `La fecha del calendario no es válida.`
- Test: RF-2, RF-9, RF-10 y contrato de `Stats`.
- Hecho cuando: `npm test --workspace backend`, `npm test --workspace domain-contracts` y
  `npm test --workspace frontend` pasan; quitar el recorte o el `notice` pone los tests en rojo.
- Evidencia (2026-11-10): `npm test --workspace backend` → 105 tests OK (incluye no textuales,
  repetidos, vacíos y recorte por separado añadidos al cerrar T4); `npm test --workspace
  domain-contracts` → 19 OK; `npm test --workspace frontend` → 51 OK; `npm run lint` limpio.
  Mutaciones ya comprobadas en T5: sin validación de `date` o sin recorte del heatmap, los
  tests de estadísticas y los HTTP pasan a rojo.

## T5 — Cubrir la API HTTP de fechas y avisos

- [x] Escribir primero en `backend/test/app.test.js`:
  - `POST`/`PUT` con fecha inválida, vacía o no textual → `400`;
  - `GET /api/sessions` con `from`/`to` inválidos, repetidos o invertidos → `400`;
  - `GET /api/stats` con `date`/`heatmapDate` inválidos o repetidos → `400` y sin `NaN`;
  - `GET /api/stats?date=9999-12-31&period=week` → `200`, `heatmap` recortado y `notice`;
  - la respuesta recortada cumple `assertStats`.
- [x] No cambiar las rutas: la validación vive en los servicios y el manejador de errores ya
  respeta los `400` de `ValidationError`.
- Test: RF-1, RF-2, RF-3, RF-4 y RF-10 en el borde HTTP.
- Hecho cuando: `npm test --workspace backend` pasa y retirar una validación del servicio pone
  el caso HTTP correspondiente en rojo.
- Evidencia: `npm test --workspace backend` → 75 tests OK; `npm run lint` limpio (se retiraron
  imports y un helper sin usar que venían de T2–T4). Mutaciones comprobadas restaurando con
  `cp` desde `/tmp/opencode/004-validacion/`:
  - `if (!isValidDateString(date))` → `if (false)` en `sessions.service.js`: POST y PUT de fecha
    inválida en rojo (2/2).
  - `if (!isValidDateString(value))` → `if (false)` en `normalizeFilter`: GET de filtro inválido
    en rojo.
  - guarda de rango invertido → `if (false)`: GET con rango invertido en rojo.
  - `if (date && !isValidDateString(date))` → `if (false)` en `stats.service.js`: GET de
    `date`/`heatmapDate` inválidos en rojo.
  - recorte del heatmap anulado: caso `date=9999-12-31&period=week` en rojo.

## T6 — Endurecer las utilidades de fecha del frontend y el calendario

- [x] Escribir primero en `frontend/test/utils/date.test.js`:
  - `fromDateString` devuelve `null` con formato inválido, fecha imposible, año fuera de rango,
    número, objeto o `null`;
  - `formatDateLong`, `formatDateShort` y `formatDateRange` devuelven `''` con valores
    inválidos; si un extremo del rango falla, todo el texto es `''`;
  - `weekdayIndex` devuelve `null` con fecha inválida y el índice correcto con fecha válida;
  - las fechas válidas conservan el formato actual.
- [x] Añadir un test de `ActivityHeatmap`: un día con fecha inválida se omite y no se coloca en
  la columna del lunes.
- [x] En `frontend/src/utils/date.js`, importar `isValidDateString`, hacer que
  `fromDateString` devuelva `null`, que los formateadores devuelvan `''` y que `weekdayIndex`
  devuelva `null`.
- [x] En `frontend/src/stats/ActivityHeatmap.jsx`, filtrar los días con fecha inválida antes de
  `buildColumns`; no inventar un lunes.
- Test: RF-7 y RF-9.
- Hecho cuando: `npm test --workspace frontend` pasa y revertir los guardas pone los tests en
  rojo.
- Evidencia (2026-11-10): `frontend/test/utils/date.test.js` (70 casos con `it.each`) y
  `frontend/test/stats/ActivityHeatmap.test.jsx` (2 casos); `npm test --workspace frontend` →
  123 tests OK; `npm run build` resuelve `domain-dates` (el paquete está hoisteado en la raíz
  como los demás workspaces); `npm run lint` limpio. Mutaciones con `cp` desde
  `/tmp/opencode/004-validacion/`:
  - `fromDateString` sin guarda → 65 tests en rojo;
  - formateadores sin guardas → 13 en rojo;
  - `weekdayIndex` devolviendo `0` → 14 en rojo;
  - `ActivityHeatmap` sin filtrar días inválidos → 2 en rojo.

## T7 — Guarda de rango invertido y aviso en el historial

- [x] Escribir primero `frontend/test/sessions/HistoryView.test.jsx`:
  - al invertir el rango aparece el aviso con `role="status"`, no se llama a la API, `loading`
    termina, se mantiene el listado anterior y se oculta el error anterior;
  - el hook conserva el error anterior;
  - una petición en vuelo cuya respuesta llega después se ignora;
  - con un filtro mal formado la guarda no se aplica y la API recibe la petición.
- [x] Crear `frontend/src/components/StatusNotice.jsx` con `role="status"` y la clase `notice`.
- [x] En `frontend/src/sessions/useSessions.js`, calcular `hasInvertedRange` solo cuando ambos
  extremos son válidos; dentro de `reload`, invalidar la petición en vuelo, no llamar a la API,
  poner `loading` en `false` y no tocar `sessions` ni el error.
- [x] En `frontend/src/sessions/HistoryView.jsx`, mostrar el aviso con `StatusNotice` y pasar
  `error=''` a `SessionList` mientras el rango esté invertido.
- [x] Añadir `.notice` a `frontend/src/styles.css` con texto visible, borde y fondo propios, sin
  depender solo del color.
- Test: RF-6.
- Hecho cuando: `npm test --workspace frontend` pasa; retirar la guarda, la invalidación de la
  petición o el filtrado del error pone los tests en rojo.
- Evidencia (2026-11-10): `frontend/test/sessions/HistoryView.test.jsx` → 5 tests OK;
  `npm test --workspace frontend` → 128 OK; `npm run lint` limpio; `npm run build` OK.
  Mutaciones con `cp` desde `/tmp/opencode/004-validacion/`:
  - guarda anulada → 4 tests en rojo;
  - `requestId` sin incrementar en la guarda → el test de la respuesta en vuelo en rojo;
  - `error={error}` sin filtrado → el test del error oculto en rojo.
  El test de la respuesta en vuelo usa `act` para drenar las microtareas: sin la invalidación,
  la respuesta obsoleta sobrescribe el listado y el caso falla.

## T8 — Mostrar el aviso de recorte en Inicio y Estadísticas

- [x] Escribir primero `frontend/test/stats/StatsDashboard.test.jsx` y ampliar
  `frontend/test/stats/StatsPanel.test.jsx`:
  - con `notice` se muestra un `StatusNotice` con `role="status"` y el texto exacto;
  - con `notice: null` no se muestra ningún aviso;
  - el resto de tarjetas sigue visible.
- [x] En `frontend/src/stats/StatsDashboard.jsx` y `frontend/src/stats/StatsPanel.jsx`, mostrar
  `stats.notice` con `StatusNotice` cuando no sea `null`, antes de las tarjetas.
- Test: RF-11.
- Hecho cuando: `npm test --workspace frontend` pasa y quitar la renderización del aviso pone
  los tests en rojo.
- Evidencia (2026-11-10): `StatsDashboard.test.jsx` (2 casos) y `StatsPanel.test.jsx` (2 casos
  nuevos); `npm test --workspace frontend` → 132 OK; `npm run lint` limpio; `npm run build` OK.
  Mutaciones con `cp` desde `/tmp/opencode/004-validacion/`: quitar el aviso en Inicio → 1 test
  en rojo; quitarlo en Estadísticas → 1 test en rojo.

## T9 — Actualizar documentación, deuda y memoria

- [x] `README.md`: documentar la fecha válida (`YYYY-MM-DD` real, 1990–9999), los `400` por
  fecha inválida o rango invertido, el máximo de 4000 días, el recorte de rangos derivados y
  `notice` en `/api/stats`.
- [x] `AGENTS.md`: añadir `packages/domain-dates/` a la estructura y la regla compartida de
  fechas.
- [x] `DEUDA_TECNICA.md`: marcar B3-2, B3-3, B4-4, B8-1 y B9-5 como resueltos con la evidencia
  de tests; ajustar el resumen a 35 resueltas, 32 pendientes y 1 en curso y las prioridades que
  citan esos IDs.
- [x] `deuda/bloque_2.md`, `bloque_3.md`, `bloque_6.md` y `bloque_7.md`: documentar la
  resolución concreta de cada ID.
- [x] `deuda/bloque_10.md` y `bloque_12.md`: sustituir la explicación repetida por una
  referencia corta a la feature 004.
- [x] `MEMORY.md`: registrar la feature 004, el paquete `domain-dates` y el total de tests real.
- Test: revisión manual de coherencia; no aplica test de comportamiento.
- Hecho cuando: no queda documentación que contradiga la regla 1990–9999, el recorte o
  `notice`, y la deuda cuadra con la tabla: 68 debilidades, 35 resueltas, 32 pendientes y 1 en
  curso (B0-7).
- Evidencia (2026-11-10): `README.md` con fecha real 1990–9999, 400 por fecha/rango, 4000 días,
  recorte y `notice`; `AGENTS.md` con `packages/domain-dates/` y la regla de fechas;
  `DEUDA_TECNICA.md` con 5 IDs resueltos y resumen 35/32/1; bloques 2, 3, 6 y 7 con la resolución
  concreta; bloques 10 y 12 con referencia a la feature 004; `MEMORY.md` con la feature, el
  paquete y 268 tests.

## T10 — Verificación final, mutación y UI

- [x] Ejecutar `npm test` desde la raíz: backend, frontend y contrato.
- [x] Ejecutar `npm run lint`: limpio.
- [x] Copiar previamente a `/tmp/opencode/004-validacion/` y restaurar con `cp` archivo por
  archivo; comprobar que cada mutación pone su test en rojo:
  - quitar la comprobación de fecha real en `isValidDateString`;
  - comparar fechas como texto en `compareDateStrings`;
  - quitar `clampDateRange` de las estadísticas;
  - quitar `notice` del contrato;
  - quitar la validación de filtros del historial;
  - quitar la guarda de rango invertido;
  - hacer que `weekdayIndex` devuelva `0`;
  - quitar los guardas de los formateadores;
  - quitar el límite de 4000 días;
  - quitar el renderizado de `notice` en Inicio o Estadísticas.
- [x] Comprobación manual con Chrome DevTools a 375 px: aviso de rango invertido en Historial
  (sin overflow, con el listado anterior visible) y aviso de recorte en Estadísticas eligiendo
  `9999-12-31`; el aviso de Inicio queda cubierto por el test de componente.
- [x] Comprobar `git status`: solo cambios esperados; sin `backend/data` ni archivos temporales.
- [x] Registrar en `tasks.md` los comandos, resultados y mutaciones.
- Test: verificación completa de RF-1 a RF-11.
- Hecho cuando: tests, lint, mutación y UI pasan; no queda ninguna mutación ni deuda de
  verificación.
- Evidencia (2026-11-10):
  - `npm test` → frontend 14 archivos / 132 tests, backend 105, `domain-contracts` 19 y
    `domain-dates` 12 = **268 tests OK**.
  - `TZ=Europe/Madrid npm test` → **268 tests OK**; `enumerateDays('2026-03-01','2026-03-31')`
    → 31 días y `enumerateDays('2026-03-16','2026-06-14')` → 91 días.
  - `npm run lint` → sin errores; `npm run build` → build correcto.
  - Mutaciones (backup en `/tmp/opencode/004-validacion/`, restaurado con `cp`):
    | Mutación | Resultado |
    |---|---|
    | `enumerateDays` con resta de fechas locales (DST) | 2 tests en rojo con `TZ=Europe/Madrid` |
    | `isValidDateString` sin comparar año/mes/día con `Date.UTC` | `domain-dates` 1 test en rojo |
    | `compareDateStrings` comparando como texto | `domain-dates` 3 tests en rojo |
    | `clampDateRange` anulado en estadísticas | backend 3 tests en rojo |
    | `notice` fuera del contrato | `domain-contracts` 1 test en rojo |
    | validación de fecha de clase retirada | POST/PUT HTTP y 2 tests del servicio en rojo |
    | validación de filtros retirada | GET con filtro inválido y 1 test del servicio en rojo |
    | guarda de rango invertido retirada | Historial 4 tests en rojo |
    | `requestId` sin invalidar en la guarda | test de respuesta en vuelo en rojo |
    | `error` sin filtrar con rango invertido | test del error oculto en rojo |
    | `weekdayIndex` devolviendo `0` | 14 tests en rojo |
    | guardas de los formateadores retiradas | 13 tests en rojo |
    | límite de 4000 días retirado | 1 test en rojo |
    | `notice` sin renderizar en Inicio | 1 test en rojo |
    | `notice` sin renderizar en Estadísticas | 1 test en rojo |
  - UI a 375 px (Chrome DevTools, `http://localhost:5173`): en Historial, `Desde=2026-10-20` y
    `Hasta=2026-10-15` muestran el aviso `role="status"` con «El rango de fechas está
    invertido: «desde» es posterior a «hasta»», `loading` termina, no hay error y se conserva el
    listado anterior. En Estadísticas, `Fecha de referencia=9999-12-31` con periodo «Semana»
    muestra el aviso de recorte antes de las tarjetas y estas siguen visibles. El aviso mide
    343 px y cabe en los 375 px; el único desbordamiento horizontal es la barra `.tabs`
    (382 px), deuda preexistente B11-7. Captura:
    `/tmp/opencode/004-validacion/estadisticas-375.png`.
  - `git status`: solo archivos de la feature (paquete `domain-dates`, specs, tests y docs);
    `backend/data` y artefactos temporales no aparecen.

## Orden y dependencias

```text
T1 → T2 → T3 → T4 → T5
T1 → T6 → T7 → T8
T5 y T8 → T9 → T10
```

- T1 crea y enlaza el paquete compartido; nada más puede importarlo antes.
- T4 actualiza el contrato y el servicio de estadísticas en el mismo paso para no dejar la suite
  rota por un campo obligatorio.
- T5 depende de T3 y T4 porque prueba los servicios a través de las rutas.
- T6 depende de T1 y puede ir en paralelo con T2–T5.
- T7 depende de T6 porque usa la comparación segura de fechas.
- T8 depende de T7 porque reutiliza `StatusNotice` y `.notice`.
- T9 no empieza hasta que T5 y T8 estén en verde.
- T10 cierra la feature y no se ejecuta hasta que T9 esté revisado.

## Archivos que se tocarán al aplicar las tareas

| Archivo | Tarea | Cambio |
|---|---|---|
| `packages/domain-dates/package.json` | T1 | Nuevo paquete interno sin dependencias externas. |
| `packages/domain-dates/index.js` | T1 | Constantes, validación, comparación y recorte. |
| `packages/domain-dates/test/dates.test.js` | T1 | Tests de validez, límites, comparación y recorte. |
| `package-lock.json` | T1 | Alta del workspace `domain-dates`. |
| `backend/src/utils/date.js` | T2 | Validación y límite explícito de días. |
| `backend/test/date.test.js` | T2 | Tests de `fromDateString`, 4000/4001 y rango invertido. |
| `backend/src/sessions/sessions.service.js` | T3 | Fecha de clase estricta y filtros validados. |
| `backend/test/sessions.service.test.js` | T3 | Tests de fecha, filtros, no textuales, repetidos y rango invertido. |
| `packages/domain-contracts/index.js` | T4 | `notice` obligatorio-nullable en `Stats`. |
| `packages/domain-contracts/test/contracts.test.js` | T4 | Casos de `notice`. |
| `frontend/test/fixtures/contracts.js` | T4 | `notice: null` en la fixture válida. |
| `backend/src/stats/stats.service.js` | T4 | Validación, recorte y `notice`. |
| `backend/test/stats.service.test.js` | T4 | Tests de fechas, recorte y aviso. |
| `backend/test/app.test.js` | T5 | Tests HTTP de `400` y `200` con `notice`. |
| `frontend/src/utils/date.js` | T6 | Parseo seguro, formateadores y `weekdayIndex`. |
| `frontend/src/stats/ActivityHeatmap.jsx` | T6 | Omisión de días inválidos. |
| `frontend/test/utils/date.test.js` | T6 | Tests de fechas inválidas y válidas. |
| `frontend/src/components/StatusNotice.jsx` | T7 | Aviso reutilizable con `role="status"`. |
| `frontend/src/sessions/useSessions.js` | T7 | Guarda de rango invertido. |
| `frontend/src/sessions/HistoryView.jsx` | T7 | Aviso y ocultación del error anterior. |
| `frontend/src/styles.css` | T7 | Estilo `.notice`. |
| `frontend/test/sessions/HistoryView.test.jsx` | T7 | Tests de aviso, sin consulta y listado conservado. |
| `frontend/src/stats/StatsDashboard.jsx` | T8 | Aviso de recorte en Inicio. |
| `frontend/src/stats/StatsPanel.jsx` | T8 | Aviso de recorte en Estadísticas. |
| `frontend/test/stats/StatsDashboard.test.jsx` | T8 | Test del aviso en Inicio. |
| `frontend/test/stats/StatsPanel.test.jsx` | T8 | Test del aviso en Estadísticas. |
| `README.md` | T9 | Reglas, API, recorte y `notice`. |
| `AGENTS.md` | T9 | Estructura y regla compartida. |
| `DEUDA_TECNICA.md` | T9 | IDs resueltos y resumen. |
| `deuda/bloque_2.md` | T9 | B3-2 y B3-3. |
| `deuda/bloque_3.md` | T9 | B4-4. |
| `deuda/bloque_6.md` | T9 | B8-1. |
| `deuda/bloque_7.md` | T9 | B9-5. |
| `deuda/bloque_10.md` | T9 | Referencia a la feature 004. |
| `deuda/bloque_12.md` | T9 | Referencia a la feature 004. |
| `MEMORY.md` | T9 | Feature 004 y total de tests. |

## Archivos que no deben cambiar

- `backend/src/sessions/sessions.routes.js`, `backend/src/stats/stats.routes.js` y
  `backend/src/app.js`: la validación vive en los servicios; las rutas y el manejador de
  errores ya son correctos.
- `frontend/src/sessions/sessions.api.js`, `frontend/src/stats/stats.api.js` y
  `frontend/src/stats/useStats.js`: el contrato y el aviso viajan en la respuesta; no requieren
  cambios.
- `frontend/src/sessions/SessionFilters.jsx`: los campos de tipo fecha ya envían valores
  válidos o vacíos.
- `backend/data/sessions.json`: no se migra ni se limpia.

## Punto de entrada para la ejecución

- Leer `AGENTS.md`, `specs/004-validacion-fechas/spec.md`, `plan.md` y este archivo antes de
  tocar código.
- No hacer commits salvo petición explícita.
- Ejecutar las tareas en el orden indicado: `T1 → T2 → T3 → T4 → T5`, `T1 → T6 → T7 → T8` y
  después `T9 → T10`.
- En T1, ejecutar `npm install` desde la raíz y revisar el diff de `package-lock.json` antes de
  continuar.
- Escribir el test antes del cambio y comprobar que falla al revertir la regla. Para las
  mutaciones, copiar los archivos a `/tmp/opencode/004-validacion/` y restaurar con `cp`
  archivo por archivo; nunca usar `git checkout -- <carpeta>`.
- No tocar `backend/data/sessions.json` ni añadir dependencias externas.
- Cerrar con `npm test` y `npm run lint` en verde desde la raíz.
- Comprobación manual a 375 px: aviso de rango invertido en Historial y aviso de recorte en
  Estadísticas. El aviso de recorte de Inicio se verifica con su test de componente.
- Registrar en este archivo los comandos, resultados y mutaciones, y actualizar los estados de
  `spec.md`, `tasks.md` y `MEMORY.md` solo cuando T10 esté en verde.
