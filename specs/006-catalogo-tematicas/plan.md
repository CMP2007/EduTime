# Plan 006 — Catálogo de temáticas con identificador

> Spec: `specs/006-catalogo-tematicas/spec.md`
> Estado: aprobado (2026-11-10)

## Contexto técnico

Hoy la temática es un texto libre (`session.title`) y condiciona todo el sistema:

- **Persistencia**: `backend/src/storage/fileStore.js` tiene la ruta fija a `sessions.json`, valida que el contenido sea un array y escribe de forma atómica. El repositorio de sesiones es una fábrica con single-flight, cola de escrituras y `structuredClone`; **no siembra**: la semilla se aplica bajo demanda desde la API.
- **API**: `Session` exige `title`; `sessionsService.list` busca `q` en `title + notes`; `statsService.groupBySubject` agrupa por `session.title` y `LongestClass` expone `title`.
- **Contrato**: `packages/domain-contracts` declara `Session.title`, `Subject.title` y `LongestClass.title`; frontend y backend validan con las mismas funciones.
- **Frontend**: el formulario usa un `<input>` de texto; el historial filtra con un buscador «Buscar por temática»; la cabecera solo tiene «+ Nueva clase»; `ConfirmDialog` solo admite un mensaje y dos botones; `Modal` cierra con Escape mediante un listener nativo en `document`.
- **Tests**: no hay tests de `SessionForm` ni de `useSessions`; los de `sessions.service`, `stats.service`, `App`, `HistoryView`, `StatsPanel` y los fixtures usan `title`.

El cambio afecta a todas las capas. El plan busca que la carga de datos de ejemplo sea explícita, solo ocurra si el usuario la acepta y nunca se mezcle con clases existentes; que el catálogo tenga una única fuente de reglas (normalización y orden) y que el contrato siga siendo la frontera entre backend y frontend.

## Enfoque

### 1. Reglas compartidas de la temática

Crear `packages/domain-themes` con funciones puras, sin dependencias:

- `normalizeThemeName(value)`: recorta extremos, pasa a minúsculas con `toLocaleLowerCase('es')` y elimina las tildes de las vocales y la diéresis (`á é í ó ú ü`). **Conserva la `ñ`**: `año` y `ano` son temáticas distintas.
- `isSameThemeName(a, b)`: compara con `normalizeThemeName`.
- `compareThemeNames(a, b)`: orden alfabético en español con `localeCompare('es', { sensitivity: 'base' })` y desempate por el texto original.

Añadir `THEME_NAME_MAX = 80` a `packages/domain-constants` y retirar `TITLE_MAX` (el título ya no existe como campo de sesión). El límite se usa en la validación de la temática y en el formulario.

### 2. Contrato de datos

En `packages/domain-contracts`:

- `Theme`: `{ id, name, sessionCount }`. `sessionCount` es derivado (no se persiste) y lo usa el diálogo de eliminación.
- `Session`: `{ id, themeId, themeName, date, durationMinutes, notes, createdAt, updatedAt }`. El nombre **no se persiste**; la API lo resuelve en cada respuesta.
- `Subject`: `{ themeId, name, minutes, sessions }`.
- `LongestClass`: `{ id, themeId, name, date, durationMinutes }`.
- Validadores `validateTheme` / `assertTheme` / `validateThemeList` / `assertThemeList`.

Se mantiene la regla del contrato: valida presencia, tipo y obligatoriedad; no valida formatos de fecha ni reglas de negocio.

### 3. Persistencia en dos archivos

Mantener `backend/data/sessions.json` y añadir `backend/data/themes.json`. En `fileStore.js`:

- Exportar `sessionsFile`, `themesFile` y `createFileStore(file)` con `{ readData, writeData }`.
- Conservar `readData(file)` / `writeData(data, file)` para los tests, la validación de arranque y la semilla.
- Generalizar el mensaje de error a «no contiene un array JSON» (sirve para ambos archivos).

`backend/src/themes/themes.repository.js` replica el patrón de sesiones: fábrica `createThemesRepository(store)`, single-flight, cola de escrituras y copias profundas. Guarda `{ id, name }`, **no siembra** y añade `insertMany(themes)` para cargar la semilla en una sola escritura, actualizando la caché solo tras el éxito.

`backend/src/sessions/sessions.repository.js` deja de sembrar (la semilla se aplica bajo demanda desde la API) y añade operaciones de datos para el borrado de temáticas y para la semilla:

- `insertMany(sessions)` → construye el array nuevo, lo persiste una sola vez y actualiza la caché solo si la escritura termina bien; así un fallo no deja clases en memoria.
- `countByThemeId(themeId)`
- `reassignTheme(fromThemeId, toThemeId)` → actualiza solo `themeId`, conserva el `updatedAt` original y persiste; no devuelve resumen.
- `removeByThemeId(themeId)` → elimina y persiste; no devuelve resumen.

Estas operaciones no deciden reglas: solo aplican el cambio que les pide el servicio.

### 4. Arranque sin migración y validación de integridad

`backend/src/startup/validateStoredData.js` sustituye a `initializeData.js`. Se ejecuta antes de `app.listen`, **no escribe nada** y no migra:

