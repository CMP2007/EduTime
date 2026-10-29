# Tasks 002 — Contrato de datos de la API

> Spec: specs/002-contrato-datos/spec.md · Plan: specs/002-contrato-datos/plan.md
> Estado: completado (2026-10-29)

Cada tarea es un cambio pequeño y verificable. El campo «Test» indica qué prueba debe existir
antes de dar la tarea por hecha; si el test no falla al revertir el cambio, la tarea no está
terminada.

## T1 — Dejar la base en verde y quitar restos

- [x] Poner `Estado: en curso` en este archivo.
- [x] Envolver `<App />` en `DataRefreshProvider` en los 2 tests de `frontend/test/App.test.jsx`.
- [x] Envolver `<StatsPanel />` en `DataRefreshProvider` en los 2 tests de
  `frontend/test/stats/StatsPanel.test.jsx`.
- [x] Revertir en `frontend/src/utils/time.js` el cambio de `goalProgress` (volver a
  `minutes || 0` y quitar el comentario de «chequeo estático»).
- Test: no introduce una regla nueva; los 4 tests existentes hoy fallan por falta del provider.
- Hecho cuando: `npm test --workspace frontend` da 28/28 en verde.

## T2 — Crear el paquete `domain-contracts` con sus validadores

- [x] Escribir primero `packages/domain-contracts/test/contracts.test.js`: métricas válidas;
  campo ausente; campo renombrado; tipo incorrecto; campo adicional tolerado; `longestClass`
  nulo válido; sesión válida; lista con un elemento inválido (ruta `[1].durationMinutes`);
  elemento nulo en la lista.
- [x] Crear `packages/domain-contracts/package.json` (`"type": "module"`, `"exports"`,
  `"test": "node --test"`) y ejecutar `npm install` para registrar el workspace.
- [x] Añadir globals de Node solo a `packages/*/test/**/*.js` en `eslint.config.js` (el paquete
  es isomorfo: no usa globals de Node).
- [x] Implementar en `index.js` los typedefs JSDoc (`Session`, `Stats`, `PeriodRange`, `Summary`,
  `Global`, `Today`, `Heatmap`, `HeatmapDay`, `Subject`), `ContractError`, los descriptores
  (`string`, `number`, `boolean`, `nullable`, `arrayOf`, `object`) y los validadores
  `validateStats` / `assertStats`, `validateSession` / `assertSession`,
  `validateSessionList` / `assertSessionList`.
- Test: RF-1, RF-6 y casos límite del contrato.
- Hecho cuando: `npm test --workspace domain-contracts` en verde y el paquete se importa desde
  backend y frontend.

## T3 — Validar métricas en el borde

- [x] Crear `frontend/test/fixtures/contracts.js` con `buildStats(overrides)` completo.
- [x] Escribir `frontend/test/stats/stats.api.test.js` mockeando `frontend/src/api/client.js`:
  respuesta válida → devuelve los datos; respuesta sin `summary.totalMinutes` → rechaza con
  `ContractError` y la ruta del campo.
- [x] Añadir `assertStats(data)` en `frontend/src/stats/stats.api.js` antes de devolver.
- Test: RF-2 (validación en el borde).
- Hecho cuando: `npm test --workspace frontend` pasa y el test falla si se quita `assertStats`.

## T4 — Validar clases en el borde

- [x] Añadir `buildSession(overrides)` a `frontend/test/fixtures/contracts.js`.
- [x] Escribir `frontend/test/sessions/sessions.api.test.js` mockeando `client.js`: listado
  válido; listado con un elemento inválido → error con `[0].title`; creación válida; creación
  inválida → error.
- [x] Validar con `assertSessionList` en `list` y `assertSession` en `create` y `update` de
  `frontend/src/sessions/sessions.api.js` (`remove` no valida).
- Test: RF-3.
- Hecho cuando: `npm test --workspace frontend` pasa y los tests fallan si se quitan las
  validaciones.

## T5 — Comprobar el contrato en los tests del backend

