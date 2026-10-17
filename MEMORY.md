#### #MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

#### ##Estado actual

- v1 de StudyTrack funcionando: monorepo con frontend (React 18 + **Vite 8**) y backend
  (Node + Express 4). Pestañas: Inicio (tarjetas + heatmap), Historial (filtros, editar,
  eliminar) y Estadísticas (periodos, temáticas, clase más larga).
- Persistencia en `backend/data/sessions.json` (ignorado por git): lectura única
  (single-flight), cola de escrituras, tmp único y fallo explícito si el fichero está corrupto.
- **Calidad**: 68 tests — 55 backend (`node --test`) + 13 frontend (Vitest + jsdom + Testing
  Library) — y ESLint en verde. Tests de frontend en `frontend/test/` (espejo de `src/`),
  sin `globals`, con `vi.mock` de las APIs y `vi.stubGlobal` de `fetch`.
- **Punto 3 (manejo de errores) resuelto** (17/10/2026): JSON malformado → 400 (4xx sin
  stacktrace en el log); `ErrorBoundary` (clase) en el `<main>` con `key={tab}`; `catch` +
  prop `error` en el borrado (`App.jsx`/`ConfirmDialog`); `ApiError` con `status`;
  `StatsPanel` combina `useStats` y `useSessions`. 19 tests nuevos, verificados por mutación.
- **Dependencias**: Vite 5→8.3.4 (+ plugin-react 6.1.2) → `npm audit` 0 vulnerabilidades
  (fin de B1-8). Pendientes (B1-9, sesión siguiente antes del punto 4): React 19, Express 5,
  concurrently 10.

#### ##Decisiones (y por qué)

- Persistencia en JSON con `fs` (sin dependencias). El repositorio es una **fábrica**
  (`createSessionsRepository(store)`) para poder simularlo en tests; single-flight, cola de
  escrituras y tmp único (B0-3); fichero corrupto → **fallar**, no sobrescribir (B3-1).
- Un archivo por funcionalidad; backend calcula las métricas (`/api/stats`); meta diaria
  180 min; racha = días consecutivos con meta cumplida (global hasta hoy).
- Tests: backend runner **nativo de Node** con `mock.method` (sin disco); frontend **Vitest 5
  + jsdom + Testing Library** (versiones exactas por `save-exact`).
- **Vite 8 antes que los tests de frontend**: Vitest 5 exige Vite ≥6; subir el build primero
  evita rehacer la config de tests (criterio: no repetir trabajo).
- `ErrorBoundary` como **clase**: React lo exige (`componentDidCatch`); excepción a la
  regla "sin clases" documentada en `AGENTS.md`. Sin `react-error-boundary` ni jest-dom.
- ESLint solo impone el estilo ya declarado. Duración en dos campos (horas + minutos),
  mínimo 15 min por clase.

#### ##Aprendizajes y errores a evitar

- Mantener `MEMORY.md` y `AGENTS.md` sincronizados con el estado real del proyecto.
- Un test que pasa no prueba nada: **romper el código a propósito** (mutación). Antes, copiar
  los ficheros a `/tmp/opencode`; revertir git **archivo por archivo**, nunca una carpeta.
- `try/finally` sin `catch` = *Unhandled Rejection* silencioso: siempre mostrar el error al
  usuario (patrón: prop `error` en `ConfirmDialog`).
- Cuidado con las fechas: fecha local y comparar como `YYYY-MM-DD`. CSS: en un flex item,
  `width: 100%` cuenta para el corte; usar `flex: 1 1 0` + `min-width`.

#### ##Próximos pasos

- **Sesión siguiente, antes del punto 4**: B1-9 — subir majors pendientes (React 19, Express 5,
  concurrently 10) con la suite como red de seguridad.
- Culminación (B0-7): tests de integración ampliados y E2E con Playwright (dependencia aparte).
- Posibles mejoras: exportar datos, gráficos de evolución, temas de color; y seguir el orden
  de `DEUDA_TECNICA.md`.