```js
export async function validateStoredData({
  sessionsStore = createFileStore(sessionsFile),
  themesStore = createFileStore(themesFile),
} = {}) {
  const [storedSessions, storedThemes] = await Promise.all([
    sessionsStore.readData(),
    themesStore.readData(),
  ]);

  const sessions = storedSessions ?? [];
  const themes = storedThemes ?? [];
  const themeIds = new Set();

  for (const theme of themes) {
    if (!theme.id || themeIds.has(theme.id)) {
      throw new Error(`El catálogo contiene una temática sin identificador o repetida (${theme.id}).`);
    }
    try {
      validateThemeName(theme.name);
    } catch (error) {
      throw new Error(`La temática ${theme.id} no tiene un nombre válido: ${error.message}`);
    }
    themeIds.add(theme.id);
  }

  for (const session of sessions) {
    if ('title' in session) {
      throw new Error(
        `La clase ${session.id} usa el formato antiguo de temática. ` +
        'Los datos actuales son de muestra: borra backend/data/ y vuelve a arrancar.',
      );
    }
    if (!session.themeId || !themeIds.has(session.themeId)) {
      throw new Error(
        `La clase ${session.id} no tiene una temática válida. ` +
        'Los datos actuales son de muestra: borra backend/data/ y vuelve a arrancar.',
      );
    }
  }
}
```

Propiedades que cubre:

- **Sin siembra**: si no existe ningún archivo, no se crea nada; los repositorios devuelven listas vacías y el frontend muestra el diálogo de datos de ejemplo.
- **Sin migración**: un `title` antiguo o un `themeId` inexistente detiene el arranque con un mensaje que pide borrar `backend/data/` (son datos de muestra). Nunca se sobrescribe.
- **Solo lectura**: no hay escrituras de arranque; la recuperación es explícita y manual.
- **Validación de temáticas**: cada temática necesita `id` único y un nombre válido; se reutiliza `validateThemeName` de `themes.validation` (dependencia `startup → themes`, en un solo sentido).
- **Arranque**: `server.js` ejecuta `validateStoredData()` antes de `app.listen`; si falla, registra el error, deja `process.exitCode = 1` y no abre el puerto.

La actualización desde una versión anterior exige borrar `backend/data/` una vez (T5.1). Es un paso documentado, no una migración automática.

### 5. Datos de ejemplo bajo demanda

`backend/src/seed/seed.js` (movida desde `sessions/`) devuelve `{ themes, sessions }`:

- Temáticas únicas por nombre (con `isSameThemeName`) y validadas con `validateThemeName`.
- Clases validadas con `validateSessionInput`, con `themeId` y sin `title`.
- Fechas relativas a hoy, como ahora.

`backend/src/seed/seed.service.js` aplica la semilla solo si no hay ninguna clase:

1. Lee las clases y las temáticas existentes.
2. Si hay al menos una clase, lanza `ConflictError` (409) con «Ya hay clases registradas; no se cargan datos de ejemplo.».
3. Construye la semilla y reconcilia temáticas: si una temática de la semilla coincide por nombre normalizado con una existente, reutiliza su `id` y no la inserta; si no, la inserta.
4. Reasigna el `themeId` de cada clase de ejemplo al `id` definitivo.
5. Escribe primero las temáticas nuevas con `themesRepository.insertMany` y después las clases con `sessionsRepository.insertMany`, una sola escritura por repositorio y actualizando la caché solo tras el éxito. Si falla la segunda, no queda ninguna clase a medias ni en memoria; al reintentar se reutilizan las temáticas ya escritas.

`backend/src/seed/seed.routes.js` expone `POST /api/seed`:

- Sin cuerpo.
- `204` si aplica la semilla.
- `409` si ya hay clases.
- Se monta en `app.js` con `app.use('/api/seed', seedRoutes)`.

`backend/src/errors.js` añade `ConflictError` (estado 409) para que el manejador de errores responda `{ error }` como el resto de 4xx.

La semilla vive en `seed/` y conoce `sessions` y `themes`; ninguno de los dos conoce `seed`. `server.js` no siembra.

### 6. Servicio y rutas de temáticas

`backend/src/themes/themes.validation.js`:

- `validateThemeName(value)`: texto obligatorio, recortado, 1–80 caracteres; mensajes «El nombre de la temática es obligatorio.» y «El nombre de la temática no puede superar 80 caracteres.».
- `assertThemeNameAvailable(name, themes, { excludeId })`: usa `isSameThemeName`; lanza «Ya existe una temática con ese nombre.».

`backend/src/themes/themes.service.js`:

- `list()`: lee temáticas y sesiones, ordena con `compareThemeNames` y calcula `sessionCount` en una pasada.
- `create({ name })`: valida, comprueba duplicado, inserta `{ id, name }` y devuelve `{ id, name, sessionCount: 0 }`.
- `rename(id, { name })`: si no existe → `null` (404). Valida, permite el mismo nombre exacto (no escribe) y permite cambiar solo mayúsculas/tildes. Si otra temática tiene el mismo nombre normalizado → error. Devuelve `{ id, name, sessionCount }`, igual que `create` y `list`.
- `remove(id, { strategy, targetThemeId })`:
  - Sin clases: elimina la temática y devuelve `true`.
  - Con clases y `strategy: 'reassign'`: exige `targetThemeId` distinto y existente; reasigna primero y elimina la temática después; devuelve `true`.
  - Con clases y `strategy: 'delete'`: elimina las clases primero y la temática después; devuelve `true`.
  - Con clases y sin estrategia válida: error de validación que explica las dos opciones.
  - Si la temática no existe: devuelve `false` (la ruta responde 404).
  - No devuelve un resumen de cuántas clases se movieron o borraron: la ruta responde `204` y los tests comprueban el estado de los repositorios.

`backend/src/themes/themes.routes.js`:

- `GET /api/themes` → lista ordenada con `sessionCount`.
- `POST /api/themes` → 201.
- `PUT /api/themes/:id` → 200 o 404.
- `DELETE /api/themes/:id` → body `{ strategy, targetThemeId? }`; 204 o 404.

