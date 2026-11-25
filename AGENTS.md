# AGENTS.md

Guía para agentes de IA que trabajen en este repositorio. Léela antes de tocar código.

## Jerarquía documental

`docs/constitution.md` contiene los principios innegociables y **prevalece sobre todo**. `README.md` es la fuente oficial de funcionalidades, reglas de dominio, modelo y API. `AGENTS.md` es la guía operativa: cómo aplicar los principios (capas, tests, convenciones, flujo y comandos). Ante conflicto, se sigue la constitución y se corrige este documento. `AGENTS.md` no duplica reglas de negocio: remite a `README.md`.

## Descripción del proyecto

**StudyTrack**: aplicación para el control de horas de estudio. Ver [`README.md`](README.md) para funcionalidades, reglas y modelo; esta guía explica cómo trabajar con el repositorio.

- **Frontend**: React 19 + Vite (JavaScript/JSX).
- **Backend**: Node.js + Express 5.
- **Persistencia**: archivos JSON (`backend/data/sessions.json` y `backend/data/themes.json`), ignorados por git.
- **Monorepo**: npm workspaces (`frontend` y `backend`).

## Cómo trabajar con el agente

- **Idioma**: textos para el usuario (planes, explicaciones, resúmenes y razonamiento) en español; identificadores y código, en inglés (principio 6).
- **Perfil**: estudiante autodidacta (Full Stack Open, parte 7), nivel básico-intermedio y arquitecto de las decisiones. Explica de forma **detallada y simple**: el objetivo es que aprenda. El usuario supervisa paso a paso, así que antes de actuar muestra qué vas a hacer, por qué, qué esperas y qué dudas hay.
- **Aprobación**: no avances en decisiones de fondo (dependencias, arquitectura, ficheros nuevos importantes) sin aprobación; propón y espera.
- **Formato de propuesta** (hallazgos, cambios, fixes):

  ```text
  Problema:      qué está mal, en concreto
  Consecuencia:  qué se rompe o qué riesgo hay
  Solución:      qué se va a hacer
  Por qué:       y por qué no la alternativa
  ```

- **Arranque de sesión**: `AGENTS.md` ya se inyecta en el contexto; lee `MEMORY.md` y `DEUDA_TECNICA.md`, confirma el contexto y propón un plan antes de tocar código. Si retomas una feature, `/statusSDD` resume el punto exacto.
- **Commits**: Conventional Commits en español (`feat(inicio): …`, `docs: …`, `chore(calidad): …`), asunto **sin tildes**, cuerpo con el qué y el por qué.

## Comandos

Todos se ejecutan desde la raíz.

```bash
npm install          # instala todos los workspaces con las versiones fijadas
npm run dev          # frontend (5173) y backend (3001) juntos
npm run frontend     # solo frontend (vite)
npm run backend      # solo backend (node --watch src/server.js)
npm run build        # build de producción del frontend (vite build)
npm test             # tests de backend, frontend y contrato
npm run lint         # ESLint sobre todo el monorepo
```

- Frontend: http://localhost:5173 · Backend: http://localhost:3001 (`127.0.0.1` por defecto; `HOST=0.0.0.0` lo expone).
- Tests: backend con `node --test` (`backend/test/`), frontend con Vitest + jsdom (`frontend/test/`) y contrato con `node --test` (`packages/domain-contracts`). Convención: `*.test.js` / `*.test.jsx`.
- Linter: ESLint (flat config en `eslint.config.js`).
- `~/.npmrc` fija `save-exact=true` e `ignore-scripts=true`: las dependencias se instalan con versión exacta.

## Estructura

Un archivo = una responsabilidad. Nada de mezclar funcionalidades o roles en un archivo.

