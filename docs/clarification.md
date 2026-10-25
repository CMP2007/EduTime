# Protocolo de clarificación

> Artefactos: `spec`, `plan` y `tasks`.
> Se aplica antes de aprobar un artefacto o cuando cambie.
> Lo usan `/feature` (en cada etapa) y `/clarify` (manual, solo detección).

## Propósito

Revisar un artefacto SDD como un QA senior de artefactos para detectar defectos antes de que
se conviertan en decisiones técnicas, tareas o código. No sustituye a los tests ni al lint:
revisa el contrato y su coherencia.

## Entradas

- **Tipo**: `spec`, `plan` o `tasks`.
- **Ruta** del artefacto.
- **Referencias**:
  - `docs/constitution.md` (principios).
  - `AGENTS.md` (estructura, modelo y reglas operativas).
  - `specs/_templates/` (qué se espera de cada artefacto).
  - Para `plan`: la `spec.md` de la misma feature.
  - Para `tasks`: la `spec.md` y el `plan.md` de la misma feature.
- Si hay varias features y no está claro cuál revisar, pregunta antes de empezar.

## Reglas

1. **Solo detecta**. No propongas soluciones, no reescribas el artefacto y no escribas otros
   artefactos durante la revisión.
2. **Lista numerada** de 1 a N, agrupada por categorías. Si una categoría no tiene hallazgos,
   escribe «Ninguno».
3. **Cada hallazgo** incluye:
   - categoría;
   - ubicación exacta (sección y `RF-x`, o «no cubierto»);
   - cita breve del texto relevante;
   - qué impide decidir, implementar o verificar;
   - una pregunta abierta para el mantenedor, sin anticipar la respuesta;
   - etiqueta `[BLOQUEANTE]` o `[NO BLOQUEANTE]`.
4. **No inventes** problemas para rellenar la lista. No confundas preferencias de estilo con
   ambigüedades.
5. **Bloqueante** solo si impide implementar o verificar sin adivinar. Si queda un bloqueante
   sin decidir, el artefacto no se aprueba.
6. **La revisión no cambia el estado** del artefacto. La spec pasa a `aprobada` con la
   aprobación y a `implementada` al cerrar; el plan y las tareas siguen su propio ciclo.
7. **Después de las respuestas**: actualiza solo lo decidido, vuelve a revisar lo cambiado y
   pide aprobación. Si cambian requisitos, repite la revisión completa. Si una respuesta sigue
   siendo ambigua, vuelve a preguntar.
8. **La resolución requiere permiso de escritura**. `/clarify` es solo detección; `/feature`
   aplica las respuestas porque trabaja en modo `build`.

## Categorías comunes

1. **Ambigüedades y huecos**: términos sin definir, cuantificadores vagos («rápido», «varios»,
   «si procede»), valores por defecto sin decidir, criterios no verificables, requisitos no
   funcionales relevantes que falten, actores o permisos sin definir.
2. **Contradicciones e inconsistencias**: requisito contra requisito, requisito contra
   historia, requisito contra no funcional, requisito contra «Fuera de alcance», criterios que
   no cubren lo prometido, artefacto contra la spec o contra `AGENTS.md`.
3. **Casos y escenarios no cubiertos**: estados vacíos, errores, datos ausentes o corruptos,
   concurrencia, desmontaje, permisos, fechas y zonas horarias, textos largos, límites, etc.
   Incluye los que estén en «Casos límite» pero no tengan un requisito o test que los cubra.
   Limítate a los que cambien el comportamiento o la aceptación.
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

- Describe comportamiento, no implementación: sin archivos, funciones, endpoints ni librerías.
- Actores y permisos definidos.
- Términos ambiguos definidos en «Definiciones» (si aplica).
- Requisitos en EARS, observables y verificables.
- Requisitos no funcionales relevantes (accesibilidad, rendimiento, seguridad, idioma).
- Casos límite y errores cubiertos por un requisito o declarados fuera de alcance.
- Criterios de finalización que se puedan comprobar con tests o manualmente.
- Coherencia con el modelo de datos, la API y las reglas de `AGENTS.md`.
- Dudas bloqueantes resueltas; las no bloqueantes, marcadas.

### Plan

- Cada `RF-x` aparece en al menos un paso y en el mapa `RF → test`.
- Cada paso responde a un `RF-x` o a una necesidad técnica justificada; sin alcance colado.
- Archivos afectados completos y coherentes con las capas.
- Dependencias en un solo sentido; dependencia nueva justificada y aprobada.
- Decisiones con alternativa descartada cuando sea relevante.
- Riesgos con mitigación; orden de implementación seguro; rollback si aplica.
- Datos, concurrencia, seguridad y migración cubiertos.
- Actualización de `AGENTS.md`, `MEMORY.md` y `DEUDA_TECNICA.md` prevista.
- Tests de cada RF y de los casos límite; mutación prevista.

### Tareas

- Cada `RF-x` tiene al menos una tarea y un test.
- Cada tarea responde a un paso del plan; sin tareas de alcance nuevo.
- Tareas pequeñas, con una responsabilidad y un resultado observable.
- Si una tarea no cabe en una sesión corta o el conjunto supera ~10, el alcance está mal
  dividido.
- Test primero y «hecho cuando» verificable.
- Dependencias y orden correctos.
- No hay tareas de código sin test.
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

- `/feature` aplica las respuestas y actualiza el artefacto.
- `/clarify` se detiene tras la lista; para aplicar, usa el agente `build` o `/feature`.
- No cambies el estado a aprobado hasta que el mantenedor lo diga.
- Si una respuesta cambia el alcance, vuelve a pasar la revisión completa.

## Reanálisis

- Si cambia la spec, vuelve a pasar `plan` y `tasks`.
- Si cambia el plan, vuelve a pasar `tasks`.
- Si una tarea revela un requisito nuevo, clarifica la spec primero; no parchees el plan en
  silencio.
- Compara siempre con el estado actual de los artefactos, no con lo que recuerdes.

## Relación con los comandos

- `/feature` lee este documento y aplica el protocolo en cada etapa: spec, plan y tareas. Tiene
  permiso de escritura para incorporar las respuestas.
- `/clarify` lee este documento y aplica solo la detección a un artefacto concreto. Es de solo
  lectura.
- No hay llamadas entre comandos: ambos leen este documento. Si cambias el protocolo, cambia
  para los dos.
