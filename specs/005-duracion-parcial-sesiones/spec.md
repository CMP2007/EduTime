# Spec 005 — Duración parcial en el alta y la edición de clases

> Origen: DEUDA_TECNICA.md · B4-2
> Estado: implementada (2026-11-10)

## Contexto y objetivo

Hoy, al registrar una clase se exige indicar horas y minutos a la vez. En la edición ocurre algo parecido: si solo se envía uno de los dos, el sistema rechaza la petición con un mensaje confuso sobre el campo que falta. Editar sin enviar ninguno ya conserva la duración actual; esta feature mantiene ese comportamiento y añade el ajuste de valores guardados fuera de rango.

El objetivo es que la duración pueda expresarse de forma parcial: enviar horas y minutos juntos, enviar solo uno de los dos (el que falte se interpreta como 0), o, al editar, no enviar ninguno (se conserva la duración actual y, si está fuera de rango, se ajusta al límite válido más cercano). Se mantienen las reglas de duración existentes: mínimo 15 minutos y máximo 23:59 (1439 minutos).

## Usuarios / actores

- **Consumidor de la API de clases**: cliente que crea o edita clases y necesita enviar la duración de forma parcial.
- **Usuario de StudyTrack**: se beneficia indirectamente de un contrato más claro y predecible; su interfaz actual no cambia.

## Historias de usuario

- H1: Como consumidor de la API quiero enviar solo horas o solo minutos al crear una clase para no tener que completar un campo que vale 0.
- H2: Como consumidor de la API quiero editar otros datos sin reenviar la duración para no arriesgarme a cambiarla sin querer.
- H3: Como consumidor de la API quiero recibir un error claro cuando no indico duración al crear para saber exactamente qué corregir.
- H4: Como consumidor de la API quiero que un registro antiguo con una duración imposible se corrija al editarlo para no arrastrar datos fuera de rango.

## Definiciones

- **Campo de duración ausente**: el campo no viene en la petición, o viene con valor `null` o cadena vacía. Se interpreta como 0.
- **Coerción numérica**: se mantiene la conversión numérica existente; por ejemplo, la cadena `"2"` equivale al número 2 y una cadena de solo espacios equivale a 0.
- **Duración parcial**: petición que incluye solo uno de los dos campos de duración (horas o minutos).
- **Duración actual**: duración ya guardada de una clase, expresada en minutos totales.
- **Duración válida**: total en minutos entre 15 y 1439 (23:59), ambos inclusive.
- **Duración fuera de rango**: duración guardada menor que 15 o mayor que 1439.
- **Ajuste al límite válido más cercano**: una duración fuera de rango se lleva a 15 si es menor que 15, o a 1439 si es mayor que 1439. El ajuste es silencioso: la respuesta devuelve la clase con la duración ajustada y no se añade un aviso.
- **Precedencia de errores de duración**: primero se valida el tipo y signo de horas; después el de minutos; después el máximo total; después el rango 0–59 de minutos cuando el total no supera el máximo; y por último el mínimo total.

## Requisitos funcionales (EARS)

- RF-1: CUANDO se crea una clase con horas y minutos válidos, EL SISTEMA guarda la duración total resultante de sumar horas × 60 y minutos.
- RF-2: CUANDO se crea una clase con solo horas, EL SISTEMA interpreta los minutos ausentes como 0 y guarda la duración en minutos.
- RF-3: CUANDO se crea una clase con solo minutos, EL SISTEMA interpreta las horas ausentes como 0 y guarda la duración en minutos.
- RF-4: CUANDO se crea una clase sin horas ni minutos, EL SISTEMA rechaza la petición con un error de validación que indica que la clase debe durar al menos 15 minutos.
- RF-5: CUANDO se edita una clase con horas y minutos válidos, EL SISTEMA actualiza la duración total resultante.
- RF-6: CUANDO se edita una clase con solo horas, EL SISTEMA interpreta los minutos ausentes como 0 y actualiza la duración.
- RF-7: CUANDO se edita una clase con solo minutos, EL SISTEMA interpreta las horas ausentes como 0 y actualiza la duración.
- RF-8: CUANDO se edita una clase sin horas ni minutos, EL SISTEMA conserva la duración actual; si esa duración es menor que 15, la guarda como 15, y si es mayor que 1439, la guarda como 1439.
- RF-9: SI la duración resultante es menor que 15 minutos, ENTONCES EL SISTEMA rechaza la petición con un error de validación que indica el mínimo de 15 minutos.
- RF-10: SI la duración resultante es mayor que 1439 minutos, ENTONCES EL SISTEMA rechaza la petición con un error de validación que indica que el máximo es 23:59.
- RF-11: SI las horas no son un entero mayor o igual que 0, ENTONCES EL SISTEMA rechaza la petición con un error de validación sobre las horas.
- RF-12: SI los minutos no son un entero mayor o igual que 0, ENTONCES EL SISTEMA rechaza la petición con un error de validación sobre los minutos.
- RF-13: SI la duración resultante no supera 1439 minutos y los minutos son mayores que 59, ENTONCES EL SISTEMA rechaza la petición con un error de validación sobre los minutos.
- RF-14: EL SISTEMA conserva la respuesta de una clase guardada con la duración total en minutos y el resto de campos sin cambios.
- RF-15: CUANDO se incumplen varias reglas de duración a la vez, EL SISTEMA informa del error según la precedencia definida.

