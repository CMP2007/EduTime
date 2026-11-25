# Tasks NNN — {{título de la funcionalidad}}

> Spec: specs/{{NNN}}-{{slug}}/spec.md · Plan: specs/{{NNN}}-{{slug}}/plan.md
> Estado: {{pendiente | en curso | completada}}

Cada tarea es un cambio pequeño y verificable. El campo «Test» indica qué prueba debe existir
antes de dar la tarea por hecha; si el test no falla sin el cambio (rojo), la tarea no está
terminada. La mutación por reversión se comprueba en la verificación detallada o de cierre.

Como guía, una tarea debería cerrarse en una sesión corta (aprox. 20-30 min). Si una tarea no
cabe o el conjunto supera ~10 tareas, replantea el alcance de la spec en vez de crear tareas
artificiales.

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
