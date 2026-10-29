# Plan 002 — Contrato de datos de la API

> Spec: specs/002-contrato-datos/spec.md
> Estado: aprobado (2026-10-29)

## Contexto técnico

- El frontend habla con la API a través de `frontend/src/api/client.js` (`request`), y de ahí
  pasan `stats.api.js` y `sessions.api.js`. Los hooks `useStats` y `useSessions` ya guardan
  `error.message` y las pantallas ya tienen una zona de error (`StatsPanel`, `StatsDashboard`,
  `SessionList`). El punto natural para cortar una respuesta inválida es la capa `*.api.js`.
- El backend produce la forma de las respuestas en `stats.service.js` (objeto con `period`,
  `summary`, `global`, `today`, `heatmap`) y en `sessions.service.js` (objeto de sesión que
  devuelve el repositorio). Hoy nada comprueba esa forma.
- El monorepo ya usa npm workspaces con `packages/*`; `domain-constants` demuestra que un paquete
  local se resuelve sin publicar nada. `packages/` es el sitio previsto para crecer.
- No hay TypeScript ni `tsc`: los `// @ts-check` existentes son ayuda del editor, no una puerta de
  calidad. La verificación real será en runtime y en tests.
- Hay 4 tests de frontend en rojo por un cambio previo (`DataRefreshProvider` en `main.jsx` y
  tests que renderizan sin el provider). Arreglarlos es necesario para cumplir «`npm test` en
  verde», pero no cambia comportamiento de producción: solo el contexto de los tests.
- El test de contrato que dejó el intento anterior exige `global.current` y `global.best`, campos
  que no existen (la racha está en `global.streak`); se sustituye.

## Enfoque

1. **Dejar la base en verde.** Envolver `<App />` y `<StatsPanel />` en `DataRefreshProvider` en
   los tests que hoy fallan. Sin cambios en código de producción.
2. **Crear `packages/domain-contracts`.** Paquete de workspace con `package.json`
   (`"type": "module"`, `"test": "node --test"`) e `index.js` con typedefs JSDoc (`Session`,
   `Stats`, `PeriodRange`, `Summary`, `Global`, `Today`, `Heatmap`, `HeatmapDay`, `Subject`) y:
   - `ContractError` (nombre propio, mensaje en español);
   - descriptores internos (`string`, `number`, `boolean`, `nullable`, `arrayOf`, `object`) para
     validar sin repetir comprobaciones;
   - `validateStats` / `assertStats`;
   - `validateSession` / `assertSession` y `validateSessionList` / `assertSessionList`.
   Los validadores devuelven una lista de fallos con ruta (`summary.totalMinutes`,
   `[2].title`); `assert*` lanza `ContractError` con el **primer** fallo y el nombre del recurso.
   Se toleran campos adicionales (solo se exige presencia y tipo de los declarados).
3. **Cablear el borde.** En `stats.api.js`, validar antes de devolver. En `sessions.api.js`,
   validar `list`, `create` y `update`; `remove` devuelve `null` y no se valida.
4. **Tests del paquete.** Casos válidos y fallos por campo ausente, renombrado, tipo incorrecto,
   elemento inválido en lista y campo adicional tolerado.
5. **Backend contra el contrato compartido.** Usar `assertStats` dentro del test existente de
   `statsService` (sustituyendo el test roto, sin duplicar casos) y crear
   `backend/test/sessions.service.test.js` con `assertSession` / `assertSessionList` sobre la
   salida real del servicio, con el repositorio simulado.
6. **RF-7 en la interfaz.** En `StatsPanel`, renderizar el bloque que depende de `stats`
   (tarjetas y lista filtrada por el periodo) solo si no hay error; el filtro de periodo sigue
   visible. `StatsDashboard` y `SessionList` ya sustituyen los datos por el error.
7. **Limpiar el intento anterior.** Quitar el bloque JSDoc flotante de `stats.service.js` y anotar
   `getStats` con el typedef `Stats`; revertir el cambio de `goalProgress` en `time.js`.
8. **Documentar y cerrar.** Actualizar `AGENTS.md`, `DEUDA_TECNICA.md` (B0-6 resuelto, sin añadir
   TypeScript como deuda) y `MEMORY.md`; añadir los globals de Node para `packages/**` en ESLint.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `specs/002-contrato-datos/spec.md` | Aprobada. |
