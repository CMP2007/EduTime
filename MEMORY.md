# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- v1 de StudyTrack funcionando: monorepo con frontend (React 19 + **Vite 8**) y backend (Node + Express 5). Pestañas: Inicio (tarjetas + heatmap), Historial (filtros, editar, eliminar) y Estadísticas (periodos, temáticas, clase más larga).
- Persistencia en `backend/data/sessions.json` y `backend/data/themes.json` (ignorados por git): lectura única (single-flight), cola de escrituras, tmp único y fallo explícito si un fichero está corrupto o incoherente.
- **Calidad**: 545 tests — 229 backend (`node --test`) + 264 frontend (Vitest + jsdom + Testing Library) + 29 del contrato + 12 de `domain-dates` + 9 de `domain-themes` + 2 de `domain-constants` — y ESLint en verde. La suite del backend pasa también con `TZ=Europe/Madrid`.
- **Feature 001 (modal accesible)** resuelta; patrones aplicados (accesibilidad, foco, scroll, ErrorBoundary, ApiError).
- **Feature 002 (contrato de datos)** implementada; B0-6 resuelto sin TypeScript.
- **Feature 003 (red/proxy/CORS)** implementada y validada (corrección 2026-11-06): sin CORS en el backend, proxy con `/api` relativa y `.env` de la raíz, host local del frontend y del backend, errores de red en español. El layout a 375 px queda fuera de alcance. `DEUDA_TECNICA.md`: B1-6, B1-7, B1-10 y B1-11 resueltos; B11-7 registrado.
- **Feature 004 (validación de fechas)** implementada y validada (2026-11-10): paquete `domain-dates` (fecha real 1990–9999, comparación por tupla y recorte de rangos); API con 400 por fecha inválida, filtros repetidos y rango invertido; `notice` en `/api/stats`; avisos de rango invertido (Historial) y de recorte (Inicio/Estadísticas). `DEUDA_TECNICA.md`: B3-2, B3-3, B4-4, B8-1 y B9-5 resueltos (36/31/1).
- **Feature 005 (duración parcial)** implementada y validada (2026-11-10): `POST`/`PUT` aceptan horas y minutos juntos o por separado (la parte ausente vale 0); `PUT` sin duración conserva y ajusta a 15–1439; `durationMinutes` directo se ignora. `DEUDA_TECNICA.md`: B4-2 resuelto (37/30/1).
- **B4-3 resuelto (2026-11-10)**: el repositorio de sesiones aísla referencias con `structuredClone` en salida y entrada; tests con campo anidado verificados con mutación. `DEUDA_TECNICA.md`: B4-3 resuelto (38/29/1).
- **B4-5 resuelto (2026-11-10)**: la validación de campos vive en `sessions.validation.js` y la usan el servicio y `buildSeed`; la semilla se valida antes de persistirse. `backend/test/seed.test.js` verificado con mutación. `DEUDA_TECNICA.md`: B4-5 resuelto (39/28/1).
- **Feature 006 (catálogo de temáticas)** implementada y validada (2026-11-14): `packages/domain-themes` (normalización sin tildes, `ñ` conservada, orden español), contrato `Theme`/`Session{themeId,themeName}`, `themes.repository/service/routes`, arranque que valida los datos guardados, siembra bajo demanda (`POST /api/seed`), selector con alta inline, gestor, borrado con reasignación o total, aviso de temáticas creadas y filtro por temática con búsqueda en observaciones. `DEUDA_TECNICA.md`: B5-2 resuelto (40/27/1). Validación final tras corregir el copy del aviso, el foco al abrir el formulario y al cerrar el alta inline, y la carrera del test de Escape. Mutaciones verificadas en normalización, duplicados, longitud, reasignación, arranque, conflicto y reutilización de la semilla, filtros, agrupación por `themeId`, copia y foco (13 reglas, las 13 detectadas).
- **B5-3 resuelto (2026-11-15)**: la racha se memoiza en `stats.service.js` (`createStreakMemo`) con clave «día de referencia + fechas con meta»; sin invalidación explícita y con recálculo al cambiar datos o día. Medido con 3650 clases: ~9 ms → ~1,5 ms por petición. `DEUDA_TECNICA.md`: B5-3 resuelto (41/26/1).
- **B5-4 resuelto (2026-11-15)**: `GOAL_MINUTES` tiene una sola definición en `packages/domain-constants` y backend/frontend la importan desde ahí (refactor `46c0d4c`, que también cerró B0-1); no queda copia en el frontend. Sin cambios de código: lo cubre la suite existente. La meta sigue fija; hacerla configurable sería funcionalidad nueva (`/feature`). `DEUDA_TECNICA.md`: B5-4 resuelto (42/25/1).
- **Deuda verificada (2026-11-17)**: B9-1, B10-2 y B11-7 pasan a resueltos sin cambio de comportamiento (reglas compartidas, periodos en una sola fuente con test y pestañas sin overflow medido a 375/320 px); B7-2, B9-3, B9-4 y B11-4 quedan parciales. `DEUDA_TECNICA.md`: 45/22/1.
- **Feature 007 (orquestación de la app)** implementada y validada (2026-11-17): pestañas con dirección propia (`#/inicio`, `#/historial`, `#/estadisticas`) mediante `navigation/tabs.js` y `navigation/useTabRoute.js` (sin dependencias; hash vacío/desconocido normaliza con `replaceState` y Atrás/Adelante cierran diálogos; reelegir la activa es inocuo porque el navegador ignora el hash repetido); escrituras de clases en `useSessionMutations` (HTTP, flags, error y refresco), `App` solo orquesta; `saving` pasa a prop de `SessionForm`; `deleteMessage.js` usa `formatDateLong` y omite la fecha inválida; aviso de error tras navegar con `StatusNotice`. `DEUDA_TECNICA.md`: B6-3, B6-4 y B6-5 resueltos (48/20/1) y B6-6 registrado (falta el test de reintento tras un error de guardado o borrado).
- **B6-6 resuelto (2026-11-18)**: `frontend/test/App.test.jsx` añade el reintento tras un error de guardado (RF-11) y de borrado (RF-13): el segundo envío tiene éxito, cierra el formulario o el diálogo y limpia el error; verificado por mutación. Es cobertura, sin cambio de comportamiento ni spec nueva. `DEUDA_TECNICA.md`: 49/19/1.

