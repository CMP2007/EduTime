# Tasks 001 — Accesibilidad del modal

> Spec: specs/001-modal-accesible/spec.md · Plan: specs/001-modal-accesible/plan.md
> Estado: completada (T1–T10)

Cada tarea es un cambio pequeño y verificable. La columna «Test» indica qué prueba debe
existir antes de dar la tarea por hecha; si el test no falla al revertir el cambio, la tarea
no está terminada.

## T1 — Arnés de test del Modal
- [x] Crear `frontend/test/components/Modal.test.jsx` con un componente auxiliar que monte un
      disparador, un `<main tabIndex={-1}>` y el `Modal` controlado por estado.
- [x] Tests de comportamiento actual que deben seguir pasando: Escape cierra (RF-6) y «×»
      cierra (RF-7).
- Test: los dos casos, con `onClose` simulado.
- Hecho cuando: `npx vitest run frontend/test/components/Modal.test.jsx` pasa.

## T2 — El fondo deja de cerrar (RF-8)
- [x] Test en rojo: `mousedown` en `.modal-overlay` no llama a `onClose`, y en el interior
      tampoco.
- [x] Eliminar `handleBackdrop` y el `onMouseDown` del overlay.
- Test: RF-8.
- Hecho cuando: el test pasa y no queda ningún manejador de cierre en el fondo.

## T3 — Foco inicial (RF-1)
- [x] Tests de las tres ramas: primer campo editable, si no primer botón del cuerpo, si no
      contenedor del diálogo con `tabIndex={-1}`.
- [x] Implementar el `useEffect` de montaje con el orden de preferencia.
- Test: RF-1 (tres casos).
- Hecho cuando: `SessionForm` enfoca «Temática» y `ConfirmDialog` enfoca «Cancelar».

## T4 — Trampa de foco (RF-2)
- [x] Tests: Tab en el último vuelve al primero; Shift+Tab en el primero va al último; los
      botones deshabilitados se saltan.
- [x] Extender el listener de `keydown` existente: calcular enfocables del diálogo, filtrar
      deshabilitados y `[hidden]`, y envolver en ambos sentidos.
- Test: RF-2 (tres casos).
- Hecho cuando: el foco no puede salir del diálogo con Tab ni Shift+Tab.

## T5 — Restaurar el foco (RF-3)
- [x] Test: al desmontar, el foco vuelve al botón que abrió el modal.
- [x] Capturar `document.activeElement` al montar (en un ref) y restaurarlo en la limpieza.
- Test: RF-3.
- Hecho cuando: cerrar con Escape y con «×» devuelve el foco al disparador.

## T6 — Fallback al contenido principal (RF-4)
- [x] Test: si el disparador se elimina del documento antes de cerrar, el foco va a `main`.
- [x] Añadir `tabIndex={-1}` a `<main>` en `App.jsx` y el fallback con
      `document.querySelector('main')`.
- Test: RF-4.
- Hecho cuando: borrar una clase deja el foco en `main`, no en `body`.

## T7 — Bloqueo del scroll (RF-5)
- [x] Tests: `body.style.overflow === 'hidden'` con el modal abierto; se restaura el valor
      previo al cerrar; desmontar sin cerrar no deja el bloqueo.
- [x] Guardar el `overflow` previo y aplicarlo/restaurarlo en el mismo efecto de montaje.
- Test: RF-5 y caso límite de desmontaje.
- Hecho cuando: los tres casos pasan y la comprobación manual confirma que el fondo no se
  desplaza.

## T8 — Limpieza y coherencia
- [x] Quitar `autoFocus` de `SessionForm` (la regla vive en `Modal`).
- [x] Añadir `.app__content:focus { outline: none; }` en `styles.css`.
- [x] Revisar que `onClose` se guarda en un ref y que el listener no se re-suscribe en cada
      render.
- Test: la suite completa sigue en verde, sin cambios en los tests por este motivo.
- Hecho cuando: `npm test` y `npm run lint` pasan desde la raíz.

## T9 — Verificación por mutación y manual
- [x] Revertir una a una las reglas (foco inicial, trampa, restauración, scroll, cierre) y
      comprobar que su test falla; restaurar desde `/tmp/opencode` con `cp`.
- [x] Comprobación manual en Chrome: abrir/cerrar el formulario y el borrado, tabular en ambos
      sentidos, ver el retorno del foco y el fondo sin scroll.
- Hecho cuando: las cinco mutaciones se detectan y el recorrido manual se comporta como la
  spec.

## T10 — Cierre documental
- [x] Marcar `B8-2` como `resuelto` en `DEUDA_TECNICA.md` con la evidencia (tests y commits).
- [x] Actualizar `MEMORY.md` con la decisión y el estado.
- [x] `AGENTS.md` solo si cambia estructura, modelo o comandos; en esta feature no se espera.
- Hecho cuando: la deuda y la memoria reflejan lo implementado.

## Orden y dependencias
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10.

T3 depende de T1 (arnés). T4, T5 y T6 comparten el mismo efecto de montaje: se implementan en
tareas separadas para que cada test aísle una regla.
