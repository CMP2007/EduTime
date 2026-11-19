# Tasks 008 — Validación explícita y accesible de la duración del formulario de clases

> Spec: specs/008-validacion-duracion-formulario/spec.md · Plan: specs/008-validacion-duracion-formulario/plan.md
> Estado: completada

Cada tarea es un cambio pequeño y verificable. El campo «Test» indica qué prueba debe existir
antes de dar la tarea por hecha; si el test no falla al revertir el cambio, la tarea no está
terminada.

## T1 — Validación pura de la duración

- [x] Escribir primero `frontend/test/sessions/durationInput.test.js` con los casos: ambos vacíos,
      espacios, `1.5` en horas, `-1` en minutos, ambos inválidos, 24 h, 23 h 60 min, 0 h 60 min,
      15 y 1439 exactos, `1e2` y `1.0`; y que devuelva los enteros listos para enviar.
- [x] Crear `frontend/src/sessions/durationInput.js` con `parseDurationInput`: vacío o solo
      espacios → 0; horas entero ≥ 0; minutos entero ≥ 0; máximo total; rango de minutos; mínimo
      total; mensaje y campos afectados según la precedencia.
- [x] Reutilizar `DURATION_MIN`, `DURATION_MAX` y `MINUTES_MAX` de `domain-constants`.
- Test: RF-1 a RF-6 y sus casos límite.
- Hecho cuando: `npm test -w frontend -- test/sessions/durationInput.test.js` pasa y el test falla
  al invertir la precedencia o al quitar el máximo.

## T2 — Integrar la validación en el envío

- [x] Escribir primero en `frontend/test/sessions/SessionForm.test.jsx`: duración inválida no envía
      y conserva los valores; `24` h y `1e2` h muestran el máximo; `0` h `10` min y `0` h `60` min
      muestran sus mensajes; una duración válida envía enteros (`1` h con minutos vacíos →
      `hours: 1, minutes: 0`).
- [x] Sustituir el cálculo de duración de `SessionForm` por la función pura y enviar los enteros
      que devuelve, sin `Number(...) || 0`.
- [x] Bloquear el envío si la duración no es válida y conservar temática, fecha, duración y
      observaciones.
- Test: RF-1, RF-2, RF-4, RF-5, RF-6, RF-7 y RF-13.
- Hecho cuando: los casos nuevos pasan y los tests de guardado existentes siguen en verde.

## T3 — Estado único de error y anuncio de la duración

- [x] Escribir primero en `SessionForm.test.jsx`: el mensaje tiene rol de alerta, el foco no se
      mueve, el grupo queda descrito y el error de horas marca solo horas mientras el de mínimo o
      máximo marca ambos.
- [x] Modelar el error del formulario como objeto discriminado (`kind`, `message`, `fields`) y
      pintar un único mensaje con `role="alert"` y un identificador propio.
- [x] Asociar el grupo de horas y minutos con `aria-describedby` y marcar con `aria-invalid` los
      controles afectados.
- Test: RF-3, RF-8 y RF-9.
- Hecho cuando: los tests de ARIA pasan y `aria-invalid` desaparece al dejar de ser visible.

## T4 — Error de temática, aviso preventivo y sustitución

- [x] Escribir primero los tests: error de temática obligatoria, aviso preventivo, sustitución al
      enviar (un solo mensaje de temática), limpieza al elegir temática y precedencia sobre un
      error de duración.
- [x] Añadir a `ThemeSelect` las props `describedBy` e `invalid` aplicadas al `<select>`.
- [x] Asociar y marcar el selector con el error de temática y con el aviso preventivo, ambos con
      `role="alert"` e identificador propio.
- [x] Al enviar con el aviso preventivo visible, mostrar solo el error del envío; al cambiar la
      temática, ocultar el mensaje y dejar de marcar el selector.
- Test: RF-10, RF-11 y RF-14.
- Hecho cuando: los tests pasan y en el DOM solo hay un mensaje de temática visible en cada estado.

## T5 — Error del servidor y limpieza del error de duración

- [x] Escribir primero los tests: error del servidor anunciado sin asociación, que permanece al
      editar la duración y desaparece en el siguiente envío; error de duración que desaparece al
      corregir.
- [x] Marcar como `kind: 'server'` el error que devuelve la escritura, sin `aria-describedby` ni
      `aria-invalid`.
- [x] Limpiar el error de duración al modificar horas o minutos y mantener el del servidor hasta el
      siguiente envío.
- Test: RF-11 y RF-12.
- Hecho cuando: los tests pasan y el reintento tras un error de servidor sigue funcionando.

## T6 — Retirar `combineDuration`

- [x] Quitar `combineDuration` de `frontend/src/utils/time.js` y su caso de
      `frontend/test/utils/time.test.js`, manteniendo `splitDuration`.
- Test: la suite completa de frontend y `rg combineDuration`; no se añade un test nuevo porque es
  una retirada sin cambio observable.
- Hecho cuando: `rg combineDuration` no devuelve resultados y `npm test -w frontend` pasa.

## T7 — Documentación y deuda

- [x] Añadir en `README.md` una frase sobre la comprobación de la duración en el formulario y el
      anuncio de los errores asociados al campo.
- [x] Marcar en `DEUDA_TECNICA.md` B8-5, B9-3, B9-4 y B9-6 como resueltos, y anotar en B0-7 que el
      anuncio con lector de pantalla queda pendiente de la capa E2E.
- [x] Actualizar el resumen y los totales de `DEUDA_TECNICA.md` (54/14/1 → 58/10/1) y las notas de
      prioridad de los bloques 8 y 9.
- [x] Registrar el cierre y la decisión en `MEMORY.md`.
- Test: no aplica (documentación); se comprueba que los estados, los totales y las referencias son
  coherentes.
- Hecho cuando: los tres documentos reflejan el comportamiento implementado, los totales cuadran y
  la nota de E2E está registrada.

## T8 — Validación final de la feature

- [x] Ejecutar `npm test` y `npm run lint` desde la raíz.
- [x] Hacer la mutación de cada regla nueva copiando antes a `/tmp/opencode` y restaurando archivo
      por archivo: precedencia, mínimo total, máximo total, rango de minutos, `aria-invalid`,
      `aria-describedby`, limpieza al corregir, sustitución del aviso y envío de enteros.
- [x] Revisar en Chrome DevTools el árbol de accesibilidad: rol de alerta, asociación descriptiva y
      desaparición del estado de no válido al corregir.
- [x] Cambiar la spec a `implementada (2026-11-18)` y estas tareas a `completada`.
- Test: matriz RF → test del plan completa y sin huecos.
- Hecho cuando: `npm test` y lint en verde, todas las mutaciones detectadas y la matriz sin
  resultados ausentes.

## Orden y dependencias

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8.

T2 depende de T1; T3, T4 y T5 comparten el estado de error de `SessionForm` y van en ese orden;
T6 solo puede hacerse cuando T2 haya dejado `combineDuration` sin uso; T7 y T8 cierran la feature.