| `specs/002-contrato-datos/plan.md` | Este documento. |
| `specs/002-contrato-datos/tasks.md` | Tareas verificables (siguiente artefacto). |
| `packages/domain-contracts/package.json` | Nuevo paquete de workspace con script `test`. |
| `packages/domain-contracts/index.js` | Typedefs JSDoc, `ContractError` y validadores. |
| `packages/domain-contracts/test/contracts.test.js` | Tests del contrato (válidos y fallos). |
| `frontend/src/stats/stats.api.js` | Validar la respuesta de métricas. |
| `frontend/src/sessions/sessions.api.js` | Validar listado, creación y edición. |
| `frontend/src/stats/StatsPanel.jsx` | No renderizar datos si hay error (RF-7). |
| `frontend/test/fixtures/contracts.js` | Fixtures completas `buildStats` y `buildSession`. |
| `frontend/test/stats/stats.api.test.js` | Validación en el borde de métricas. |
| `frontend/test/sessions/sessions.api.test.js` | Validación en el borde de clases. |
| `frontend/test/stats/StatsPanel.test.jsx` | Provider, fixtures, error de contrato y RF-7. |
| `frontend/test/App.test.jsx` | Provider en los tests que renderizan la app. |
| `backend/src/stats/stats.service.js` | Quitar comentario flotante y anotar `getStats`. |
| `backend/test/stats.service.test.js` | Sustituir el test roto por `assertStats` sobre la salida real. |
| `backend/test/sessions.service.test.js` | Nuevo: `create` y `list` cumplen el contrato. |
| `frontend/src/utils/time.js` | Revertir el cambio de `goalProgress`. |
| `eslint.config.js` | Globals de Node solo para los tests del paquete (`packages/*/test/**`). |
| `package-lock.json` | Enlace del nuevo paquete tras `npm install`. |
| `AGENTS.md` | Estructura, tests del paquete, fixtures y convención del contrato. |
| `DEUDA_TECNICA.md` | B0-6 a resuelto. |
| `MEMORY.md` | Decisión y estado real de la suite. |

## Decisiones y alternativas

- **Paquete nuevo `packages/domain-contracts`.** Una responsabilidad por paquete y una sola
  definición para backend y frontend. Alternativas descartadas: un archivo dentro de
  `domain-constants` (mezcla constantes y contrato y obliga a cambiar sus `exports`) y un módulo
  solo en `frontend/src/api` (el backend deja de compartir la definición).
- **Validadores propios con descriptores, sin dependencias.** Cubre el caso real y mantiene el
  principio 1. Alternativas descartadas: `zod` (dependencia y API nueva para este alcance) y
  comprobaciones a mano campo por campo (repetición y más fácil de desincronizar).
- **JSDoc + `// @ts-check` sin `tsc`.** Documenta tipos y ayuda en el editor sin añadir
  dependencias ni una puerta nueva. `tsc` no se añade en esta iteración.
- **Validar en `*.api.js`, no en `request` ni en los componentes.** `request` es genérico y no
  conoce cada recurso; los componentes deben recibir datos ya validados. Los hooks no cambian.
- **Tolerar campos adicionales.** Permite que el backend añada campos sin romper al frontend.
  Alternativa descartada: exigir forma exacta, que convertiría cualquier añadido en un fallo.
- **Reutilizar los tests del backend.** `assertStats` se incorpora al test que ya existe; no se
  crea una suite de contrato paralela que duplique casos.
- **Solo se valida presencia y tipo, no formato.** Una fecha con forma rara pero de tipo texto no
  se detecta; el objetivo es la deriva de campos y el backend genera el formato. Alternativa
  descartada: validar `YYYY-MM-DD` e ISO, que amplía el alcance y duplica reglas ya garantizadas
  por el backend.
- **El error de métricas oculta también la lista filtrada.** La lista de registros se filtra con
  las fechas del periodo, que vienen de `stats`; sin métricas válidas no se puede calcular el
  rango. Alternativa descartada: mostrar todas las clases, que daría una lista incorrecta para el
  periodo elegido.
- **Arreglar los 4 tests rojos en esta feature.** Sin ello no se cumple el criterio de cierre. Es
  un cambio solo en tests (envolver con el provider), no de comportamiento.

## Riesgos

- **Mensajes demasiado técnicos para el usuario.** Mitigación: prefijo en español y ruta del
  campo; los tests fijan el texto y que no se pinte `0`/«0m».