Montar en `app.js` con `app.use('/api/themes', themesRoutes)`.

### 7. Sesiones con `themeId`

`backend/src/sessions/sessions.validation.js`:

- `validateSessionInput` valida `themeId` como texto no vacío (obligatorio) y deja de validar `title`.
- El resto de reglas (fecha, duración, observaciones) no cambia.

`backend/src/sessions/sessions.service.js`:

- `create(payload)`: valida la entrada, comprueba que la temática existe (`themesRepository.findById`), inserta `{ id, themeId, date, durationMinutes, notes, ... }` y devuelve la sesión con `themeName` resuelto.
- `update(id, payload)`: si no llega `themeId`, conserva el actual; comprueba que existe; actualiza y resuelve el nombre.
- `list(filters)`: acepta `themeId` además de `from`, `to` y `q`. `themeId` se valida como texto único no vacío: si llega repetido (array) o con otro tipo, responde `400` como los filtros de fecha. `q` busca **solo en `notes`**. Resuelve `themeName` con un mapa de temáticas. Si una clase referencia una temática inexistente, lanza un error explícito (invariante rota).
- `sessions.routes.js` pasa `themeId` del query.

### 8. Estadísticas

`backend/src/stats/stats.service.js`:

- Lee `themesRepository.findAll()` una vez.
- `groupBySubject` agrupa por `session.themeId` y usa el nombre actual del catálogo; devuelve `{ themeId, name, minutes, sessions }`.
- `longestClass` devuelve `{ id, themeId, name, date, durationMinutes }`.
- Si una clase referencia una temática inexistente, falla con un error explícito.

### 9. Capa de datos del frontend

- `frontend/src/themes/themes.api.js`: `list`, `create`, `rename`, `remove`, validando con `assertThemeList` / `assertTheme`.
- `frontend/src/themes/useThemes.js`: estado `{ themes, loading, error }`, `reload`, `createTheme(name)` y dependencia de `versions.themes`. `createTheme` llama a la API, inserta la temática en la lista local ordenada con `compareThemeNames` y llama a `refreshThemes`; devuelve la temática creada para que el formulario la seleccione. Acepta `{ enabled }` para no cargar cuando el modal está cerrado.
- `frontend/src/seed/seed.api.js`: `apply()` llama a `POST /api/seed`; la respuesta 204 no tiene cuerpo.
- `DataRefreshContext`: añadir `themes: 0` y `refreshThemes`. `refreshAll` sigue tocando solo `sessions` y `stats`; guardar una clase no recarga el catálogo.

### 10. Interfaz de temáticas

- `frontend/src/components/Modal.jsx`: pasa a ser consciente de la **pila de modales**. Solo el modal superior maneja `Escape` y `Tab`; los inferiores no roban el foco ni se cierran con el mismo evento. Se añade un contexto/módulo de pila y tests en `Modal.test.jsx`.
- `frontend/src/themes/ThemeSelect.jsx`: `<select>` con todas las temáticas, opción vacía, botón «+» y campo inline. Con `allowCreate`, el alta llama a `onCreate(name)`, selecciona la temática creada y cierra el campo; si falla, mantiene el campo abierto y muestra el error. El `onKeyDown` del campo inline captura Escape, llama a `event.stopPropagation()` y cierra solo el campo; así el listener nativo de `Modal` no cierra el formulario.
- `frontend/src/themes/ThemesDialog.jsx`: modal «Temáticas» con alta, listado ordenado, renombrar inline y eliminar. Muestra error de carga y «Reintentar», y muestra el error visible de alta, renombrado y eliminación sin cerrar el diálogo. No muestra el número de clases. El renombrado inline captura Escape igual que el alta inline: `stopPropagation()` y cancela solo la edición.
- `frontend/src/themes/DeleteThemeDialog.jsx`: diálogo apilado sobre el gestor. Sin clases: confirmación simple. Con clases: muestra el número y dos opciones (reasignar a otra temática o eliminar la temática y sus clases); si no hay otra temática, la reasignación no está disponible y se explica. El botón de confirmar se desactiva si falta la temática destino. Al estar en la pila, solo este diálogo maneja el foco y Escape mientras está abierto.
- `frontend/src/themes/CreatedThemesNotice.jsx`: aviso apilado sobre el formulario, con la lista de temáticas creadas y un botón «Entendido»; al cerrarlo se cierra el formulario. Aparece cuando se cierra el formulario por cualquier vía (Cancelar, «×» o Escape) si se creó al menos una temática y la clase no se guardó. Si el campo inline está abierto, Escape cierra solo el campo y no dispara el aviso.
- `frontend/src/seed/SeedPrompt.jsx`: diálogo de datos de ejemplo. Usa `useSessions()` sin filtros para saber si hay clases; no se muestra mientras carga, si hay error de carga o si ya hay al menos una clase. Con la aplicación vacía, pregunta «¿Quieres cargar datos de ejemplo?» con dos acciones: «Cargar datos de ejemplo» y «Empezar sin datos». Aceptar llama a `seedApi.apply()`, refresca sesiones y estadísticas y cierra; si falla, mantiene el diálogo, muestra el error en una región viva (`role="alert"`) y permite reintentar. Rechazar, «×» o Escape ocultan el diálogo sin escribir nada; un estado local evita que reaparezca en la misma carga y, al recargar la página, vuelve a preguntar mientras no haya clases.

### 11. Integración en las vistas

