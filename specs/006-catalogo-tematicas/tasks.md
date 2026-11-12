# Tasks 006 — Catálogo de temáticas con identificador

> Spec: specs/006-catalogo-tematicas/spec.md · Plan: specs/006-catalogo-tematicas/plan.md
> Estado: pendiente

Cada tarea es un cambio pequeño y verificable. El campo «Test» indica qué prueba debe existir
antes de dar la tarea por hecha; si el test no falla al revertir el cambio, la tarea no está
terminada.

La feature cubre 40 RF y se divide en 25 tareas pequeñas. Por decisión del mantenedor se levanta
la guía de ~10 tareas para priorizar responsabilidades separadas y resultados verificables.
Las tareas 1–22 pueden dejar en rojo los workspaces cuyos consumidores aún no se han actualizado
(sobre todo por el cambio de `Session.title` a `themeId`). La puerta `npm test` y `npm run lint`
se exige al cerrar T23; cada tarea exige su test específico en verde y que falle al revertir su
regla. No se elimina cobertura: los tests de semilla se mueven de `sessions/` a `seed/`.

## T1 — Reglas compartidas de temáticas

- [x] Crear `packages/domain-themes` con `package.json` (workspace, `type: module`, script `test`) e `index.js`.
- [x] Implementar `normalizeThemeName` (trim, minúsculas con `toLocaleLowerCase('es')`, tildes de vocales y diéresis, conservar `ñ`), `isSameThemeName` y `compareThemeNames` (orden `es`, desempate por texto original).
- [x] Añadir `THEME_NAME_MAX = 80` en `packages/domain-constants/index.js`; `TITLE_MAX` se retira en T7, cuando `sessions.validation` deje de usarlo.
- [x] Crear `packages/domain-themes/test/themes.test.js` con mayúsculas, tildes, `ñ`, espacios, orden y desempate.
- Test: RF-3 (límite), RF-4 (duplicados), RF-14 (orden) y casos límite de nombres.
- Hecho cuando: `npm test -w domain-themes` en verde y `npm run lint` sin errores en los archivos nuevos.

## T2 — Contrato de datos

- [x] Declarar `Theme` como `{ id, name, sessionCount }` y añadir `validateTheme` / `assertTheme` / `validateThemeList` / `assertThemeList`.
- [x] Cambiar `Session` a `{ id, themeId, themeName, date, durationMinutes, notes, createdAt, updatedAt }` y retirar `title`.
- [x] Cambiar `Subject` a `{ themeId, name, minutes, sessions }` y `LongestClass` a `{ id, themeId, name, date, durationMinutes }`.
- [x] Actualizar los validadores de sesión, materia y clase más larga; tolerar campos adicionales y conservar la ruta del primer campo inválido.
- [x] Actualizar `packages/domain-contracts/test/contracts.test.js` con casos válidos, campos ausentes y listas.
- Test: RF-1, RF-2, RF-5, RF-21, RF-32 y RF-33; reglas del contrato.
- Hecho cuando: `npm test -w domain-contracts` en verde.

## T3 — Persistencia de temáticas

- [ ] Exportar `sessionsFile`, `themesFile` y `createFileStore(file)` desde `backend/src/storage/fileStore.js`; conservar `readData` / `writeData` y generalizar el mensaje a «no contiene un array JSON».
- [ ] Crear `backend/src/themes/themes.repository.js` con fábrica `createThemesRepository(store)`, single-flight, cola de escrituras y copias profundas; sin semilla.
- [ ] Implementar `findAll`, `findById`, `insert`, `update` y `remove` sobre `{ id, name }`.
- [ ] Actualizar `backend/test/fileStore.test.js` (rutas, mensaje genérico, corrupción, no-array, escritura atómica) y crear `backend/test/themes.repository.test.js` (CRUD, copias y concurrencia).
- Test: RF-1, RF-2, RF-5 y RF-8; casos límite de JSON corrupto y escrituras concurrentes.
- Hecho cuando: `npm test -w backend -- test/fileStore.test.js test/themes.repository.test.js` en verde.

## T4 — Repositorio de sesiones para el borrado

- [ ] Quitar la semilla y su import de `backend/src/sessions/sessions.repository.js`; el repositorio queda como acceso a datos puro. Los tests de semilla se mueven a T5, no se eliminan.
- [ ] Añadir `countByThemeId(themeId)`, `reassignTheme(fromThemeId, toThemeId)` (solo cambia `themeId`, conserva `updatedAt`, sin resumen) y `removeByThemeId(themeId)` (sin resumen).
- [ ] Actualizar `backend/test/sessions.repository.test.js`: sin tests de semilla, conteos, reasignación, borrado por temática y concurrencia.
- Test: RF-8, RF-9, RF-11 y RF-12; casos límite sin clases, varias clases y escrituras concurrentes.
- Hecho cuando: `npm test -w backend -- test/sessions.repository.test.js` en verde.

