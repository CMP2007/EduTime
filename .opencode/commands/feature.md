---
description: Planifica e implementa una funcionalidad con SDD
agent: build
---

Quiero añadir esta funcionalidad: $ARGUMENTS

Trabaja con Spec-Driven Development. Antes de nada, lee `docs/constitution.md`, `AGENTS.md`,
`MEMORY.md` y las plantillas de `specs/_templates/`.

## Fase 1 — Spec (qué y por qué)

1. Elige la carpeta `specs/<NNN>-<slug>/`, usando el siguiente número libre de `specs/`.
2. Copia `specs/_templates/spec.md` y rellénala. Solo comportamiento: contexto, actores,
   historias, requisitos funcionales en EARS, no funcionales, casos límite, fuera de alcance
   y criterios de finalización. No cites archivos, funciones, endpoints ni librerías.
3. Enséñame la spec y espera mi aprobación. No escribas `plan.md`, `tasks.md` ni código.

## Fase 2 — Plan (cómo)

4. Con la spec aprobada, copia `specs/_templates/plan.md` y rellénala: enfoque, archivos
   afectados, decisiones y alternativas, riesgos, verificación de la constitución, mapa
   RF → test y orden de implementación.
5. Enséñame el plan y espera mi aprobación.

## Fase 3 — Tareas (pasos)

6. Con el plan aprobado, copia `specs/_templates/tasks.md` y divide el trabajo en tareas
   pequeñas y verificables. Cada tarea lleva su test y su «hecho cuando».
7. Enséñame las tareas y espera mi aprobación.

## Fase 4 — Implementación

8. Solo entonces toca código. Implementa tarea a tarea: primero el test en rojo, luego el
   cambio mínimo, luego el verde. Marca la tarea en `tasks.md` y pide mi visto bueno antes de
   seguir, salvo que te autorice ir seguido.
9. Al cerrar: `npm test` y `npm run lint` en verde, mutación de cada regla nueva, y actualiza
   `DEUDA_TECNICA.md` y `MEMORY.md` según `AGENTS.md`.

Si una duda mía puede cambiar la spec o el plan, pregúntala antes de continuar. No avances de
fase sin aprobación explícita.
