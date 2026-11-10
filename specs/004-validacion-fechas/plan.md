# Plan 004 — Validación de fechas de entrada

> Spec: specs/004-validacion-fechas/spec.md
> Estado: aprobado (2026-11-10)

## Contexto técnico

- Backend y frontend tienen cada uno su propio módulo de fechas. Ambos construyen un `Date`
  con `value.split('-').map(Number)` sin comprobar formato ni existencia real; el backend
  además propaga `NaN` a los cálculos de estadísticas.
- El backend valida la fecha de una clase con una expresión regular y `Date.parse`, que
  acepta fechas imposibles como `2026-02-31`; los filtros `from`/`to` no se validan y se
  comparan como texto.
- La consulta de estadísticas valida `period` y `heatmap`, pero no `date` ni `heatmapDate`.
- `getRange` puede producir extremos fuera de `1990-01-01`–`9999-12-31`:
  `addMonths('1990-01-01', -12)` devuelve `1989-01-01` y `endOfWeek('9999-12-31')` devuelve
  `10000-01-02`. Comparar esas cadenas como texto falla porque `'10000-…' < '9999-…'`.
- `enumerateDays` corta el bucle a 4000 iteraciones sin avisar y compara extremos como texto.
- En el frontend, `useSessions` consulta siempre que cambian los filtros; no distingue un
  rango invertido. Los formateadores pueden producir `NaN undefined NaN`; `weekdayIndex`
  devuelve `NaN` y el calendario coloca el día inválido en la primera columna.
- No existe hoy un módulo compartido de reglas de fechas. Los paquetes actuales son
  `domain-constants` (constantes) y `domain-contracts` (forma de las respuestas, que excluye
  explícitamente los formatos de fecha).

## Enfoque

1. **Crear un paquete interno `packages/domain-dates/`** con una única responsabilidad:
   reglas puras de fecha compartidas por backend y frontend.
   - Exportar `DATE_YEAR_MIN = 1990`, `DATE_YEAR_MAX = 9999`, `DATE_MIN = '1990-01-01'`,
     `DATE_MAX = '9999-12-31'`, `MAX_RANGE_DAYS = 4000` y `RANGE_CLAMP_NOTICE` con el texto
     exacto de la spec.
   - Exportar `isValidDateString(value)`: comprueba que es texto, que cumple
     `^\d{4}-\d{2}-\d{2}$`, que el año está entre 1990 y 9999 y que la fecha existe de
     verdad. Para lo último se construye el instante con `Date.UTC` y se comparan año, mes y
     día en UTC; así se rechazan `2026-02-31`, `2026-13-01`, `2025-02-29`, etc., sin
     depender de la zona horaria del proceso.
   - Exportar `compareDateStrings(a, b)`: compara por tupla numérica `(año, mes, día)`, no
     como texto. Acepta años de 4 y 5 cifras porque los rangos derivados internos pueden
     producir `10000-01-02` o `1989-12-31`. Devuelve negativo, cero o positivo.
   - Exportar `clampDateRange(from, to)` → `{ from, to, clamped }`. Si `from < DATE_MIN` lo
     sustituye por `DATE_MIN`; si `to > DATE_MAX` lo sustituye por `DATE_MAX`; si no hay
     recorte devuelve los extremos originales con `clamped: false`. No valida entradas de
     usuario: solo se usa con rangos derivados ya calculados.
   - `package.json` con `"type": "module"`, `main`/`exports` y script `test` con
     `node --test`, siguiendo el patrón de `domain-contracts`. Sin dependencias externas.
   - Ejecutar `npm install` desde la raíz para dar de alta el workspace, verificar que
     `node_modules/domain-dates` apunta al paquete y revisar el diff de `package-lock.json`
     (solo debe añadir el workspace nuevo, sin versiones de terceros).