- `App.jsx`: botón secundario «Temáticas» junto a «+ Nueva clase»; estado del modal; mensaje de borrado de clase con `themeName`; renderiza `SeedPrompt` para que el diálogo de datos de ejemplo aparezca sobre cualquier pestaña; tras crear/renombrar/eliminar temáticas, refrescar lo que corresponda (`refreshThemes` y, si cambian nombres o clases, `refreshSessions`/`refreshStats`).
- `SessionForm.jsx`: `form.themeId` en lugar de `title`; `ThemeSelect` con alta inline; estados de carga/error/retry; el botón «Guardar» se desactiva mientras no haya catálogo disponible (carga inicial o catálogo vacío), además de cuando hay error; una recarga en segundo plano con el catálogo ya cargado no bloquea el guardado; preselecciona la temática al editar; si la temática de la clase ya no existe, avisa y exige elegir otra; usa `useThemes.createTheme` y acumula las temáticas creadas. El aviso aparece al cerrar por cualquier vía (Cancelar, «×» o Escape) si se creó al menos una temática y no se guardó la clase; guardar no lo muestra. El campo inline abierto captura Escape y cierra solo el campo.
- `HistoryView.jsx`: carga temáticas, las pasa al filtro y, si la temática elegida desaparece, limpia `from`, `to`, `q` y `themeId` para mostrar el historial completo.
- `SessionFilters.jsx`: desplegable de temáticas (incluye «Todas») y búsqueda con etiqueta «Buscar en observaciones»; «Limpiar» reinicia `from`, `to`, `q` y `themeId`.
- `SessionRow.jsx`, `LongestClassCard.jsx` y `SubjectBreakdown.jsx`: usan `themeName` / `name` y `themeId` como clave.
- `styles.css`: estilos del gestor, alta inline, opciones del diálogo de borrado, aviso y diálogo de datos de ejemplo (acciones apiladas a 375 px), sin desbordes.

### 12. Documentación y calidad

Actualizar `README.md` (modelo, API, funcionalidades, `POST /api/seed` y el paso de borrar `backend/data/` al actualizar), `AGENTS.md` (nuevas carpetas, paquete `domain-themes`, arranque y datos de ejemplo), `MEMORY.md` y `DEUDA_TECNICA.md` (B5-2). Cerrar con `npm test`, `npm run lint`, mutación de cada regla nueva y comprobación manual a 375 px.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `packages/domain-themes/package.json` | Nuevo paquete workspace. |
| `packages/domain-themes/index.js` | `normalizeThemeName`, `isSameThemeName`, `compareThemeNames`. |
| `packages/domain-themes/test/themes.test.js` | Tildes, `ñ`, mayúsculas, espacios y orden. |
| `packages/domain-constants/index.js` | `TITLE_MAX` → `THEME_NAME_MAX`. |
| `packages/domain-contracts/index.js` | `Theme`, `Session`, `Subject`, `LongestClass` y validadores. |
| `packages/domain-contracts/test/contracts.test.js` | Casos de temática y campos nuevos. |
| `backend/src/storage/fileStore.js` | Rutas exportadas y `createFileStore`. |
| `backend/src/themes/themes.validation.js` | Validación y duplicados. |
| `backend/src/themes/themes.repository.js` | Fábrica, single-flight, cola, copias e `insertMany`. |
| `backend/src/themes/themes.service.js` | Alta, renombrado, borrado, reasignación y conteos. |
| `backend/src/themes/themes.routes.js` | Endpoints `/api/themes`. |
| `backend/src/startup/validateStoredData.js` | Validación de integridad sin migración ni siembra. |
| `backend/src/sessions/sessions.repository.js` | Sin semilla; `insertMany`, `countByThemeId`, `reassignTheme`, `removeByThemeId`. |
| `backend/src/sessions/sessions.validation.js` | `themeId` en lugar de `title`. |
| `backend/src/sessions/sessions.service.js` | Resolución de nombre, filtro `themeId`, `q` en notas. |
| `backend/src/sessions/sessions.routes.js` | Query `themeId`. |
| `backend/src/seed/seed.js` | Movida desde `sessions/`; devuelve `{ themes, sessions }`. |
| `backend/src/seed/seed.service.js` | Aplica la semilla solo si no hay clases y reutiliza temáticas. |
| `backend/src/seed/seed.routes.js` | `POST /api/seed`. |
| `backend/src/errors.js` | `ConflictError` (409). |
| `backend/src/stats/stats.service.js` | Agrupación por `themeId` y nombres actuales. |
| `backend/src/app.js` | Monta `/api/themes` y `/api/seed`. |
| `backend/src/server.js` | `validateStoredData()` antes de escuchar. |
| `backend/test/themes.repository.test.js` | Nuevo. |
| `backend/test/themes.service.test.js` | Nuevo. |
| `backend/test/startup/validateStoredData.test.js` | Nuevo. |
| `backend/test/sessions.repository.test.js` | Sin tests de semilla; métodos nuevos, incluido `insertMany`. |
| `backend/test/sessions.service.test.js` | `themeId`/`themeName`, filtros y errores. |
| `backend/test/seed/seed.test.js` | Semilla con temáticas. |
| `backend/test/seed/seed.service.test.js` | Reutilización, 409, fallo y reintento. |
| `backend/test/stats.service.test.js` | Temáticas simuladas y nombres. |
| `backend/test/app.test.js` | Payloads con `themeId`, rutas de temáticas, `POST /api/seed` y contratos. |
| `backend/test/fileStore.test.js` | Mensaje genérico y rutas. |
| `frontend/src/components/Modal.jsx` | Pila de modales: solo el superior maneja Escape y Tab. |
| `frontend/src/themes/themes.api.js` | Nuevo cliente HTTP. |
| `frontend/src/themes/useThemes.js` | Nuevo hook con `createTheme`. |
| `frontend/src/themes/ThemeSelect.jsx` | Nuevo selector con alta inline. |
| `frontend/src/themes/ThemesDialog.jsx` | Nuevo gestor. |
| `frontend/src/themes/DeleteThemeDialog.jsx` | Nuevo diálogo de borrado. |
| `frontend/src/themes/CreatedThemesNotice.jsx` | Nuevo aviso. |
| `frontend/src/context/DataRefreshContext.jsx` | Versión `themes` y `refreshThemes`. |
| `frontend/src/seed/seed.api.js` | Cliente de `POST /api/seed`. |
| `frontend/src/seed/SeedPrompt.jsx` | Diálogo de datos de ejemplo. |
| `frontend/src/App.jsx` | Botón, modal, mensaje de borrado y `SeedPrompt`. |
| `frontend/src/sessions/SessionForm.jsx` | Selector, alta inline, aviso y errores. |
| `frontend/src/sessions/HistoryView.jsx` | Carga de temáticas y limpieza de los cuatro filtros. |
| `frontend/src/sessions/SessionFilters.jsx` | Desplegable y búsqueda en observaciones. |
| `frontend/src/sessions/SessionRow.jsx` | `themeName`. |
| `frontend/src/sessions/useSessions.js` | Filtro `themeId`. |
| `frontend/src/stats/LongestClassCard.jsx` | `name`. |
| `frontend/src/stats/SubjectBreakdown.jsx` | `themeId` y `name`. |
| `frontend/src/styles.css` | Estilos nuevos, incluido el diálogo de datos de ejemplo a 375 px. |
| `frontend/test/components/Modal.test.jsx` | Pila: foco y Escape solo en el modal superior. |
| `frontend/test/themes/*.test.jsx` | Nuevos tests de UI y API. |
| `frontend/test/seed/seed.api.test.js` | Nuevo. |
| `frontend/test/seed/SeedPrompt.test.jsx` | Nuevo. |
| `frontend/test/sessions/SessionForm.test.jsx` | Nuevo. |
| `frontend/test/sessions/HistoryView.test.jsx` | Filtro por temática, notas y limpieza de los cuatro filtros. |
| `frontend/test/App.test.jsx` | Botón «Temáticas», mensaje con `themeName` y diálogo de datos de ejemplo. |
| `frontend/test/fixtures/contracts.js` | Datos con `themeId`/`themeName` y temáticas. |
| `frontend/test/stats/*.test.jsx` | Fixtures actualizados. |
| `README.md`, `AGENTS.md`, `MEMORY.md`, `DEUDA_TECNICA.md` | Documentación. |

