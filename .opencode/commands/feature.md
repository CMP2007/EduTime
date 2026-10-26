---
description: Planifica, clarifica e implementa una funcionalidad con SDD
agent: build
---

Quiero añadir esta funcionalidad: $ARGUMENTS

Trabaja con Spec-Driven Development. Antes de nada, lee `docs/constitution.md`, `AGENTS.md`,
`MEMORY.md`, `docs/clarification.md`, `docs/validation.md` y las plantillas de
`specs/_templates/`.

Si `$ARGUMENTS` describe una feature que ya existe, no empieces de cero: pídeme que use
`/statusSDD` para retomar el punto exacto.

Regla general: cada artefacto pasa por el protocolo de `docs/clarification.md` antes de pedir
mi aprobación. Si hay hallazgos bloqueantes, espera mi decisión; si no, pide aprobación. No
escribas el siguiente artefacto ni código hasta que el anterior esté aprobado. No invoques
`/clarify` ni `/validate` como subcomandos: aplica sus protocolos directamente.

## Fase 1 — Spec (qué y por qué)

1. Elige `specs/<NNN>-<slug>/`, con el siguiente número libre de `specs/`.
2. Antes de escribir, haz hasta 5 preguntas de una en una para acotar alcance, casos límite,
   errores y qué queda fuera. Si con lo que sabes basta, dilo y sigue. Luego copia
   `specs/_templates/spec.md` y rellénala. Solo comportamiento: contexto, actores, historias,
   requisitos funcionales en EARS, no funcionales, casos límite, fuera de alcance y criterios
   de finalización. No cites archivos, funciones, endpoints ni librerías. Deja el estado en
   `propuesta`.
3. Aplica el protocolo `spec` de `docs/clarification.md`. Enséñame la spec y la lista de
   hallazgos, y espera mis respuestas. No escribas `plan.md`, `tasks.md` ni código.
4. Con mis respuestas, actualiza la spec, vuelve a revisar lo cambiado (revisión completa si
   cambian requisitos) y pide mi aprobación. Cambia el estado a `aprobada (AAAA-MM-DD)` solo
   cuando apruebe.

## Fase 2 — Plan (cómo)

5. Con la spec aprobada, copia `specs/_templates/plan.md` y rellénala: enfoque, archivos
   afectados, decisiones y alternativas, riesgos, verificación de la constitución, mapa
   RF → test y orden de implementación. Deja el estado en `propuesto`.
6. Aplica el protocolo `plan` de `docs/clarification.md`. Enséñame el plan y la lista de
   hallazgos, y espera mis respuestas.
7. Actualiza el plan, vuelve a revisar lo cambiado y pide mi aprobación. Cambia el estado a
   `aprobado (AAAA-MM-DD)` solo cuando apruebe.

## Fase 3 — Tareas (pasos)

8. Con el plan aprobado, copia `specs/_templates/tasks.md` y divide el trabajo en tareas
   pequeñas y verificables. Cada tarea lleva su test y su «hecho cuando». Deja el estado en
   `pendiente`.
9. Aplica el protocolo `tasks` de `docs/clarification.md`. Enséñame las tareas y la lista de
   hallazgos, y espera mis respuestas.
10. Actualiza las tareas, vuelve a revisar lo cambiado y pide mi aprobación. Mantén el estado
    en `pendiente` hasta que empiece la implementación.

## Fase 4 — Implementación

11. Solo entonces toca código. Al empezar, cambia el estado de `tasks.md` a `en curso`.
    Implementa tarea a tarea: primero el test en rojo, luego el cambio mínimo, luego el verde.
    Marca la tarea en `tasks.md` y pide mi visto bueno antes de seguir, salvo que te autorice ir
    seguido.
12. Al cerrar, aplica `docs/validation.md`: matriz RF → test, `npm test` y `npm run lint` en
    verde, mutación de cada regla nueva y, si toca UI, Chrome DevTools con 375 px. Si hay
    bloqueantes, no cierres. Si todo pasa, actualiza `DEUDA_TECNICA.md` y `MEMORY.md` según
    `AGENTS.md`, marca `tasks.md` como `completada` y la spec como `implementada (AAAA-MM-DD)`.

Si una duda mía puede cambiar la spec, el plan o las tareas, pregúntala antes de continuar. No
avances de etapa sin aprobación explícita.

Si aparece un requisito nuevo durante la implementación, no lo parchees: actualiza primero la
spec, luego el plan y las tareas, y vuelve a clarificar. Si el cambio es acotado, propón
`/change` para hacer ese delta sin repetir todo el flujo.
