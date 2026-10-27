# Protocolo de validación

> Documento compartido por `/validate` (validación manual) y el cierre de `/feature`.
> Comprueba que lo implementado cumple el contrato. No sustituye a
> [`clarification.md`](clarification.md), que revisa los artefactos antes de implementar.

## Propósito

Comprobar con evidencia que la spec, el plan, las tareas y el código son coherentes, y que
todos los requisitos funcionales (RF) tienen cobertura y pasan. No arregla nada: informa y da
un veredicto.

## Entradas

- La feature (`specs/<NNN>-<slug>/`) y sus tres artefactos: `spec.md`, `plan.md`, `tasks.md`.
- `docs/constitution.md`, `AGENTS.md` y `clarification.md`.
- El código y los tests de la feature.
- Chrome DevTools para la UI, si la feature toca interfaz.

## Reglas

1. **Solo lectura**: no edites artefactos, código ni estados. Si encuentras un fallo, lo
   describes; no lo corriges.
2. **Evidencia**: cada afirmación lleva comando, archivo/test o salida. Nada de «parece que».
3. **No inventes**: si falta un test, un dato o un entorno, dilo; no lo des por bueno.
4. **Separa los problemas**:
   - **Fallo**: el test existe y falla.
   - **Hueco**: no hay test para un comportamiento exigido.
   - **Incoherencia**: spec, plan o tareas se contradicen.
   - **No verificable**: falta el entorno o el dato para comprobarlo.
5. **Los tests no se sustituyen**: `npm test` cubre backend y frontend. Chrome es para lo que
   no se automatiza (layout, foco visual, teclado, responsive).
6. **No valides una implementación que no existe**: si el código aún no está, di «no validable
   todavía» y limita la revisión al contrato.
7. **No cambies el estado de la spec**: el cierre lo decide el mantenedor, `/feature` o
   `/change`.

## Niveles

### 1. Spec

- El estado (`propuesta`, `aprobada`, `implementada`) y la fecha son coherentes con el trabajo.
- Los RF están en EARS, son observables y verificables.
- Están las definiciones, actores, NFR, casos límite, fuera de alcance y criterios de
  finalización.
- Cada RF tiene un test previsto o una comprobación manual declarada.
- No filtra implementación (archivos, funciones, endpoints, librerías).
- No contradice la constitución ni `AGENTS.md`.
- Si hay ambigüedad, contradicción o un requisito no verificable, es un hallazgo para
  `/clarify`; no lo resuelvas aquí.

### 2. Plan

- Cada RF aparece al menos en un paso y en el mapa `RF → test`.
- Cada paso responde a un RF o a una necesidad técnica justificada.
- Archivos, capas, dependencias, riesgos, orden y rollback están claros.
- No hay dependencias nuevas sin aprobación ni versiones con rango.
- La verificación de la constitución está hecha.
- Se prevé actualizar `AGENTS.md`, `MEMORY.md` y `DEUDA_TECNICA.md` si hace falta.

### 3. Tareas

- Cada RF llega a una tarea con su test y su «hecho cuando».
- No hay tareas de código sin test.
- El orden y las dependencias son correctos.
- Los checkboxes y el estado (`pendiente`, `en curso`, `completada`) reflejan la realidad.
- Una tarea marcada sin test o sin cambio verificable es un fallo.

### 4. Implementación

- Ejecuta `npm test` desde la raíz. Debe pasar backend (`node --test`) y frontend (Vitest).
- Ejecuta `npm run lint`. Debe quedar sin errores.
- Construye la matriz `RF → test → resultado`.
- **Mutación**: por cada regla nueva, revierte el cambio y comprueba que su test falla.
  Copia antes a `/tmp/opencode` y restaura archivo por archivo; no uses
  `git checkout -- <carpeta>`.
- **UI**: si aplica, abre la app con Chrome DevTools y comprueba teclado, foco, scroll,
  estados de error y **375 px**. Los tests de Vitest no cubren el layout real.
- **Constitución**: dependencias y versiones (`npm outdated`/`npm audit` si cambian), spec
  antes del código, capas, tests/lint, datos/secretos (`git ls-files backend/data` y `.env*`) e
  idioma.
- **Documentación**: `AGENTS.md`, `MEMORY.md` y `DEUDA_TECNICA.md` actualizados si cambió
  estructura, comportamiento o deuda.

### 5. Cierre

- La spec puede pasar a `implementada` y las tareas a `completada` solo si no hay
  bloqueantes.
- `git status` no debe tener cambios inesperados. Avisa de lo que quede sin commitear; no es
  un fallo de código, pero impide dar el trabajo por cerrado.
- El veredicto responde: ¿la spec se cumple?, ¿los artefactos son coherentes?, ¿la
  implementación está verificada?, ¿qué falta para cerrar?

## Matriz RF → test

| RF | Test automatizado | Comprobación manual | Resultado |
|---|---|---|---|
| RF-1 | archivo/test | — | pasa / falla / ausente / no verificable |

- Si un RF no tiene test, escribe `ausente` y explica por qué.
- Si la comprobación es manual, indica qué se hizo y con qué resultado.
- No marques `pasa` sin haber ejecutado la prueba.

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

- Un hueco que deja un RF sin evidencia es bloqueante.
- Una incoherencia entre artefactos es bloqueante.
- Una prueba no ejecutada es «no verificable», no un aprobado.
- El siguiente paso puede ser `/clarify`, `/task`, `/change`, `/feature` o «commit»; no lo
  ejecutes tú.

## Relación con los comandos

- `/validate`: aplica este documento a una feature, sin lanzar `/feature`.
- `/feature`: aplica este documento al cerrar.
- `/clarify`: revisa el contrato antes de implementar; no valida código.
- `/task` y `/change`: implementan; después se valida con este protocolo.