## Decisiones y alternativas

- **Dos archivos (`sessions.json` + `themes.json`).** Mantiene el contrato de «array JSON» del `fileStore`, evita reescribir el catálogo cuando se guarda una clase y permite una carga de datos de ejemplo recuperable escribiendo primero las temáticas. Alternativa descartada: un único `data.json` con `{ sessions, themes }`, que obliga a cambiar el `fileStore`, el repositorio y todos sus tests, y complica la recuperación ante un fallo a mitad.
- **La API resuelve `themeName`.** Evita que el historial y las estadísticas tengan que cargar y cruzar el catálogo, y garantiza que el nombre mostrado sea siempre el actual. Alternativa descartada: devolver solo `themeId` y resolver en el frontend, que duplica la lógica de resolución en varias vistas y puede mostrar nombres obsoletos si una vista no recarga.
- **Paquete `domain-themes`.** La regla de duplicados (tildes, mayúsculas, `ñ`) y el orden alfabético son compartidos por backend y frontend; una sola definición evita que el selector y el backend ordenen o comparen distinto. Alternativa descartada: duplicar las funciones en backend y frontend, con riesgo de divergencia.
- **Semilla bajo demanda desde la API y sin migración.** El arranque solo valida integridad y no escribe nada. La semilla se aplica con `POST /api/seed` cuando el frontend confirma que no hay clases. Alternativa descartada: sembrar en el arranque, que impide preguntar al usuario y mezcla datos de muestra con datos propios; y migrar los datos antiguos, que el mantenedor ha declarado prescindibles.
- **Diálogo en el frontend, no prompt de terminal.** La consulta se hace en la interfaz que usa el mantenedor; `npm run dev` no reenvía la entrada al backend y el prompt de terminal no sería accesible desde la app. Alternativa descartada: `readline` en el arranque, que además bloquea el servidor y complica los tests.
- **Sin migración y con datos actuales descartables.** Los datos de la versión anterior son de muestra; un `title` o un `themeId` inválido detiene el arranque con un mensaje que pide borrar `backend/data/`. Alternativa descartada: migrar, que conserva datos prescindibles y añade código y tests de conversión.
- **Reutilizar temáticas al sembrar.** Si el usuario ya creó temáticas pero no clases, la semilla no las duplica: reutiliza por nombre normalizado y crea solo las que falten. Alternativa descartada: sembrar siempre un catálogo nuevo, que duplicaría nombres y rompería la unicidad.
- **No persistir el rechazo.** El usuario vuelve a ver el diálogo en la siguiente carga mientras no haya clases. Alternativa descartada: guardar una marca de rechazo, que exigiría otro estado persistente y ocultaría la opción para siempre.
- **`POST /api/seed` responde 204.** No hay cuerpo que la interfaz consuma: tras aceptar, el frontend refresca sesiones y estadísticas. Alternativa descartada: devolver un resumen, que añade contrato y tests sin consumidor.
- **La semilla no se ejecuta desde el repositorio.** El repositorio de sesiones deja de sembrar; `seed.service` orquesta ambos repositorios. Alternativa descartada: que el repositorio de sesiones escriba también temáticas, que rompe la separación de responsabilidades.
- **`validateStoredData` crea sus almacenes por defecto.** `server.js` llama `validateStoredData()` sin cableado; los tests le pasan almacenes en memoria. Alternativa descartada: que `server.js` construya y pase los almacenes, que duplica el cableado por defecto.
- **Borrado con `strategy` en el body de `DELETE`.** Un solo endpoint expresa las dos acciones y permite validar el destino en el servidor. Alternativa descartada: endpoints separados (`/delete`, `/reassign`), que multiplican rutas para el mismo recurso.
- **`remove` no devuelve un resumen.** La ruta responde `204` y los tests comprueban el estado de los repositorios (clases reasignadas o borradas y temática eliminada). Alternativa descartada: devolver `{ reassigned, deletedSessions }` para una UI que no lo usa, dejando un retorno sin consumidor.
- **`rename` devuelve `{ id, name, sessionCount }`.** El contrato `Theme` exige `sessionCount` y el frontend valida con `assertTheme`; sin ese campo el renombrado parecería fallar con `ContractError`. Alternativa descartada: devolver solo `{ id, name }` y relajar el contrato.
- **`themeId` del filtro se valida como texto único.** Un `themeId` repetido llega como array y devolvería un historial vacío; se responde `400` como en los filtros de fecha. Alternativa descartada: ignorar el tipo y devolver una lista vacía, que oculta el error.
- **La reasignación conserva `updatedAt`.** Solo cambia `themeId`; fecha, duración, observaciones y marcas de tiempo se mantienen. Alternativa descartada: actualizar `updatedAt`, que no aporta información útil al usuario y altera el orden de “modificadas recientemente”.
- **`ñ` se conserva al normalizar.** «Tildes» se interpreta como las vocales acentuadas y la diéresis; `año` y `ano` son temáticas distintas. Alternativa descartada: eliminar todos los diacríticos con `NFD`, que convertiría `ñ` en `n` y fusionaría palabras diferentes.
- **Modelo de temática mínimo `{ id, name }`.** No hay requisito de auditoría ni de fechas de creación; `sessionCount` se calcula y no se persiste. Alternativa descartada: añadir `createdAt`/`updatedAt`, que no se usan y aumentan el contrato.
- **`refreshThemes` separado de `refreshAll`.** Guardar una clase no debe recargar el catálogo; renombrar o eliminar una temática sí debe refrescar sesiones y estadísticas. Alternativa descartada: incluir `themes` en `refreshAll`, que provoca recargas innecesarias.
- **`useThemes.createTheme` centraliza el alta y el refresco.** El hook llama a la API, inserta la temática ordenada y hace `refreshThemes`; el formulario solo selecciona el resultado. Alternativa descartada: repartir la lógica entre `SessionForm` y `ThemesDialog`, con riesgo de que una vista no refresque a la otra.
- **Escape del alta inline y del renombrado con `stopPropagation`.** El campo inline se queda con el evento antes de que llegue al listener de `document` del `Modal`; el resto del modal sigue cerrando con Escape. Alternativa descartada: un estado global de «Escape bloqueado», más frágil y difícil de probar.
- **`Modal` consciente de la pila.** Solo el modal superior maneja `Escape` y `Tab`; así el gestor y el diálogo de borrado, o el formulario y el aviso, pueden apilarse sin robarse el foco. Alternativa descartada: no apilar y sustituir el contenido del modal padre, que mezcla dos vistas en un mismo componente.
- **El filtro del historial se limpia entero al borrar la temática elegida.** Se limpian `from`, `to`, `q` y `themeId` para cumplir «muestra el historial completo». Alternativa descartada: limpiar solo `themeId`, que dejaría fechas o texto activos y no mostraría todo el historial.
- **Dependencia mutua aceptada entre temáticas y sesiones.** `themes.service` usa `sessions.repository` para el borrado y `sessions.service` usa `themes.repository` para validar y resolver nombres; los repositorios no importan servicios y la dirección HTTP → reglas → datos se respeta. Alternativa descartada: una capa de orquestación adicional para una app local pequeña.
- **Orden de borrado: primero las clases, después la temática.** Si falla la segunda escritura, queda una temática sin clases (recuperable); al revés quedarían clases huérfanas. Alternativa descartada: borrar la temática primero, que rompe la integridad referencial ante un fallo.