```
.opencode/commands/            # comandos del proyecto y protocols/ (clarification, validation)
docs/constitution.md           # principios innegociables
specs/
  _templates/                  # plantillas de spec, plan y tareas
  <NNN>-<slug>/                # spec.md (qué), plan.md (cómo), tasks.md (pasos)
packages/
  domain-constants/            # reglas de dominio compartidas
  domain-dates/                # isValidDateString, compareDateStrings, clampDateRange
  domain-contracts/            # contrato de la API (typedefs + assert/validate runtime)
  domain-themes/               # normalizeThemeName, isSameThemeName, compareThemeNames
backend/src/
  server.js, serverConfig.js, app.js, errors.js
  storage/fileStore.js         # lectura/escritura atómica de los JSON
  startup/validateStoredData.js  # valida los datos guardados antes de servir
  middleware/requestLogger.js  # logging de peticiones
  sessions/                    # repository (datos), validation (campos), service (reglas), routes (HTTP)
  themes/                      # repository, validation, service (reasignación), routes
  seed/                        # datos de ejemplo bajo demanda (POST /api/seed)
  stats/                       # racha, periodos, temáticas, heatmap (/api/stats)
  utils/date.js                # utilidades de fecha y periodos
backend/test/                  # espejo de backend/src/; la capa de datos se simula
frontend/vitest.config.js      # configuración de Vitest + jsdom
frontend/test/                 # espejo de frontend/src/; setup.js y fixtures/contracts.js
frontend/src/
  main.jsx, App.jsx            # entrada y orquestador (sin acceso a datos)
  api/                         # client.js (fetch) y ApiError.js
  components/                  # Modal, Tabs, Card, ErrorBoundary…
  context/DataRefreshContext.jsx  # versiones de sesiones, estadísticas y temáticas
  hooks/                       # hooks genéricos (useDebouncedValue)
  navigation/                  # pestañas, direcciones y hook de ruta
  seed/                        # aviso de datos de ejemplo: api + diálogo
  sessions/                    # api, hooks, formulario, historial
  stats/                       # api, hook, tarjetas, heatmap
  themes/                      # api, hook, selector, gestor y borrado
  utils/                       # helpers de tiempo y fecha
  styles.css                   # estilos globales
```

### Modelo, reglas y API (fuente oficial: [`README.md`](README.md))

Reglas de negocio, modelo (`Theme` y `Session` con `themeId`/`themeName`) y endpoints (`/api/sessions`, `/api/themes`, `/api/seed`, `/api/stats`) se mantienen en `README.md`. Esta guía conserva lo operativo: capas, convenciones y flujo SDD.

## Convenciones de código

- **ES Modules** (`import`/`export`) en backend y frontend; los `package.json` usan `"type": "module"`.
- **Idioma**: identificadores y nombres técnicos en inglés; textos de UI, errores y comentarios en español (principio 6).
- **Backend**: `server.js` solo arranca; rutas en `*.routes.js`, lógica en `*.service.js`, datos en `*.repository.js` (principio 3).
- **Repositorios**: patrón fábrica (`createXRepository(store)`) con almacenamiento inyectable para poder simularlo en tests. Devuelven copias (`{ ...item }`).
- **Frontend**: un componente por archivo; datos en hooks (`use*.js`) y HTTP en `*.api.js`.
- **Contrato de datos**: `packages/domain-contracts` es la fuente única de `/api/themes`, `/api/stats` y `/api/sessions`. El frontend valida con `assertTheme`, `assertThemeList`, `assertStats`, `assertSession` o `assertSessionList`; el backend usa las mismas funciones en sus tests. Se valida presencia, tipo y obligatoriedad (no formatos ni reglas de negocio) y se toleran campos extra. Un fallo lanza `ContractError` con la ruta del primer campo inválido (`summary.totalMinutes`, `[1].durationMinutes`).
- **Temáticas**: `packages/domain-themes` es la fuente única para normalizar (`normalizeThemeName`), comparar duplicados (`isSameThemeName`) y ordenar (`compareThemeNames`). Se conserva el nombre visible; la comparación ignora extremos, mayúsculas y tildes.
- **Fechas**: `packages/domain-dates` es la fuente única para validar (`isValidDateString`), comparar por tupla (`compareDateStrings`) y recortar rangos derivados (`clampDateRange`). Las entradas de usuario se validan, nunca se recortan; solo los rangos del sistema se recortan a 1990-01-01–9999-12-31 y, si cambian, la API lo comunica en `notice`.
- **Arranque**: `backend/src/startup/validateStoredData.js` valida los datos guardados antes de servir (clase con `themeId` existente, sin `title` antiguo). Un dato incoherente falla con mensaje explícito y no sobrescribe nada. Los datos de ejemplo solo se escriben con `POST /api/seed`, nunca al arrancar.
- **Estilo**: punto y coma, comillas simples, 2 espacios, funciones flecha, sin clases (excepción: `ErrorBoundary` por `componentDidCatch`).
- El frontend usa `/api` relativo (sin `VITE_API_URL`); el proxy de Vite lo reenvía al backend, configurable con `VITE_PROXY_TARGET` en el entorno o en el `.env` de la raíz (el proceso tiene prioridad; por defecto `http://localhost:3001`).
- El backend no usa CORS ni emite `Access-Control-Allow-Origin`; escucha en `127.0.0.1` y solo se expone con `HOST` explícito.
- **Tests backend**: `node:test` + `node --test`, sin dependencias, en `backend/test/`. La capa de datos se simula con `mock.method`; la excepción es `fileStore`, que se prueba con ficheros reales temporales.
- **Tests frontend**: Vitest en modo run con jsdom, en `frontend/test/`. **Sin `globals`**: se importan `describe`/`it`/`expect` de `vitest`; el cleanup está en `frontend/test/setup.js`. Se mockean `*.api.js` con `vi.mock` y `fetch` con `vi.stubGlobal`.
- **Tests**: todo cambio de comportamiento lleva un test que falle sin él (rojo → verde). En un fix con test preexistente, ajústalo hasta verlo en rojo.
- **Mutación (solo en `/validate` o verificación detallada)**: copiar antes a `/tmp/opencode` y restaurar con `cp`; revertir con git **archivo por archivo**, nunca una carpeta entera. `git checkout -- <archivo>` solo es seguro si está commiteado; sobre cambios sin commitear los borra.
- **Lint**: ESLint con las reglas recomendadas, las de hooks de React y el estilo declarado. No impone opiniones no documentadas (paréntesis en flechas, saltos de línea en JSX…).

