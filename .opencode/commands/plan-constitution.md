---
description: Planifica la constitución del proyecto (solo plan; no escribe)
agent: plan
---

Planifica la constitución del proyecto: los principios innegociables que cualquier cambio debe
respetar, sea cual sea su stack. **Solo planificas: no escribas ni modifiques archivos ni ejecutes
comandos que cambien el repositorio.** Al final entregas el contenido para que lo escriba otro
agente.

Contexto adicional: $ARGUMENTS

## Regla de oro

Funciona en cualquier repositorio. No asumas lenguaje, framework ni estructura: **detecta** las
convenciones y adáptate. Si algo no se deduce con evidencia, pregúntalo; no lo inventes.

## Antes de proponer

1. **Ruta**: usa la convención de documentación existente (`specs/`, `.specify/`, `docs/`) y
   explica la elección; si no hay, `docs/constitution.md`.
2. **Documento existente**: si ya hay constitución, propón una actualización (contenido completo y
   qué cambia), no un archivo nuevo. Si un documento de instrucciones para agentes (`AGENTS.md`,
   `CLAUDE.md`, `.cursorrules`…) se declara constitución o cumple ese papel, trátalo como
   existente: la ruta elegida pasa a ser la constitución y ese documento, la guía operativa que la
   referencia. Indica qué reglas se mueven, enlazan o retiran y confirma la jerarquía antes de
   proponer. Si otro documento ya declara jerarquía, resuelve el solapamiento; no crees un segundo
   documento que diga lo mismo.
3. **Evidencia**: inspecciona lo relevante:
   - instrucciones para agentes (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`…); lee completo el
     principal si existe;
   - memoria o deuda (`MEMORY.md`, `DEUDA_TECNICA.md`), README, CONTRIBUTING, ADRs, arquitectura y
     `specs/`;
   - manifiestos y configuración del stack por workspace (`package.json`, `pyproject.toml`,
     `Cargo.toml`, `go.mod`, `*.csproj`, `pom.xml`…), lockfiles y runtime;
   - tests, linter, CI, formato, commits, `CODEOWNERS` y `SECURITY.md`.
   Si no hay nada, deduce las prácticas del código. En monorepos revisa cada workspace; si hay
   reglas distintas, anótalo sin duplicar principios. No leas `.env` salvo que sea imprescindible y
   no imprimas secretos: cita solo nombres de variables. La deuda documentada describe el estado
   actual; no la conviertas en principio.
4. **Proyecto nuevo o información insuficiente**: pregunta en una sola tanda (máx. 7; repite si
   hace falta), marca las bloqueantes y da una opción por defecto. No propongas hasta resolverlas;
   el resto puede ir con supuestos marcados.
5. **Fuente de cada regla**: solo lo que digo yo o evidencia del repositorio. Los temas a–f son una
   lista de comprobación, no una fuente. Sin fuente, una regla es una pregunta. Distingue lo que ya
   se hace de lo que quiero adoptar y marca cada regla como `actual`, `nueva` o `cambiada` en la
   propuesta (no en el documento final). Si algo contradice lo que digo o dos documentos se
   contradicen, muestra ambas versiones y pregunta; no elijas en silencio.

## Contenido del documento

- Título y una línea de propósito.
- **6 principios innegociables** (si el proyecto justifica otra cifra, propónla y explica por qué),
  en tabla Markdown:

  ```markdown
  | Principio | Regla | Verificación |
  |---|---|---|
  ```

  Cada fila: nombre; regla concreta en 1–2 frases; **cómo se verifica** (comando o ruta exactos si
  es automático; si es manual, criterio exacto y quién revisa). Distingue verificación actual de
  propuesta; si es propuesta, indica coste y si bloquea.

- **Temas mínimos**: cada uno cubierto por al menos un principio o justificado como no aplicable.
  Pueden agruparse, pero no omitirse en silencio:
  a. Simplicidad del stack y disciplina de dependencias (nada sin justificar y aprobar).
  b. Relación entre especificación y código (qué spec hace falta, dónde vive, qué pasa si el código
     la contradice).
  c. Separación de responsabilidades (lógica, interfaz, datos…).
  d. Política de tests: qué se prueba, con qué comando, qué bloquea y cuándo se comprueba la
     mutación (rojo → verde en el trabajo por tarea; reversión en la verificación detallada).
  e. Datos del usuario: recogida mínima; sin secretos ni datos personales en repositorio, logs o
     terceros sin consentimiento o base legal; acceso y retención documentados. Si no hay datos
     personales, cubre secretos y datos internos; no lo omitas.
  f. Idioma: detéctalo por evidencia (README, instrucciones, docs). Si no hay, pregunta. Ejemplo:
     documentación, comentarios, UI y mensajes en español; identificadores y nombres técnicos en
     inglés: confirma antes de escribir.
- **Gobernanza** (4–6 líneas): versión y fecha de la última enmienda; cuándo prevalece; cómo se
  modifica (quién aprueba y qué se documenta); cómo se comprueba y qué pasa si se viola (rechazo,
  excepción o enmienda). Por defecto, aprueba el mantenedor.
- **Límite**: máximo **25 líneas con contenido** (sin contar líneas en blanco) y **160 caracteres por
  celda o línea**, salvo comandos o rutas exactos imprescindibles. Lo que no quepa es regla de
  operación y va al documento de instrucciones del agente.
- **Criterio de innegociable**: si una excepción obligaría a modificar la constitución, no solo el
  plan de un cambio, es un principio. Si es procedimental, va al documento de instrucciones.
- No inventes principios genéricos («código limpio»). Cada regla se ancla en evidencia o en una
  decisión mía.

## Propuesta

1. Muestra el contenido completo (no un resumen) en un bloque de código.
2. Lista solapamientos y contradicciones con los documentos existentes y qué reglas mover, enlazar
   o retirar; indica qué documento prevalece. Si no hay, dilo. Si hay que mover reglas del documento
   de instrucciones, preséntalo como opción separada con su riesgo.
3. Incluye el cambio exacto para referenciar la constitución desde el documento de instrucciones (el
   que exista; p. ej. `AGENTS.md`). Si ese documento ya es la constitución, deja claro que la ruta
   acordada prevalece y que pasa a ser la guía operativa. Se aplica al implementar, no ahora.
4. Indica preguntas abiertas y qué decidiría yo.
5. Antes de mostrarlo, comprueba: cada principio tiene verificación; el de datos es concreto; cada
   tema a–f está cubierto o justificado; el idioma coincide con la evidencia; no hay
   contradicciones, cada regla tiene fuente y estado; no hay secretos; el límite de líneas es real
   (indica el conteo).
6. Espera mi aprobación explícita; si pido cambios, vuelve a proponer. Al aprobar, entrega el
   contenido completo en un único bloque de código e indica el siguiente paso: cambiar al agente de
   implementación (en OpenCode, `build`) para que lo escriba en la ruta acordada y aplique el cambio
   de referencia.