2. **Backend: fechas y límites**
   - `backend/src/utils/date.js` importa `isValidDateString`, `MAX_RANGE_DAYS` y
     `compareDateStrings` de `domain-dates`.
   - `fromDateString` valida antes de construir el `Date` y lanza `RangeError` con mensaje
     en español si la fecha no es válida.
   - `enumerateDays` valida los extremos, calcula el número de días con `Date.UTC` y lanza
     un `RangeError` explícito si supera `MAX_RANGE_DAYS`; nunca devuelve una serie truncada.
     Si `from > to`, conserva el comportamiento actual y devuelve `[]`.
   - `addDays`, `addMonths`, `startOfWeek`, `endOfWeek`, `startOfMonth`, `endOfMonth` y
     `getRange` conservan su comportamiento para fechas válidas. Pueden devolver años de 5
     cifras en los extremos; el recorte se hace después, en el servicio de estadísticas.

3. **Backend: sesiones**
   - `sessions.service.js` sustituye la expresión regular y `Date.parse` por
     `isValidDateString`. La fecha del cuerpo no se recorta: los espacios alrededor son
     inválidos, como dice la spec. El mensaje se mantiene: `La fecha no es válida.`
   - En `update`, la fecha solo se considera omitida si es `undefined`; un `date: null`
     presente se valida como fecha inválida y se rechaza. No se usa `??` para la fecha.
   - Añadir un normalizador de filtros: `undefined` o `''` se convierten en «sin filtro»;
     cualquier otro valor no textual (número, objeto o lista de parámetros repetidos) o no
     válido lanza `ValidationError`.
   - `list` valida `from` y `to` antes de leer del repositorio y rechaza un rango invertido
     con `ValidationError`.
   - Mensajes previstos: `El filtro «desde» no es una fecha válida.`,
     `El filtro «hasta» no es una fecha válida.` y
     `El rango de fechas está invertido: «desde» es posterior a «hasta».`

4. **Backend: estadísticas, recorte y aviso**
   - `stats.service.js` normaliza `date` y `heatmapDate` antes de leer datos: `undefined` o
     `''` significan «no enviado»; un valor no textual (incluida una lista por parámetro
     repetido) o inválido lanza `ValidationError`.
   - `date` ausente sigue usando hoy; `heatmapDate` ausente sigue usando la fecha de
     referencia.
   - Calcular `periodRange` y `heatmapRange` con `getRange` y aplicar `clampDateRange` a cada
     uno por separado. El recorte no altera la fecha de referencia ni la de hoy.
   - La respuesta incluye `notice: string | null` en el nivel superior. Vale
     `RANGE_CLAMP_NOTICE` si se recortó el periodo, el calendario o ambos; vale `null` si no
     hubo recorte. Siempre está presente, porque el contrato lo declara obligatorio-nullable.
   - El `label` del periodo y del calendario no cambia; solo cambian `from`/`to` y los datos
     calculados con el rango recortado.
   - `buildHeatmap` recibe el rango ya recortado, así que nunca enumera más de 4000 días por
     este camino.
   - Mensajes previstos: `La fecha de referencia no es válida.` y
     `La fecha del calendario no es válida.`
   - No se añade un mapeo global de `RangeError` a `400`: las entradas externas se validan
     como `ValidationError`; un `RangeError` de una fecha persistida corrupta sigue siendo
     un fallo interno explícito.

5. **Contrato de datos**
   - `packages/domain-contracts/index.js` añade `@property {string|null} notice` al typedef
     `Stats` y `notice: nullable(STRING)` a `STATS`. No se valida el contenido del texto, solo
     presencia y tipo, como el resto del contrato.
   - Actualizar `packages/domain-contracts/test/contracts.test.js` y
     `frontend/test/fixtures/contracts.js` para incluir `notice: null` en las respuestas
     válidas y un caso de `notice` con texto.
   - Este cambio va junto con el del servicio de estadísticas: al ser un campo obligatorio,
     cualquier fixture o test que no lo incluya fallará hasta actualizarlo.

