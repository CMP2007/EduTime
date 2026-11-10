# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- v1 de StudyTrack funcionando: monorepo con frontend (React 19 + **Vite 8**) y backend (Node + Express 5). Pestañas: Inicio (tarjetas + heatmap), Historial (filtros, editar, eliminar) y Estadísticas (periodos, temáticas, clase más larga).
- Persistencia en `backend/data/sessions.json` (ignorado por git): lectura única (single-flight), cola de escrituras, tmp único y fallo explícito si el fichero está corrupto.
- **Calidad**: 268 tests — 105 backend (`node --test`) + 132 frontend (Vitest + jsdom + Testing Library) + 19 del contrato + 12 de `domain-dates` — y ESLint en verde. La suite del backend pasa también con `TZ=Europe/Madrid`.
- **Feature 001 (modal accesible)** resuelta; patrones aplicados (accesibilidad, foco, scroll, ErrorBoundary, ApiError).
- **Feature 002 (contrato de datos)** implementada; B0-6 resuelto sin TypeScript.
- **Feature 003 (red/proxy/CORS)** implementada y validada (corrección 2026-11-06): sin CORS en el backend, proxy con `/api` relativa y `.env` de la raíz, host local del frontend y del backend, errores de red en español. El layout a 375 px queda fuera de alcance. `DEUDA_TECNICA.md`: B1-6, B1-7, B1-10 y B1-11 resueltos; B11-7 registrado.
- **Feature 004 (validación de fechas)** implementada y validada (2026-11-10): paquete `domain-dates` (fecha real 1990–9999, comparación por tupla y recorte de rangos); API con 400 por fecha inválida, filtros repetidos y rango invertido; `notice` en `/api/stats`; avisos de rango invertido (Historial) y de recorte (Inicio/Estadísticas). `DEUDA_TECNICA.md`: B3-2, B3-3, B4-4, B8-1 y B9-5 resueltos (35/32/1).

## Decisiones (y por qué)

- Persistencia en JSON con `fs` (sin dependencias). Repositorio como **fábrica** (`createSessionsRepository(store)`) para simular en tests; single-flight, cola de escrituras, tmp único; fichero corrupto → **fallar**, no sobrescribir.
- Un archivo por funcionalidad; backend calcula las métricas (`/api/stats`); meta diaria 180 min; racha = días consecutivos con meta cumplida (global hasta hoy).
- Tests: backend runner **nativo de Node** con `mock.method`; frontend **Vitest 5 + jsdom + Testing Library** (exactas por `save-exact`).
- **Contrato compartido** en `packages/domain-contracts` (JSDoc + validadores runtime, sin TypeScript ni dependencias): el frontend valida `/api/stats` y `/api/sessions` en `*.api.js`; el backend comprueba su salida en tests. Un fallo lanza `ContractError` con la ruta del campo y la UI oculta los datos dependientes.
- **Logging**: middleware propio (`createRequestLogger`), sin `morgan`, registra método, ruta, estado y duración en `console.info`; los errores 500 se registran saneados en `console.error`, sin volcar el body.
- `ErrorBoundary` como **clase** (React lo exige); excepción documentada en `AGENTS.md`. Sin `react-error-boundary` ni jest-dom.
- **Skills de agente versionadas**: `.agents/skills/` y `skills-lock.json` se commitean.
- **SDD operativo**: constitución en `docs/constitution.md`, guía operativa en `AGENTS.md`. Comandos SDD en `.opencode/commands/` con protocolos en `.opencode/commands/protocols/`. `/feature` es orquestador, con `/clarify`, `/validate`, `/statusSDD`, `/task` y `/change`.

## Aprendizajes y errores a evitar

- Mantener `MEMORY.md` y `AGENTS.md` sincronizados con el estado real.
- Un test que pasa no prueba nada: **romper el código a propósito** (mutación). Antes, copiar a `/tmp/opencode`; `git checkout -- <archivo>` solo seguro si ya commiteado; revertir **archivo por archivo**.
- Validar el contrato **en el borde** evita `0m` plausibles pero falsos: si la respuesta no encaja, error visible y sin datos viejos.
- `try/finally` sin `catch` = *Unhandled Rejection* silencioso: mostrar error al usuario.
- Fechas: local, comparar como `YYYY-MM-DD` y por tupla numérica (nunca como texto si puede haber años de 5 cifras). Validar entradas de usuario, recortar solo rangos derivados. En flex items, `width: 100%` puede cortar; usar `flex: 1 1 0` + `min-width`.
- Al subir major con *peers*, revisar `npm ls` y usar `npm dedupe` si hay dos copias.
- No duplicar flujos externos; respetar gates de clarificación/validación.

## Próximos pasos

- Seguir orden de `DEUDA_TECNICA.md`.
- Mantener `npm test` y `npm run lint` en verde antes de cerrar cambios.
