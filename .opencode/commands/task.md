---
description: SDD · Implementa una tarea o un cambio pequeño sin lanzar /feature
agent: build
---

Uso: `/task <NNN-slug> <T3|descripción>` o `/task <descripción>`

Solicitud: $ARGUMENTS

Lee `docs/constitution.md`, `AGENTS.md`, `.opencode/commands/protocols/clarification.md` y `.opencode/commands/protocols/validation.md` antes de
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
2. **Plan breve antes de implementar.** Propón:
   - **Archivos que vas a tocar:** solo los necesarios para esta tarea.
   - **Enfoque:** cómo harás que el test pase a rojo/verde (cambio mínimo). Indica explícitamente si vas a hacer fallar el test primero.
   - **Comandos que vas a ejecutar:** `npm test <ruta concreta>` si aplica, `npm test` y `npm run lint` desde la raíz.
   - **UI:** si toca UI, menciona la comprobación a 375 px con Chrome DevTools.
   - **Riesgos o dudas:** si los hay.

   **No edites ningún archivo. Espera mi aprobación explícita.**
3. Tras aprobación, implementa **solo esa tarea**: primero el test en rojo, luego el cambio mínimo, luego el verde. No adelantes tareas ni cambies requisitos.
4. Ejecuta el test concreto y después `npm test` y `npm run lint` desde la raíz. Si la tarea
   toca UI, comprueba 375 px con Chrome DevTools cuando aplique.
5. Marca el checkbox. Si quedan tareas, deja `tasks.md` en `en curso`; si no queda ninguna,
   marca `tasks.md` como `completada`, pero **no** cambies la spec a `implementada`.
6. Si era la última tarea, sugiere `/validate` para comprobar el cierre. No declares la spec
   cerrada.
7. Reporta: tarea, archivos, test, comandos ejecutados y resultado.

## 3. Caso B — petición individual

1. **Contexto**
   - Entiende la petición: `$ARGUMENTS`. Si hay referencias a IDs, rutas o nombres existentes, búscalos con `grep`/`glob` para entender el estado real.
   - Revisa `specs/` por si hay alguna feature abierta o aprobada que ya cubra total o parcialmente lo que se pide.
   - Si existen ficheros de seguimiento del proyecto (`MEMORY.md`, `TODO.md`, `BACKLOG.md`, etc.), léelos **solo si están presentes**. No los exijas.

2. **Decide si toca contrato o no**
   - **Si el cambio añade o modifica una regla, un contrato, una API o una UI no cubiertos por la spec:**
     - Busca una spec aprobada que ya cubra el cambio. Si existe, limita el alcance estrictamente a lo que falte, con test, y no inventes requisitos.
     - Si **no** existe ninguna spec que lo cubra: **detente**. Explícame el hueco y sugiere `/change` si hay una feature abierta relacionada o `/feature` si es una funcionalidad nueva. **No implementes**.
   - **Si el cambio no añade ni modifica un contrato** (bug que restaura lo esperado, documento, refactor, test o estilo): pasa al paso 3.

3. **Plan obligatorio antes de tocar código**
   Propón un plan breve con:
   - **Objetivo:** qué se quiere conseguir con este cambio.
   - **Alcance:** qué sí entra y qué **no** entra (explicita que será el cambio mínimo).
   - **Archivos a tocar:** lista los archivos implicados, justificando por qué son necesarios.
   - **Enfoque:** cómo vas a hacerlo. Si vas a seguir rojo/verde, indícalo explícitamente.
   - **Test:** ¿añadirás o ajustarás un test para que falle sin el cambio? Si no aplica, justifícalo brevemente.
   - **Comandos:** qué vas a ejecutar (`npm test <ruta concreta>` si aplica, `npm test`, `npm run lint` desde la raíz). Si toca UI, indica la comprobación a 375 px con Chrome DevTools.
   - **Riesgos/dudas:** si los hay.

   **No edites ningún archivo. Espera mi aprobación explícita.**

4. **Implementación (tras aprobación)**
   - Implementa **únicamente** lo aprobado.
   - Primero el test en rojo (si lo hay), luego el cambio mínimo, luego el verde.
   - Ejecuta los comandos propuestos.
   - Si toca UI, comprueba 375 px con Chrome DevTools.
   - Actualiza `MEMORY.md` solo si aporta valor real al proyecto. No fuerces actualizaciones a otros ficheros de seguimiento.
   - Reporta: petición, archivos tocados, test, comandos ejecutados y resultado. Sin commits.

## 4. Límites

- Una tarea o un cambio pequeño, no una feature completa.
- Nada de dependencias nuevas sin aprobación.
- Nada de commits.
- Si el trabajo crece, detente y propone `/change` o `/feature`.