6. **Frontend: utilidades de fecha**
   - `frontend/src/utils/date.js` importa `isValidDateString` del paquete compartido.
   - `fromDateString` devuelve `null` si la fecha no es válida.
   - `formatDateLong`, `formatDateShort` y `formatDateRange` devuelven `''` ante un valor
     inválido o nulo. En un rango, si un extremo falla, se devuelve `''` para todo el texto.
   - `weekdayIndex` devuelve `null` ante una fecha inválida para no inventar un día.
   - `ActivityHeatmap` descarta los días cuya fecha no sea válida antes de calcular las
     columnas; un día inválido no se pinta ni se coloca en lunes. `buildColumns` ya no
     recibe fechas inválidas.
   - `monthNameFromKey` conserva su comportamiento actual; no construye fechas.

7. **Frontend: historial**
   - `useSessions` calcula si el rango está invertido con `compareDateStrings` solo cuando
     ambos extremos existen **y** son fechas válidas. Si alguno no es válido, no aplica la
     guarda y deja que la API responda `400` con el mensaje del filtro. La comprobación vive
     dentro de `reload`, para cubrir también a cualquier consumidor que lo llame
     directamente.
   - Si el rango está invertido: incrementa `requestIdRef` para invalidar la petición en
     vuelo, no llama a la API, deja `loading` en `false` y no toca `sessions`; así se
     conserva el último listado válido. El hook conserva el error anterior en su estado y
     expone `hasInvertedRange` para que la vista lo pinte.
   - `HistoryView` muestra el aviso `El rango de fechas está invertido: «desde» es posterior
     a «hasta».` con `role="status"`, y pasa `error=''` a `SessionList` mientras el rango
     esté invertido. El error anterior se conserva en el hook, pero la vista lo oculta para
     que el aviso mande y el listado anterior siga visible.
   - `SessionFilters` y `sessions.api.js` no cambian: los campos de tipo fecha ya envían
     valores válidos o vacíos, y el cliente omite los filtros vacíos.

8. **Frontend: aviso de recorte**
   - Crear `frontend/src/components/StatusNotice.jsx`: componente presentacional que pinta un
     aviso con `role="status"` y la clase `notice`. Se reutiliza para el aviso de recorte y
     evita duplicar el marcado y el rol en dos pantallas.
   - `StatsDashboard` y `StatsPanel` muestran `stats.notice` con `StatusNotice` cuando no es
     `null`, antes de las tarjetas. No se muestra nada si `notice` es `null`.
   - `frontend/src/styles.css` añade `.notice` con texto visible, borde y fondo propios, sin
     depender solo del color y sin overflow a 375 px.
   - El aviso de rango invertido del historial usa el mismo componente, para que ambos avisos
     compartan presentación y accesibilidad.

9. **Documentación y deuda**
   - `README.md`: fijar la regla de fecha (`YYYY-MM-DD`, fecha real, 1990–9999), los `400`
     por fechas inválidas o rango invertido, el máximo de 4000 días, el recorte de rangos
     derivados y el campo `notice` de `/api/stats`.
   - `AGENTS.md`: añadir `packages/domain-dates/` a la estructura y mencionar que la regla de
     fechas es compartida.
   - `DEUDA_TECNICA.md` y los archivos de bloque: marcar B3-2, B3-3, B4-4, B8-1 y B9-5 como
     resueltos, con la evidencia de tests; ajustar el resumen a 35 resueltas, 32 pendientes y 1
     en curso (68 debilidades en la tabla) y las prioridades que citan esos IDs. En
     `deuda/bloque_10.md` y `deuda/bloque_12.md` no se repite la explicación: se remite a la
     feature 004.
   - `MEMORY.md`: registrar la feature 004, el paquete compartido y el nuevo total de tests.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `packages/domain-dates/package.json` | Nuevo paquete interno, sin dependencias externas, con script `test`. |
