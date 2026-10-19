#### #MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

#### ##Estado actual

- v1 de StudyTrack funcionando: monorepo con frontend (React 19 + **Vite 8**) y backend
  (Node + Express 4). Pestañas: Inicio (tarjetas + heatmap), Historial (filtros, editar,
  eliminar) y Estadísticas (periodos, temáticas, clase más larga).
- Persistencia en `backend/data/sessions.json` (ignorado por git): lectura única
  (single-flight), cola de escrituras, tmp único y fallo explícito si el fichero está corrupto.
- **Calidad**: 68 tests — 55 backend (`node --test`) + 13 frontend (Vitest + jsdom + Testing
  Library) — y ESLint en verde. Tests de frontend en `frontend/test/` (espejo de `src/`),
  sin `globals`, con `vi.mock` de las APIs y `vi.stubGlobal` de `fetch`.
- **Punto 3 (manejo de errores) resuelto** (17/10/2026): JSON malformado → 400 (4xx sin
  stacktrace en el log); `ErrorBoundary` en `<main>` con `key={tab}`; `ApiError` con
  `status` y prop `error` en `ConfirmDialog`. 19 tests nuevos, verificados por mutación.
- **Dependencias al día (B1-9 cerrado, 18/10/2026)**: `react`/`react-dom` **19.3.1**, `express`
  **5.3.0**, `concurrently` **10.0.6** (versiones exactas, `npm outdated` vacío, `npm audit` 0
  vulnerabilidades). Sin cambios de código: RTL 16 reutilizó los 13 tests y los tests HTTP de
  Express sirvieron de red. Ojo: tras instalar React 19 quedó la 18 hoisteada como peer de RTL
  (lockfile); `npm dedupe` la colapsó a una única 19.

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
- **Skills de agente versionadas**: `.agents/skills/` y `skills-lock.json` se commitean
  (config de proyecto, como `AGENTS.md`; el lockfile aporta reproducibilidad y detección
  de alteraciones, igual que `package-lock.json`). `.gitignore` solo para artefactos y
  estado desechable de máquina.

#### ##Aprendizajes y errores a evitar

- Mantener `MEMORY.md` y `AGENTS.md` sincronizados con el estado real del proyecto.
- Un test que pasa no prueba nada: **romper el código a propósito** (mutación). Antes, copiar
  los ficheros a `/tmp/opencode`; revertir git **archivo por archivo**, nunca una carpeta.
- `try/finally` sin `catch` = *Unhandled Rejection* silencioso: siempre mostrar el error al
  usuario (patrón: prop `error` en `ConfirmDialog`).
- Cuidado con las fechas: fecha local y comparar como `YYYY-MM-DD`. CSS: en un flex item,
  `width: 100%` cuenta para el corte; usar `flex: 1 1 0` + `min-width`.
- Al subir un major de una librería con *peers* (p. ej. React), revisar `npm ls <paquete> --all`:
  el lockfile puede conservar la resolución peer vieja y quedar **dos copias**; `npm dedupe`
  la colapsa. `git status` limpio antes de tocar dependencias = revert seguro.
- Una skill cuyo `SKILL.md` solo redirige es un punto muerto si la skill destino no está
  instalada; verificar el destino antes de darla por puesta. `grill-me`: el protocolo va
  dentro de su propio `SKILL.md` (`.agents/skills/`, invocación solo manual).

#### ##Próximos pasos

- **Siguiente**: encarar el **punto 4** (B1-9 quedó atrás: majors subidos con la suite en verde).
- Culminación (B0-7): tests de integración ampliados y E2E con Playwright (dependencia aparte).
- Posibles mejoras: exportar datos, gráficos de evolución, temas de color; y seguir el orden
  de `DEUDA_TECNICA.md`.
