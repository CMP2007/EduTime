---
description: Planifica la constitución del proyecto (solo plan; no escribe)
agent: plan
---

Planifica la constitución del proyecto: los principios innegociables que
cualquier cambio debe respetar, sea cual sea su stack o temática. **Este comando
solo planifica: no escribas ni modifiques ningún archivo ni ejecutes comandos que
cambien el repositorio** (instalar, formatear, commitear). Al final entregarás el
contenido para que lo escriba otro agente.

Contexto adicional: $ARGUMENTS

## Regla de oro

Este comando debe funcionar en cualquier repositorio. No asumas lenguaje,
framework, estructura ni nombres de archivo: **detecta** las convenciones del
proyecto y adáptate. Si algo no se puede deducir con evidencia, pregúntalo; no
lo inventes.

## Antes de proponer

1. **Ruta**: si el proyecto ya tiene una convención de documentación (p. ej.
   `specs/`, `.specify/`, `docs/`), usa la existente y explica la elección. Si
   no define ninguna, usa `docs/constitution.md`.
2. **Documento existente**: si ya hay una constitución, propón una actualización
   (contenido completo y qué cambia), no un archivo nuevo. Si un documento de
   instrucciones para agentes (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`…) se
   declara constitución o cumple ese papel, trátalo como existente: propón que el
   archivo de constitución (la ruta elegida) sea la constitución y que ese
   documento pase a ser la guía operativa que la referencia. Indica qué reglas se
   mueven, cuáles se enlazan y cuáles se retiran, y confirma la jerarquía antes de
   proponer el contenido. Si otro documento ya declara una jerarquía, la propuesta
   debe resolver ese solapamiento, no crear un segundo documento que diga lo
   mismo.
3. **Evidencia**: inspecciona lo que exista y sea relevante:
   - documentos de instrucciones para agentes (`AGENTS.md`, `CLAUDE.md`,
     `.cursorrules`, etc.); lee completo el documento principal si existe;
   - documentos de memoria o de deuda si existen (p. ej. `MEMORY.md`,
     `DEUDA_TECNICA.md`), README, CONTRIBUTING, ADRs, documentación de
     arquitectura y `specs/`;
   - manifiestos y configuración del stack, incluidos los de cada workspace
     (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `*.csproj`,
     `pom.xml`…), lockfiles y versiones de runtime;
   - tests, linter, CI (`.github/workflows`, etc.), formato, convención de
     commits, `CODEOWNERS` y `SECURITY.md`.
   Si no hay nada, deduce las prácticas reales del código. Si es un monorepo,
   revisa cada workspace; si hay reglas distintas, indícalo en una nota sin
   duplicar principios.
   No leas `.env` salvo que sea imprescindible y no imprimas valores de secretos:
   cita solo los nombres de las variables. La deuda técnica documentada describe
   el estado actual; no la conviertas en principio innegociable.
4. **Proyecto nuevo o información insuficiente**: haz las preguntas necesarias
   en una sola tanda (máx. 7 por ronda; repite si hace falta), marcando las
   bloqueantes y con una opción por defecto. No propongas hasta resolver las
   bloqueantes; el resto puede ir con supuestos marcados.
5. **Fuente de cada regla**: solo información mía o evidencia del repositorio.
   Los temas a–f son una lista de comprobación, no una fuente. Sin fuente, una
   regla no es una regla: es una pregunta. Distingue lo que ya se hace de lo que
   quiero adoptar y marca cada regla como `actual`, `nueva` o `cambiada` en la
   propuesta (no hace falta que ese estado aparezca en el documento final). Si
   algo contradice lo que te digo, o si dos documentos se contradicen, muestra
   ambas versiones y pregúntame; no elijas en silencio.

## Contenido del documento

- Título y una línea de propósito.
- **6 principios innegociables** (si el proyecto justifica otra cifra, propónla
  y explica por qué), en una tabla Markdown:

  ```markdown
  | Principio | Regla | Verificación |
  |---|---|---|
  ```

  Cada fila debe tener:
  - nombre;
  - regla concreta en 1–2 frases;
  - **cómo se verifica**: comando o ruta exactos si es automático; si es manual,
    criterio exacto y quién lo revisa. Distingue verificación actual de
    propuesta; si es propuesta, indica el coste y si es bloqueante.

- **Temas mínimos**: cada tema debe estar cubierto por al menos un principio o
  justificado como no aplicable. Pueden agruparse, pero no omitirse en silencio:
  a. Simplicidad del stack y disciplina de dependencias (no añadirlas sin
     justificar y aprobar).
  b. Relación entre especificación y código (qué spec hace falta, dónde vive y
     qué pasa si el código la contradice).
  c. Separación de responsabilidades (lógica, interfaz, datos… según el caso).
  d. Política de tests (qué se prueba, con qué comando y qué bloquea).
  e. Protección de datos del usuario: recogida mínima; sin secretos ni datos
     personales en el repositorio, los logs o terceros sin consentimiento o base
     legal aplicable; acceso y retención documentados (si hay datos personales).
     Si el proyecto no trata datos personales, el principio cubre secretos y
     datos internos; no lo omitas.
  f. Idioma: detéctalo por evidencia (README, documentos de instrucciones,
     docs). Si no hay evidencia, pregúntame. Por ejemplo, si el documento de
     instrucciones fija documentación, comentarios, UI y mensajes en español, e
     identificadores y nombres técnicos en inglés, confirma la elección antes de
     escribir.
- **Gobernanza** (4–6 líneas): versión y fecha de la última enmienda; cuándo
  prevalece sobre otros documentos; cómo se modifica (quién aprueba y qué se
  documenta); cómo se comprueba y qué pasa si se viola (se rechaza el cambio, se
  abre una excepción o se modifica la constitución). Por defecto, aprueba el
  mantenedor del repositorio.
- **Límite**: máximo **25 líneas con contenido** (sin contar líneas en blanco),
  con un máximo de **160 caracteres por celda o línea**, salvo comandos o rutas
  exactos, que pueden excederlo si son imprescindibles. Lo que no quepa es regla
  de operación y va al documento de instrucciones del agente, no a la
  constitución.
- **Criterio de innegociable**: si una excepción obligaría a modificar la
  constitución, no solo el plan de un cambio, es un principio. Si es
  procedimental o de cómo hacer las cosas, va al documento de instrucciones del
  agente (p. ej. `AGENTS.md`).
- No inventes principios genéricos («código limpio») que cualquier proyecto
  podría cumplir. Cada regla debe estar anclada en evidencia o en una decisión
  mía.

## Propuesta

1. Muestra el contenido completo del documento propuesto (no un resumen), en un
   bloque de código.
2. Lista solapamientos y contradicciones con los documentos existentes y qué
   reglas habría que mover, enlazar o retirar; indica qué documento prevalece.
   Si no hay solapamientos, dilo. Si el cambio implica mover reglas del
   documento de instrucciones, preséntalo como una opción separada y explica el
   riesgo.
3. Incluye el cambio exacto para referenciar la constitución desde el documento
   de instrucciones del agente (el que exista; p. ej. `AGENTS.md`). Si ese
   documento ya es la constitución, el cambio debe dejar claro que la constitución
   (la ruta acordada) prevalece y que el documento existente pasa a ser la guía
   operativa. Se aplicará al implementar, no ahora.
4. Indica las preguntas abiertas y qué decidiría yo.
5. Antes de mostrarlo, comprueba:
   - cada principio tiene verificación;
   - el de datos es concreto para este proyecto, no una frase genérica;
   - cada tema a–f está cubierto o justificado;
   - el idioma coincide con la evidencia;
   - no hay contradicciones y cada regla tiene fuente y estado;
   - no hay secretos;
   - el límite de líneas es real (indica el conteo).
6. Espera mi aprobación explícita. Si pido cambios, vuelve a proponer. **Este
   comando no escribe archivos.** Al aprobar, entrega el contenido completo en un
   único bloque de código e indica el siguiente paso: cambiar al agente de
   implementación (en OpenCode, `build`) para que escriba el contenido en la ruta
   acordada y aplique el cambio de referencia en el documento de instrucciones.
   No escribas tú ni ejecutes comandos que modifiquen el repositorio.