- **Dos definiciones del contrato (paquete y `AGENTS.md`).** Mitigación: `AGENTS.md` señala el
  módulo compartido como fuente de verdad y el test del backend detecta la deriva del productor.
- **Falsos positivos (campos nuevos o nulos legítimos).** Mitigación: campos adicionales
  tolerados y `longestClass` declarado como anulable, con tests.
- **El paquete nuevo no resuelve en Vite/Vitest.** Mitigación: `npm install`, comprobar el enlace
  en `node_modules` y ejecutar la suite completa.
- **Los tests de componentes mockean `*.api.js` y no pasan por la validación.** Mitigación: los
  tests de cableado mockean `client.js` (una capa por debajo) para ejercitar el validador.
- **Ocultar tarjetas ante cualquier error en `StatsPanel`.** Mitigación: es el comportamiento
  pedido por RF-7 y el error queda visible.

## Verificación contra la constitución

- **Principio 1 (dependencias):** ninguna nueva; todo con `node:test`, Vitest y módulos propios.
- **Principio 2 (spec y código):** spec 002 aprobada; cada RF tiene test en el mapa siguiente.
- **Principio 3 (capas):** el paquete solo define contrato; el frontend valida en `*.api.js`; los
  hooks y componentes no conocen la forma cruda de la API.
- **Principio 4 (tests y lint):** tests por RF y mutación de las reglas nuevas; `npm test` y
  `npm run lint` como puerta.
- **Principio 5 (datos y secretos):** no se añaden datos, ficheros ni secretos.
- **Principio 6 (idioma):** mensajes al usuario en español; identificadores y código en inglés.

## Plan de pruebas (RF → test)

| RF | Caso | Resultado |
|---|---|---|
| RF-1 | `packages/domain-contracts/test/contracts.test.js`: la definición exporta tipos y validadores, y backend y frontend la importan. | ✅ 17/17; importada por nombre desde backend y frontend. |
| RF-2 | `frontend/test/stats/stats.api.test.js`: métricas inválidas → `ContractError` con ruta. `StatsPanel.test.jsx`: el error se muestra y no aparece «0m». | ✅ 4/4 y caso de primera carga inválida; error con `summary.totalMinutes`, sin «0m». |
| RF-3 | `frontend/test/sessions/sessions.api.test.js`: lista o clase inválida → `ContractError` con ruta. El error visible se cubre con el test existente de `StatsPanel` que hace fallar la carga de sesiones. | ✅ 6/6 (list/create/update); error visible de sesiones en `StatsPanel`. |
| RF-4 | Suite existente completa en verde (mismos datos y textos). | ✅ 119/119: 62 backend + 40 frontend + 17 contrato. |
| RF-5 | `backend/test/stats.service.test.js` con `assertStats`; `backend/test/sessions.service.test.js` con `assertSession` / `assertSessionList`. | ✅ 62/62 en backend, con ambos tests de contrato. |
| RF-6 | `packages/domain-contracts/test/contracts.test.js`: un campo adicional no produce fallo. | ✅ Campo adicional tolerado en métricas y en sesión. |
| RF-7 | `StatsPanel.test.jsx`: primera carga válida y recarga inválida → error visible y sin tarjetas de datos anteriores. | ✅ Test en verde y mutación comprobada; verificado a 375 px. |

Resultado global (2026-10-29): `npm test` **119/119** y `npm run lint` en verde. Las tres mutaciones de
T8 pusieron su test en rojo y, restauradas, volvieron a verde. Comprobación manual a 375 px con una
respuesta alterada: error visible con `summary.totalMinutes`, sin tarjetas, «0m» ni «0 clases»; al
restaurar el código, los datos vuelven. Sin cambios de layout respecto a la carga válida.

## Orden de implementación

1. Arreglar los 4 tests rojos (provider).
2. Crear el paquete y los validadores con sus tests.
3. Cablear `stats.api.js` y `sessions.api.js`, fixtures y tests de borde.
4. Añadir `assertStats` al test del backend y crear el test de `sessions.service`.
5. Ajustar `StatsPanel` para RF-7 y su test.
6. Limpiar el intento anterior (`stats.service.js`, `time.js`).
7. Mutación de cada regla nueva.
8. Documentación, `npm test`, `npm run lint` y cierre.

## Fuera de alcance

El mismo de la spec: revalidar entrada o reglas de negocio, rechazar campos adicionales,
telemetría o registro de derivas, y pruebas de extremo a extremo. No se añade `tsc` ni migración a
TypeScript.
