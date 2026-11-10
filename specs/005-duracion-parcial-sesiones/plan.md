# Plan 005 — Duración parcial en el alta y la edición de clases

> Spec: specs/005-duracion-parcial-sesiones/spec.md
> Estado: aprobado (2026-11-10)

## Contexto técnico

- `sessions.service.js` valida la duración en `parseDuration`: convierte `Number(payload.hours)` y `Number(payload.minutes)`; si falta uno, `Number(undefined)` es `NaN` y lanza un mensaje engañoso sobre el otro campo.
- `update` ya conserva la duración cuando no llega ninguno, pero solo detecta `undefined`; `null` y `''` se convertirían en 0. Además, usa la duración existente sin comprobar si está fuera de 15–1439.
- Las constantes de dominio ya definen `DURATION_MIN = 15`, `MINUTES_MAX = 59`, `HOURS_MAX = 23` y `DURATION_MAX = 1439`.
- Las rutas no validan: delegan en el servicio; el manejador de errores ya convierte `ValidationError` en 400.
- El contrato de respuesta (`domain-contracts`) no cambia: `durationMinutes` sigue siendo un entero.
- El frontend envía siempre horas y minutos juntos y no se toca en esta feature.

## Enfoque

1. **Normalizar la lectura de la duración** en `sessions.service.js`.
   - Añadir un helper `readDurationPart(value)`: `undefined`, `null` y `''` → 0; cualquier otro valor → `Number(value)`.
   - Añadir un helper `isDurationPartAbsent(value)`: `value === undefined || value === null || value === ''`. Se usa solo en `update` para distinguir «no enviado» de «enviado como 0».
   - Mantener la coerción numérica actual: `'2'` → 2, `'   '` → 0; no se añaden reglas de tipo nuevas.

2. **Reescribir `parseDuration` con la precedencia aprobada**.
   - Leer horas y minutos con `readDurationPart`.
   - Validar que horas es un entero ≥0; si no, lanzar `ValidationError` con `Las horas deben ser un número entero mayor o igual que 0.`
   - Validar que minutos es un entero ≥0; si no, lanzar `ValidationError` con `Los minutos deben ser un número entero mayor o igual que 0.`
   - Calcular `durationMinutes = hours * 60 + minutes`.
   - Si `durationMinutes > DURATION_MAX`, lanzar `ValidationError` con `La clase no puede superar las 23:59.`
   - Si `minutes > MINUTES_MAX`, lanzar `ValidationError` con `Los minutos deben ser un número entero entre 0 y 59.`
   - Si `durationMinutes < DURATION_MIN`, lanzar `ValidationError` con `La clase debe durar al menos 15 minutos.`
   - Devolver `durationMinutes`.
   - La comprobación de máximo va antes que la de minutos >59: así `hours=24`, `hours=23, minutes=60` y `hours=24, minutes=60` dan el mensaje de máximo, y `hours=0, minutes=60` da el de minutos.
   - Ya no se usa `HOURS_MAX` en el servicio; el tope de horas lo impone el total.

3. **Ajustar `create`**.
   - No requiere cambios propios: `validate` llama a `parseDuration`; si no llega ninguna parte, el total es 0 y se lanza el mínimo.
   - `durationMinutes` directo se ignora porque `parseDuration` solo lee horas y minutos.

4. **Ajustar `update`**.
   - Detectar ausencia con `isDurationPartAbsent` (no solo `=== undefined`).
   - Si faltan ambas, tomar `existing.durationMinutes`, ajustarlo con `clampDuration` y repartirlo en horas/minutos.
   - Si falta solo una, dejar la ausente como `undefined` para que `parseDuration` la trate como 0; no se conserva la parte existente.
   - Añadir `clampDuration(value)`: `15` si `< DURATION_MIN`, `1439` si `> DURATION_MAX`, si no `value`.
   - Mantener el resto de campos (`title`, `date`, `notes`) como hoy.
   - El ajuste es silencioso: la respuesta devuelve la duración ajustada; no se añade aviso.

5. **No tocar rutas, contrato ni frontend**.
   - `sessions.routes.js`, `app.js` y `packages/domain-contracts` no cambian.
   - El formulario sigue enviando ambos campos; la UI no cambia.
   - `packages/domain-constants` no cambia: `HOURS_MAX` sigue definiendo `DURATION_MAX`.

