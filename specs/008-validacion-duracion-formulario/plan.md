# Plan 008 — Validación explícita y accesible de la duración del formulario de clases

> Spec: specs/008-validacion-duracion-formulario/spec.md
> Estado: aprobado (2026-11-18)

## Contexto técnico

Hoy `SessionForm.jsx` calcula la duración total con `combineDuration` (en `utils/time.js`), que
convierte cualquier valor no numérico en `0`, y solo comprueba el mínimo. El máximo queda en los
atributos `max` de los dos controles y el mensaje se pinta como un `<p className="error">` sin
identificador ni relación con el campo. Al editar una clase cuya temática ya no existe, el
formulario muestra un aviso preventivo (`role="status"`) que hoy puede convivir con el error del
envío.

`combineDuration` solo lo consume `SessionForm` (y su test), así que se puede sustituir sin
arrastrar a otros consumidores. Las reglas de duración ya viven en `packages/domain-constants`
(`DURATION_MIN`, `DURATION_MAX`, `MINUTES_MAX`), que es la fuente única frente al backend. El
selector de temática es un componente aparte (`ThemeSelect.jsx`) que hoy no acepta atributos ARIA;
habrá que abrirle esa puerta de forma explícita.

## Enfoque

1. **Extraer la validación de la duración a una función pura** (`sessions/durationInput.js`):
   recibe los dos valores del formulario y devuelve, en una sola llamada, los enteros
   interpretados, la duración total y, si procede, el mensaje con los controles afectados.
   Reglas y precedencia idénticas a las del backend:
   - Campo vacío o solo espacios → `0`.
   - Horas: entero ≥ 0; si no, mensaje de horas.
   - Minutos: entero ≥ 0; si no, mensaje de minutos.
   - Total > `DURATION_MAX` → mensaje de máximo (afecta a horas y minutos).
   - Minutos > `MINUTES_MAX` (con total dentro de rango) → mensaje de minutos.
   - Total < `DURATION_MIN` → mensaje de mínimo (afecta a horas y minutos).
   Devuelve también si es válida y los enteros listos para enviar, de modo que el formulario no
   repita conversiones.

2. **Sustituir `combineDuration` por la función pura** en `SessionForm`, y retirar
   `combineDuration` de `utils/time.js` (solo la usaba el formulario). El envío pasa a usar los
   enteros que devuelve la validación, no `Number(...) || 0`.

3. **Modelar el error como un único objeto discriminado** en `SessionForm`:
   `{ kind: 'theme' | 'duration' | 'server', message, fields }`. De ahí se derivan:
   - el mensaje visible (uno solo);
   - si el aviso preventivo de temática se muestra o lo sustituye el error del envío (RF-14);
   - qué campo recibe `aria-invalid` y `aria-describedby` (RF-9, RF-10, RF-12).

4. **Añadir la accesibilidad**:
   - Un identificador propio para cada mensaje visible (el general y el aviso preventivo), generado
     con `useId`; el campo asociado referencia con `aria-describedby` el que esté visible en ese
     momento.
   - `role="alert"` en el mensaje y en el aviso preventivo.
   - `aria-describedby` en el grupo de duración o en el selector de temática según el tipo de
     error; nunca en errores del servidor.
   - `aria-invalid` solo en los controles afectados y solo mientras el error está visible.
   - Al cambiar horas o minutos se limpia el error de duración; al cambiar la temática se limpia
     el de temática. El error del servidor se mantiene hasta el siguiente envío.

5. **Abrir `ThemeSelect` a los atributos necesarios**: props explícitas `describedBy` e `invalid`
   que se aplican al `<select>`; sin difundir props arbitrarias.

6. **Actualizar tests y documentación**, incluida la nota de que el anuncio con lector de
   pantalla queda pendiente de la capa E2E (B0-7).

Pseudocódigo de la validación:

