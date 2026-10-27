# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- v1 de StudyTrack funcionando: monorepo con frontend (React 19 + **Vite 8**) y backend (Node + Express 5). Pestañas: Inicio (tarjetas + heatmap), Historial (filtros, editar, eliminar) y Estadísticas (periodos, temáticas, clase más larga).
- Persistencia en `backend/data/sessions.json` (ignorado por git): lectura única (single-flight), cola de escrituras, tmp único y fallo explícito si el fichero está corrupto.
- **Calidad**: 87 tests — 59 backend (`node --test`) + 28 frontend (Vitest + jsdom + Testing Library) — y ESLint en verde.
- **Feature 001 (modal accesible)** resuelta; patrones aplicados (accesibilidad, foco, scroll, ErrorBoundary, ApiError).

## Decisiones (y por qué)

- Persistencia en JSON con `fs` (sin dependencias). Repositorio como **fábrica** (`createSessionsRepository(store)`) para simular en tests; single-flight, cola de escrituras, tmp único; fichero corrupto → **fallar**, no sobrescribir.
- Un archivo por funcionalidad; backend calcula las métricas (`/api/stats`); meta diaria 180 min; racha = días consecutivos con meta cumplida (global hasta hoy).
- Tests: backend runner **nativo de Node** con `mock.method`; frontend **Vitest 5 + jsdom + Testing Library** (exactas por `save-exact`).
- `ErrorBoundary` como **clase** (React lo exige); excepción documentada en `AGENTS.md`. Sin `react-error-boundary` ni jest-dom.
- **Skills de agente versionadas**: `.agents/skills/` y `skills-lock.json` se commitean.
- **SDD operativo**: constitución en `docs/constitution.md`, guía operativa en `AGENTS.md`. Comandos SDD en `.opencode/commands/` con protocolos en `.opencode/commands/protocols/`. `/feature` es orquestador, con `/clarify`, `/validate`, `/statusSDD`, `/task` y `/change`.

## Aprendizajes y errores a evitar

- Mantener `MEMORY.md` y `AGENTS.md` sincronizados con el estado real.
- Un test que pasa no prueba nada: **romper el código a propósito** (mutación). Antes, copiar a `/tmp/opencode`; `git checkout -- <archivo>` solo seguro si ya commiteado; revertir **archivo por archivo**.
- `try/finally` sin `catch` = *Unhandled Rejection* silencioso: mostrar error al usuario.
- Fechas: local, comparar como `YYYY-MM-DD`. En flex items, `width: 100%` puede cortar; usar `flex: 1 1 0` + `min-width`.
- Al subir major con *peers*, revisar `npm ls` y usar `npm dedupe` si hay dos copias.
- No duplicar flujos externos; respetar gates de clarificación/validación.

## Próximos pasos

- Seguir orden de `DEUDA_TECNICA.md`.
- Mantener `npm test` y `npm run lint` en verde antes de cerrar cambios.