| `packages/domain-dates/index.js` | Constantes, `isValidDateString`, `compareDateStrings` y `clampDateRange`. |
| `packages/domain-dates/test/dates.test.js` | Formato, bisiestos, límites 1990/9999, fechas imposibles, comparación con años de 5 cifras y recorte. |
| `package-lock.json` | Alta del workspace `domain-dates` tras `npm install`, sin dependencias de terceros. |
| `backend/src/utils/date.js` | `fromDateString` valida; `enumerateDays` usa UTC, el máximo y falla explícitamente. |
| `backend/src/sessions/sessions.service.js` | Validación estricta de fecha de clase y de filtros; rechazo de rango invertido. |
| `backend/src/stats/stats.service.js` | Validación de `date`/`heatmapDate`, recorte de rangos y campo `notice`. |
| `packages/domain-contracts/index.js` | `notice` obligatorio-nullable en el typedef y en el validador de `Stats`. |
| `packages/domain-contracts/test/contracts.test.js` | Casos de `notice` presente, nulo y ausente. |
| `backend/test/date.test.js` | Tests de `fromDateString`, comparación numérica y límite de `enumerateDays`. |
| `backend/test/sessions.service.test.js` | Tests de creación/edición, filtros inválidos, no textuales, repetidos, vacíos y rango invertido. |
| `backend/test/stats.service.test.js` | Tests de fechas inválidas, vacías, recorte por periodo/calendario y `notice`. |
| `backend/test/app.test.js` | Tests HTTP de `400` para fechas inválidas, no textuales, repetidas y rango invertido; `200` con `notice`. |
| `frontend/src/utils/date.js` | Parseo seguro, formateadores que devuelven `''` y `weekdayIndex` sin `NaN`. |
| `frontend/src/components/StatusNotice.jsx` | Aviso reutilizable con `role="status"`. |
| `frontend/src/sessions/useSessions.js` | Detección de rango invertido, omisión de la consulta y conservación del listado. |
| `frontend/src/sessions/HistoryView.jsx` | Aviso de rango invertido y ocultación del error anterior. |
| `frontend/src/stats/StatsDashboard.jsx` | Aviso de recorte en Inicio. |
| `frontend/src/stats/StatsPanel.jsx` | Aviso de recorte en Estadísticas. |
| `frontend/src/stats/ActivityHeatmap.jsx` | Omisión de días con fecha inválida. |
| `frontend/src/styles.css` | Estilo `.notice`. |
| `frontend/test/utils/date.test.js` | Formateadores, `fromDateString` y `weekdayIndex` con fechas inválidas. |
| `frontend/test/sessions/HistoryView.test.jsx` | Aviso, ausencia de consulta, listado anterior conservado y error anterior oculto. |
| `frontend/test/stats/StatsPanel.test.jsx` | Aviso de recorte visible y ausencia cuando `notice` es `null`. |
| `frontend/test/stats/StatsDashboard.test.jsx` | Aviso de recorte en Inicio. |
| `frontend/test/fixtures/contracts.js` | `notice: null` en la fixture válida. |
| `README.md` | Reglas y API de fechas, recorte y `notice`. |
| `AGENTS.md` | Estructura del nuevo paquete y regla compartida. |
| `DEUDA_TECNICA.md` | Estado de B3-2, B3-3, B4-4, B8-1 y B9-5 y resumen. |
| `deuda/bloque_2.md` | Resolución de B3-2 y B3-3. |
| `deuda/bloque_3.md` | Resolución de B4-4. |
| `deuda/bloque_6.md` | Resolución de B8-1. |
| `deuda/bloque_7.md` | Resolución de B9-5. |
| `deuda/bloque_10.md` | Referencia a la feature 004 sin duplicar la explicación. |
| `deuda/bloque_12.md` | Referencia a la feature 004 sin duplicar la explicación. |
| `MEMORY.md` | Feature 004 y total de tests. |

## Decisiones y alternativas

- **Paquete `domain-dates` nuevo.** La regla de fechas es dominio compartido y no encaja en
  `domain-constants` (constantes) ni en `domain-contracts` (forma de respuestas, que excluye
  formatos de fecha). Alternativa descartada: duplicar el validador en backend y frontend,
  que puede divergir y refuerza el problema que B3-2/B8-1 describen. Es un paquete interno
  sin dependencias externas; no se añade ninguna versión de terceros. El alta exige
  `npm install` y actualizar `package-lock.json`.