```text
parseDurationInput(hours, minutes):
  h = parsePart(hours)      // vacío → 0; si no, Number(valor)
  m = parsePart(minutes)
  si !entero(h) o h < 0        → error de horas, afectados [hours]
  si !entero(m) o m < 0        → error de minutos, afectados [minutes]
  total = h * 60 + m
  si total > MAX               → error de máximo, afectados [hours, minutes]
  si m > 59                    → error de minutos, afectados [minutes]
  si total < MIN               → error de mínimo, afectados [hours, minutes]
  válido con { hours: h, minutes: m, durationMinutes: total }
```

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `frontend/src/sessions/durationInput.js` | Nuevo: validación pura de horas y minutos con mensajes y controles afectados. |
| `frontend/src/sessions/SessionForm.jsx` | Usa la validación, estado de error discriminado, envío de enteros, ARIA y limpieza al corregir. |
| `frontend/src/themes/ThemeSelect.jsx` | Props `describedBy` e `invalid` aplicadas al `<select>`. |
| `frontend/src/utils/time.js` | Retira `combineDuration`, que deja de tener consumidores. |
| `frontend/test/sessions/durationInput.test.js` | Nuevo: reglas, precedencia, límites, vacíos y ejemplos numéricos. |
| `frontend/test/sessions/SessionForm.test.jsx` | Casos de error de duración, temática y servidor; ARIA, limpieza, precedencia y sustitución del aviso. |
| `frontend/test/utils/time.test.js` | Retira el caso de `combineDuration`; mantiene `splitDuration`. |
| `README.md` | Una frase en «Funcionalidades» sobre la comprobación de la duración y el anuncio del error. |
| `DEUDA_TECNICA.md` | B8-5, B9-3, B9-4 y B9-6 a resueltos; nota en B0-7 del anuncio con lector pendiente de E2E. |
| `MEMORY.md` | Registro del cierre y de la decisión de diferir el anuncio con lector a E2E. |

## Decisiones y alternativas

- **Función pura en `sessions/` en vez de endurecer `combineDuration`.** La conversión de tiempo
  (`utils/time.js`) y la validación del formulario (reglas de dominio y mensajes) son
  responsabilidades distintas. Alternativa descartada: hacer que `combineDuration` lance una
  excepción, porque obliga a usar excepciones para control de flujo y mezcla dos responsabilidades.
- **Retirar `combineDuration`.** Tras el cambio no queda ningún consumidor; mantenerla invita a
  reintroducir la coerción silenciosa que B8-5 señala. Alternativa descartada: conservarla como
  envoltorio de la nueva función, que duplicaría la API sin uso.
- **Un único objeto de error con `kind`.** Evita estados imposibles (dos errores visibles a la vez)
  y hace explícita la regla de RF-14. Alternativa descartada: tres estados booleanos o un `error`
  de texto más banderas, que ya provocó la ambigüedad del aviso preventivo.
- **Reutilizar `DURATION_MIN`, `DURATION_MAX` y `MINUTES_MAX` de `domain-constants`.** Es la misma
  fuente que valida el backend; no se duplican reglas. Los textos del cliente se mantienen en el
  propio módulo de validación, equivalentes a los del servidor pero sin acoplar la UI a los
  mensajes del backend.
- **Props ARIA explícitas en `ThemeSelect`.** Mantiene la API del componente acotada y evita
  difundir props desconocidas al `<select>`. Alternativa descartada: `{...props}`.
- **Anuncio con lector de pantalla diferido a E2E.** El test unitario comprueba rol, asociación y
  estado; la comprobación real con tecnología de asistencia pertenece a la capa E2E (B0-7), que
  está pendiente. Se registra en `DEUDA_TECNICA.md` y `MEMORY.md`.

## Riesgos

- **Los controles numéricos descartan texto no válido.** El navegador convierte `"abc"` en vacío;
  por eso la validación trata el vacío como `0` y los casos límite usan valores que el control
  conserva (`1.5`, `-1`, `1e2`, `1.0`), comprobados con jsdom. Mitigación: tests sobre la función
  pura y sobre el formulario con esos valores.
- **Cambios en tests existentes.** Varios casos esperan que el error permanezca tras editar;
  con la limpieza al corregir hay que ajustarlos. Mitigación: revisar cada caso de
  `SessionForm.test.jsx` y ejecutar la suite completa.
- **Soporte desigual de ARIA en grupos y campos.** `aria-describedby` en un `fieldset` y
  `aria-invalid` en los controles puede variar entre lectores. Mitigación: estructura estándar
  (grupo descrito + controles marcados) y comprobación en el árbol de accesibilidad; el anuncio
  real queda en E2E.
- **Identificadores duplicados si hay dos formularios.** Mitigación: generar los ids con `useId`.
- **La retirada de `combineDuration` rompe imports no detectados.** Mitigación: búsqueda previa
  (solo `SessionForm` y su test) y `npm test` completo.
