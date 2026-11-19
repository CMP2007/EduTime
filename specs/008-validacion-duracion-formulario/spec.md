# Spec 008 — Validación explícita y accesible de la duración del formulario de clases

> Origen: DEUDA_TECNICA.md · B8-5, B9-3, B9-4 y B9-6
> Estado: implementada (2026-11-18)

## Contexto y objetivo

Al registrar o editar una clase, la duración se introduce en horas y minutos. Hoy el
formulario convierte en 0 cualquier valor que no puede interpretar como número, sin avisar; solo
comprueba el mínimo, y deja el máximo a lo que el control del navegador quiera impedir; y el
mensaje de error no está asociado a ningún campo, de modo que una tecnología de asistencia puede
no anunciarlo o no relacionarlo con lo que hay que corregir.

El objetivo es que el formulario compruebe la duración de forma explícita antes de enviarla, con
las mismas reglas y mensajes equivalentes a los del servidor, y que el error se anuncie y quede
asociado al campo correspondiente. La validación del servidor sigue siendo la autoridad final;
este cambio evita viajes innecesarios y mejora la corrección y la accesibilidad.

## Usuarios / actores

- **Usuario de StudyTrack**: persona que registra o edita una clase y necesita saber qué
  duración corregir sin perder el resto de lo escrito.
- **Usuario de tecnología de asistencia**: persona que usa lector de pantalla o navegación por
  teclado y necesita que el error se anuncie y se asocie al campo.
- **Servidor**: autoridad final de las reglas; sigue validando y rechazando aunque el formulario
  deje pasar algo.

## Historias de usuario

- H1: Como usuario quiero que una duración mal escrita se me señale antes de guardar para
  corregirla sin perder el resto del formulario.
- H2: Como usuario quiero que el máximo real de 23:59 se compruebe igual que el mínimo para no
  depender de lo que permita el navegador.
- H3: Como usuario de lector de pantalla quiero que el error se anuncie y esté asociado al campo
  para saber qué corregir sin recorrer todo el formulario.
- H4: Como usuario quiero que el aviso desaparezca cuando corrijo el campo al que se refiere para
  no seguir viendo un error ya resuelto.

## Definiciones

- **Campo de duración**: cada uno de los dos controles numéricos del formulario, horas y minutos.
- **Campo de duración vacío**: un control sin contenido, o con solo espacios. Se interpreta como
  0, igual que hoy.
- **Entrada de duración inválida**: un valor presente en un campo de duración que no es un
  entero mayor o igual que 0.
- **Duración resultante**: horas × 60 + minutos, en minutos.
- **Reglas de duración vigentes**: mínimo 15 minutos; máximo 1439 minutos (23:59); horas entero
  mayor o igual que 0; minutos entero mayor o igual que 0; y, cuando la duración resultante no
  supera el máximo, minutos menores o iguales que 59.
- **Precedencia de errores de duración**: primero horas inválidas; después minutos inválidos;
  después máximo total; después rango de minutos; por último mínimo total.
- **Error de duración**: mensaje que impide guardar por incumplir una regla de duración.
- **Error de temática**: mensaje que impide guardar por no haber una temática válida elegida.
  Incluye el que aparece al enviar y el aviso preventivo que se muestra al abrir la edición
  cuando la temática guardada ya no está en el catálogo.
- **Error del servidor**: mensaje que aparece al fallar la escritura por causas ajenas a la
  validación del formulario.
- **Precedencia entre campos**: la temática se valida antes que la duración; si ambas son
  inválidas, el mensaje visible es el de temática.
- **Campo asociado**: selector de temática para los errores de temática; grupo de horas y minutos
  para los errores de duración.
- **Controles afectados**: el selector de temática en los errores de temática; en los errores de
  duración, los que nombra el mensaje (horas, minutos o ambos), y ambos en los de mínimo y máximo
  total.
