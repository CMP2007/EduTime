---
description: Revisa un artefacto SDD como QA (solo detección)
agent: plan
---

Revisa este artefacto: $ARGUMENTS

Lee `.opencode/commands/protocols/clarification.md` y aplícalo. Detecta el tipo (`spec`, `plan` o `tasks`) y la ruta;
si falta alguno, infiérelo del contexto o pregúntame. Lee también los artefactos de referencia
que indique el protocolo; `AGENTS.md` ya está en tu contexto. Si la ruta no existe, dilo y no inventes.

No revises código ni tests de implementación: este comando es para artefactos SDD. Para
código ya implementado, usa `/validate`.

Entrega solo la lista de hallazgos, con el formato del protocolo. No propongas soluciones, no
edites archivos y no escribas planes ni código. Si no hay hallazgos, dilo. Espera mis respuestas
sin aplicar cambios.