## Riesgos

- **Datos antiguos incompatibles.** Un `backend/data/` de una versión anterior impide arrancar con un error explícito. Mitigación: el mensaje pide borrar `backend/data/` (son datos de muestra), la tarea T5.1 lo hace y `README.md` lo documenta; no se sobrescribe nada.
- **Semilla sobre datos existentes.** Si la condición de «no hay clases» se implementa mal, se podrían mezclar datos de muestra con datos propios. Mitigación: `seedService.apply` relee las clases y responde 409 si hay al menos una; tests de servicio y de ruta.
- **Semilla duplicada al reintentar.** Un fallo tras escribir temáticas podría duplicarlas al reintentar. Mitigación: reconciliación por nombre normalizado, `insertMany` por repositorio y test de reintento.
- **Diálogo invasivo.** Con la aplicación vacía, el diálogo reaparece en cada carga si el usuario rechaza. Es el comportamiento acordado; se mitiga permitiendo cerrarlo con «Empezar sin datos», «×» o Escape y no bloqueando la creación de clases después.
- **Dos archivos no son atómicos entre sí.** Mitigación: la semilla escribe primero las temáticas y después las clases; si falla la segunda escritura, no hay clases a medias y el reintento reutiliza las temáticas. Se prueba el caso «temáticas escritas, sesiones no».
- **Cambio de contrato en cascada.** `Session.title` desaparece y afecta a fixtures, tests y componentes. Mitigación: actualizar primero el contrato y sus tests, y después los consumidores; `npm test` como puerta.
- **Carrera entre crear una clase y eliminar su temática.** Dos peticiones concurrentes podrían dejar una clase huérfana. Mitigación: la aplicación es local y de un solo usuario; el borrado reasigna/elimina clases antes de borrar la temática y el arranque valida la integridad. Se documenta como fuera de alcance la concurrencia entre pestañas.
- **Modales apilados.** El `Modal` actual no soporta dos modales abiertos: el inferior roba el foco y ambos reaccionan al mismo Escape. Mitigación: pila de modales con solo el superior manejando `Escape` y `Tab`, y tests en `Modal.test.jsx` con dos modales abiertos.
- **Escape con el alta inline o el renombrado.** Si el `stopPropagation` no funciona con el listener nativo, Escape cerraría el modal. Mitigación: tests explícitos de `ThemeSelect`, `ThemesDialog` y `SessionForm` que comprueban que el modal sigue abierto.
- **Layout a 375 px.** El selector, el botón «+», el gestor y el diálogo de borrado añaden controles. Mitigación: comprobación manual y estilos con `flex-wrap`/`min-width: 0`.
- **Tests existentes acoplados a `title`.** Muchos tests construyen sesiones con `title`. Mitigación: actualizarlos en el mismo cambio y mantener los helpers (`buildSession`) con `themeId`/`themeName`.