6. **Documentación y deuda**.
   - `README.md`: duración parcial, mínimo 15, máximo 23:59 (1439), ajuste al editar sin duración y `durationMinutes` directo no aceptado. Añadir una nota de que una duración guardada no numérica o no entera queda fuera de alcance (no se define comportamiento para datos corruptos de tipo).
   - `DEUDA_TECNICA.md`: B4-2 resuelto; resumen 37 resueltas, 30 pendientes y 1 en curso.
   - `deuda/bloque_3.md`: resolución de B4-2.
   - `deuda/bloque_10.md` y `deuda/bloque_12.md`: marcar B4-2 como hecho y remitir a la feature 005.
   - `MEMORY.md`: feature 005, B4-2 resuelto y total de tests real.
   - `AGENTS.md` no cambia: no hay estructura, convención ni comando nuevos.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `backend/src/sessions/sessions.service.js` | Lectura de duración parcial, precedencia de errores, máximo 23:59 y ajuste al editar sin duración. |
| `backend/test/sessions.service.test.js` | Tests de creación/edición parcial, errores, precedencia, máximo y ajuste. |
| `backend/test/app.test.js` | Tests HTTP de POST/PUT parciales, 400 y ajuste. |
| `README.md` | Reglas y API de duración parcial, máximo 1439 y ajuste. |
| `DEUDA_TECNICA.md` | B4-2 resuelto y resumen actualizado. |
| `deuda/bloque_3.md` | Resolución de B4-2. |
| `deuda/bloque_10.md` | B4-2 marcado como hecho. |
| `deuda/bloque_12.md` | B4-2 marcado como hecho. |
| `MEMORY.md` | Feature 005 y total de tests. |

No cambian: `backend/src/sessions/sessions.routes.js`, `backend/src/app.js`, `packages/domain-constants/index.js`, `packages/domain-contracts/**`, `frontend/**`, `backend/data/sessions.json`, `AGENTS.md`.

## Decisiones y alternativas

- **El total es la cota superior, no las horas.** Las horas solo deben ser enteras ≥0; el total >1439 da el mensaje de máximo. Alternativa descartada: mantener horas 0–23 y eliminar la comprobación de máximo, que quedaría inalcanzable y dejaría sin efecto el mensaje de 23:59 aprobado.
- **Precedencia: tipo/signo de horas, tipo/signo de minutos, máximo total, minutos 0–59, mínimo total.** Alternativa descartada: validar primero los rangos de campo; `hours=24` daría el mensaje de horas y nunca el de máximo.
- **Campo ausente = 0.** Se comprueba `undefined`, `null` y `''`; `Number(undefined)` ya no produce `NaN`. Alternativa descartada: usar `Number()` directo; mantendría el fallo confuso de B4-2.
- **En edición, si faltan ambos se conserva; si falta uno, vale 0.** Es la decisión de la spec. Alternativa descartada: conservar la parte existente cuando falta una; la spec dice que la que falta vale 0.
- **Ajuste al editar sin duración.** Un registro con 10 se guarda como 15; uno con 1440, como 1439. Alternativa descartada: rechazar la edición, que impediría corregir otros campos de un registro antiguo; alternativa descartada: migrar todos los datos, fuera de alcance.
- **`durationMinutes` directo se ignora.** Alternativa descartada: aceptarlo como campo alternativo; sería un contrato nuevo y la spec lo excluye.
- **Sin cambios en el frontend.** El formulario ya envía ambos campos y el backend acepta ese mismo payload. Alternativa descartada: edición parcial en UI, fuera de alcance.
- **Sin dependencias nuevas.** La regla es local al servicio; no se crea un paquete compartido porque el frontend no la necesita.

## Riesgos

- **Cambio de mensaje para `hours=24`.** Antes daba el error de horas; ahora da el de máximo 23:59. Mitigación: tests explícitos y README.
- **`minutes=60` depende del total.** Con `hours=0` da error de minutos; con `hours=23` da máximo. Mitigación: tests de ambos casos y de la precedencia.
- **Detección de ausencia incompleta.** Si `update` solo mira `undefined`, `null`/`''` dejarían de conservar la duración. Mitigación: helper `isDurationPartAbsent` y tests de `null`/`''` en PUT sin duración y con una sola parte.
- **Ajuste silencioso.** El cliente puede recibir una duración distinta de la guardada sin aviso. Mitigación: la spec lo declara; el README lo documenta; tests de 10→15, 0→15, 1440→1439 y 2000→1439.
- **Datos corruptos de tipo.** `durationMinutes` no numérico queda fuera de alcance; el ajuste asume un entero. Mitigación: declarado en la spec y en el README.
- **Regresión del frontend.** El formulario envía ambos campos y sigue funcionando. Mitigación: `npm test` completo, incluidos los tests de `SessionForm` y `App`.
- **Tests HTTP con disco.** Los tests de `app.test.js` deben simular el repositorio con `mock.method`; no deben escribir en `backend/data`. Mitigación: seguir el patrón existente de `findById`/`insert`/`update`.
- **Import de `HOURS_MAX` sin usar.** Al dejar de usarlo, ESLint lo marcaría. Mitigación: retirarlo del import y dejar la constante para `DURATION_MAX`.