- **Validación por ida y vuelta con `Date.UTC`.** Alternativa descartada: validar solo con
  la expresión regular; aceptaría `2026-02-31` y `2025-02-29`. Alternativa descartada: usar
  un `Date` local; la comparación de componentes depende de la zona horaria y de los cambios
  de horario.
- **Comparación numérica, no lexicográfica.** `'10000-01-02' < '9999-12-31'` como texto, pero
  como tupla el año 10000 es posterior. Alternativa descartada: comparar cadenas y asumir
  4 cifras; rompe en los límites, que es justo el caso que esta feature cubre.
- **Recortar los rangos derivados, no rechazarlos.** Es la decisión aprobada: una fecha de
  entrada válida nunca produce `400` por su periodo o calendario. Alternativa descartada:
  rechazar con `400`, que impediría consultar `1990-01-01` con `12m` o `9999-12-31` con
  semana. Alternativa descartada: permitir fechas derivadas fuera de rango, que rompería el
  formato `YYYY-MM-DD`.
- **`notice` único, no una lista.** Un solo mensaje cubre el recorte del periodo, del
  calendario o de ambos, porque el límite es el mismo. Alternativa descartada: un array de
  avisos, con más contrato y más interfaz para el mismo mensaje.
- **`notice` obligatorio-nullable en el contrato.** El backend siempre lo devuelve (`null` o
  texto), así el frontend no distingue entre «campo ausente» y «sin aviso». Alternativa
  descartada: campo opcional, que obligaría al frontend a comprobar también su ausencia.
- **`RangeError` en utilidades y `ValidationError` en servicios.** Alternativa descartada:
  mapear todo `RangeError` a `400`, que convertiría fallos internos en errores del cliente.
- **Formateadores que devuelven `''` y `weekdayIndex` que devuelve `null`.** Es la decisión
  aprobada en la spec. Alternativa descartada: lanzar y romper la pantalla, o pintar un
  texto fijo que parezca un dato. `ActivityHeatmap` filtra los días inválidos antes de
  calcular columnas, así que no inventa un lunes.
- **Rango invertido en el hook, aviso en la vista.** La guarda vive en `reload` para cubrir a
  cualquier consumidor y se invalida la petición en vuelo. Solo se aplica cuando ambos
  extremos son fechas válidas; un valor mal formado sigue el camino normal y la API responde
  `400`. Alternativa descartada: validar solo en el efecto o en `SessionFilters`; dejaría
  casos sin cubrir o impediría estados intermedios normales al cambiar una fecha.
  Alternativa descartada: comparar cadenas mal formadas en el hook, que trasladaría a la
  interfaz una validación que ya hace la API.
- **El error anterior se conserva en el hook y lo oculta la vista.** `HistoryView` pasa
  `error=''` mientras el rango está invertido; así no se pierde el estado y el aviso manda.
  Alternativa descartada: borrar el error en `reload`, que mezcla responsabilidades y elimina
  información que el hook ya tenía.
- **Fecha del cuerpo sin `trim`.** La spec exige formato exacto; los espacios alrededor son
  inválidos. Es un cambio de comportamiento deliberado frente al `trim` actual.

## Riesgos

- **`notice` obligatorio rompe fixtures y tests existentes.** Mitigación: actualizar
  `domain-contracts`, su test y la fixture del frontend en el mismo paso que el servicio;
  ejecutar `npm test` antes de seguir con la interfaz.
- **Datos persistidos antiguos con fechas imposibles.** Los datos actuales no contienen
  fechas inválidas. Si apareciera una, los cálculos lanzarían un `RangeError` explícito (500)
  en lugar de devolver `NaN`. Mitigación: auditoría previa de `backend/data/sessions.json` y
  fallo explícito; no se migra ni se silencia.
