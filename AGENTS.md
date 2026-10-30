# AGENTS.md

Guía para agentes de IA que trabajen en este repositorio. Léela antes de tocar código.

## Jerarquía documental

- `README.md` es la **fuente oficial** de funcionalidades, reglas de dominio, modelo y API.
- `AGENTS.md` es la **guía operativa** para agentes: cómo trabajar con el proyecto, convenciones de código, capas, flujo SDD y comandos.
- `docs/constitution.md` prevalece sobre todos.
- `AGENTS.md` no debe duplicar reglas de negocio ni funcionalidad; debe remitir a `README.md` y conservar lo operativo (capas, tests, convenciones, flujo).

La **constitución** ([`docs/constitution.md`](docs/constitution.md)) contiene los principios
innegociables y prevalece sobre este documento. `AGENTS.md` es la guía operativa: explica cómo
aplicarlos (comandos, estructura, convenciones y flujo de trabajo). Ante cualquier conflicto, se
sigue la constitución y se corrige este documento.

## Descripción del proyecto

**StudyTrack**: aplicación para el control de horas de estudio. Ver [`README.md`](README.md) para funcionalidades, reglas y modelo; esta guía (`AGENTS.md`) explica cómo trabajar con el repositorio.

- **Frontend**: React 19 + Vite (JavaScript/JSX).
- **Backend**: Node.js + Express 5.
- **Persistencia**: archivo JSON (`backend/data/sessions.json`).

Es un monorepo con **npm workspaces** (`frontend` y `backend`).

## Cómo trabajar con el agente

- **Idioma**: texto dirigido al usuario (planes, explicaciones, resúmenes y razonamiento) en
  español; identificadores y código, en inglés (principio 6).
- **Perfil del usuario**: estudiante autodidacta (Full Stack Open, parte 7), con nivel
  básico-intermedio de JavaScript, React y Express, y arquitecto de las decisiones del
  proyecto. Por eso las explicaciones deben ser **más detalladas y simples de lo normal**:
  el objetivo es que aprenda, no solo que el cambio funcione.
- **Razonamiento visible**: antes de actuar, explicar qué se va a hacer, por qué, qué se
  espera obtener y qué dudas hay. El usuario supervisa paso a paso: mejor pecar de
  explicativo que quedarse corto.
- **Aprobación**: no avanzar en decisiones de fondo (dependencias, arquitectura, ficheros
  nuevos importantes) sin aprobación; proponer y esperar.
- **Formato de propuesta** (hallazgos, cambios, fixes):

  ```text
  Problema:      qué está mal, en concreto
  Consecuencia:  qué se rompe o qué riesgo hay
  Solución:      qué se va a hacer
  Por qué:       y por qué no la alternativa
  ```

- **Arranque de sesión**: leer `AGENTS.md` → `MEMORY.md` → `DEUDA_TECNICA.md`, confirmar el
  contexto y proponer un plan antes de tocar código. Si retomas una feature, `/statusSDD` resume
  el punto exacto.
- **Commits**: Conventional Commits en español (`feat(inicio): …`, `docs: …`,
  `chore(calidad): …`), asunto **sin tildes**, cuerpo con el qué y el por qué.

## Comandos

Todos se ejecutan desde la raíz.

```bash
npm install          # instala dependencias de todos los workspaces (usa las versiones fijadas en package.json)
npm run dev          # levanta frontend (5173) y backend (3001) juntos
npm run frontend     # solo frontend (vite --host 0.0.0.0)
npm run backend      # solo backend (node --watch src/server.js)
npm run build        # build de producción del frontend (vite build)
npm test             # tests de todos los workspaces (backend, frontend y contrato)
npm run lint         # ESLint sobre todo el monorepo
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- **Tests backend**: runner nativo de Node (`node --test`), sin dependencias. Viven en
  `backend/test/` (espejo de `src/`). Convención: `*.test.js`.
- **Tests frontend**: Vitest + jsdom + Testing Library. Viven en `frontend/test/` (espejo de
  `src/`); config en `frontend/vitest.config.js`. Convención: `*.test.js` / `*.test.jsx`.
- **Tests del contrato**: paquete `packages/domain-contracts` con el runner nativo de Node
  (`node --test`). `npm test` los incluye por workspace. Convención: `*.test.js`.
- **Linter**: ESLint (flat config en la raíz, `eslint.config.js`).
- **`~/.npmrc`**: fija `save-exact=true` e `ignore-scripts=true` (config global del usuario);
  por eso las dependencias se instalan con versión exacta.

## Estructura

Un archivo = una responsabilidad. Nada de mezclar funcionalidades o roles en un archivo.

```
.opencode/commands/            # comandos SDD (feature, clarify, validate, status, task, change)
docs/constitution.md           # principios innegociables del proyecto
.opencode/commands/protocols/clarification.md          # protocolo QA de spec, plan y tareas
.opencode/commands/protocols/validation.md             # protocolo de validación de artefactos y código
specs/
  _templates/                  # plantillas de spec, plan y tareas
  <NNN>-<slug>/                # una carpeta por funcionalidad
    spec.md                    # qué y por qué (EARS, sin implementación)
    plan.md                    # cómo (enfoque técnico y mapa RF → test)
    tasks.md                   # pasos verificables, con test y «hecho cuando»

