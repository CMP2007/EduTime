## Bloque 0 — Mapa general y arquitectura

### B0-1 · Constantes de dominio duplicadas entre backend y frontend

**Resuelto:** se crea el paquete compartido `packages/domain-constants` (`GOAL_MINUTES`, `TITLE_MAX`, `NOTES_MAX`, `DURATION_MIN`, `HOURS_MAX`, `MINUTES_MAX`, `DURATION_MAX`, `PERIODS`, `PERIOD_OPTIONS`) y se usa desde backend (`sessions.service.js`, `stats.service.js`, `date.js`) y frontend (`SessionForm.jsx`, `time.js`, `PeriodFilter.jsx`). La fuente única evita divergencias entre validación cliente/servidor.

### B0-2 · Sin tests ni linter configurado

**Resuelto:** 49 tests con el runner nativo de Node (`node --test`, en `backend/test/`) y
ESLint con flat config en la raíz (`eslint.config.js`); de paso se retiró un `eslint-disable`
sin efecto en `app.js`. Detalle en `MEMORY.md` y en el commit `6e4c1d5`.

### B0-3 · Persistencia acoplada al proceso (condiciones de carrera)

**Resuelto:** el ciclo `load()` → mutar → `persist()` era *read-modify-write* sin
coordinación: dos lecturas en frío solapadas se quedaban cada una con su propio array
(**lost update**), el primer arranque podía siembrar dos veces y las escrituras usaban el
mismo tmp fijo (`sessions.json.tmp`). Ahora `sessions.repository.js` es una fábrica
(`createSessionsRepository(store)`) que cachea la **promesa** de lectura (single-flight),
serializa las escrituras en una cola (`writeChain`) y escribe en un tmp único
(`pid + randomUUID`). Verificado con pruebas de mutación.
**Alcance:** un proceso; multi-proceso (lock de fichero o SQLite) queda fuera.
Tests: `backend/test/sessions.repository.test.js`. Evidencia y detalle: commit `158b325`.

### B0-4 · `README.md` desincronizado con la regla real de racha

**Resuelto:** `README.md` corregido para reflejar que la racha son días consecutivos con
**meta cumplida (≥ 180 min)** (coincide con `AGENTS.md` y `backend/src/stats/stats.service.js`).
Si hoy aún no se llega a la meta, la racha sigue viva hasta fin del día y se guarda la
**racha más extensa** (récord).

### B0-5 · Patrón `version` / refresh por props (invalidación gruesa)

**Resuelto (28/10/2026):** se sustituye el contador global por `DataRefreshContext`
(`frontend/src/context/DataRefreshContext.jsx`) con versiones por recurso (`sessions`, `stats`).
`App.jsx` llama a `refreshAll()` al crear/editar/eliminar; las vistas ya no reciben `version` por
props (*prop drilling* eliminado). `useSessions` y `useStats` dependen solo de la clave de su
recurso y descartan respuestas obsoletas con `requestId`, evitando carreras entre peticiones.
Los `react-hooks/exhaustive-deps` intencionales desaparecen. Validado con `npm test` y `npm run lint`.

### B0-6 · Sin TypeScript ni validación del contrato de datos

El contrato de la API solo está **documentado** (tabla en `AGENTS.md`), no verificado. El
backend valida bien la **entrada** del usuario (`sessions.service.js:35-55`), pero la forma
de la **salida** no se comprueba y el frontend la asume.

#### Fallo silencioso (verificado)

Los componentes son defensivos (`today?.minutes ?? 0`, defaults). Ejecutando el propio código:

```
formatMinutes(undefined) -> "0m"
goalProgress(undefined)  -> 0
formatMinutes(NaN)       -> "0m"
```

Un campo ausente o renombrado se pinta como `"0m"` / `0` — un valor **plausible pero falso**
— en lugar de fallar. Para un tablero de métricas, un dato incorrecto silencioso es peor que
un error visible.

#### Otros puntos

- Sin TypeScript, PropTypes ni JSDoc con `// @ts-check`.
- Sin tests de contrato que detecten la deriva backend↔frontend.

#### Mitigación sugerida

- JSDoc + `// @ts-check` (chequeo de tipos **sin** dependencias).
- Módulo de constantes/contratos compartido (enlaza con B0-1).
- Schemas en runtime (zod/joi) o TypeScript si se justifica la dependencia.

#### Resolución (2026-10-29)

Se resolvió **sin TypeScript ni dependencias nuevas**, con JSDoc + `// @ts-check` y validación en
runtime:

- Nuevo workspace `packages/domain-contracts`: typedefs JSDoc (`Stats`, `Session`, …),
  `ContractError` y validadores `validateStats` / `assertStats`, `validateSession` /
  `assertSession` y `validateSessionList` / `assertSessionList`. Tolera campos adicionales y el
  primer fallo incluye la ruta (`summary.totalMinutes`, `heatmap.days[1].minutes`,
  `[1].durationMinutes`).
- `frontend/src/stats/stats.api.js` y `frontend/src/sessions/sessions.api.js` validan la respuesta
  **en el borde** antes de devolverla. Si falla, `StatsPanel` muestra el error y oculta las
  tarjetas y la lista filtrada, sin valores por defecto plausibles.
- El backend comprueba su propia salida en tests con las mismas funciones
  (`assertStats` en `stats.service.test.js`; `assertSession` / `assertSessionList` en
  `sessions.service.test.js`), reutilizando los casos existentes.
- Suite: **119 tests** — 62 backend + 40 frontend + 17 del paquete de contrato — con `npm test` y
  `npm run lint` en verde.

### B0-7 · Sin tests de frontend ni E2E (requisito de culminación)

La suite (49 casos con `node --test`) cubre **solo el backend**. El frontend no tiene ninguna
prueba automatizada: ni tests unitarios/DOM de hooks y componentes, ni tests de integración, ni
E2E de punta a punta.

**Impacto:** cualquier refactor de frontend es a ciegas (regresiones de UX: errores tragados,
estados mal mostrados) y, sobre todo, **el proyecto no puede considerarse culminado** sin tests
en ambas capas, de integración y E2E.
**Mitigación:** (1) tests unitarios/DOM con **Vitest + Testing Library + jsdom** en
`frontend/test/` (espejo de `src/`, misma convención que `backend/test/`); (2) tests HTTP del
backend (`app.test.js`) como nivel de integración; (3) tests E2E con **Playwright** (flujo
completo: crear/editar/borrar + fallos de red).

**En curso (infraestructura hecha):** en la sesión del punto 3 se montó la infraestructura
(**Vitest 5 + jsdom + Testing Library**, versiones exactas en `frontend/package.json`;
`frontend/vitest.config.js`, `frontend/test/` espejo de `src/`, script `test` por workspace) y
ya hay **28 tests unitarios/DOM** en verde junto a los 59 de backend (87 en total con
`npm test`). Quedan, para la culminación, los tests de **integración ampliados** y los **E2E**
(Playwright: dependencia aparte, a aprobar).

---