- **Cambio de comportamiento en fechas con espacios.** Antes se recortaban y ahora se
  rechazan. Mitigación: tests explícitos y aviso en `README.md`.
- **Años de 5 cifras en los extremos derivados.** `addMonths` y `endOfWeek` pueden producirlos.
  Mitigación: `compareDateStrings` y `clampDateRange` comparan por tupla numérica; el recorte
  se aplica antes de filtrar, enumerar o responder.
- **Etiqueta del periodo no refleja el recorte.** `label` sigue siendo «Últimos 12 meses»
  aunque los datos empiecen en `1990-01-01`. Mitigación: el aviso `notice` explica el límite;
  no se cambia el texto de la etiqueta para no alterar el contrato existente.
- **`fromDateString` del frontend devuelve `null`.** Cualquier consumidor futuro debe
  comprobarlo. Mitigación: los consumidores actuales se adaptan y los tests cubren los
  formateadores, `weekdayIndex` y el calendario.
- **Aviso de rango invertido y listado anterior.** Mantener el listado anterior podría
  parecer contradictorio; el aviso debe dejar claro que no corresponde al rango inválido.
  Mitigación: test de interfaz y comprobación manual a 375 px.
- **Diff del `package-lock.json`.** `npm install` puede reordenar o tocar entradas si el
  lockfile no estaba sincronizado. Mitigación: revisar el diff y confirmar que solo añade el
  workspace `domain-dates`.

## Verificación contra la constitución

- **Principio 1 (dependencias):** no se añaden dependencias externas ni versiones de
  terceros. Se crea un paquete interno `domain-dates` porque la regla es compartida y no
  encaja en los paquetes existentes; requiere `npm install` y el diff del lockfile, que se
  revisa antes de cerrar.
- **Principio 2 (spec y código):** la spec 004 está aprobada y cada RF tiene test previsto.
- **Principio 3 (separación de capas):** la regla pura vive en `domain-dates`; backend
  mantiene repositorio/servicio/rutas y frontend mantiene API/hook/componente. La validación
  de entrada se hace en el servicio antes de leer o escribir; el recorte se hace en el
  servicio de estadísticas, no en la ruta.
- **Principio 4 (tests y lint):** cada regla nueva tiene test rojo/verde y se comprobará la
  mutación; `npm test` y `npm run lint` bloquean el cierre.
- **Principio 5 (datos y secretos):** no se añaden datos ni secretos; las fechas inválidas no
  llegan al almacenamiento y los errores no exponen datos internos. No se migran datos.
- **Principio 6 (idioma):** mensajes y documentación en español; identificadores y código en
  inglés.

## Plan de pruebas (RF → test)

