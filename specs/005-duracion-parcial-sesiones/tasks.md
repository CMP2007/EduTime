# Tasks 005 — Duración parcial en el alta y la edición de clases

> Spec: specs/005-duracion-parcial-sesiones/spec.md · Plan: specs/005-duracion-parcial-sesiones/plan.md
> Estado: completada (2026-11-10) · T1–T8 en verde

Cada tarea es un cambio pequeño y verificable. El campo «Test» indica qué prueba debe existir
antes de dar la tarea por hecha; si el test no falla al revertir el cambio, la tarea no está
terminada.

## T1 — Tests del servicio: creación con duración parcial y errores

- [x] Añadir en `backend/test/sessions.service.test.js` un bloque `describe` para `create` con:
  - horas y minutos válidos guardan `hours * 60 + minutes` (RF-1), incluido `'2'` como 2;
  - solo horas guarda `hours * 60` (RF-2);
  - solo minutos guarda `minutes` (RF-3);
  - sin horas ni minutos, o con ambos `null`/`''`, lanza `La clase debe durar al menos 15 minutos.` (RF-4);
  - `durationMinutes` directo sin horas/minutos lanza el mínimo (RF-4);
  - total 0 y 14 lanzan el mínimo (RF-9);
  - total exactamente 15 y exactamente 1439 se aceptan como válidos (límites de RF-9 y RF-10);
  - `hours=24`, `hours=23,minutes=60` y `hours=24,minutes=60` lanzan `La clase no puede superar las 23:59.` (RF-10);
  - horas `-1`, `1.5`, `'abc'` lanzan `Las horas deben ser un número entero mayor o igual que 0.` (RF-11);
  - minutos `-1`, `1.5`, `'abc'` lanzan `Los minutos deben ser un número entero mayor o igual que 0.` (RF-12);
  - `hours=0,minutes=60` lanza `Los minutos deben ser un número entero entre 0 y 59.` (RF-13);
  - precedencia: `hours=-1,minutes=-1` da el error de horas; `hours='abc',minutes='abc'` da el error de horas; `hours=23,minutes=60` da el máximo; `hours=0,minutes=0` da el mínimo (RF-15).
- [x] Simular `sessionsRepository.insert` con `mock.method` y comprobar que no se llama en los casos inválidos.
- Test: RF-1 a RF-4 y RF-9 a RF-13, RF-15.
- Hecho cuando: `node --test backend/test/sessions.service.test.js` falla por los motivos esperados (mensajes y validación actuales).

## T2 — Implementar lectura normalizada y precedencia en `parseDuration`

- [x] En `backend/src/sessions/sessions.service.js`, añadir `readDurationPart(value)`: `undefined`, `null` y `''` → 0; otro valor → `Number(value)`.
- [x] Reescribir `parseDuration` en este orden: horas entero ≥0 → minutos entero ≥0 → total `> DURATION_MAX` (mensaje 23:59) → minutos `> MINUTES_MAX` → total `< DURATION_MIN`.
- [x] Fijar los mensajes exactos del plan: horas, minutos de tipo/signo, minutos 0–59, máximo 23:59 y mínimo 15.
- [x] Retirar `HOURS_MAX` del import del servicio (deja de usarse; sigue en `domain-constants` para `DURATION_MAX`).
- Test: RF-1 a RF-4 y RF-9 a RF-13, RF-15 de T1.
- Hecho cuando: `node --test backend/test/sessions.service.test.js` en verde.

## T3 — Tests del servicio: edición parcial, conservación y ajuste

- [x] Añadir un bloque `describe` para `update` con:
  - ambos válidos actualizan la duración (RF-5);
  - solo horas usa minutos 0 (RF-6);
  - solo minutos usa horas 0 (RF-7);
  - solo horas con `hours: 0` lanza el mínimo, y solo minutos con `minutes: 0` lanza el mínimo (RF-9);
  - `hours=24`, `hours=23,minutes=60` y `hours=24,minutes=60` lanzan `La clase no puede superar las 23:59.` (RF-10);
  - sin duración conserva 120, 15 y 1439 (RF-8);
  - sin duración ajusta 10 y 0 a 15, y 1440 y 2000 a 1439 (RF-8);
  - `null` y `''` en una o ambas partes cuentan como ausentes (RF-8);
  - una parte ausente y la otra presente usa 0 para la ausente (RF-8);
  - `durationMinutes` directo sin horas/minutos conserva y ajusta la duración existente (RF-8);
  - el resto de campos (`title`, `date`, `notes`) se conserva (RF-14).
- [x] Simular `findById` y `update` con `mock.method`; comprobar que `update` no se llama cuando la validación falla.
- Test: RF-5 a RF-10 y RF-14.
- Hecho cuando: los tests nuevos de `update` fallan con el código actual (conservación sin ajuste y detección solo de `undefined`).

