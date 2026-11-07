## Bloque 11 — Frontend: estilos

Revisión de `frontend/src/styles.css` (771 líneas, hoja global).

### B11-1 · Colores hardcodeados mezclados con variables CSS

Conviven variables (`--primary`, `--border`…) con hex sueltos: `#f8fafc`, `#b91c1c`,
`#eef2f7`, `#334155`, `#94a3b8`, `#22c55e`, el degradado `#818cf8 → #4f46e5`, etc. Cambiar la
paleta obliga a buscar y reemplazar.

**Mitigación:** un token para cada color usado.

### B11-2 · Estilos de elemento globales (`input/select/textarea`) con posible fuga

`styles.css:312-335` estiliza por **elemento** (`input, select, textarea { width: 100% }`,
`textarea { resize: none }`). Estos estilos alcanzan a **cualquier** input futuro (y al buscador
`type="search"`), dificultando variantes locales.

**Mitigación:** clases explícitas en vez de selectores de elemento.

### B11-3 · `styles.css` monolítico (771 líneas) frente a "un archivo por responsabilidad"

El proyecto adopta "un archivo por responsabilidad" en JS, pero el CSS se acumula en un único
archivo. No es fatal en un proyecto pequeño, pero contradice la convención declarada y escala
mal.

**Mitigación:** dividir por feature (`sessions.css`, `stats.css`…) o adoptar una convención.

### B11-4 · Sin `:focus-visible` ni `prefers-reduced-motion`

El foco se marca con `:focus` (`styles.css:324-329`), de modo que aparece también al hacer clic;
y las transiciones (`button`, `progress__bar`) ignoran `prefers-reduced-motion`.

**Mitigación:** usar `:focus-visible` y respetar `prefers-reduced-motion`.

### B11-5 · Valores mágicos de layout sin tokens

`z-index: 50`, `width: 240px`, `min-width: 260px`, alturas varias: números sueltos sin escala,
que además hacen poco responsive el panel del heatmap.

**Mitigación:** tokens para `z-index`/tamaños o un enfoque más fluido.

### B11-6 · `textarea { resize: none }` quita al usuario el redimensionado

`styles.css:331-335` desactiva el resize manual (se compensa con el auto-crecimiento en JS),
pero elimina una capacidad nativa del control.

**Mitigación:** valorar `resize: vertical` si el auto-crecimiento fallara.

### B11-7 · Barra de pestañas con overflow horizontal a 375 px

La barra `.tabs` usa `width: fit-content` y, en pantallas estrechas (375 px), puede desbordar la
página y provocar scroll horizontal. Se detectó durante la validación de `003`, pero es un
problema de layout preexistente y ajeno a la feature de red/proxy/CORS.

**Mitigación:** limitar la barra al ancho del contenedor (`max-width: 100%`) y desplazar solo
dentro de ella (`overflow-x: auto`), o permitir `flex-wrap: wrap`. Debe abordarse en una feature
de estilos/UI.

---