- **Anuncio accesible**: exposición del mensaje como alerta, de forma que una tecnología de
  asistencia lo comunique sin mover el foco.

## Requisitos funcionales (EARS)

- RF-1: CUANDO el usuario envía el formulario con uno o ambos campos de duración vacíos, EL
  SISTEMA interpreta cada campo vacío como 0 antes de aplicar las reglas de duración.
- RF-2: CUANDO el usuario envía el formulario con horas o minutos que no son un entero mayor o
  igual que 0, EL SISTEMA no envía la clase y muestra un mensaje que identifica el campo
  afectado.
- RF-3: CUANDO se incumplen varias reglas de duración a la vez, EL SISTEMA informa de un único
  error según la precedencia definida.
- RF-4: SI la duración resultante es menor que 15 minutos, ENTONCES EL SISTEMA no envía la clase
  y muestra un mensaje que indica el mínimo de 15 minutos.
- RF-5: SI la duración resultante es mayor que 1439 minutos, ENTONCES EL SISTEMA no envía la
  clase y muestra un mensaje que indica el máximo de 23:59.
- RF-6: SI la duración resultante no supera 1439 minutos y los minutos son mayores que 59,
  ENTONCES EL SISTEMA no envía la clase y muestra un mensaje sobre los minutos.
- RF-7: CUANDO la duración cumple todas las reglas y la temática es válida, EL SISTEMA envía la
  clase con las horas y los minutos interpretados como enteros.
- RF-8: CUANDO el formulario muestra un error, EL SISTEMA lo anuncia de forma accesible sin mover
  el foco.
- RF-9: MIENTRAS el error visible es de duración, EL SISTEMA asocia el mensaje al grupo de horas
  y minutos y marca como no válidos los controles afectados por el mensaje.
- RF-10: MIENTRAS el error visible es de temática —tanto el de un envío rechazado como el aviso
  preventivo de una temática que ya no existe—, EL SISTEMA asocia el mensaje al selector de
  temática y lo marca como no válido.
- RF-11: CUANDO el usuario modifica el campo asociado al error visible —el selector de temática o
  cualquiera de los dos controles de duración—, EL SISTEMA oculta el mensaje y deja de marcar los
  controles afectados.
- RF-12: CUANDO el error visible procede de un fallo del servidor, EL SISTEMA lo anuncia sin
  asociarlo a ningún campo, sin marcarlo como no válido y lo mantiene hasta el siguiente envío.
- RF-13: CUANDO el formulario rechaza el envío, EL SISTEMA conserva los valores escritos de
  temática, fecha, duración y observaciones, y deja el formulario disponible para corregir y
  reintentar.
- RF-14: CUANDO el usuario envía el formulario con el aviso preventivo de temática visible, EL
  SISTEMA sustituye ese aviso por el error de temática del envío, de modo que solo hay un mensaje
  de temática visible a la vez.

## Requisitos no funcionales

- **Accesibilidad**: el error se expone como alerta; la asociación al campo usa la relación
  descriptiva estándar; el estado de no válido solo se muestra mientras el error de ese campo
  está visible; el orden de tabulación y el foco no cambian al aparecer el error.
- **Idioma**: mensajes en español, equivalentes en contenido a los del servidor; identificadores
  internos en inglés.
- **Compatibilidad**: no cambia el contrato de la clase ni el de la API; el servidor sigue
  validando y rechazando con sus propios mensajes.
- **Dependencias**: ninguna nueva.
- **Datos**: no hay cambios en el modelo ni migración; no se guardan datos nuevos.
- **Rendimiento**: la validación es inmediata al enviar y no genera peticiones adicionales.

## Casos límite

- Horas y minutos vacíos → se interpretan como 0 → error de mínimo.
- Horas vacías y minutos 90 → duración resultante 90 → error de minutos (no supera el máximo).
- Horas 24 y minutos 0 → duración resultante 1440 → error de máximo.
- Horas 23 y minutos 60 → duración resultante 1440 → error de máximo (el máximo manda sobre el
  rango de minutos).
