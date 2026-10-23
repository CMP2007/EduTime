# Tasks NNN — {{título de la funcionalidad}}

> Spec: specs/{{NNN}}-{{slug}}/spec.md · Plan: specs/{{NNN}}-{{slug}}/plan.md
> Estado: {{pendiente | en curso | completada}}

Cada tarea es un cambio pequeño y verificable. El campo «Test» indica qué prueba debe existir
antes de dar la tarea por hecha; si el test no falla al revertir el cambio, la tarea no está
terminada.

## T1 — {{nombre de la tarea}}

- [ ] {{Cambio, en imperativo.}}
- [ ] {{Cambio, en imperativo.}}
- Test: {{RF o caso límite que cubre}}.
- Hecho cuando: {{comando o comportamiento observable}}.

## T2 — {{nombre de la tarea}}

- [ ] {{Cambio, en imperativo.}}
- Test: {{RF o caso límite que cubre}}.
- Hecho cuando: {{comando o comportamiento observable}}.

## Orden y dependencias

T1 → T2 → … → TN.

{{Qué tareas comparten código o no pueden empezar hasta que otra termine.}}