| RF | Caso |
|---|---|
| RF-1 | `backend/test/sessions.service.test.js`: crear/editar con `2026-02-31`, `2026-1-1`, `1989-12-31`, ` 2026-10-15 `, fecha vacía y valor no textual falla y no llama a `insert`/`update`. `backend/test/app.test.js`: `POST` inválido responde `400`. |
| RF-2 | `backend/test/stats.service.test.js`: `date`/`heatmapDate` inválidos o no textuales lanzan `ValidationError` antes de `findAll`. `backend/test/app.test.js`: consulta con fecha inválida o repetida responde `400` y no contiene `NaN`. |
| RF-3 | `backend/test/sessions.service.test.js`: `from`/`to` inválidos, no textuales o repetidos (`['a','b']`) lanzan `ValidationError` antes de `findAll`. `backend/test/app.test.js`: filtro inválido o repetido responde `400`. |
| RF-4 | `backend/test/sessions.service.test.js`: rango invertido lanza `ValidationError` antes de `findAll`. `backend/test/app.test.js`: responde `400`. |
| RF-5 | `backend/test/sessions.service.test.js`: `from`/`to` vacíos no filtran; una fecha de clase vacía sigue siendo inválida. `backend/test/stats.service.test.js`: `date`/`heatmapDate` vacíos usan hoy/referencia. |
| RF-6 | `frontend/test/sessions/HistoryView.test.jsx`: al invertir el rango aparece el aviso con `role="status"`, no se llama a la API, `loading` termina, se mantiene el listado anterior y se oculta el error anterior; el hook conserva ese error. Un test con petición en vuelo comprueba que su respuesta se ignora. Un test con un filtro mal formado comprueba que la guarda no se aplica y la API recibe la petición. |
| RF-7 | `frontend/test/utils/date.test.js`: formatos inválidos devuelven `''`; un rango con un extremo inválido devuelve `''`; `weekdayIndex` devuelve `null`; las fechas válidas no cambian. Test del calendario: un día inválido se omite y no se coloca en lunes. |
| RF-8 | `backend/test/date.test.js`: 4000 días se enumeran; 4001 lanza `RangeError`; `from > to` devuelve `[]`. `packages/domain-dates/test/dates.test.js` cubre la validez compartida y la comparación numérica. |
| RF-9 | Tests existentes de backend y frontend, más casos válidos de bisiesto (`2024-02-29`), años `1990`/`9999`, `from == to` y un solo filtro. |
| RF-10 | `packages/domain-dates/test/dates.test.js`: `clampDateRange` recorta `1989-01-01` y `10000-01-02`, no toca rangos interiores. `backend/test/stats.service.test.js`: `1990-01-01` con `12m` devuelve `period.from === '1990-01-01'`; `9999-12-31` con `week` devuelve `heatmap.to === '9999-12-31'`; ambos casos devuelven `notice` con el mensaje exacto; un rango interior devuelve `notice: null`; el recorte de periodo y calendario se evalúa por separado. |
| RF-11 | `frontend/test/stats/StatsDashboard.test.jsx` y `StatsPanel.test.jsx`: con `notice` se muestra un aviso con `role="status"` y el texto exacto; con `notice: null` no se muestra. `backend/test/app.test.js`: la respuesta recortada incluye `notice` y cumple `assertStats`. La comprobación manual a 375 px del aviso de recorte se hace en Estadísticas, donde se puede elegir `9999-12-31`; Inicio queda cubierto por el test de componente. |

## Orden de implementación

1. Crear `packages/domain-dates/` con constantes, validador, comparación, recorte y tests.
2. Ejecutar `npm install` desde la raíz, verificar el enlace del workspace y revisar el diff de
   `package-lock.json`.
3. Adaptar `backend/src/utils/date.js` y sus tests.
4. Validar fechas y filtros en `sessions.service.js` y sus tests.
5. Validar `date`/`heatmapDate`, recortar rangos y añadir `notice` en `stats.service.js`;
   actualizar `domain-contracts`, su test y la fixture del frontend en el mismo paso.
6. Añadir los tests HTTP de `400` y de respuesta con `notice` en `app.test.js`.
7. Adaptar `frontend/src/utils/date.js`, `ActivityHeatmap.jsx` y sus tests.
8. Crear `StatusNotice.jsx`, adaptar `useSessions`/`HistoryView` y añadir el test de interfaz.
9. Mostrar `notice` en `StatsDashboard` y `StatsPanel`, añadir `.notice` y sus tests.
10. Actualizar `README.md`, `AGENTS.md`, `DEUDA_TECNICA.md`, los bloques y `MEMORY.md`.
11. Ejecutar `npm test`, `npm run lint`, mutación y comprobación manual a 375 px del aviso de
    rango invertido en Historial y del aviso de recorte en Estadísticas. El aviso de recorte
    de Inicio se verifica con el test de componente, porque la interfaz siempre usa la fecha
    de hoy.

## Fuera de alcance

Se mantiene el resumen de la spec: duración/título/notas, rejilla del calendario (B10-4),
accesibilidad de errores existentes (B9-4), lógica «lunes = 0» (B8-4), formato de fecha del
diálogo de borrado (B6-5), otros formatos de fecha, zonas horarias, migración de datos, E2E y
el rechazo de rangos derivados (se recortan y avisan).