## T5.1 — Arranque sin migración y validación de integridad

- [ ] Sustituir `backend/src/startup/initializeData.js` por `backend/src/startup/validateStoredData.js`: leer ambos almacenes, no escribir nada y fallar con un mensaje explícito si una clase conserva `title`, no tiene `themeId` o referencia una temática inexistente; validar también que cada temática tenga `id` único y nombre válido.
- [ ] Hacer que `backend/src/server.js` ejecute `validateStoredData()` antes de `app.listen`; si falla, registrar el error, dejar `process.exitCode = 1` y no abrir el puerto.
- [ ] Eliminar los datos locales de `backend/data/` (son de muestra) antes de la primera ejecución del formato nuevo y documentarlo en `README.md`; no se migra ningún registro.
- [ ] Crear `backend/test/startup/validateStoredData.test.js` con arranque sin datos, datos válidos, `title` antiguo, `themeId` ausente o inexistente, temática inválida y comprobación de que no se escribe.
- Test: RF-34 y RF-40; arranque vacío, formato antiguo y referencias rotas.
- Hecho cuando: `npm test -w backend -- test/startup/validateStoredData.test.js` en verde y `backend/data/` limpio.

## T5.2 — Datos de ejemplo bajo demanda

- [ ] Mover `backend/src/sessions/seed.js` a `backend/src/seed/seed.js`; devolver `{ themes, sessions }` con `themeId`, validar temáticas con `validateThemeName`, sesiones con `validateSessionInput` y unir temáticas con `isSameThemeName`.
- [ ] Añadir `insertMany` a `themesRepository` y `sessionsRepository` (una sola escritura por repositorio, actualizando la caché solo tras el éxito).
- [ ] Crear `backend/src/seed/seed.service.js`: leer sesiones y temáticas, lanzar `ConflictError` 409 si hay al menos una clase, reutilizar temáticas existentes por nombre normalizado, crear solo las que falten y escribir primero temáticas y después sesiones.
- [ ] Crear `backend/src/seed/seed.routes.js` con `POST /api/seed` (204) y montarlo en `backend/src/app.js`; añadir `ConflictError` a `backend/src/errors.js`.
- [ ] Crear `backend/test/seed/seed.test.js` y `backend/test/seed/seed.service.test.js`; ampliar `backend/test/app.test.js` con `POST /api/seed` (204 y 409).
- Test: RF-36, RF-38 y RF-39; semilla con catálogo vacío, reutilización de temáticas, rechazo con clases, fallo de escritura y reintento sin duplicados.
- Hecho cuando: `npm test -w backend -- test/seed/seed.test.js test/seed/seed.service.test.js test/app.test.js` en verde para los casos de semilla.

## T5.3 — Diálogo de datos de ejemplo

- [ ] Crear `frontend/src/seed/seed.api.js` con `apply()` contra `POST /api/seed`.
- [ ] Crear `frontend/src/seed/SeedPrompt.jsx`: usar `useSessions()` sin filtros; no mostrar mientras carga, con error o con clases; con la aplicación vacía, ofrecer «Cargar datos de ejemplo» y «Empezar sin datos». Aceptar llama a la API, refresca todo y cierra; si falla, mantiene el diálogo, muestra el error y permite reintentar. Rechazar, «×» o Escape cierran sin escribir y sin volver a mostrar el diálogo en la misma carga.
- [ ] Renderizar `SeedPrompt` en `frontend/src/App.jsx` y ajustar `frontend/test/App.test.jsx` para que sus casos con datos no muestren el diálogo.
- [ ] Crear `frontend/test/seed/seed.api.test.js` y `frontend/test/seed/SeedPrompt.test.jsx` con vacío, aceptar, rechazar, error, reintento, Escape y recarga.
- Test: RF-35, RF-37 y RF-38 (lado UI).
- Hecho cuando: `npm test -w frontend -- test/seed/seed.api.test.js test/seed/SeedPrompt.test.jsx test/App.test.jsx` en verde.

## T6 — Servicio y rutas de temáticas

