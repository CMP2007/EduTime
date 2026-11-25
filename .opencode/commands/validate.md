---
description: SDD · Valida una feature completa (solo lectura)
agent: plan
---

Uso: `/validate <NNN-slug>`

Valida la feature indicada: $ARGUMENTS

Si no indico feature, detéctala: la que tenga `tasks.md` en curso, la última modificada en
`specs/` o la que mencione `MEMORY.md`. Si hay varias candidatas, pregúntame.

Lee `.opencode/commands/protocols/validation.md` y aplícalo. Lee también `docs/constitution.md`,
`.opencode/commands/protocols/clarification.md`, `spec.md`, `plan.md` y `tasks.md` de la feature;
`AGENTS.md` ya está en tu contexto.

Comprueba los cinco niveles: spec, plan, tareas, implementación y cierre. Ejecuta `npm test` y
`npm run lint` desde la raíz. Para la UI, usa Chrome DevTools y comprueba 375 px cuando
corresponda. No sustituyas los tests de Vitest por Chrome. Si no puedes ejecutar algo (por
ejemplo, el modo plan no permite shell o falta Chrome), dilo y no lo des por bueno.

No edites archivos, no arregles nada, no marques tareas y no cambies estados. Entrega el
veredicto y la matriz del protocolo. Si hay bloqueantes, no declares la spec cumplida. Si todo
pasa, indícame que la spec puede marcarse `implementada` y las tareas `completada`, pero no lo
hagas tú. Para corregir, indícame el siguiente comando (`/clarify`, `/task`, `/change` o
`/feature`), pero no lo ejecutes.