## Reglas al modificar el proyecto

Aplican los principios de [`docs/constitution.md`](docs/constitution.md); si hay conflicto, prevalece la constitución.

1. **Dependencias**: justifica que lo existente no basta y espera aprobación (principio 1). Consulta `npm outdated`; versiones exactas, nunca `@latest`.
2. **Capas**: `repository` / `service` / `routes` en backend; `*.api.js` / `use*.js` / componente en frontend (principio 3).
3. **Un archivo, una responsabilidad**: no mezclar funcionalidades ni roles (principio 3).
4. **Validación**: valida toda entrada del usuario en el backend antes de usarla.
5. **Persistencia**: datos en `backend/data/*.json` (ignorados por git), nunca solo en memoria; IDs estables; escritura atómica y fallo ante JSON corrupto o incoherente (principio 5).
6. **Documentación**: al añadir funcionalidad, actualiza `README.md`; `AGENTS.md` solo si cambian estructura, convenciones o comandos; `MEMORY.md` si aporta valor.
7. **Spec**: funcionalidad o cambio de comportamiento → `/feature` desde `specs/_templates/`, con spec aprobada antes de codificar. Bugs, docs y refactors sin cambio observable no requieren spec (principio 2). `/task` no salta el gate; un requisito nuevo va por `/change` o `/feature`.
8. **Puerta de calidad**: `npm test` y `npm run lint` en verde antes de terminar (principio 4).
9. **Clarificación**: antes de aprobar spec, plan o tareas, aplica `protocols/clarification.md`; `/feature` lo hace en cada etapa y `/clarify` permite reanalizar a mano. Un bloqueante se resuelve antes de avanzar.
10. **Validación**: antes de cerrar una feature, aplica `protocols/validation.md`; `/validate` lo ejecuta a mano y comprueba la matriz RF → test, `npm test`, lint, mutación y UI. Un bloqueante impide cerrar.

## Notas

- `MEMORY.md` es el diario de estudio del proyecto (estado, decisiones, aprendizajes). Revisarlo al empezar una sesión.
- `.opencode/commands/` contiene los comandos del proyecto: `feature.md` (flujo completo), `clarify.md` (QA de artefactos), `validate.md` (validación de la implementación), `statusSDD.md` (estado y siguiente paso), `task.md` (una tarea), `change.md` (cambio de requisito) y `tokens.md` (consumo real de tokens y pasos por sesión).
