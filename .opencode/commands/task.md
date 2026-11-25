---
description: SDD · Implementa una tarea o un cambio pequeño sin lanzar /feature
agent: build
---

Uso: `/task <NNN-slug> <T3|descripción>` o `/task <descripción>`

Solicitud: $ARGUMENTS

Lee `docs/constitution.md` antes de actuar; `AGENTS.md` ya está en tu contexto, no lo releas.
No leas `clarification.md` ni `validation.md` para ejecutar la tarea: lo esencial está integrado
aquí. Si la tarea cierra la feature, aplica `validation.md`; si es ambigua o contradice la spec,
detente y propón `/clarify` o `/change`. El ciclo rojo → verde sí se hace aquí; la mutación por
reversión queda para la verificación detallada de una feature, no en cada iteración. No hagas commit
salvo que te lo pida.

## 1. Decide el caso

| Caso | Señal | Qué haces |
|---|---|---|
| **A — tarea de feature** | primer token `NNN-slug` o `specs/…`, después `T3` o descripción | Implementas esa tarea de `tasks.md` (§2) |
| **B — cambio puntual** | sin feature delante: bug que restaura lo esperado (incluido el estilo), doc, refactor sin cambio observable o test | Ejecutas con §3 |
| **C — requiere spec** | añade o cambia regla, contrato, API o comportamiento, incluida UI nueva o cambio de comportamiento visual | **Detente**: propón `/change` (feature abierta) o `/feature` (nueva). No implementes |

Si la feature o la tarea no existen, detente y muestra las disponibles. No inventes tareas. Si
al analizar descubres que un caso B es en realidad C, reclasifícalo y detente.

## 2. Caso A — tarea de `tasks.md`

1. Lee `spec.md`, `plan.md` y `tasks.md`. Exige que la tarea exista, tenga test y «hecho
   cuando», y que sus dependencias estén completadas. Si `tasks.md` está `pendiente`, pásalo a
   `en curso`.
2. Si la tarea es ambigua, contradice la spec o exige un requisito nuevo, **detente**: propón
   `/clarify` o `/change`. No la interpretes por tu cuenta.
3. Tras la aprobación de §4, implementa **solo esa tarea** y marca su checkbox. Deja `tasks.md`
   en `en curso` o, si era la última, aplica el cierre de `validation.md`: matriz RF → test,
   `npm test`, lint, mutación y UI. Si pasa, marca `tasks.md` como `completada` y la spec como
   `implementada`; si hay bloqueantes, no cierres.

## 3. Caso B — cambio puntual

1. **Contexto:** localiza con `grep`/`glob` los IDs, rutas o nombres citados y revisa `specs/`
   por si una feature abierta o aprobada ya cubre el cambio. Lee `MEMORY.md` solo si aporta.
2. Tras la aprobación de §4, implementa solo lo aprobado. Actualiza `MEMORY.md` solo si aporta.

## 4. Común (A y B)

1. **Análisis y despeje de dudas (antes de planificar):**
   - Contrasta la tarea o petición con `constitution.md`, `AGENTS.md` y, en caso A, con
     `spec.md` y `plan.md`.
   - Ante cualquier ambigüedad, contradicción o dato faltante, **detente y pídeme decisión**.
     No planifiques sobre suposiciones. Si la duda es del artefacto, propón `/clarify`; si es de
     alcance, `/change`.
2. **Diseño y autoclarificación del plan (sin editar archivos):**
   - Elabora el plan y revísalo críticamente antes de mostrarlo:
     - ¿El alcance es el mínimo necesario o se cuela trabajo extra?
     - ¿Respeta capas, idioma, convenciones y principios de `constitution.md`?
     - ¿Cubre casos límite, errores y un test real (rojo → verde) que falle sin el cambio?
     - ¿Hay una alternativa más simple o segura?
   - Corrige solo los fallos que no cambien alcance, contrato ni criterios de aceptación. Si la
     corrección cambia alguno, **detente y pídeme decisión** antes de presentar el plan.
   - Presenta el plan ya depurado y espera **una sola aprobación**:
     - **Alcance:** qué entra y qué no (cambio mínimo) y, en caso B, por qué no necesita spec.
     - **Archivos:** solo los necesarios, con motivo.
     - **Enfoque:** test en rojo primero (o por qué no aplica), luego cambio mínimo.
     - **Verificación:** test puntual, `npm test`, `npm run lint`, `git status`.
     - **UI:** sí/no y qué comprobarás a 375 px.
     - **Autorevisión / riesgos:** qué ajustaste y qué riesgos menores quedan.
3. **Implementa** lo aprobado. No refactorices de paso ni toques otros requisitos. Si el trabajo
   crece, detente y propón `/change` o `/feature`.
4. **Tests (rojo → verde):**
   - El test debe fallar sin el cambio y pasar después, sin debilitar aserciones.
   - Si el test ya existía y pasaba antes del cambio, no cubre el fallo: ajústalo hasta verlo en
     rojo; si no puedes, no cierres y decláralo bloqueante.
   - Si un cambio de comportamiento no admite test, dilo y explica por qué; no lo des por bueno.
5. **UI:** solo si el cambio toca estilos o cómo se muestra la interfaz, abre la app con Chrome
   DevTools y revisa a 375 px teclado, foco, scroll y estados de error. Si no puedes ejecutarlo,
   dilo: no lo declares verificado. Si el cambio no toca UI, no la compruebes.
6. **Autocomprobación antes de reportar:**
   - ¿Coincide con el plan aprobado (archivos, pasos y alcance)?
   - ¿Cumple lo pedido y solo lo pedido, sin contradecir `spec.md`, `plan.md` o `tasks.md`?
   - ¿Quedan huecos sin cubrir o dudas pendientes?
   - ¿`npm test` y `npm run lint` en verde? ¿`git status` solo con lo esperado?
   - ¿Toca datos o secretos? `git ls-files backend/data` vacío y `.env*` sin versionar. Solo si
     tocas dependencias, `npm outdated`/`npm audit`.
   - ¿Documentación o deuda que deba actualizarse?
     Si hay un bloqueante, **no cierres**: descríbelo y di qué falta.

## 5. Límites

- Una tarea o un cambio acotado, no una feature.
- Sin dependencias nuevas sin aprobación previa.

## 6. Reporte (5 líneas)

```text
Hecho: <tarea o petición>
Archivos: <lista>
Tests: <test puntual> · npm test: <ok/falla> · lint: <ok/errores>
UI: <revisada a 375 px / no aplica / no verificable>
Pendiente: <nada | dudas, bloqueantes o siguiente comando>
```
