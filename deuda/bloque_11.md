## Bloque 11 — Frontend: estilos

Revisión de `frontend/src/styles.css` (771 líneas, hoja global).

### B11-1 · Colores hardcodeados mezclados con variables CSS

Conviven variables (`--primary`, `--border`…) con hex sueltos: `#f8fafc`, `#b91c1c`,
`#eef2f7`, `#334155`, `#94a3b8`, `#22c55e`, el degradado `#818cf8 → #4f46e5`, etc. Cambiar la
paleta obliga a buscar y reemplazar.

**Mitigación:** un token para cada color usado.

**Resuelto (2026-11-26):** todos los colores de `styles.css` están en `:root` como tokens
semánticos (`--surface-muted`, `--text-soft`, `--on-accent`, `--danger-*`, `--warning-*`,
`--track`, `--heatmap-*`, `--overlay`, `--modal-shadow`); no quedan hex/rgb/keywords sueltos ni
valores duplicados con un token existente. `frontend/test/styles.test.js` lo comprueba (rojo →
verde) y falla si se añade un literal de color fuera de `:root`. La paleta no cambió: los valores
son idénticos.

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

**Resuelto (2026-11-26):** `frontend/src/styles.css` se divide en `frontend/src/styles/`:
`index.css` es el único punto de entrada (solo `@import`, en orden de cascada) y hay 12 hojas por
responsabilidad (`tokens`, `base`, `buttons`, `tabs`, `cards`, `forms`, `sessions`, `stats`,
`heatmap`, `modal`, `themes`, `utilities`); la mayor tiene 159 líneas. Las declaraciones se
copiaron literales y el orden de carga reproduce la cascada anterior, así que la apariencia no
cambia. `frontend/test/styles.test.js` conserva las guardas de B11-1/B11-2 sobre todas las hojas y
añade cuatro estructurales (manifiesto solo con `@import`, cada hoja importada una vez sin
huérfanas, límite de 200 líneas y entrada desde `main.jsx`), verificadas en rojo → verde; estilos
calculados idénticos a 375 px. Refactor sin cambio observable: no requiere spec.

### B11-4 · Sin `:focus-visible` ni `prefers-reduced-motion`

El foco se marca con `:focus` (`styles.css:324-329`), de modo que aparece también al hacer clic;
y las transiciones (`button`, `progress__bar`) ignoran `prefers-reduced-motion`.

**Mitigación:** usar `:focus-visible` y respetar `prefers-reduced-motion`.

**Parcialmente resuelto (2026-11-17):** `prefers-reduced-motion` ya se respeta (bloque
`@media (prefers-reduced-motion: reduce)`); `:focus-visible` solo cubre `button` y `a`. Falta
aplicarlo a los controles de formulario; se hará en la spec de estilos.

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

**Resuelto (2026-11-17):** la media query de `max-width: 560px` hace que `.tabs` ocupe el ancho
del contenedor y envuelva los botones. Medido con Chrome DevTools a 375 px y 320 px:
`scrollWidth === clientWidth` (sin scroll horizontal) y `flex-wrap: wrap`. El arreglo llegó con
el selector de temáticas (`e7babd3`, 2026-11-14).

### B11-8 · El campo de duración del formulario desborda su contenedor a 375 px

Medido con Chrome DevTools durante la validación de `specs/008-validacion-duracion-formulario/`
(2026-11-18): a 375 px, el `fieldset` de duración ocupa 311 px dentro de un formulario de 303 px
(8 px de desbordamiento interno). La página no genera scroll horizontal
(`scrollWidth === clientWidth`), pero el grupo de horas y minutos puede provocar scroll dentro
del formulario. Es un problema de layout preexistente y ajeno al alcance funcional de 008, que
excluye el control de desbordamiento a 375 px de sus criterios de cierre.

**Mitigación:** permitir que la fila de horas y minutos se ajuste (`flex-wrap`), reducir el ancho
mínimo de los controles o aplicar `max-width: 100%` al grupo; abordarlo en la feature de
estilos/UI.

---