- [x] Sustituir en `backend/test/stats.service.test.js` el test roto de B0-6 (exigía
  `global.current` y `global.best`) por una aserción `assertStats(stats)` sobre la respuesta real,
  reutilizando el caso existente.
- [x] Quitar el bloque JSDoc flotante de `backend/src/stats/stats.service.js` y anotar `getStats`
  con `@returns {Promise<import('domain-contracts').Stats>}`.
- [x] Crear `backend/test/sessions.service.test.js` con el repositorio simulado: `create` cumple
  `assertSession` y `list` cumple `assertSessionList`.
- Test: RF-5.
- Hecho cuando: `npm test --workspace backend` en verde (los 60 actuales, con el test roto
  sustituido, más los 2 nuevos de `sessions.service`).

## T6 — Ocultar datos obsoletos en `StatsPanel` (RF-7)

- [x] Renderizar en `frontend/src/stats/StatsPanel.jsx` el bloque que depende de `stats`
  (tarjetas y lista filtrada) solo si no hay error; el filtro de periodo sigue visible.
- [x] Actualizar `frontend/test/stats/StatsPanel.test.jsx` para usar `buildStats` / `buildSession`
  y añadir: (a) `statsApi.get` rechaza con `ContractError` → mensaje visible y ningún «0m»;
  (b) primera carga válida y recarga inválida → error visible y sin tarjetas de datos anteriores.
- Test: RF-2 (interfaz) y RF-7.
- Hecho cuando: los tests de `StatsPanel` pasan en verde y fallan si se vuelve a mostrar el bloque
  con error.

## T7 — Actualizar documentación y configuración

- [x] `AGENTS.md`: añadir `packages/domain-contracts` y `frontend/test/fixtures` a la estructura,
  indicar que `npm test` incluye los tests del paquete y que el contrato compartido es la fuente
  única.
- [x] `DEUDA_TECNICA.md`: B0-6 a `resuelto` con qué se hizo; sin añadir TypeScript como deuda.
- [x] `MEMORY.md`: registrar la decisión del contrato compartido y el estado real de la suite.
- Test: no aplica test de comportamiento; revisión de los documentos.
- Hecho cuando: la documentación refleja el estado real.

## T8 — Mutación de las reglas nuevas

- [x] Con copia previa en `/tmp/opencode` y restauración archivo por archivo, renombrar
  `summary.totalMinutes` en el esquema del paquete → debe fallar el test del paquete.
- [x] Quitar `assertStats` de `frontend/src/stats/stats.api.js` → debe fallar el test de cableado.
- [x] Renombrar `totalMinutes` en la salida de `backend/src/stats/stats.service.js` → debe fallar
  el test de contrato del backend.
- Test: las tres reglas nuevas (esquema, borde y contrato del productor).
- Hecho cuando: cada mutación pone su test en rojo y, restaurada, vuelve a verde.

## T9 — Validación y cierre

- [x] Ejecutar `npm test` y `npm run lint` desde la raíz.
- [x] Comprobación manual con Chrome DevTools a 375 px: forzar temporalmente una respuesta
  inválida, verificar que se muestra el error y que no aparecen datos por defecto ni se rompe el
  layout; restaurar el cambio.
- [x] Rellenar la matriz RF → test → resultado, marcar las tareas como completadas, la spec como
  `implementada (2026-10-29)` y proponer el commit.
- Test: validación completa de `specs/002-contrato-datos/spec.md` (RF-1 a RF-7).
- Hecho cuando: suite y lint en verde, mutaciones comprobadas, UI revisada y sin bloqueantes.

## Orden y dependencias

T1 → T2 → T3 y T4 (paralelizables) → T5 (solo depende de T2) → T6 (depende de T3 y T4) → T7 →
T8 → T9.

T2 crea la definición que usan T3, T4 y T5. T6 necesita los fixtures de T3 y T4. T7, T8 y T9 no
empiezan hasta que el código y los tests estén cerrados.