## Decisiones (y por qué)

- Persistencia en JSON con `fs` (sin dependencias). Repositorio como **fábrica** (`createSessionsRepository(store)`) para simular en tests; single-flight, cola de escrituras, tmp único; fichero corrupto → **fallar**, no sobrescribir.
- Un archivo por funcionalidad; backend calcula las métricas (`/api/stats`); meta diaria 180 min; racha = días consecutivos con meta cumplida (global hasta hoy).
- Tests: backend runner **nativo de Node** con `mock.method`; frontend **Vitest 5 + jsdom + Testing Library** (exactas por `save-exact`).
- **Contrato compartido** en `packages/domain-contracts` (JSDoc + validadores runtime, sin TypeScript ni dependencias): el frontend valida `/api/stats` y `/api/sessions` en `*.api.js`; el backend comprueba su salida en tests. Un fallo lanza `ContractError` con la ruta del campo y la UI oculta los datos dependientes.
- **Logging**: middleware propio (`createRequestLogger`), sin `morgan`, registra método, ruta, estado y duración en `console.info`; los errores 500 se registran saneados en `console.error`, sin volcar el body.
- `ErrorBoundary` como **clase** (React lo exige); excepción documentada en `AGENTS.md`. Sin `react-error-boundary` ni jest-dom.
- **Skills de agente versionadas**: `.agents/skills/` y `skills-lock.json` se commitean.
- **SDD operativo**: constitución en `docs/constitution.md`, guía operativa en `AGENTS.md`. Comandos SDD en `.opencode/commands/` con protocolos en `.opencode/commands/protocols/`. `/feature` es orquestador, con `/clarify`, `/validate`, `/statusSDD`, `/task` y `/change`.
- **Enrutado por hash, sin router**: tres pestañas no justifican una dependencia; la URL solo lleva la pestaña (filtros y periodos no) y la normalización usa `replaceState` para no ensuciar el historial.

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