- [ ] Crear `backend/src/themes/themes.validation.js` con `validateThemeName` (obligatorio, recortado, 1–80) y `assertThemeNameAvailable` (duplicado por nombre normalizado).
- [ ] Crear `backend/src/themes/themes.service.js`: `list` ordenado con `sessionCount`, `create`, `rename` (mismo texto exacto no escribe; solo mayúsculas/tildes actualiza; devuelve `{ id, name, sessionCount }`) y `remove` (sin clases, reasignar o eliminar todo; `true`/`false`; sin resumen).
- [ ] Crear `backend/src/themes/themes.routes.js` con `GET`, `POST`, `PUT` y `DELETE`; estados 200, 201, 204, 400 y 404.
- [ ] Montar `/api/themes` en `backend/src/app.js`.
- [ ] Crear `backend/test/themes.service.test.js` y ampliar `backend/test/app.test.js` con las rutas y el contrato.
- Test: RF-2 a RF-13, RF-26 a RF-28 (lado API) y RF-10; duplicados, mismo nombre, renombrado, borrado con y sin clases, destino inexistente o repetido y cancelación.
- Hecho cuando: `npm test -w backend -- test/themes.service.test.js test/app.test.js` en verde para los casos de temáticas.

## T7 — Servicio y rutas de sesiones

- [ ] Cambiar `backend/src/sessions/sessions.validation.js` para validar `themeId` como texto no vacío y dejar de validar `title`; retirar `TITLE_MAX` de `domain-constants` cuando ya no se use.
- [ ] En `backend/src/sessions/sessions.service.js`, comprobar que la temática existe en `create` y `update`, resolver `themeName` en cada respuesta y conservar la temática actual si `update` no recibe `themeId`.
- [ ] En `list`, aceptar `themeId` como texto único no vacío (400 si llega repetido o con otro tipo), buscar `q` solo en `notes` y fallar si una clase referencia una temática inexistente.
- [ ] Pasar `themeId` desde `backend/src/sessions/sessions.routes.js`.
- [ ] Actualizar `backend/test/sessions.service.test.js` y los casos de sesiones de `backend/test/app.test.js`.
- Test: RF-20 a RF-24 y RF-29 a RF-31; temática inexistente, `themeId` repetido, búsqueda que solo coincide en notas y filtros de fecha intactos.
- Hecho cuando: `npm test -w backend -- test/sessions.service.test.js test/app.test.js` en verde para los casos de sesiones.

## T8 — Estadísticas por `themeId`

- [ ] Leer las temáticas una vez en `backend/src/stats/stats.service.js`.
- [ ] Agrupar por `session.themeId` y usar el nombre actual del catálogo en `groupBySubject` (`{ themeId, name, minutes, sessions }`).
- [ ] Devolver `{ id, themeId, name, date, durationMinutes }` en `longestClass` y fallar si una clase referencia una temática inexistente.
- [ ] Actualizar `backend/test/stats.service.test.js` con temáticas simuladas, renombrado y temática inexistente.
- Test: RF-32 y RF-33; renombrado reflejado y referencia rota.
- Hecho cuando: `npm test -w backend -- test/stats.service.test.js` en verde.

## T9 — Cliente HTTP de temáticas

- [ ] Crear `frontend/src/themes/themes.api.js` con `list`, `create`, `rename` y `remove`.
- [ ] Validar las respuestas con `assertThemeList` / `assertTheme` y propagar `ApiError` con el status.
- [ ] Crear `frontend/test/themes/themes.api.test.js` con llamadas correctas, error de contrato y error HTTP.
- Test: RF-2, RF-4, RF-23 y RF-28 (lado API).
- Hecho cuando: `npm test -w frontend -- test/themes/themes.api.test.js` en verde.

## T10 — Hook `useThemes` y contexto de refresco

- [ ] Crear `frontend/src/themes/useThemes.js` con `{ themes, loading, error }`, `reload`, `createTheme(name)` (API, inserción ordenada y `refreshThemes`) y dependencia de `versions.themes`; aceptar `{ enabled }`.
- [ ] Añadir `themes: 0` y `refreshThemes` a `frontend/src/context/DataRefreshContext.jsx`; `refreshAll` sigue tocando solo `sessions` y `stats`.
- [ ] Crear `frontend/test/themes/useThemes.test.js` con carga, error, alta, orden y refresco.
- Test: RF-2, RF-4, RF-23 y RF-28; error de contrato, duplicado y refresco tras crear.
- Hecho cuando: `npm test -w frontend -- test/themes/useThemes.test.js` en verde.

## T11 — `Modal` con pila

- [ ] Convertir `frontend/src/components/Modal.jsx` en consciente de la pila: solo el modal superior maneja `Escape` y `Tab`; los inferiores no roban el foco ni se cierran con el mismo evento.
- [ ] Crear `frontend/test/components/Modal.test.jsx` con un modal y con dos modales apilados.
- Test: NFR de accesibilidad y modales apilados.
- Hecho cuando: `npm test -w frontend -- test/components/Modal.test.jsx` en verde.

