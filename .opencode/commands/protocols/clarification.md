# Protocolo de clarificación

> Artefactos: `spec`, `plan` y `tasks`.
> Se aplica antes de aprobar un artefacto o cuando cambie.
> Lo usan `/feature` (en cada etapa) y `/clarify` (manual, solo detección).

## Propósito

Revisar un artefacto SDD como un QA senior: detectar defectos antes de que se conviertan en
decisiones técnicas, tareas o código. No sustituye a tests ni lint; revisa el contrato y su
coherencia.

## Entradas

- **Tipo** (`spec`, `plan` o `tasks`) y **ruta** del artefacto.
- **Referencias**: `docs/constitution.md`, `AGENTS.md` (ya en contexto), `specs/_templates/`; para
  `plan`, la `spec.md`; para `tasks`, la `spec.md` y el `plan.md`.
- Si hay varias features y no está claro cuál revisar, pregunta antes de empezar.

## Reglas

1. **Solo detecta**: no propongas soluciones, no reescribas el artefacto ni escribas otros
   artefactos.
2. **Lista numerada** agrupada por categorías; si una no tiene hallazgos, escribe «Ninguno».
3. **Cada hallazgo** lleva: categoría; ubicación exacta (sección y `RF-x`, o «no cubierto»); cita
   breve; qué impide decidir, implementar o verificar; pregunta abierta sin anticipar la
   respuesta; etiqueta `[BLOQUEANTE]` o `[NO BLOQUEANTE]`.
4. **No inventes** problemas ni confundas estilo con ambigüedad.
5. **Bloqueante** solo si impide implementar o verificar sin adivinar. Con un bloqueante sin
   decidir, el artefacto no se aprueba.
6. **La revisión no cambia estados**: la spec pasa a `aprobada` con la aprobación y a
   `implementada` al cerrar; plan y tareas siguen su ciclo.
7. **Tras las respuestas**: actualiza solo lo decidido, revisa lo cambiado y pide aprobación. Si
   cambian requisitos, repite la revisión completa; si una respuesta sigue ambigua, vuelve a
   preguntar.
8. **Resolver exige escritura**: `/clarify` solo detecta; `/feature` aplica las respuestas porque
   trabaja en modo `build`.

## Categorías comunes

1. **Ambigüedades y huecos**: términos sin definir, cuantificadores vagos («rápido», «varios»,
   «si procede»), valores por defecto sin decidir, criterios no verificables, NFR relevantes que
   falten, actores o permisos sin definir.
2. **Contradicciones**: requisito contra requisito, historia, NFR o «Fuera de alcance»; criterios
   que no cubren lo prometido; artefacto contra spec o `AGENTS.md`.
3. **Casos no cubiertos**: estados vacíos, errores, datos ausentes o corruptos, concurrencia,
   desmontaje, permisos, fechas y zonas horarias, textos largos, límites. Incluye los de «Casos
   límite» sin requisito o test; limítate a los que cambien comportamiento o aceptación.
4. **Conflictos con la constitución o `AGENTS.md`**: cita el principio o la regla y el requisito
   que lo incumple (dependencias, spec verificable, capas, tests, datos/secretos, idioma,
   implementación filtrada en la spec).

## Checklist por artefacto

| Comprobación | Spec | Plan | Tareas |
|---|---|---|---|
| Ambigüedades | términos y criterios | pasos imprecisos | tareas imprecisas |
| Contradicciones | RF contra RF/NFR | plan contra spec/AGENTS | tareas contra plan |
| Cobertura | casos límite | cada RF → paso → test | cada RF → tarea → test |
| Alcance | fuera de alcance | pasos sin RF | tareas sin RF |
| Constitución | dependencias, verificabilidad | capas, dependencias, tests | tests, docs, deuda |
| Orden | — | secuencia y rollback | dependencias |
| Cierre | criterios verificables | riesgos y mitigación | «hecho cuando» |

### Spec

- Comportamiento, no implementación: sin archivos, funciones, endpoints ni librerías.
- Actores y permisos definidos; términos ambiguos en «Definiciones» (si aplica).
- RF en EARS, observables y verificables; NFR relevantes (accesibilidad, rendimiento, seguridad,
  idioma).
- Casos límite y errores cubiertos por un requisito o declarados fuera de alcance.
- Criterios de finalización comprobables con tests o manualmente.
- Coherencia con el modelo de datos, la API y las reglas de `AGENTS.md`.
- Dudas bloqueantes resueltas; las no bloqueantes, marcadas.

### Plan

- Cada `RF-x` aparece al menos en un paso y en el mapa `RF → test`.
- Cada paso responde a un `RF-x` o a una necesidad técnica justificada; sin alcance colado.
- Archivos completos y coherentes con las capas.
- Dependencias en un solo sentido; las nuevas, justificadas y aprobadas.
- Decisiones con alternativa descartada cuando sea relevante.
- Riesgos con mitigación; orden seguro; rollback si aplica.
- Datos, concurrencia, seguridad y migración cubiertos.
- Actualización de `AGENTS.md`, `MEMORY.md` y `DEUDA_TECNICA.md` prevista.
- Tests de cada RF y de los casos límite; mutación prevista para la verificación detallada o de
  cierre.

### Tareas

- Cada `RF-x` tiene al menos una tarea y un test.
- Cada tarea responde a un paso del plan; sin alcance nuevo.
- Tareas pequeñas, con una responsabilidad y un resultado observable.
- Si una tarea no cabe en una sesión corta o el conjunto supera ~10, el alcance está mal dividido.
- Test primero y «hecho cuando» verificable.
- Dependencias y orden correctos; ninguna tarea de código sin test.
- Actualización de documentación, deuda y memoria incluida.
- Las tareas no mezclan funcionalidades ni roles.

## Formato de salida

```md
### Ambigüedades
1. [BLOQUEANTE] RF-3 · «...»: ...
   - Evidencia: ...
   - Impacto: ...
   - Pregunta: ...

### Contradicciones
2. [NO BLOQUEANTE] RF-5 contra «Fuera de alcance»: ...
   - Evidencia: ...
   - Impacto: ...
   - Pregunta: ...

### Casos límite
Ninguno.

### Constitución y AGENTS
3. [BLOQUEANTE] Principio 3 · ...
   - Evidencia: ...
   - Impacto: ...
   - Pregunta: ...

**Resumen:** 2 bloqueantes, 1 no bloqueante.
```

## Resolución

- `/feature` aplica las respuestas y actualiza el artefacto; `/clarify` se detiene tras la lista
  (para aplicar, usa `build` o `/feature`).
- No cambies el estado a aprobado hasta que el mantenedor lo diga.
- Si una respuesta cambia el alcance, repite la revisión completa.

## Reanálisis

- Si cambia la spec, vuelve a pasar `plan` y `tasks`; si cambia el plan, vuelve a pasar `tasks`.
- Si una tarea revela un requisito nuevo, clarifica la spec primero; no parchees el plan en
  silencio.
- Compara con el estado actual de los artefactos, no con lo que recuerdes.

## Relación con los comandos

- `/feature` aplica este protocolo en cada etapa (spec, plan y tareas) y puede escribir las
  respuestas. `/clarify` solo detecta y es de lectura.
- `/change` aplica una clarificación enfocada al delta de spec, plan y tareas.
- `/validate` aplica `validation.md` sobre la implementación; no sustituye a este protocolo.
- No hay llamadas entre comandos: comparten documentos. Si cambias un protocolo, cambia para
  todos los que lo lean.
