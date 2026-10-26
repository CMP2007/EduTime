#### #MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

#### ##Estado actual

- v1 de StudyTrack funcionando: monorepo con frontend (React 19 + **Vite 8**) y backend
  (Node + Express 5). Pestañas: Inicio (tarjetas + heatmap), Historial (filtros, editar,
  eliminar) y Estadísticas (periodos, temáticas, clase más larga).
- Persistencia en `backend/data/sessions.json` (ignorado por git): lectura única
  (single-flight), cola de escrituras, tmp único y fallo explícito si el fichero está corrupto.
- **Calidad**: 87 tests — 59 backend (`node --test`) + 28 frontend (Vitest + jsdom + Testing
  Library) — y ESLint en verde. Tests de frontend en `frontend/test/` (espejo de `src/`),
  sin `globals`, con `vi.mock` de las APIs y `vi.stubGlobal` de `fetch`. **B3-4/B2-2 resueltos**
  (25/10/2026): periodos inválidos → 400; `ValidationError` compartido en `backend/src/errors.js`.
- **Feature 001 (modal accesible) resuelta** (22/10/2026): `Modal` atrapa el foco (Tab y
  Shift+Tab), enfoca el primer campo/botón/cuerpo al abrir, restaura el foco al disparador
  (o a `main` si desapareció), bloquea el scroll del `body` y ya no cierra al pulsar el fondo.
  Deuda **B8-2** cerrada; 15 tests nuevos verificados por mutación. Spec en
  `specs/001-modal-accesible/`.
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
- **Constitución y SDD (22/10/2026)**: `docs/constitution.md` es la constitución del proyecto y
  `AGENTS.md` su guía operativa resumida; el trabajo por funcionalidad vivirá en artefactos
  versionados (`specs/`). `CONTEXTO_SESION.md` se elimina: su contenido exclusivo
  (idioma/razonamiento, perfil, plantilla de propuesta, commits, orden de lectura) se consolidó
  en `AGENTS.md` y `MEMORY.md`.
- **Comandos SDD propios (26/10/2026)**: se conserva `/feature` como orquestador y se añaden
  `/validate`, `/statusSDD`, `/task` y `/change`; los 9 comandos externos no se copian (duplican
  el flujo, algunos usan `agent: plan` para escribir y no respetan los gates). Los comandos
  comparten `docs/clarification.md` y `docs/validation.md`; no se llaman entre sí.

#### ##Aprendizajes y errores a evitar

- Mantener `MEMORY.md` y `AGENTS.md` sincronizados con el estado real del proyecto.
- Un test que pasa no prueba nada: **romper el código a propósito** (mutación). Antes, copiar
  los ficheros a `/tmp/opencode`; `git checkout -- <archivo>` solo es seguro si ya está
  commiteado; revertir **archivo por archivo**, nunca una carpeta.
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
- **Protocolo de clarificación (25/10/2026)**: la revisión QA de spec, plan y tareas vive en
  `docs/clarification.md`; `/feature` la aplica en cada gate y `/clarify` la ejecuta a mano en
  modo solo lectura. Los comandos no se llaman entre sí: comparten el documento.
- **Contraste con una skill SDD externa (25/10/2026)**: su flujo era redundante y su plan
  hardcodeaba `node --test`; se adoptaron `Definiciones`, el estado `implementada`, el patrón
  EARS permanente, una heurística suave de tamaño de tarea y una nota opcional de pseudocódigo
  y funciones puras de fecha. No se duplicó el flujo.
- **Validación separada del cierre (26/10/2026)**: `docs/validation.md` es la fuente única para
  `/validate` y el cierre de `/feature`; `npm test` cubre Vitest y Chrome no lo sustituye.

#### ##Próximos pasos

- **SDD operativo**: plantillas en `specs/_templates/{spec,plan,tasks}.md`, protocolos en
  `docs/clarification.md` y `docs/validation.md`; `/feature` guía spec → clarificación → plan →
  clarificación → tareas → clarificación → implementación, con aprobación antes de cada gate.
  Comandos manuales: `/clarify` (artefactos), `/validate` (implementación), `/statusSDD` (estado),
  `/task` (una tarea) y `/change` (delta de requisito). La constitución, la guía y la feature
  001 quedaron en los commits `58a7e8e`…`24f5d65`; los comandos manuales nuevos se cierran en
  el commit del SDD (26/10/2026).
- Después, retomar el siguiente punto pendiente de `DEUDA_TECNICA.md`.
- Culminación (B0-7): tests de integración ampliados y E2E con Playwright (dependencia aparte).
- Posibles mejoras: exportar datos, gráficos de evolución, temas de color; y seguir el orden
  de `DEUDA_TECNICA.md`.