## T12 — `ThemeSelect` con alta inline

- [ ] Crear `frontend/src/themes/ThemeSelect.jsx` con selector, opción vacía, botón «+», campo inline con foco, alta que selecciona la temática creada, error que mantiene el campo y Escape con `stopPropagation()`.
- [ ] Crear `frontend/test/themes/ThemeSelect.test.jsx` con apertura, foco, alta válida, alta fallida, cancelación y Escape.
- Test: RF-14 a RF-19.
- Hecho cuando: `npm test -w frontend -- test/themes/ThemeSelect.test.jsx` en verde.

## T13 — `ThemesDialog`

- [ ] Crear `frontend/src/themes/ThemesDialog.jsx` con listado ordenado, alta, renombrado inline, eliminación, error de carga con «Reintentar», errores de acción visibles y sin número de clases.
- [ ] Capturar Escape en el renombrado inline con `stopPropagation()` para cancelar solo la edición.
- [ ] Crear `frontend/test/themes/ThemesDialog.test.jsx` con listado, alta, duplicado, renombrado, error de carga, reintento y Escape.
- Test: RF-4, RF-6, RF-7, RF-26 a RF-28.
- Hecho cuando: `npm test -w frontend -- test/themes/ThemesDialog.test.jsx` en verde.

## T14 — `DeleteThemeDialog`

- [ ] Crear `frontend/src/themes/DeleteThemeDialog.jsx` con confirmación simple sin clases y, con clases, número y dos opciones.
- [ ] Ordenar el destino, deshabilitar la reasignación si no hay otra temática, explicar por qué y desactivar la confirmación sin destino.
- [ ] Crear `frontend/test/themes/DeleteThemeDialog.test.jsx` con borrado simple, reasignación, eliminación total, cancelación, sin destino y confirmación desactivada.
- Test: RF-8 a RF-13.
- Hecho cuando: `npm test -w frontend -- test/themes/DeleteThemeDialog.test.jsx` en verde.

## T15 — `CreatedThemesNotice`

- [ ] Crear `frontend/src/themes/CreatedThemesNotice.jsx` con la lista de nombres creados y un botón «Entendido» que cierra el aviso y el formulario.
- [ ] Crear `frontend/test/themes/CreatedThemesNotice.test.jsx` con uno y varios nombres, cierre con botón y cierre con teclado.
- Test: RF-25 y NFR de accesibilidad.
- Hecho cuando: `npm test -w frontend -- test/themes/CreatedThemesNotice.test.jsx` en verde.

## T16 — `App`: botón «Temáticas», modal y mensaje de borrado

- [ ] Añadir a `frontend/src/App.jsx` el botón secundario «Temáticas», el estado del modal y el mensaje de borrado con `themeName`.
- [ ] Refrescar temáticas, sesiones y estadísticas según el cambio (crear, renombrar o eliminar).
- [ ] Ampliar `frontend/test/App.test.jsx` con el botón, la apertura del gestor y el mensaje de borrado.
- Test: RF-26, RF-28 y RF-33.
- Hecho cuando: `npm test -w frontend -- test/App.test.jsx` en verde.

## T17 — `SessionForm` base

- [ ] Cambiar `frontend/src/sessions/SessionForm.jsx` a `form.themeId`, usar `ThemeSelect`, mostrar carga/error/«Reintentar» y desactivar «Guardar» mientras carga.
- [ ] Preseleccionar la temática al editar y avisar si la temática de la clase ya no existe, exigiendo elegir otra.
- [ ] Crear `frontend/test/sessions/SessionForm.test.jsx` con catálogo vacío, carga, error, reintento, guardado sin temática, edición y temática eliminada.
- Test: RF-14, RF-15, RF-20 a RF-24.
- Hecho cuando: `npm test -w frontend -- test/sessions/SessionForm.test.jsx` en verde para los casos base.

## T18 — `SessionForm` alta inline y aviso de temáticas creadas

- [ ] Usar `useThemes.createTheme` en `frontend/src/sessions/SessionForm.jsx` y acumular las temáticas creadas.
- [ ] Mostrar el aviso al cerrar por Cancelar, «×» o Escape si se creó alguna temática y no se guardó la clase; guardar no lo muestra.
- [ ] Si el campo inline está abierto, capturar Escape y cerrar solo el campo.
- [ ] Ampliar `frontend/test/sessions/SessionForm.test.jsx` con alta válida, alta fallida, aviso por las tres vías, guardado sin aviso y Escape del campo.
- Test: RF-16 a RF-19 y RF-25.
- Hecho cuando: `npm test -w frontend -- test/sessions/SessionForm.test.jsx` en verde para los casos de alta y aviso.