## T4 — Implementar edición parcial y ajuste silencioso en `update`

- [x] Añadir `isDurationPartAbsent(value)`: `undefined`, `null` o `''`.
- [x] Detectar la ausencia de duración con `isDurationPartAbsent` en lugar de `=== undefined`.
- [x] Si faltan ambas partes, tomar `existing.durationMinutes`, ajustarlo con `clampDuration` y repartirlo en horas/minutos.
- [x] Añadir `clampDuration(value)`: 15 si `< DURATION_MIN`, 1439 si `> DURATION_MAX`, si no `value`.
- [x] Si falta solo una parte, dejarla como `undefined` para que `parseDuration` la trate como 0; no se conserva la parte existente.
- [x] Mantener `title`, `date` y `notes` como hoy y no añadir aviso en la respuesta (ajuste silencioso).
- Test: RF-5 a RF-10 y RF-14 de T3.
- Hecho cuando: `node --test backend/test/sessions.service.test.js` en verde.

## T5 — Tests HTTP de POST/PUT parciales, errores y ajuste

- [x] Añadir en `backend/test/app.test.js`:
  - POST con ambos, solo horas y solo minutos responde 201 con la duración esperada (RF-1 a RF-3);
  - POST sin horas/minutos responde 400 con el mensaje de mínimo (RF-4, RF-9);
  - POST con `hours=24` o `hours=23,minutes=60` responde 400 con `23:59` (RF-10);
  - POST con horas o minutos de tipo/signo inválido responde 400 (RF-11, RF-12);
  - POST con `hours=0,minutes=60` responde 400 con el mensaje de minutos (RF-13);
  - PUT con ambos, solo horas y solo minutos actualiza la duración (RF-5 a RF-7);
  - PUT con `hours=24` o `hours=23,minutes=60` responde 400 con `23:59` (RF-10);
  - PUT sin duración conserva y ajusta (RF-8);
  - PUT con `null`/`''` equivale a ausente (RF-8).
- [x] Simular `findById`, `insert` y `update` con `mock.method`; ningún caso debe escribir en `backend/data`.
- Test: RF-1 a RF-13 en la capa HTTP.
- Hecho cuando: `node --test backend/test/app.test.js` en verde sin tocar rutas.

## T6 — Actualizar `README.md`

- [x] Cambiar el máximo de «23h / 1380» a «23:59 / 1439» en las reglas y en la tabla del modelo.
- [x] Documentar que horas y minutos se aceptan por separado (la parte ausente vale 0), que en edición sin duración se conserva y se ajusta, y que `durationMinutes` directo se ignora.
- [x] Añadir la nota de que una duración guardada no numérica o no entera queda fuera de alcance.
- Test: no aplica (documentación); se revisa contra la spec 005.
- Hecho cuando: `README.md` describe el comportamiento de la spec y no contradice los mensajes ni los límites.

## T7 — Actualizar deuda y `MEMORY.md`

- [x] `DEUDA_TECNICA.md`: marcar B4-2 como resuelto y actualizar el resumen a 37 resueltas, 30 pendientes y 1 en curso.
- [x] `deuda/bloque_3.md`: escribir la resolución de B4-2 con referencia a la feature 005.
- [x] `deuda/bloque_10.md` y `deuda/bloque_12.md`: marcar B4-2 como hecho y remitir a la feature 005.
- [x] `MEMORY.md`: registrar la feature 005, B4-2 resuelto y el total de tests real.
- Test: no aplica (documentación); se revisa que las referencias y contadores cuadren.
- Hecho cuando: las cuatro referencias de deuda son coherentes entre sí y con `README.md`.

## T8 — Verificación final, mutación y limpieza

- [x] Antes de romper código, copiar `sessions.service.js` y sus dos tests a `/tmp/opencode` y restaurarlos con `cp`.
- [x] Comprobar que cada regla nueva (ausente = 0, precedencia, máximo 23:59, minutos 0–59, mínimo, `clampDuration`) falla si se revierte.
- [x] Ejecutar `npm test` desde la raíz.
- [x] Ejecutar `npm run lint` desde la raíz.
- [x] Revisar `git status` y confirmar que no se han tocado rutas, contrato, frontend ni `backend/data`.
- [x] UI: no aplica (el formulario no cambia).
- Test: puerta de calidad completa de la constitución (principio 4).
- Hecho cuando: `npm test` y `npm run lint` en verde, mutación confirmada y `git status` sin archivos inesperados.

## Orden y dependencias

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8.

- T1 y T2 comparten `parseDuration`; T2 no empieza hasta que T1 esté en rojo.
- T3 y T4 comparten `update`; T4 no empieza hasta que T3 esté en rojo.
- T5 depende de T2 y T4 (comportamiento HTTP ya implementado).
- T6 y T7 son documentación y pueden ir en cualquier orden tras T5.
- T8 cierra: exige T1–T7 terminadas.