## Verificación contra la constitución

- **Principio 1 (dependencias y stack)**: no se añaden dependencias externas. `domain-themes` es un paquete workspace interno aprobado por el mantenedor, con las mismas versiones exactas del monorepo; se justifica porque la regla de duplicados y el orden son compartidos.
- **Principio 2 (spec y código)**: la spec `006-catalogo-tematicas` está aprobada y este plan cubre RF-1 a RF-40 con tests verificables. No se implementa nada fuera de su alcance.
- **Principio 3 (separación de responsabilidades)**: backend con `themes.repository` (datos), `themes.service` (reglas), `themes.routes` (HTTP), `seed.service` (semilla), `seed.routes` (HTTP) y `startup/validateStoredData.js` (arranque); frontend con `themes.api.js` y `seed.api.js` (HTTP), `useThemes` (estado), `SeedPrompt` (UI) y componentes. La semilla vive en `seed/` para que `sessions` y `themes` no dependan de ella; la dependencia mutua entre los servicios se acepta a nivel de repositorios (sin imports circulares).
- **Principio 4 (tests y lint)**: cada RF tiene al menos un test; los nuevos tests deben fallar al revertir la regla. `npm test` y `npm run lint` bloquean el cierre. La pila de `Modal` y el Escape del alta/renombrado tienen tests propios.
- **Principio 5 (datos y secretos)**: todo queda en local (`backend/data/`), sin secretos ni datos personales; `backend/data/` sigue ignorado por git y solo contiene datos de muestra que se pueden borrar; borrar una clase la elimina del almacenamiento y borrar una temática con «eliminar todo» elimina sus clases.
- **Principio 6 (idioma)**: textos de interfaz y errores en español con «Temática»/«Temáticas»; identificadores, módulos y código en inglés (`theme`, `themeId`, `themesRepository`).

## Plan de pruebas (RF → test)