packages/
  domain-constants/           # constantes de dominio compartidas entre backend y frontend
    index.js                  # fuente única de verdad para reglas de dominio
  domain-contracts/           # contrato de las respuestas de la API (tipos + validación runtime)
    index.js                  # typedefs JSDoc, ContractError y validadores assert/validate
    test/contracts.test.js    # casos del contrato (válidos, campos ausentes, listas)

backend/src/
  server.js                    # arranque del servidor (puerto 3001, variable PORT)
  app.js                       # monta las rutas /api y maneja errores
  errors.js                    # errores compartidos (AppError, ValidationError)
  storage/fileStore.js         # lectura/escritura del JSON en disco
  utils/date.js                # utilidades de fecha y periodos
  sessions/
    sessions.repository.js     # CRUD sobre el almacenamiento (fábrica: createSessionsRepository)
    sessions.service.js        # validación + reglas de negocio
    sessions.routes.js         # endpoints /api/sessions
    seed.js                    # datos de ejemplo iniciales
  stats/
    stats.service.js           # racha, periodos, temáticas, heatmap
    stats.routes.js            # endpoint /api/stats

backend/test/                  # tests (espejo de backend/src/)
  app.test.js                  # respuestas HTTP y manejo de errores de la app
  date.test.js                 # utilidades de fecha y periodos
  fileStore.test.js            # lectura/escritura del JSON (ficheros reales temporales)
  sessions.repository.test.js  # carreras/concurrencia con el almacenamiento simulado
  sessions.service.test.js     # contrato de creación/listado con el repositorio simulado
  stats.service.test.js        # estadísticas con el repositorio simulado

frontend/
  vitest.config.js             # configuración de los tests (Vitest + jsdom)
  test/                        # tests (espejo de frontend/src/)
    setup.js                   # registro global: cleanup de Testing Library
    fixtures/contracts.js      # datos válidos de Stats/Session para los tests

frontend/src/
  main.jsx                     # punto de entrada de React
  App.jsx                      # layout + pestaña activa + modales globales
  api/ApiError.js              # error de API que conserva el status HTTP
  api/client.js                # fetch genérico a la API (lanza ApiError)
  components/                  # componentes reutilizables (Modal, Tabs, Card, ErrorBoundary…)
  sessions/                    # feature de clases: api, hook, formulario, historial
  stats/                       # feature de métricas: api, hook, tarjetas, heatmap
  utils/                       # helpers de tiempo y fecha
  styles.css                   # estilos globales
