---
description: SDD · Resume dónde estamos y el siguiente paso (solo lectura)
agent: plan
---

Uso: `/statusSDD [NNN-slug]`

Feature: $ARGUMENTS

Si no indico feature, detéctala: la que tenga trabajo pendiente en `tasks.md`, la última
modificada en `specs/` o la que mencione `MEMORY.md`. Si hay varias, lista las candidatas y
pregúntame.

Lee `MEMORY.md`, `DEUDA_TECNICA.md`, `git status`, los últimos commits y, de la feature,
`spec.md`, `plan.md` y `tasks.md`; `AGENTS.md` ya está en tu contexto. `MEMORY.md` y
`DEUDA_TECNICA.md` son contexto; la verdad son los artefactos y el estado de git.

No modifiques nada. Devuelve:

1. **Feature**: ruta y si existe.
2. **Estado**: fase y estado literal de `spec.md`, `plan.md` y `tasks.md`.
3. **Tareas**: hechas/total, última completada y siguiente pendiente.
4. **Git**: rama, último commit y cambios sin commitear.
5. **Incoherencias**: por ejemplo, spec `implementada` con tareas pendientes, plan aprobado
   sin tareas, tarea marcada sin test o estados contradictorios.
6. **Siguiente paso**: el comando exacto (`/clarify`, `/validate`, `/task`, `/change`,
   `/feature` o commit) y por qué, en una frase.

Si no hay ninguna feature, dilo y propón `/feature`. Si el estado no se puede deducir, di qué
falta en vez de suponerlo. Si todo está implementado y validado, el siguiente paso es cerrar
la spec (`implementada`) o hacer commit; no lo hagas tú.