- Horas 0 y minutos 60 → duración resultante 60 → error de minutos.
- Horas decimales o negativas → error de horas.
- Minutos decimales o negativos → error de minutos; si horas y minutos son inválidos a la vez,
  manda el error de horas.
- Texto que el control numérico del navegador no conserva: se comporta como campo vacío, no como
  entrada inválida.
- Duración resultante exactamente 15 minutos → válida.
- Duración resultante exactamente 1439 minutos (23:59) → válida.
- Error de duración visible y el usuario cambia horas o minutos → el mensaje desaparece.
- Error de temática visible y el usuario elige otra temática → el mensaje desaparece.
- Aviso preventivo de temática inexistente visible y el usuario elige una temática del catálogo →
  el aviso desaparece.
- Aviso preventivo de temática inexistente visible y el usuario envía → solo queda el mensaje de
  temática del envío.
- Error del servidor visible y el usuario modifica la duración → el mensaje permanece hasta el
  siguiente envío.
- Sin temática elegida y con una duración menor que 15 minutos → el mensaje visible es el de la
  temática.
- Temática inválida y duración inválida a la vez → el mensaje visible es el de la temática.
- Horas escritas como `1e2` → se interpretan como 100 → error de máximo.
- Horas escritas como `1.5` → no son un entero → error de horas.
- Horas escritas como `1.0` → se interpretan como 1 → válidas.
- Minutos escritos como `-1` → error de minutos.

## Fuera de alcance

- B9-2 (búsqueda sin retardo) y el resto de deuda no relacionada.
- Validación en el cliente de la fecha, las observaciones o la temática más allá de la
  obligatoriedad ya existente.
- Cambiar el mínimo de 15 minutos, el máximo de 23:59 o la forma de introducir la duración.
- Sustituir o relajar la validación del servidor.
- Rediseño visual del formulario o mensajes independientes por cada control de duración.
- Cambiar los textos de error del servidor.

## Criterios de finalización

- RF-1 a RF-14 cubiertos por tests del frontend.
- Los casos límite anteriores cubiertos por tests o por comprobación manual declarada.
- `npm test` y `npm run lint` en verde desde la raíz.
- Cada test nuevo falla si se revierte la regla que cubre (mutación).
- Comprobación manual en navegador: el mensaje aparece con rol de alerta en el árbol de
  accesibilidad, la asociación descriptiva y el estado de no válido se ven en el inspector, y el
  estado desaparece al corregir.
- El anuncio real con lector de pantalla queda pendiente de la capa de pruebas de extremo a
  extremo (se anota en B0-7 de `DEUDA_TECNICA.md`); los tests unitarios comprueban el rol, la
  asociación y el estado.
- `DEUDA_TECNICA.md` marca B8-5, B9-3, B9-4 y B9-6 como resueltos, y `MEMORY.md` registra el
  cierre.

## Dudas abiertas

- Ninguna bloqueante. Decisiones cerradas: un campo vacío vale 0; se espejan todas las reglas de
  duración del servidor con su precedencia y la temática se valida antes que la duración; hay un
  único mensaje de error asociado al campo correspondiente; el aviso preventivo de temática
  inexistente cuenta como error de temática y el envío lo sustituye, de modo que nunca hay dos
  mensajes de temática a la vez; el error se limpia al corregir su campo asociado y el del
  servidor se mantiene hasta el siguiente envío; los casos de notación numérica se concretan con
  ejemplos; el control de desbordamiento a 375 px queda fuera de los criterios de cierre
  (registrado como deuda `B11-8`); el anuncio con lector de pantalla se comprobará en la capa de
  pruebas de extremo a extremo, aún pendiente (B0-7).
- [NO BLOQUEANTE] Los textos exactos de los mensajes se fijan en el plan, manteniendo la
  equivalencia con los del servidor.