```

### Modelo, reglas y API (fuente oficial: [`README.md`](README.md))

Reglas de negocio, modelo (`id`/`title`/`date`/`durationMinutes`/`notes`) y endpoints (`/api/sessions`, `/api/stats`) se mantienen en `README.md`. Esta guía conserva lo operativo: capas, convenciones y flujo SDD.

## Convenciones de código

- **ES Modules** (`import`/`export`) en backend y frontend. Los `package.json` usan `"type": "module"`.
- **Idioma**: identificadores y nombres técnicos en inglés; textos de UI, errores y comentarios en
  español (principio 6).
- **Backend**: `server.js` solo arranca; rutas en `*.routes.js`, lógica en `*.service.js`, datos en
  `*.repository.js` (principio 3).
- **Repositorios**: cualquier repositorio nuevo sigue el patrón fábrica (`createXRepository(store)`) con el almacenamiento inyectable, para poder simularlo en tests.
- **Frontend**: un componente por archivo. La lógica de datos en hooks (`use*.js`) y las llamadas HTTP en `*.api.js`.
- **Contrato de datos**: `packages/domain-contracts` es la fuente única de la forma de
  `/api/stats` y `/api/sessions`. El frontend valida la respuesta en `*.api.js` con `assertStats`,
  `assertSession` o `assertSessionList`; el backend comprueba su salida en los tests con las
  mismas funciones. Se valida presencia, tipo y obligatoriedad (no formatos de fecha ni reglas de
  negocio) y se toleran campos adicionales. Un fallo lanza `ContractError` con la ruta del primer
  campo inválido (`summary.totalMinutes`, `[1].durationMinutes`).
- **Estilo**: punto y coma al final, comillas simples, indentación de 2 espacios, funciones flecha, sin clases (excepción: `ErrorBoundary`, que React exige como clase para `componentDidCatch`).
- Los repositorios y servicios devuelven copias (`{ ...item }`) para no exponer el estado interno.
- El frontend usa `VITE_API_URL` (por defecto `http://localhost:3001/api`); el proxy de Vite ya reenvía `/api`.
- **Tests backend**: runner nativo de Node (`node:test` + `node --test`), sin dependencias. Un archivo `*.test.js` por módulo bajo prueba, en `backend/test/`. La capa de datos se **simula** con `mock.method` (no se toca el disco); la excepción es `fileStore`, cuyo comportamiento **es** el disco y se prueba con ficheros reales en un directorio temporal. El repositorio es una fábrica con punto de inyección del almacenamiento para poder simularlo.
- **Tests frontend**: Vitest en modo run (`vitest run`) con entorno jsdom. **Sin `globals`**: los tests importan `describe`/`it`/`expect` de `vitest` explícitamente; el cleanup de Testing Library está registrado en `frontend/test/setup.js`. Se mockean los módulos `*.api.js` con `vi.mock` (no hay red) y `fetch` con `vi.stubGlobal` cuando se prueba el cliente. Antes de cerrar un fix, comprobar que su test **falla si se revierte el cambio** (mutación).
- **Pruebas de mutación**: antes de romper el código a propósito, copiar los archivos a
  `/tmp/opencode` y restaurarlos con `cp`; revertir con git **archivo por archivo**, nunca una
  carpeta entera (`git checkout -- <dir>` se lleva cambios buenos). `git checkout -- <archivo>`
  solo es seguro si el archivo ya está commiteado; sobre cambios sin commitear los borra.
- **Lint**: ESLint impone las reglas recomendadas de JavaScript, las de hooks de React y el estilo declarado (2 espacios, comillas simples, punto y coma). No impone opiniones no documentadas (paréntesis en flechas, saltos de línea en JSX…).

## Reglas al modificar el proyecto

Aplican los principios de [`docs/constitution.md`](docs/constitution.md); si hay conflicto,
prevalece la constitución.

1. **Dependencias**: justifica que lo existente no basta y espera aprobación (principio 1). Antes
   de proponer, consulta `npm outdated`; usa versiones exactas y nunca `@latest`.
2. **Capas**: `repository` (datos) / `service` (reglas) / `routes` (HTTP) en backend; `*.api.js`
   (HTTP) / `use*.js` (estado) / componente (UI) en frontend (principio 3).
3. **Un archivo, una responsabilidad**: no mezclar funcionalidades ni roles (principio 3).
4. **Validación**: valida toda entrada del usuario en el backend antes de usarla.
5. **Persistencia**: datos en `backend/data/sessions.json` (ignorado por git), nunca solo en
   memoria; IDs estables; escritura atómica y fallo ante JSON corrupto. Seguridad: principio 5.
6. **Documentación**: al añadir una funcionalidad, actualiza `README.md` (funcionalidades,
   reglas, modelo o API) y `AGENTS.md` solo si cambia la estructura, las convenciones o los
   comandos. Actualiza `MEMORY.md` si aporta valor.
7. **Spec**: para funcionalidad o cambio de comportamiento, usa `/feature`, parte de
   `specs/_templates/` y deja la spec aprobada en `specs/<feature>/spec.md` antes de codificar.
   Bugs, docs y refactors sin cambio observable no requieren spec (principio 2). `/task` no
   salta este gate; para un requisito nuevo usa `/change` o `/feature`.
8. **Puerta de calidad**: `npm test` y `npm run lint` en verde antes de terminar (principio 4).
9. **Clarificación**: antes de aprobar una spec, un plan o unas tareas, aplica el protocolo de
   `.opencode/commands/protocols/clarification.md`. `/feature` lo hace en cada etapa; `/clarify` permite reanalizar un
   artefacto a mano en modo solo lectura. Un hallazgo bloqueante se resuelve antes de avanzar.
10. **Validación**: antes de cerrar una feature, aplica `.opencode/commands/protocols/validation.md`. `/validate` lo
    ejecuta a mano sin lanzar `/feature`; comprueba la matriz RF → test, `npm test`, lint,
    mutación y UI. Un bloqueante impide cerrar.

## Notas

- `MEMORY.md` es el diario de estudio del proyecto (estado, decisiones, aprendizajes). Revisarlo al empezar una sesión.
- `.opencode/commands/` contiene los comandos SDD: `feature.md` (flujo completo), `clarify.md`
  (QA de artefactos), `validate.md` (validación de la implementación), `statusSDD.md` (estado y
  siguiente paso), `task.md` (una tarea) y `change.md` (cambio de requisito).
