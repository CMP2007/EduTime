## Bloque 12 — Veredicto transversal

Síntesis de la revisión. **No añade IDs nuevos** (los hallazgos son transversales y ya están
registrados arriba). Temas recurrentes, ordenados por impacto:

1. **Ausencia de red de seguridad**: sin tests ni linter — **B0-2 / B1-2 / B5-1**.
2. ✅ **Validación de fechas transversal** — **B3-2 / B4-4 / B8-1 / B9-5** resueltos en
   `specs/004-validacion-fechas/` *(paquete `domain-dates` y avisos de rango; ver `MEMORY.md`)*.
3. **Duplicación de reglas y constantes entre capas**: meta, periodos, validaciones, filtrado —
   **B0-1 / B5-4 / B9-1 / B10-1 / B10-2**.
4. **Concurrencia e invalidación**: carga/escritura en disco y recargas en cliente —
   **B0-3 / B0-5 / B7-2**.
5. **Accesibilidad pendiente**: **B11-4** (resto de `:focus-visible` en los controles de
   formulario). B8-2 y B9-4 ya están resueltos.

El proyecto está **bien estructurado por capas** (repository/service/routes; hook/api/component)
y con buena separación de responsabilidades; la deuda se concentra en robustez (tests,
validación, concurrencia) más que en arquitectura.

---

## Prioridad global y orden sugerido

El proyecto es pequeño y monousuario, así que **prioriza simplicidad**; las costuras solo se
notan al crecer (más escritores concurrentes, más vistas, más campos). Orden sugerido de
ataque en una sesión futura:

1. ✅ **B0-2 / B1-2 / B5-1** — tests y linter *(hecho: 49 tests con `node --test` y ESLint;
   ver `MEMORY.md`)*.
2. ✅ **B0-3 / B3-1** — persistencia (single-flight del load, cola de escrituras, tmp único) y
   no perder datos si el fichero está corrupto. *(hecho: repositorio como fábrica, cola de
   escrituras y `readData` que falla ante corrupción; 17 tests nuevos, verificados por mutación)*.
3. ✅ **B2-1 / B6-1 / B6-2 / B7-1 / B10-6** — manejo de errores: JSON malformado → 400; añadir *Error
   Boundary*; gestionar el fallo de borrado; conservar el código HTTP en los errores del cliente;
   mostrar el estado de `useSessions` en `StatsPanel`. *(hecho: rama 4xx en `app.js`, `ErrorBoundary`
   con `key={tab}` alrededor del `<main>`, `catch` + prop `error` en `ConfirmDialog`, `ApiError` con
   `status` y estados combinados en `StatsPanel`; 19 tests nuevos — 6 de backend y 13 de frontend —
   verificados por mutación)*.
4. ✅ **B1-9** — subir los majors pendientes (`react` 19, `express` 5, `concurrently` 10) con la suite
   como red de seguridad. *(hecho: `concurrently` 10.0.6, `express` 5.3.0, `react`/`react-dom` 19.3.1;
   verificación tras cada salto y `npm outdated` vacío)*.
5. ✅ **B0-6** — contratos (JSDoc + `@ts-check`, constantes compartidas). *(hecho: paquete
   `domain-contracts` con typedefs y validadores en runtime; validación en el borde del frontend
   y aserciones en tests del backend; sin TypeScript ni dependencias nuevas)*.
6. **B0-5 / B7-2** — invalidación de datos (Context por recurso + `AbortController`) y orden de
   respuestas en los hooks.
7. **B0-1 / B5-4 / B9-1 / B10-1 / B10-2** — fuente única de constantes y reglas de dominio
   (meta diaria, periodos, validaciones) y eliminar el filtrado duplicado en cliente.
8. **B0-4** — sincronizar documentación.
9. **Resto de pendientes de baja severidad** — ajustes de configuración y limpieza suelta,
   atacables por orden de bloque y severidad según las tablas de resumen.
10. ✅ **B4-2** — endurecer/documentar el update parcial de duración. *(hecho: feature 005)*
11. **B11-4** — resto de accesibilidad: `:focus-visible` en los controles de formulario
    (`prefers-reduced-motion` ya se respeta; B8-2 y B9-4 están resueltos).
12. **B9-2** — `debounce` en la búsqueda por temática.
13. ✅ **B1-8** — subir **Vite a una *major*** para eliminar las vulnerabilidades `esbuild`/`vite`
    (cambio *breaking*: afecta a `vite.config.js` y `@vitejs/plugin-react`). Hacerlo con
    `npm test` y `npm run lint` como red de seguridad. *(hecho en la sesión del punto 3:
    `vite@8.3.4` + `@vitejs/plugin-react@6.1.2`, `npm audit` → 0 vulnerabilidades; de paso quedó
