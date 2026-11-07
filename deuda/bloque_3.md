## Bloque 4 — Backend: dominio de sesiones

Revisión de `backend/src/sessions/seed.js`, `sessions.repository.js`, `sessions.service.js`
y `sessions.routes.js` (capas datos / reglas / HTTP).

### B4-1 · `sessionsService.getById` sin usar (código muerto)

`sessions.service.js:76-78` exporta `getById`, pero ninguna ruta lo usa (no hay
`GET /api/sessions/:id`); `update` llama directamente a `repository.findById`. Es código sin
consumidor.

**Mitigación:** eliminarlo o exponer la ruta que lo justifique.

### B4-2 · Update parcial de duración exige horas y minutos juntos

En `sessions.service.js:92-110`, si `update` recibe solo `hours` **o** solo `minutes`, el otro
queda `undefined`; `parseDuration` hace `Number(undefined)` → `NaN` y lanza un mensaje confuso
("Los minutos deben ser un número entre 0 y 59"). El frontend siempre manda ambos, pero la API
lo permite y falla de forma poco clara.

**Mitigación:** documentar que la duración va en pareja o derivar el campo que falte desde el
valor existente (como ya se hace cuando no viene ninguno).

### B4-3 · `clone` superficial en el repositorio

El `clone` de `sessions.repository.js` (dentro de la fábrica) clona con una copia superficial
`{ ...session }`. Hoy todos los campos
son primitivos, así que aísla bien; pero si se añadiera un campo anidado (p. ej. un array de
etiquetas), la copia compartiría esa referencia y el estado interno quedaría expuesto.

**Mitigación:** usar una copia profunda (`structuredClone`) cuando haya estructuras anidadas.

### B4-4 · Filtros `from`/`to` sin validar

`matchesFilters` (`sessions.service.js:57-66`) compara `session.date` con `from`/`to` como
texto, sin comprobar el formato. Una fecha mal formada en el query string no da error: filtra
de forma silenciosa y potencialmente errónea.

**Mitigación:** validar el formato `YYYY-MM-DD` de los filtros y responder 400 si son
inválidos.

> **Refuerza B0-1:** las reglas de validación (título, notas, 15 min, 23 h) están duplicadas
> en `frontend/src/sessions/SessionForm.jsx`.

### B4-5 · El seed se persiste sin pasar por la validación del servicio

En `sessions.repository.js`, cuando no existe el fichero, `load()` construye la semilla
(`buildSeed()`) y la escribe **directamente**, sin pasar por `sessionsService`. Las entradas
de ejemplo nunca se validan (título máx. 80, duración mín. 15,
etc.). Si alguien añade una entrada de seed inválida, se guardaría una sesión que la API
rechazaría si se enviara por HTTP, rompiendo el invariante "toda sesión persistida cumple las
reglas del dominio".

**Impacto:** bajo (los datos de ejemplo son fijos y hoy válidos), pero es un invariante no
garantizado.
**Mitigación sugerida:** validar el seed antes de escribirlo, o documentar explícitamente que
el seed es de confianza y se construye conforme al modelo.

---

## Bloque 5 — Backend: dominio de estadísticas

Revisión de `backend/src/stats/stats.service.js` (cálculo de métricas) y `stats.routes.js`
(endpoint único `GET /api/stats`).

### B5-1 · Sin tests en la lógica crítica de estadísticas

**Resuelto:** `backend/test/stats.service.test.js` cubre racha (`current`/`best`), meta del
día, periodos, resumen y heatmap con el repositorio simulado (`mock.method`), verificado con
pruebas de mutación. Commit `6e4c1d5`.

### B5-2 · Agrupación por temática por título exacto (sin normalizar)

`groupBySubject` agrupa por `session.title` tal cual. "Programación" y "programacion" (ambos
aparecen en los datos locales de ejemplo) cuentan como temáticas distintas. La app no tiene un
catálogo de temáticas: la identidad es el texto.

**Mitigación:** normalizar (trim + minúsculas/acentos) para agrupar, o introducir temáticas
con id propio.

### B5-3 · Racha recalculada en cada petición (sin caché)

`computeStreaks` reordena y recorre todas las fechas con meta en **cada** llamada a
`/api/stats`. A esta escala es irrelevante, pero es trabajo repetido que podría memoizarse.

**Mitigación:** cachear el resultado invalidando al escribir (o dejarlo, por simplicidad).

### B5-4 · Meta diaria fija (180) y duplicada backend/frontend

`GOAL_MINUTES = 180` está en `stats.service.js:4` y otra vez en `frontend/src/utils/time.js:2`
(ver **B0-1**). Si se quisiera configurar por usuario, habría que tocar ambos lados.

**Mitigación:** fuente única de constantes compartida.

---

