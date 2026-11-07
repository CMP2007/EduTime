## Bloque 2 — Backend: arranque y composición

Revisión de `backend/src/server.js` (bootstrap) y `backend/src/app.js` (composición:
middlewares, rutas, 404 y manejador de errores).

### B2-1 · JSON malformado responde 500 en lugar de 400

El manejador de errores de `app.js` solo traduce a 400 los `ValidationError`. Cuando `express.json()` no puede
parsear el body, lanza un `SyntaxError` de `body-parser` con `status: 400` y
`type: 'entity.parse.failed'`, pero **no es** `ValidationError`, así que cae en el `500`.

**Evidencia ejecutada** (app real en puerto efímero, sin escribir en disco):

| Petición | Esperado | Obtenido |
|----------|----------|----------|
| `GET /api/health` | 200 | 200 |
| `GET /api/nope` | 404 | 404 |
| `POST` body `{bad json` | 400 | **500** ❌ |
| `POST` título vacío | 400 | 400 |
| `POST` duración 5 min | 400 | 400 |

**Impacto:** un error del cliente se reporta como fallo del servidor; el frontend muestra
"Error interno del servidor" y se ensucia el log con un stacktrace.
**Mitigación:** respetar `error.status`/`error.statusCode` (o detectar
`error.type === 'entity.parse.failed'`) y responder 400.

**Resuelto:** el manejador de errores de `app.js` respeta ahora cualquier `status`/`statusCode`
4xx **antes** de caer al 500; para `entity.parse.failed` responde 400 con un mensaje amigable
("JSON inválido en el cuerpo de la petición") en vez del mensaje crudo del parser, y los 4xx ya
**no** se registran con `console.error` (el log solo ve fallos reales del servidor). Sin nuevas
dependencias y **sin adelantar el punto 8**: en esa sesión la rama `instanceof ValidationError`
quedó intacta. Se retiró después al resolver **B2-2** (25/10/2026); B2-4 sigue pendiente.
Tests: `backend/test/app.test.js` (app real en puerto efímero; ningún caso escribe en disco),
verificado por mutación.

### B2-2 · `app.js` acoplado a `ValidationError` de sessions

`app.js:5` importa `ValidationError` desde `sessions/sessions.service.js`. La capa de
composición (transversal) depende de un dominio concreto. Si `stats` u otro dominio define su
propia validación, hay que añadir otro `instanceof` aquí.

**Mitigación:** extraer una clase base de error (p. ej. `HttpError`/`AppError` con `status`)
en un módulo propio, que cada dominio extienda; el handler decide por `error.status`.

**Resuelto (25/10/2026):** `ValidationError` vive en `backend/src/errors.js` y extiende
`AppError` (`status = 400`). `app.js` ya no importa nada de `sessions`: decide por
`error.status`, así que cualquier dominio puede lanzar errores 4xx sin añadir un `instanceof`.

### B2-3 · Boilerplate de `try/catch` en cada ruta

**Resuelto (07/11/2026):** se eliminaron los `try/catch` de `sessions.routes.js` y
`stats.routes.js`. En Express 5 los rechazos de handlers `async` (y los `throw` síncronos) se
reenvían solos al middleware de errores, así que un wrapper `asyncHandler` sería redundante:
no se añadió archivo ni dependencia. Tests: `backend/test/app.test.js` (validación → 400 y
fallo real de servicio → 500). Verificado por mutación retirando el manejador de errores de
`app.js`.

### B2-4 · Sin logging de peticiones/errores

No hay logger; solo `console.error(error)` en el handler de errores (que además imprime el
body problemático del `SyntaxError`). No se registra método, ruta, estado ni duración.

**Mitigación:** middleware de logging simple (o `morgan`, si se justifica) y no volcar el
body en los logs.

---

## Bloque 3 — Backend: persistencia y tiempo

Revisión de `backend/src/storage/fileStore.js` (leer/escribir el JSON) y
`backend/src/utils/date.js` (fechas y periodos).

### B3-1 · Fichero JSON corrupto se trata como vacío (riesgo de pérdida de datos)

**Resuelto:** `readData` (`backend/src/storage/fileStore.js`) ya no devuelve `[]` ante
contenido inválido: distingue `ENOENT` (no existe → `null`, primer arranque → semilla) de
cualquier contenido que no sea un array JSON válido (corrupto, **vacío**, no-array) → **lanza
error y no toca el fichero**. Se eligió fallar en vez de copiar a `.bak` y arrancar vacío: un
arranque vacío ocultaría la pérdida y normalizaría el "sobrescribe y sigue". `app.js` no se
tocó: el manejador actual ya responde 500 y registra el mensaje en el log (mejora de mensajes
= punto 3). Tests: `backend/test/fileStore.test.js` (el fichero corrupto queda intacto),
verificado por mutación. Evidencia y detalle: commit `158b325`.

### B3-2 · `fromDateString` no valida la entrada

`date.js:12-15` hace `value.split('-').map(Number)` y construye la fecha sin comprobar nada.
Con una cadena basura produce un `Date` inválido y `toDateString` devolvería `NaN-NaN-NaN`,
que se propaga a los cálculos. Está mitigado porque la entrada de usuario se valida en
`sessions.service.js` (patrón de fecha), pero la función es frágil por sí sola.

**Mitigación:** validar el formato dentro de `fromDateString` o lanzar error si la fecha es
inválida.

### B3-3 · `enumerateDays` trunca en silencio a 4000 días

`date.js:60-70` corta el bucle con `guard < 4000` (≈ 11 años) sin avisar. Un rango mayor
daría un heatmap **incompleto** sin ningún error.

**Mitigación:** extraer el límite a una constante con nombre y, o bien justificarlo (cubre
12m/año con holgura), o lanzar error si se supera.

### B3-4 · Periodos inválidos degradan en silencio a `week`

`getRange` (`date.js:97-99`) usa `default:` → `week`, y `stats.service.js:71-72` vuelve a caer
a `'week'` con `isValidPeriod`. Un error de tipeo en el parámetro `period`/`heatmap` no se
detecta: se sirve otra cosa.

**Mitigación:** devolver `400` ante un periodo inválido en vez de degradar.

**Resuelto (25/10/2026):** `statsService.getStats` valida `period` y `heatmap` antes de leer
datos y lanza `ValidationError` (400) con la lista de valores permitidos; si se omiten, siguen
usando `week`. `getRange` ya no tiene un `default` silencioso: sin periodo usa `week`, pero un
periodo desconocido lanza `RangeError`. Tests en `date.test.js`, `stats.service.test.js` y
`app.test.js` (peticiones HTTP reales).

> **Nota:** la lista de periodos está además duplicada entre backend y frontend (ampliación de
> **B0-1**).

---

