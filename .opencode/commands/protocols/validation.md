# Protocolo de validación

> Documento compartido por `/validate` (validación manual) y el cierre de `/feature` y `/change`.
> Comprueba que lo implementado cumple el contrato. No sustituye a `clarification.md`, que revisa
> los artefactos antes de implementar.

## Propósito

Comprobar con evidencia que spec, plan, tareas y código son coherentes, y que todos los
requisitos funcionales (RF) tienen cobertura y pasan. No arregla nada: informa y da un veredicto.

## Entradas

- La feature (`specs/<NNN>-<slug>/`) con `spec.md`, `plan.md` y `tasks.md`.
- `docs/constitution.md`, `AGENTS.md` (ya en contexto) y `clarification.md`.
- El código, los tests y, si toca interfaz, Chrome DevTools.

## Reglas

1. **Solo lectura**: no edites artefactos, código ni estados; describe el fallo, no lo corrijas.
2. **Evidencia**: cada afirmación lleva comando, archivo/test o salida; nada de «parece que».
3. **No inventes**: si falta un test, un dato o un entorno, dilo; no lo des por bueno.
4. **Separa los problemas**: **fallo** (el test existe y falla), **hueco** (no hay test para un
   comportamiento exigido), **incoherencia** (spec, plan o tareas se contradicen) y **no
   verificable** (falta entorno o dato).
5. **Los tests no se sustituyen**: `npm test` cubre backend y frontend; Chrome es para lo que no
   se automatiza (layout, foco visual, teclado, responsive).
6. **No valides una implementación que no existe**: si el código no está, di «no validable
   todavía» y limita la revisión al contrato.
7. **No cambies el estado de la spec**: el cierre lo decide el mantenedor, `/feature` o `/change`.

## Niveles

### 1. Spec

- Estado (`propuesta`, `aprobada`, `implementada`) y fecha coherentes con el trabajo.
- RF en EARS, observables y verificables.
- Definiciones, actores, NFR, casos límite, fuera de alcance y criterios de finalización.
- Cada RF con test previsto o comprobación manual declarada.
- Sin implementación filtrada (archivos, funciones, endpoints, librerías).
- Sin contradicciones con la constitución ni `AGENTS.md`.
- Ambigüedad, contradicción o requisito no verificable: hallazgo para `/clarify`; no lo resuelvas
  aquí.

### 2. Plan

- Cada RF aparece al menos en un paso y en el mapa `RF → test`.
- Cada paso responde a un RF o a una necesidad técnica justificada.
- Archivos, capas, dependencias, riesgos, orden y rollback claros.
- Sin dependencias nuevas sin aprobación ni versiones con rango.
- Verificación de la constitución hecha.
- Actualización de `AGENTS.md`, `MEMORY.md` y `DEUDA_TECNICA.md` prevista si hace falta.

### 3. Tareas

- Cada RF llega a una tarea con test y «hecho cuando».
- Sin tareas de código sin test.
- Orden y dependencias correctos.
- Checkboxes y estado (`pendiente`, `en curso`, `completada`) reflejan la realidad.
- Una tarea marcada sin test o sin cambio verificable es un fallo.

### 4. Implementación

- `npm test` desde la raíz: backend (`node --test`) y frontend (Vitest).
- `npm run lint` sin errores.
- Matriz `RF → test → resultado`.
- **Mutación**: por cada regla nueva, revierte el cambio y comprueba que su test falla. Copia
  antes a `/tmp/opencode` y restaura archivo por archivo; no uses `git checkout -- <carpeta>`.
- **UI**: si aplica, abre la app con Chrome DevTools y comprueba teclado, foco, scroll, errores y
  **375 px**. Vitest no cubre el layout real.
- **Constitución**: dependencias y versiones (`npm outdated`/`npm audit` si cambian), spec antes
  del código, capas, tests/lint, datos/secretos (`git ls-files backend/data` y `.env*`) e idioma.
- **Documentación**: `AGENTS.md`, `MEMORY.md` y `DEUDA_TECNICA.md` actualizados si cambió
  estructura, comportamiento o deuda.

### 5. Cierre

- Spec a `implementada` y tareas a `completada` solo sin bloqueantes.
- `git status` sin cambios inesperados; avisa de lo que quede sin commitear (no es fallo de
  código, pero impide cerrar).
- El veredicto responde: ¿se cumple la spec?, ¿son coherentes los artefactos?, ¿está verificada la
  implementación?, ¿qué falta?

## Matriz RF → test

| RF | Test automatizado | Comprobación manual | Resultado |
|---|---|---|---|
| RF-1 | archivo/test | — | pasa / falla / ausente / no verificable |

- RF sin test: escribe `ausente` y explica por qué.
- Comprobación manual: indica qué se hizo y con qué resultado.
- No marques `pasa` sin ejecutar la prueba.

## Formato de salida

```md
## Veredicto
- Spec: cumplida | no cumplida | no validable
- Artefactos: coherentes | incoherentes
- Tests: pasa | falla
- Lint: limpio | con errores
- Mutación: hecha | no aplica | pendiente
- UI: revisada | no aplica | no verificable
- Bloqueantes: N

## Matriz RF
| RF | Test | Manual | Resultado |
|---|---|---|---|
| RF-1 | ... | ... | pasa/falla/ausente |

## Hallazgos
1. [BLOQUEANTE] Nivel · ubicación: ...
   - Evidencia:
   - Impacto:
   - Qué falta:
2. [NO BLOQUEANTE] ...

## Siguiente paso
...
```

- Hueco que deja un RF sin evidencia: bloqueante.
- Incoherencia entre artefactos: bloqueante.
- Prueba no ejecutada: «no verificable», no aprobado.
- Siguiente paso: `/clarify`, `/task`, `/change`, `/feature` o «commit»; no lo ejecutes tú.

## Relación con los comandos

- `/validate`: aplica este documento a una feature sin lanzar `/feature`.
- `/feature`: lo aplica al cerrar. `/clarify`: revisa el contrato, no código.
- `/task` y `/change`: implementan; después se valida con este protocolo.