## Requisitos no funcionales

- **Idioma**: mensajes de error en español; identificadores internos en inglés.
- **Compatibilidad**: el contrato de respuesta de una clase no cambia; la duración sigue siendo un entero de minutos.
- **Dependencias**: ninguna nueva.
- **Datos**: no hay migración; las clases ya guardadas se leen igual y solo se ajustan al editarse sin duración.
- **Seguridad**: no se añaden datos ni exposición nuevos.
- **Rendimiento**: sin cambios observables en los tiempos de respuesta.

## Casos límite

- Crear con `null` o cadena vacía en uno o ambos campos: se tratan como ausentes.
- Cadenas numéricas como `"2"` se aceptan y equivalen a 2; el resto de conversiones sigue el comportamiento actual.
- Crear con ambos campos ausentes (`null`/vacío) → 400 con mensaje de mínimo.
- Crear con `{horas: 0, minutos: 0}` → 400 con mensaje de mínimo.
- Crear con `{horas: 0}` solo → 400 con mensaje de mínimo.
- Crear con `{minutos: 0}` solo → 400 con mensaje de mínimo.
- Editar sin duración una clase con duración 10 → se guarda 15.
- Editar sin duración una clase con duración 0 → se guarda 15.
- Editar sin duración una clase con duración 1440 → se guarda 1439.
- Editar sin duración una clase con duración 2000 → se guarda 1439.
- Editar sin duración una clase con duración 15 o 1439 → no cambia.
- Editar con solo un campo y resultado 0 → 400 con mensaje de mínimo.
- Duración exactamente 15 minutos → válida.
- Duración exactamente 1439 minutos (23:59) → válida.
- Duración 1440 minutos, con `{horas: 24}` o `{horas: 23, minutos: 60}` → 400 con mensaje de máximo 23:59.
- Horas 24 → 400 con mensaje de máximo 23:59 (no con el mensaje de rango de horas).
- Minutos 60 con total no superior a 1439 (por ejemplo `{horas: 0, minutos: 60}`) → 400 con mensaje sobre minutos.
- Minutos 60 con total superior a 1439 (por ejemplo `{horas: 23, minutos: 60}`) → 400 con mensaje de máximo 23:59.
- Horas o minutos no numéricos, decimales o negativos → 400 sobre el campo correspondiente; si ambos son inválidos por tipo o signo, el error de horas tiene prioridad.
- Horas 24 y minutos 60 → 400 con mensaje de máximo 23:59 (el máximo total manda sobre el rango de minutos).
- Enviar solo una duración total directa en minutos, sin horas ni minutos: en el alta → 400 con mensaje de mínimo; en la edición → se conserva la duración actual y se ajusta si procede.
- Editar una clase inexistente → 404 (comportamiento actual, sin cambios).
- Errores de temática o fecha siguen teniendo prioridad sobre la duración (comportamiento actual).

## Fuera de alcance

- Cambios en la interfaz de usuario: el formulario seguirá enviando horas y minutos juntos.
- Aceptar una duración total directa en minutos como campo alternativo: se ignora siempre; si se envía junto con horas y minutos, mandan horas y minutos.
- Cambiar el mínimo de 15 minutos o el máximo de 23:59.
- Cambiar las reglas de temática, fecha, notas o la forma de la respuesta.
- Hacer una migración masiva o reescribir clases que no se editan; el ajuste solo se aplica al editar una clase sin duración.
- Registros con duración guardada no numérica o no entera: se asume que la duración es un número entero y no se define un comportamiento para datos corruptos de tipo.
- El ajuste de mensajes del formulario del frontend (B9-3).
- B4-3, B4-5 y el resto de deuda no relacionada.

## Criterios de finalización

- RF-1 a RF-15 cubiertos por tests del backend.
- Casos límite anteriores cubiertos por tests o comprobación manual declarada.
- `npm test` y `npm run lint` en verde desde la raíz.
- Cada test nuevo falla si se revierte la regla que cubre (mutación).
- `README.md` documenta el máximo como 1439 (23:59), la duración parcial, el ajuste de registros fuera de rango y que la duración total directa no se acepta.
- `DEUDA_TECNICA.md` marca B4-2 como resuelto.
- No aplica comprobación de UI: la feature no cambia la interfaz.

## Dudas abiertas

- Ninguna bloqueante. Decisiones cerradas: `null` y cadena vacía cuentan como ausentes; se mantiene la coerción numérica actual; el error de horas tiene prioridad sobre el de minutos; el máximo total manda sobre los rangos de campo; los registros guardados fuera de rango se ajustan a 15 o 1439 al editarse sin duración; la duración total directa se ignora siempre; el ajuste es silencioso; el NFR de rendimiento es observable; el alcance es solo la API.
- [NO BLOQUEANTE] Los textos exactos de los errores de horas y minutos se fijan en el plan; los de mínimo y máximo ya quedan definidos por su contenido.
