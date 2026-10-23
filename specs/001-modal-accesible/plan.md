# Plan 001 — Accesibilidad del modal

> Spec: specs/001-modal-accesible/spec.md
> Estado: aprobado (2026-10-22)

## Contexto técnico
`Modal` se monta solo cuando está abierto: `SessionForm` devuelve `null` sin `open` y
`ConfirmDialog` también. Por tanto, montar/desmontar es el ciclo de vida de abrir/cerrar y
sus efectos (`useEffect`) son el sitio natural para capturar el foco, bloquear el scroll y
restaurar todo al desmontar. El diálogo ya tiene `role="dialog"`, `aria-modal` y
`aria-labelledby`; no hay que tocarlos.

## Enfoque
1. **Foco inicial** en `Modal`, dentro de un `useEffect` de montaje:
   - primer `input | select | textarea` habilitado dentro de `.modal__body`;
   - si no hay, primer `button` habilitado dentro de `.modal__body`;
   - si no hay, el contenedor del diálogo (`tabIndex={-1}`).
   La «×» de la cabecera queda fuera del criterio (decisión de la spec), pero sigue siendo
   enfocable y entra en la trampa.
2. **Trampa de foco** en el mismo listener de `keydown` que ya gestiona Escape: al pulsar Tab,
   calcular los enfocables visibles del diálogo, saltar deshabilitados y envolver del último
   al primero (y al revés con Shift+Tab).
3. **Restauración**: guardar `document.activeElement` al montar; al desmontar, si el elemento
   sigue en el documento (`isConnected`), devolverle el foco; si no, enfocar `main`.
4. **Scroll**: guardar el `overflow` previo del `body`, aplicar `hidden` al montar y
   restaurarlo en la limpieza (cubre el desmontaje sin cierre).
5. **Cierre**: se mantienen Escape y «×». Se elimina el `onMouseDown` del overlay, de modo que
   el fondo deja de cerrar (RF-8).
6. **Fallback `main`**: añadir `tabIndex={-1}` a `<main>` en `App.jsx` y, en `Modal`, buscar
   `main` con `document.querySelector('main')` si el disparador desapareció.
7. **Sin anillo de foco en `main`**: `tabIndex={-1}` no entra en el orden de tabulación, así
   que el foco solo puede llegar ahí por programa. Se elimina el borde con
   `.app__content:focus { outline: none; }`, sin afectar a ningún control interactivo.

## Archivos afectados
| Archivo | Cambio |
|---|---|
| `frontend/src/components/Modal.jsx` | Foco inicial, trampa, restauración, scroll y eliminación del cierre por fondo |
| `frontend/src/App.jsx` | `tabIndex={-1}` en `<main>` |
| `frontend/src/sessions/SessionForm.jsx` | Quitar `autoFocus` (la regla pasa a `Modal`) |
| `frontend/src/styles.css` | `.app__content:focus { outline: none; }` |
| `frontend/test/components/Modal.test.jsx` | Nuevo: un test por RF y por caso límite |
| `frontend/test/components/ConfirmDialog.test.jsx` | Solo si algún caso cambia; hoy no prueba el fondo |

## Decisiones y alternativas
- **Trampa manual, sin dependencias.** `focus-trap-react` haría el trabajo, pero la
  constitución exige justificar dependencias y aquí son ~20 líneas. Se descarta.
- **Foco inicial en el cuerpo, no en la cabecera.** Mantiene el foco en la acción útil sin
  cambiar a los consumidores; en el borrado cae en «Cancelar» (menos destructivo).
- **Fallback `main` mediante selector.** Alternativa: prop `fallbackFocusSelector`. Se
  descarta por superficie; si otro consumidor lo necesita, se añade entonces.
- **Quitar `autoFocus` de `SessionForm`** (aprobado): la regla de foco inicial vive solo en
  `Modal`, sin dos mecanismos compitiendo.
- **Sin anillo en `main`** (aprobado): es un contenedor no interactivo y no tabulable; el
  indicador visual no aporta y el borde programático confunde. El resto de controles conserva
  su foco visible.
- **No usar `focusin` como red de seguridad.** La spec solo exige Tab; añadir `focusin`
  cubriría clics del ratón fuera del diálogo, pero el overlay ya tapa el fondo.

## Riesgos
- **StrictMode en desarrollo** ejecuta efecto → limpieza → efecto. Capturar el foco antes de
  moverlo y restaurar en la limpieza hace que la segunda captura vuelva a ver el disparador;
  hay que comprobarlo a mano, porque los tests corren sin StrictMode.
- **jsdom no implementa la navegación con Tab**: los tests deben comprobar que el handler
  mueve el foco y hace `preventDefault`, no esperar el comportamiento nativo.
- **`onClose` cambia de identidad en cada render de `App`**, lo que re-suscribe el listener.
  Se guardará en un ref para que el efecto no se re-ejecute ni repita la captura de foco.
- **Elementos ocultos**: sin layout en jsdom, filtrar por `offsetParent` no sirve; se
  filtrarán deshabilitados y `[hidden]`, y el resto se considera enfocable.
- **Orden de la limpieza**: la restauración usa la referencia capturada, no
  `document.activeElement`, para no depender del orden de desmontaje de React.

## Verificación contra la constitución
- Principio 1: sin dependencias nuevas.
- Principio 3: todo el comportamiento vive en `Modal`; `App` solo aporta el `main` enfocable.
- Principio 4: cada RF con test que falla al revertirlo; `npm test` y `npm run lint` en verde.
- Principio 5: no se tocan datos ni secretos.
- Principio 6: textos en español, identificadores en inglés.

## Plan de pruebas (RF → test)
| RF | Caso |
|---|---|
| RF-1 | Formulario: foco en temática. Sin campos: foco en «Cancelar». Sin controles en el cuerpo: foco en el diálogo |
| RF-2 | Tab en el último vuelve al primero; Shift+Tab en el primero va al último; deshabilitados se saltan |
| RF-3 | Al cerrar, el foco vuelve al botón que abrió |
| RF-4 | Disparador eliminado antes de cerrar: foco en `main` |
| RF-5 | `body.style.overflow = 'hidden'` abierto; se restaura el valor previo al cerrar |
| RF-6 | Escape llama a `onClose` una vez |
| RF-7 | Clic en «Cerrar» llama a `onClose` |
| RF-8 | `mousedown` en el overlay no cierra; en el interior tampoco |
| Caso límite | Desmontar sin cerrar deja el `body` sin el bloqueo |

## Orden de implementación
1. Tests de RF-6, RF-7 y RF-8 (comportamiento actual, salvo RF-8).
2. Foco inicial y `tabIndex` del contenedor (RF-1).
3. Trampa de foco (RF-2).
4. Restauración y fallback `main` (RF-3, RF-4).
5. Bloqueo de scroll y limpieza (RF-5 y caso de desmontaje).
6. Quitar `autoFocus` de `SessionForm`, añadir el CSS y pasar lint/tests completos.
7. Mutación: revertir cada regla y confirmar que su test falla.

## Fuera de alcance
El de la spec: aviso de cambios sin guardar, bloqueo de Escape durante `busy`, compensación de
la barra de scroll, foco contextual por pantalla, modales anidados y estilos.