| RF | Caso |
|---|---|
| RF-1 | `themes.repository` persiste y `validateStoredData` conserva las temáticas tras reiniciar. La semilla solo se aplica bajo demanda y si no hay clases. |
| RF-2 | `themesService.create` crea con id y nombre; `POST /api/themes` responde 201. |
| RF-3 | Validación rechaza vacío, solo espacios y más de 80 caracteres. |
| RF-4 | Alta duplicada por mayúsculas, tildes o espacios devuelve error y no crea; test de UI en formulario y gestor. |
| RF-5 | Renombrar actualiza el nombre y devuelve `{ id, name, sessionCount }`; sesiones, historial y estadísticas muestran el nuevo. |
| RF-6 | Renombrado vacío, largo o duplicado conserva el nombre anterior y muestra error. |
| RF-7 | Mismo texto exacto no escribe; cambio solo de mayúsculas/tildes actualiza el nombre visible. |
| RF-8 | Borrado de temática sin clases pide confirmación y elimina; el test comprueba el estado del repositorio. |
| RF-9 | Borrado con clases muestra el número y las dos acciones. |
| RF-10 | Reasignación exige destino distinto; sin otra temática la opción no está disponible y se explica. |
| RF-11 | Reasignación mueve todas las clases, conserva fecha/duración/observaciones/`updatedAt` y elimina la temática; el test comprueba los repositorios. |
| RF-12 | Eliminar todo borra la temática y sus clases; el test comprueba los repositorios. |
| RF-13 | Cancelar el diálogo no modifica nada. |
| RF-14 | Selector del formulario ordenado, con todas las temáticas y acción de alta; «Guardar» desactivado mientras no haya catálogo disponible. |
| RF-15 | Catálogo vacío muestra indicación y no permite guardar. |
| RF-16 | «+» despliega el campo y le da el foco. |
| RF-17 | Alta válida registra, cierra el campo y selecciona la temática nueva. |
| RF-18 | Alta fallida mantiene el campo abierto, muestra el error y no cambia la selección. |
| RF-19 | Cancelar el alta oculta el campo y conserva la selección anterior. |
| RF-20 | Guardar sin temática muestra error y no guarda. |
| RF-21 | Guardar asocia por `themeId`; la respuesta y la fila muestran `themeName` del catálogo. |
| RF-22 | Editar preselecciona la temática de la clase. |
| RF-23 | Error de carga muestra «Reintentar»; el formulario no permite guardar; «Guardar» desactivado mientras no haya catálogo disponible. |
| RF-24 | Temática seleccionada eliminada antes de guardar: error y no se guarda. |
| RF-25 | Cerrar tras crear temáticas muestra el aviso con sus nombres por Cancelar, «×» o Escape; guardar no lo muestra; Escape con el alta inline abierta cierra solo el campo. |
| RF-26 | La cabecera muestra «Temáticas» y abre el gestor. |
| RF-27 | Gestor ordenado con alta, renombrar y eliminar; el listado no muestra el número de clases; Escape cancela solo el renombrado. |
| RF-28 | Crear desde el gestor o desde el formulario deja la temática disponible sin recargar la app; `createTheme` refresca el contexto. |
| RF-29 | Filtro del historial con todas las temáticas ordenadas; seleccionar filtra; el texto busca solo en observaciones; `themeId` repetido responde 400. |
| RF-30 | Eliminar la temática elegida en el filtro limpia `from`, `to`, `q` y `themeId` y muestra todo el historial. |
| RF-31 | Los filtros de fecha y sus validaciones siguen funcionando. |
| RF-32 | Estadísticas agrupan por `themeId` y muestran el nombre actual; un renombrado se refleja. |
| RF-33 | Historial, clase más larga y estadísticas muestran el nombre actual del catálogo. |
| RF-34 | `validateStoredData` no escribe ni siembra con archivos ausentes; los repositorios devuelven listas vacías. |
| RF-35 | `SeedPrompt` aparece al cargar con el listado de clases vacío; no aparece con datos, en carga o con error. |
| RF-36 | `seedService.apply` crea temáticas y clases, reutiliza temáticas existentes por nombre normalizado y la UI refresca sin recargar. |
| RF-37 | Rechazar, cerrar con «×» o Escape no llama a la API y oculta el diálogo; al recargar con la aplicación vacía vuelve a aparecer. |
| RF-38 | Fallo de `POST /api/seed`: el diálogo muestra el error y permite reintentar; no quedan clases a medias ni temáticas duplicadas. |
| RF-39 | Con al menos una clase, `POST /api/seed` responde 409 y la UI no ofrece el diálogo. |
| RF-40 | `validateStoredData` falla con `title` antiguo, `themeId` ausente o inexistente y no sobrescribe. |
| Transversal | `Modal` con dos modales abiertos: solo el superior maneja `Escape` y `Tab`; el inferior no roba el foco. |

## Orden de implementación

1. `domain-themes` + `THEME_NAME_MAX` + tests de normalización y orden.
2. Contrato (`Theme`, `Session`, `Subject`, `LongestClass`) + tests de contrato.
3. `fileStore` con rutas y `createFileStore`; repositorio de temáticas; tests.
4. Repositorio de sesiones sin semilla y con `insertMany` y operaciones de reasignación/borrado; tests.
5. `validateStoredData` (integridad sin migración) y `server.js`; tests de datos válidos, `title` antiguo, `themeId` inválido y no escritura.
6. Semilla en `seed/seed.js`, `seed.service.js`, `seed.routes.js`, `insertMany` y `POST /api/seed`; tests de semilla condicionada, reutilización de temáticas, 409 y reintento.
7. Servicio y rutas de temáticas; tests de servicio y HTTP.
8. Servicio de sesiones con `themeId`, `themeName`, filtro y búsqueda en notas; tests.
9. Estadísticas por `themeId`; tests.
10. Capa de datos del frontend (`themes.api`, `seed.api`, `useThemes`, `DataRefreshContext`) y tests.
11. `Modal` con pila y tests; después UI de temáticas (`ThemeSelect`, `ThemesDialog`, `DeleteThemeDialog`, `CreatedThemesNotice`) y `SeedPrompt` con tests.
12. Integración en `App`, `SessionForm`, historial, filas y estadísticas; tests.
13. Documentación (`README`, `AGENTS`, `MEMORY`, `DEUDA_TECNICA`), `npm test`, `npm run lint`, mutación y comprobación manual a 375 px.

## Rollback

- La feature se entrega en commits por área; para revertirla, aplicar `git revert` de esos commits en orden inverso. Nunca usar `git checkout -- <carpeta>`: se llevarían por delante cambios buenos.
- Los datos de `backend/data/` son de muestra y no se migran. Antes de volver al código anterior, parar el servidor, hacer copia de `backend/data/` si hubiera datos reales y borrar `sessions.json` y `themes.json`; el arranque antiguo no entiende el formato nuevo.
- Revertir frontend y backend juntos: el frontend anterior espera `title` y el backend nuevo devuelve `themeId` y `themeName`, así que mezclar versiones falla al leer las clases.
- No hay migraciones, servicios externos ni cambios irreversibles: el rollback se limita a código y a los dos JSON locales.

## Fuera de alcance

Lo indicado en la spec: fusionar temáticas, colores/iconos/orden manual/metas, deshacer borrados, auditoría, roles o multiusuario, importación/exportación, búsqueda o paginación en el selector, renombrado concurrente entre pestañas, cambios en las reglas de duración, fecha u observaciones, migración de datos del formato anterior y recuerdo del rechazo de los datos de ejemplo. Este plan no introduce alcance nuevo.
