# Spec 001 — Accesibilidad del modal

> Origen: DEUDA_TECNICA.md · B8-2
> Estado: implementada (2026-10-22)

## Contexto y objetivo
El componente `Modal` es la base de los dos diálogos de la app (formulario de sesión y
confirmación de borrado). Hoy no gestiona el foco ni el scroll: con teclado se puede tabular
fuera del diálogo, al cerrarlo el foco se pierde, el fondo sigue desplazándose y un clic
accidental en el fondo cierra y descarta lo escrito. Esta iteración convierte `Modal` en un
diálogo modal accesible, sin tocar a sus dos consumidores.

## Usuarios / actores
El estudiante, tanto con teclado como con lector de pantalla, y cualquier usuario que abra o
cierre un diálogo.

## Historias de usuario
- H1: Como usuario de teclado quiero que el foco quede dentro del diálogo y vuelva a donde
  estaba al cerrarlo, para no perder el hilo.
- H2: Como usuario quiero que el fondo no se desplace mientras el diálogo está abierto.
- H3: Como usuario quiero cerrar el diálogo solo de forma intencionada, para no perder lo
  escrito por un clic accidental.

## Requisitos funcionales (EARS)
- RF-1: CUANDO se abra un modal, EL SISTEMA moverá el foco al primer campo editable del
  cuerpo del diálogo; si no hay campos, al primer botón habilitado del cuerpo; si no hay
  ninguno, al contenedor del diálogo.
- RF-2: MIENTRAS un modal esté abierto, EL SISTEMA mantendrá el foco dentro del diálogo al
  pulsar Tab y Shift+Tab, ciclando del último al primer elemento y viceversa y saltando los
  elementos deshabilitados.
- RF-3: CUANDO se cierre un modal, EL SISTEMA devolverá el foco al elemento que lo abrió.
- RF-4: SI al cerrarse el modal el elemento que lo abrió ya no está en el documento, ENTONCES
  EL SISTEMA moverá el foco al contenido principal (`<main>`).
- RF-5: MIENTRAS un modal esté abierto, EL SISTEMA impedirá el desplazamiento del fondo y
  restaurará el estilo previo del `body` al cerrarse.
- RF-6: CUANDO el usuario pulse Escape, EL SISTEMA cerrará el modal.
- RF-7: CUANDO el usuario pulse el botón «Cerrar» de la cabecera, EL SISTEMA cerrará el modal.
- RF-8: SI el usuario pulsa sobre el fondo del diálogo, ENTONCES EL SISTEMA no cerrará el
  modal ni modificará su estado.

## Requisitos no funcionales
- Se conservan `role="dialog"`, `aria-modal="true"` y `aria-labelledby` con el título.
- Sin dependencias nuevas (principio 1 de la constitución).
- Los textos visibles siguen en español; identificadores y código, en inglés.
- El foco visible no se elimina ni se oculta con estilos.

## Casos límite
- El disparador desaparece al cerrar (borrar la última sesión): foco al `main`.
- El modal se desmonta sin cerrar por un error de render: el `body` no queda bloqueado.
- Todos los botones del cuerpo deshabilitados (estado de borrado en curso): Tab salta los
  deshabilitados y el foco se queda en la «×».
- El primer campo del cuerpo está deshabilitado: se usa el siguiente enfocable.
- El modal no tiene ningún elemento enfocable: no alcanzable hoy, porque la «×» siempre
  existe; no se especifica.
- Escape con el foco dentro de un campo de texto: cierra igual (no hay edición que lo consuma).
- Clic o pulsación que empieza en el fondo y termina dentro (o al revés): no cierra.
- Dos modales abiertos a la vez: no ocurre hoy; el anidamiento queda fuera de alcance.

## Fuera de alcance
- Avisar de cambios sin guardar: Escape y «×» siguen descartando el contenido.
- Impedir el cierre con Escape mientras el diálogo de borrado está en curso (`busy`).
- Compensar el ancho de la barra de scroll para evitar el salto de layout en escritorio.
- Foco contextual por pantalla (fila siguiente, botón «Nueva clase»).
- Modales anidados y estilos o animaciones de apertura.

## Criterios de finalización
- RF-1 a RF-8 cubiertos por tests, con un archivo nuevo `frontend/test/components/Modal.test.jsx`.
- Se actualizan los tests existentes que esperen el cierre por clic en el fondo.
- `npm test` y `npm run lint` en verde desde la raíz.
- Cada test nuevo falla si se revierte la regla que cubre (mutación).
- Comprobación manual con teclado en Chrome: abrir y cerrar el formulario y el borrado, tabular
  en ambos sentidos, y verificar el retorno del foco.

## Dudas abiertas
- [NO BLOQUEANTE] ¿Añadir una nota en la interfaz de que el fondo ya no cierra? No es
  necesario con Escape y «×» visibles, pero cambia una costumbre de uso.