## T19 — `useSessions` y `SessionFilters`

- [ ] Añadir el filtro `themeId` a `frontend/src/sessions/useSessions.js`.
- [ ] En `frontend/src/sessions/SessionFilters.jsx`, añadir el desplegable de temáticas (con «Todas»), la etiqueta «Buscar en observaciones» y «Limpiar» que reinicia `from`, `to`, `q` y `themeId`.
- [ ] Crear o ampliar los tests de `useSessions` y `SessionFilters` con selección, búsqueda y limpieza de los cuatro filtros.
- Test: RF-29 y RF-31.
- Hecho cuando: `npm test -w frontend -- test/sessions/useSessions.test.js test/sessions/SessionFilters.test.jsx` en verde.

## T20 — `HistoryView`

- [ ] En `frontend/src/sessions/HistoryView.jsx`, cargar temáticas, pasarlas al filtro y, si la temática elegida desaparece, limpiar `from`, `to`, `q` y `themeId`.
- [ ] Ampliar `frontend/test/sessions/HistoryView.test.jsx` con filtro por temática, búsqueda en observaciones y limpieza al eliminar la temática elegida.
- Test: RF-29 y RF-30.
- Hecho cuando: `npm test -w frontend -- test/sessions/HistoryView.test.jsx` en verde.

## T21 — Filas y estadísticas

- [ ] Usar `themeName` / `name` y `themeId` como clave en `frontend/src/sessions/SessionRow.jsx`, `frontend/src/stats/LongestClassCard.jsx` y `frontend/src/stats/SubjectBreakdown.jsx`.
- [ ] Actualizar `frontend/test/fixtures/contracts.js` y `frontend/test/stats/*.test.jsx` con los campos nuevos.
- Test: RF-32 y RF-33.
- Hecho cuando: `npm test -w frontend -- test/stats` y los tests de fila en verde.

## T22 — Estilos y comprobación a 375 px

- [ ] Ajustar `frontend/src/styles.css` para el selector, el botón «+», el gestor, el diálogo de borrado y el aviso, con `flex-wrap` y `min-width: 0`.
- [ ] Comprobar manualmente que no hay desbordes horizontales a 375 px.
- Test: NFR de compatibilidad.
- Hecho cuando: comprobación manual a 375 px sin desbordes.

## T23 — Documentación y puerta de calidad

- [ ] Actualizar `README.md` (modelo, API y funcionalidades, `POST /api/seed` y borrado de `backend/data/` al actualizar), `AGENTS.md` (nuevas carpetas, `domain-themes`, arranque y datos de ejemplo), `MEMORY.md` y `DEUDA_TECNICA.md` (B5-2).
- [ ] Ejecutar `npm test` y `npm run lint` desde la raíz y corregir lo que quede en rojo.
- [ ] Aplicar la mutación de cada regla nueva: copiar los archivos a `/tmp/opencode`, revertir el cambio, comprobar que su test falla y restaurar con `cp`; no usar `git checkout -- <dir>`.
- [ ] Comprobar manualmente en el navegador: diálogo de datos de ejemplo (aceptar, rechazar, reintentar y volver a preguntar tras recargar), alta inline, aviso al cancelar, reintento de la lista, gestión, borrado con reasignación y total, limpieza del filtro, Escape y 375 px.
- Test: RF-1 a RF-40 y criterios de finalización de la spec.
- Hecho cuando: `npm test` y `npm run lint` en verde desde la raíz, mutación documentada y comprobaciones manuales hechas.

## Orden y dependencias

T1 → T2 → T3 → T4 → T5.1 → T5.2 → T5.3 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20 → T21 → T22 → T23.

- T1 y T2 son la base compartida: sin el paquete `domain-themes` y el contrato nuevo no se pueden escribir los repositorios ni los servicios.
- T3 y T4 comparten el patrón de repositorio; T5.1 valida lo almacenado sin escribir y T5.2 siembra bajo demanda; T5.3 necesita T5.2 y el cliente de sesiones existente.
- T6 y T7 comparten el contrato y los repositorios; T8 depende de T7 para agrupar por `themeId`.
- T9 y T10 son la base del frontend; T11 a T15 construyen los componentes; T16 a T18 integran la cabecera y el formulario.
- T19 y T20 comparten el estado de filtros; T21 muestra los nombres actuales; T22 ajusta el layout.
- T23 cierra la feature y no puede empezar hasta que el resto esté implementado.
