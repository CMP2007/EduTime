---
description: SDD · Cambia un requisito y lo implementa sin recorrer /feature
agent: build
---

Uso: `/change <NNN-slug> <cambio solicitado>`

Feature: $1
Cambio solicitado: $2

Si `$1` está vacío o no coincide con `specs/<NNN>-<slug>/`, pregúntame. Si `$2` está vacío,
pregúntame qué cambia. No adivines.

Lee `docs/constitution.md`, `.opencode/commands/protocols/clarification.md` y los tres artefactos
de la feature; `AGENTS.md` ya está en tu contexto. No leas `validation.md` hasta el cierre. No
hagas commit salvo que te lo pida.

## 1. Decide si este comando es el adecuado

- Si el cambio no toca comportamiento ni contrato y es un bug, doc o refactor, propón `/task`
  en vez de este flujo.
- Si la feature no existe o la spec no está aprobada, detente y propone `/feature`.
- Si el cambio afecta a varios RF, cambia el alcance o exige rediseñar el plan, detente y
  propone `/feature`.
- Si es un delta acotado sobre una spec aprobada, sigue.

## 2. Delta de artefactos (sin código)

1. **Spec**: añade o modifica el RF en EARS, con criterios verificables, casos límite y fuera
   de alcance si cambian. Ajusta definiciones y NFR si hace falta. No cambies el estado a
   `implementada`; el estado se actualiza tras la aprobación.
2. **Clarificación enfocada**: aplica el protocolo de `.opencode/commands/protocols/clarification.md` solo a lo que
   cambia (coherencia, ambigüedad, casos límite, constitución). Si hay un bloqueante, espera mi
   respuesta y no escribas el resto.
3. **Plan**: actualiza el enfoque, archivos, riesgos, orden y el mapa `RF → test` para el
   delta. No rehagas lo que no cambia.
4. **Tareas**: añade o ajusta la tarea con su test y su «hecho cuando». Mantén el estado en
   `pendiente` hasta la aprobación.
5. Enséñame el diff de `spec.md`, `plan.md` y `tasks.md` y **espera una única aprobación**.
   No toques código todavía.

## 3. Implementación (tras la aprobación)

1. Marca la spec como `aprobada (AAAA-MM-DD)`, el plan como `aprobado (AAAA-MM-DD)` y las
   tareas como `en curso`.
2. Implementa **solo el delta**: primero el test en rojo, luego el cambio mínimo, luego el
   verde. No aproveches para refactorizar ni para cambiar otros RF.
3. Ejecuta el test concreto, `npm test` y `npm run lint` desde la raíz. El test debe fallar sin
   el cambio (rojo → verde); la mutación por reversión se comprueba en la verificación detallada
   (`/validate` o el cierre de este flujo). Si toca UI, comprueba 375 px con Chrome DevTools.
4. Marca la tarea. Si con esto quedan todas las tareas completadas, lee y aplica el cierre de
   `.opencode/commands/protocols/validation.md`: spec `implementada (AAAA-MM-DD)`, `tasks.md`
   `completada`, y actualiza `MEMORY.md` y `DEUDA_TECNICA.md` si corresponde. Si no, deja el estado
   `en curso` y di qué falta.
5. Reporta el cambio, los archivos, los tests y la deuda. No hagas commit.

## 4. Límites

- Un cambio acotado, no una feature nueva.
- No cambies requisitos que no estén en `$2`.
- No marques la spec como implementada si la validación tiene bloqueantes.
- Si el cambio crece, detente y propone `/feature`.
