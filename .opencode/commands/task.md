---
description: SDD · Implementa una tarea o un cambio pequeño sin lanzar /feature
agent: build
---

Uso: `/task <NNN-slug> <T3|descripción>` o `/task <descripción>`

Solicitud: $ARGUMENTS

Lee `docs/constitution.md`, `AGENTS.md`, `docs/clarification.md` y `docs/validation.md` antes de
tocar nada. No hagas commit salvo que te lo pida.

## 1. Identifica el caso

- **Caso A — tarea de una feature**: el primer token es `NNN-slug` o `specs/...` y el resto es
  una tarea (`T3`) o una descripción. Ejemplo: `/task 001-modal-accesible T7`.
- **Caso B — petición individual**: no hay feature delante. Ejemplo: `/task corregir el foco
  del modal`.

Si la ruta de la feature no existe o la tarea no aparece en `tasks.md`, detente y enséñame las
tareas disponibles. No inventes una tarea.

## 2. Caso A — tarea de `tasks.md`

1. Lee `spec.md`, `plan.md` y `tasks.md`. Comprueba que la tarea existe, que tiene test y
   «hecho cuando», y que sus dependencias están completadas. Si `tasks.md` está `pendiente`,
   cámbialo a `en curso`. Si algo no cuadra, pídeme decisión.
2. Implementa **solo esa tarea**: primero el test en rojo, luego el cambio mínimo, luego el
   verde. No adelantes tareas ni cambies requisitos.
3. Ejecuta el test concreto y después `npm test` y `npm run lint` desde la raíz. Si la tarea
   toca UI, comprueba 375 px con Chrome DevTools cuando aplique.
4. Marca el checkbox. Si quedan tareas, deja `tasks.md` en `en curso`; si no queda ninguna,
   marca `tasks.md` como `completada`, pero **no** cambies la spec a `implementada`.
5. Si era la última tarea, sugiere `/validate` para comprobar el cierre. No declares la spec
   cerrada.
6. Reporta: tarea, archivos, test, comandos ejecutados y resultado.

## 3. Caso B — petición individual

1. Decide si el cambio añade o modifica una regla, un contrato o una UI **no cubiertos por la
   spec**.
2. Si **sí** cambia el contrato:
   - Busca una spec aprobada que ya cubra el cambio. Si existe, implementa solo la parte que
     falta, con test, y no inventes requisitos.
   - Si no existe, **detente**: no implementes sin spec (constitución, principio 2). Explícame
     el hueco y sugiere `/change` si hay una feature abierta o `/feature` si es nueva.
3. Si **no** cambia el contrato (bug que restaura lo esperado, documento, refactor, test o
   estilo):
   - Propón el cambio mínimo en una frase. Si es inequívoco, impleméntalo; si hay una decisión
     de diseño, pídeme aprobación antes.
   - Añade o ajusta el test que falle sin el cambio. Si no aplica test, explica por qué.
   - Ejecuta `npm test` y `npm run lint` desde la raíz.
   - Actualiza `MEMORY.md` y `DEUDA_TECNICA.md` solo si el cambio lo justifica.
4. No cambies la spec, el plan ni las tareas para «legalizar» un cambio no previsto.

## 4. Límites

- Una tarea o un cambio pequeño, no una feature completa.
- Nada de dependencias nuevas sin aprobación.
- Nada de commits.
- Si el trabajo crece, detente y propone `/change` o `/feature`.