- **Reversión.** No hay migración ni cambios de datos: revertir los cuatro archivos de `src` (el
  nuevo incluido), sus tests y la documentación devuelve el comportamiento anterior.

## Verificación contra la constitución

- **Principio 1 (dependencias):** ninguna nueva; se reutilizan constantes y utilidades existentes.
- **Principio 2 (spec y código):** spec `aprobada (2026-11-18)`; RF-1 a RF-14 con criterio y test.
- **Principio 3 (capas):** la validación es lógica pura separada de la UI; no se toca HTTP ni el
  backend; `SessionForm` sigue siendo UI y `ThemeSelect` mantiene su responsabilidad.
- **Principio 4 (tests y mutación):** test primero por tarea; mutación de cada regla nueva
  (precedencia, máximo, limpieza, ARIA, sustitución del aviso).
- **Principio 5 (datos y secretos):** no se añaden datos, ficheros ni secretos.
- **Principio 6 (idioma):** mensajes en español; identificadores en inglés.

## Plan de pruebas (RF → test)

| RF | Caso |
|---|---|
| RF-1 | `durationInput.test.js`: horas y minutos vacíos → 0 y error de mínimo; espacios → 0. |
| RF-2 | `durationInput.test.js`: `1.5` h, `-1` min y texto descartado; `SessionForm.test.jsx`: mensaje del campo y envío bloqueado. |
| RF-3 | `durationInput.test.js`: horas y minutos inválidos → error de horas; 23 h 60 min → máximo. |
| RF-4 | `durationInput.test.js` y `SessionForm.test.jsx`: 0 h 10 min → mensaje de mínimo. |
| RF-5 | `durationInput.test.js` y `SessionForm.test.jsx`: 24 h → mensaje de 23:59. |
| RF-6 | `durationInput.test.js` y `SessionForm.test.jsx`: 0 h 60 min → mensaje de minutos. |
| RF-7 | `SessionForm.test.jsx`: con duración válida envía enteros (`1` h, minutos vacíos → `hours: 1, minutes: 0`). |
| RF-8 | `SessionForm.test.jsx`: el mensaje tiene rol de alerta y el foco no cambia. |
| RF-9 | `SessionForm.test.jsx`: grupo de duración descrito por el error; `aria-invalid` en los controles afectados. |
| RF-10 | `SessionForm.test.jsx`: selector descrito y marcado con error de temática y con aviso preventivo. |
| RF-11 | `SessionForm.test.jsx`: al cambiar horas o minutos desaparece el error de duración; al cambiar temática, el de temática. |
| RF-12 | `SessionForm.test.jsx`: error del servidor con alerta, sin asociación ni marca; permanece al editar la duración. |
| RF-13 | `SessionForm.test.jsx`: tras rechazar, conserva temática, fecha, duración y observaciones. |
| RF-14 | `SessionForm.test.jsx`: con aviso preventivo, al enviar queda solo el mensaje del envío (un único alerta de temática). |

Casos límite con test explícito:

| Caso límite | Test |
|---|---|
| Horas `1e2` → 100 → error de máximo | `durationInput.test.js` y `SessionForm.test.jsx` |
| Horas `1.0` → 1 → válidas | `durationInput.test.js` |
| Campo con solo espacios → 0 | `durationInput.test.js` |
| Horas y minutos inválidos a la vez → error de horas | `durationInput.test.js` |
| Temática inválida y duración inválida → error de temática | `SessionForm.test.jsx` |
| Duración exactamente 15 y exactamente 1439 → válidas | `durationInput.test.js` |

## Orden de implementación

1. Crear `durationInput.js` y su test en rojo (RF-1 a RF-6).
2. Integrar la validación y el envío de enteros en `SessionForm` (RF-7, RF-13) y ajustar tests.
3. Modelar el error único y la accesibilidad (RF-8 a RF-12, RF-14), con las props de `ThemeSelect`.
4. Retirar `combineDuration` y limpiar `time.test.js`.
5. Actualizar `README.md`, `DEUDA_TECNICA.md` y `MEMORY.md`.
6. Ejecutar `npm test` y `npm run lint`, revisar el árbol de accesibilidad y hacer la mutación.

## Fuera de alcance

El de la spec: B9-2 y el resto de deuda no relacionada, validación de fecha u observaciones en el
cliente, cambio de límites o de la forma de introducir la duración, relajar el servidor, rediseño
visual o mensajes por control, y cambiar los textos del servidor.