## Verificación contra la constitución

- **Principio 1 (dependencias):** no se añaden dependencias ni se tocan versiones.
- **Principio 2 (spec y código):** la spec 005 está aprobada y cada RF tiene test previsto.
- **Principio 3 (capas):** la validación y el ajuste viven en `sessions.service.js`; las rutas y el repositorio no cambian.
- **Principio 4 (tests y lint):** tests rojo/verde, mutación por regla nueva y `npm test`/`npm run lint` en verde.
- **Principio 5 (datos y secretos):** no se añaden datos ni secretos; no se migra `backend/data/sessions.json`; el ajuste solo ocurre al editar.
- **Principio 6 (idioma):** mensajes en español; identificadores y código en inglés.

## Plan de pruebas (RF → test)

| RF | Caso |
|---|---|
| RF-1 | `backend/test/sessions.service.test.js`: `create` con horas y minutos válidos guarda `hours*60+minutes`; `'2'` se acepta como 2; `backend/test/app.test.js`: POST con ambos responde 201 y la duración. |
| RF-2 | Servicio y HTTP: `create` con solo horas guarda `hours*60`. |
| RF-3 | Servicio y HTTP: `create` con solo minutos guarda `minutes`. |
| RF-4 | Servicio y HTTP: `create` sin horas ni minutos lanza/400 con `La clase debe durar al menos 15 minutos.`; también con ambos `null`/`''` y con `durationMinutes` directo. |
| RF-5 | Servicio y HTTP: `update` con ambos actualiza la duración. |
| RF-6 | Servicio y HTTP: `update` con solo horas usa minutos 0. |
| RF-7 | Servicio y HTTP: `update` con solo minutos usa horas 0. |
| RF-8 | Servicio y HTTP: `update` sin duración conserva 120, 15 y 1439; ajusta 10/0→15 y 1440/2000→1439; `null`/`''` cuentan como ausentes; una parte ausente y la otra presente usa 0 para la ausente; con `durationMinutes` directo conserva y ajusta. |
| RF-9 | Servicio: `create`/`update` con total 0 o 14 lanzan el mínimo; HTTP: 400. |
| RF-10 | Servicio: `hours=24`, `hours=23,minutes=60` y `hours=24,minutes=60` lanzan el máximo; HTTP: 400 con `23:59`. |
| RF-11 | Servicio: horas `-1`, `1.5`, `'abc'` lanzan el error de horas; HTTP: 400. |
| RF-12 | Servicio: minutos `-1`, `1.5`, `'abc'` lanzan el error de minutos; HTTP: 400. |
| RF-13 | Servicio: `hours=0,minutes=60` lanza el error de minutos; HTTP: 400. |
| RF-14 | `assertSession` sobre la sesión creada/editada; el resto de campos se conserva. |
| RF-15 | Servicio: `hours=-1,minutes=-1` da error de horas; `hours=23,minutes=60` da máximo (no minutos); `hours=0,minutes=0` da mínimo. |

## Orden de implementación

1. Escribir los tests del servicio (rojo) y ajustar `sessions.service.js`: helpers, precedencia, máximo y ajuste.
2. Verificar el servicio en verde y comprobar que los tests fallan al revertir cada regla.
3. Escribir los tests HTTP de POST/PUT parciales, errores y ajuste; ejecutar sin tocar rutas.
4. Actualizar `README.md`.
5. Actualizar `DEUDA_TECNICA.md`, `deuda/bloque_3.md`, `deuda/bloque_10.md`, `deuda/bloque_12.md` y `MEMORY.md`.
6. Ejecutar `npm test`, `npm run lint`, mutación y `git status`. UI: no aplica (el formulario no cambia).

Rollback: revertir `sessions.service.js`, sus tests y la documentación. No hay cambios de contrato ni de datos persistidos, así que no hace falta migración ni restauración de datos.

## Fuera de alcance

Se mantiene el resumen de la spec: cambios de UI, aceptar `durationMinutes` directo, cambiar el mínimo/máximo, cambiar temática/fecha/notas/contrato, migración masiva, datos guardados no numéricos, B9-3 y el resto de deuda.
