# Plan 007 — Orquestación de la aplicación: pestañas en la URL, capas y fecha legible

> Spec: specs/007-orquestacion-app/spec.md
> Estado: aprobado (2026-11-17)

## Contexto técnico

La pestaña activa es un `useState('home')` dentro de `App.jsx`; no hay router ni dependencia de
enrutado. `App.jsx` también importa `sessionsApi` y ejecuta `create`, `update` y `remove`, además de
mantener `deleting` y `deleteError`; las lecturas ya viven en hooks (`useSessions`, `useStats`,
`useThemes`) y el refresco se coordina con `DataRefreshContext`. El mensaje de borrado interpola
`toDelete.date` sin formatear.

Los tests de frontend son Vitest + jsdom + Testing Library, sin `globals`, y `frontend/test/setup.js`
solo registra el cleanup. `App.test.jsx` mockea los módulos `*.api.js`, así que el nuevo hook de
mutaciones podrá probarse sin red. No hay dependencias nuevas previstas.

## Enfoque

### 1. Módulo de navegación (RF-1, RF-5 a RF-8)

Crear `frontend/src/navigation/tabs.js` como fuente única de las pestañas:

```js
export const TABS = [
  { id: 'home', label: 'Inicio', path: '#/inicio' },
  { id: 'history', label: 'Historial', path: '#/historial' },
  { id: 'stats', label: 'Estadísticas', path: '#/estadisticas' },
];
export const DEFAULT_TAB = 'home';
export function tabFromHash(hash) { /* coincidencia exacta o DEFAULT_TAB */ }
export function pathForTab(id) { /* '#/inicio', ... */ }
```

La comparación es exacta: mayúsculas, barra final, espacios o segmentos extra no coinciden.
`frontend/src/App.jsx` deja de declarar `TABS` y lo importa de aquí.

### 2. Hook de ruta (RF-2, RF-3, RF-4, RF-9)

Crear `frontend/src/navigation/useTabRoute.js`:

```js
const [tab, setTab] = useState(() => tabFromHash(window.location.hash));

useEffect(() => {
  // Normaliza la dirección inicial vacía o desconocida sin añadir entrada.
  const initial = tabFromHash(window.location.hash);
  if (window.location.hash !== pathForTab(initial)) {
    window.history.replaceState(null, '', pathForTab(initial));
  }
  setTab(initial);

  function onHashChange() {
    const next = tabFromHash(window.location.hash);
    if (window.location.hash !== pathForTab(next)) {
      window.history.replaceState(null, '', pathForTab(next));
    }
    setTab(next);
  }
  window.addEventListener('hashchange', onHashChange);
  return () => window.removeEventListener('hashchange', onHashChange);
}, []);

const selectTab = useCallback((id) => {
  const path = pathForTab(id);
  window.location.hash = path; // si ya es la actual, el navegador no hace nada
  setTab(id);                  // URL y estado coinciden en el mismo instante
}, []);
```

- La lectura inicial del hash evita pasar por Inicio en un enlace profundo.
- `replaceState` normaliza sin entrada adicional; Atrás no vuelve al hash desconocido.
- La asignación de `location.hash` crea entrada y permite Atrás/Adelante con `hashchange`.
- Asignar el hash que ya está activo es una operación inocua del navegador (sin entrada ni
  `hashchange`): reelegir la pestaña activa no recarga ni necesita una guarda propia.
- `setTab(id)` actualiza la pestaña en el mismo instante que la URL; el `hashchange` posterior
  vuelve a fijar el mismo valor y no provoca un render extra.
- El hook no conoce diálogos: solo la pestaña. App reacciona al cambio con un efecto.

### 3. Integración en `App` y cierre de diálogos (RF-4, RF-9)

`App.jsx` sustituye `useState('home')` por `useTabRoute()` y pasa `TABS` a `Tabs`. Un efecto sobre
`tab` cierra formulario, diálogo de borrado, gestor de temáticas, aviso de temáticas creadas y error
de mutación:

```js
useEffect(() => {
  setFormState({ open: false, session: null });
  setToDelete(null);
  setThemesOpen(false);
  clearMutationError();
}, [tab, clearMutationError]);
```

No se toca `Tabs.jsx`: sigue recibiendo `tabs`, `active` y `onChange`. Los filtros y periodos no se
consultan ni se escriben en la URL.

### 4. Hook de mutaciones (RF-10 a RF-16)

Crear `frontend/src/sessions/useSessionMutations.js` con el acceso a datos de escritura y su estado:

```js
const { refreshAll } = useDataRefresh();
const [saving, setSaving] = useState(false);
const [deleting, setDeleting] = useState(false);
const [error, setError] = useState('');

async function createSession(payload) {
  setSaving(true); setError('');
  try { const created = await sessionsApi.create(payload); refreshAll(); return created; }
  catch (requestError) { setError(requestError.message); throw requestError; }
  finally { setSaving(false); }
}
// updateSession: igual con sessionsApi.update(id, payload).

async function removeSession(id) {
  setDeleting(true); setError('');
  try { await sessionsApi.remove(id); refreshAll(); return true; }
  catch (requestError) { setError(requestError.message); return false; }
  finally { setDeleting(false); }
}
```

- `create`/`update` **relanzan** el error para que `SessionForm` conserve su mensaje inline actual.
- `remove` devuelve `true`/`false` para que App cierre el diálogo solo si la operación funcionó.
- El hook llama a `refreshAll` y deja de hacerlo `App`.
- `error` y `clearError` son la única fuente del error de borrado y del aviso posterior a una
  navegación.

`App.jsx` queda como orquestador:

```js
const { createSession, updateSession, removeSession, saving, deleting, error, clearError } =
  useSessionMutations();

async function handleSubmit(payload) {
  if (formState.session) await updateSession(formState.session.id, payload);
  else await createSession(payload);
  closeForm();
}

async function handleConfirmDelete() {
  if (!toDelete) return;
  if (await removeSession(toDelete.id)) closeDeleteDialog();
}
```

- `SessionForm` recibe `saving={saving}` (con valor por defecto `false` para no romper a sus
  consumidores actuales) y usa esa prop en lugar de su `useState` local; sigue capturando el rechazo
  de `onSubmit` para mostrar el error inline.
- `ConfirmDialog` recibe `busy={deleting}` y `error={error}`.
- Al abrir un formulario o un borrado se limpia `error` para no arrastrar un mensaje anterior.
- `{error && !formState.open && !toDelete && !themesOpen && <StatusNotice>{error}</StatusNotice>}`
  dentro de `<main>` cubre RF-16: si la escritura falla después de que la navegación cerrara el
  diálogo, el error se anuncia como aviso visible. Mientras hay diálogo abierto (incluido el gestor
  de temáticas), el aviso global se suprime para no duplicarlo ni mostrarlo fuera de contexto; al
  cerrar el gestor, el aviso vuelve a mostrarse porque el error no se borra.

### 5. Mensaje de borrado con fecha legible (RF-17, RF-18)

Crear `frontend/src/sessions/deleteMessage.js`:

```js
export function buildDeleteMessage(session) {
  if (!session) return '';
  const date = formatDateLong(session.date);
  const datePart = date ? ` del ${date}` : '';
  return `¿Seguro que quieres eliminar la clase de "${session.themeName}"${datePart}? Esta acción no se puede deshacer.`;
}
```

`App.jsx` pasa `message={toDelete ? buildDeleteMessage(toDelete) : ''}`. Se reutiliza
`formatDateLong`; si devuelve cadena vacía, la fecha se omite y nunca se muestra `AAAA-MM-DD`.

### 6. Tests y aislamiento del hash

- `frontend/test/setup.js`: tras cada test, restaurar la dirección a `/` con
  `window.history.replaceState(null, '', '/')` para que el hash de un test no contamine al siguiente.
- Tests nuevos por módulo, en espejo de `src/`:
  - `test/navigation/tabs.test.js` (funciones puras).
  - `test/navigation/useTabRoute.test.jsx` (`renderHook`, `hashchange`, historial relativo).
  - `test/sessions/useSessionMutations.test.jsx` (éxito, error, flags y refresco con un componente
    sonda que lee `versions`).
  - `test/sessions/deleteMessage.test.js`.
- `test/App.test.jsx`: integración de direcciones, cierre de diálogos al navegar, aviso posterior a
  una escritura fallida, formato de fecha, mocks de `create`/`update` y RF-9: cambiar un filtro del
  historial y un periodo de estadísticas sin que cambie el hash, y comprobar que al remontar la
  vista los filtros vuelven a su estado inicial.
- `test/sessions/SessionForm.test.jsx`: cubrir `saving` como prop («Guardando…» y controles
  deshabilitados).

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `frontend/src/navigation/tabs.js` | Nuevo: pestañas, rutas y resolución del hash. |
| `frontend/src/navigation/useTabRoute.js` | Nuevo: estado de pestaña sincronizado con la URL. |
| `frontend/src/sessions/useSessionMutations.js` | Nuevo: escrituras, flags, error y refresco. |
| `frontend/src/sessions/deleteMessage.js` | Nuevo: mensaje de borrado con fecha legible. |
| `frontend/src/App.jsx` | Usa ruta, mutaciones, mensaje y aviso; cierra diálogos al navegar. |
| `frontend/src/sessions/SessionForm.jsx` | `saving` pasa a ser prop; elimina el estado local duplicado. |
| `frontend/test/setup.js` | Restaura el hash después de cada test. |
| `frontend/test/navigation/tabs.test.js` | Nuevo: rutas válidas, vacías y desconocidas. |
| `frontend/test/navigation/useTabRoute.test.jsx` | Nuevo: inicial, selección, reelegir, atrás/adelante. |
| `frontend/test/sessions/useSessionMutations.test.jsx` | Nuevo: éxito, error, flags y refresco. |
| `frontend/test/sessions/deleteMessage.test.js` | Nuevo: fecha larga y fecha omitida. |
| `frontend/test/App.test.jsx` | Direcciones, cierre de diálogos, aviso y mensaje de borrado. |
| `frontend/test/sessions/SessionForm.test.jsx` | Estado de guardado como prop. |
| `README.md` | Funcionalidades y direcciones de pestaña. |
| `AGENTS.md` | Estructura: `navigation/`, hook de mutaciones y mensaje de borrado. |
| `MEMORY.md` | Resumen de la feature y estado de la deuda. |
| `DEUDA_TECNICA.md` | B6-3, B6-4 y B6-5 resueltos; recuento actualizado. |

## Decisiones y alternativas

- **Hash sin dependencias.** Cumple B6-3 sin tocar el servidor ni añadir `react-router`; tres
  pestañas no justifican una dependencia. Alternativa descartada: rutas con pathname (exige fallback
  del servidor y complica el desarrollo local) y React Router (dependencia nueva).
- **Módulo de navegación separado del componente.** Permite probar la resolución de direcciones como
  función pura y deja `App` como orquestador. Alternativa descartada: `useState` + `useEffect` dentro
  de `App` (más difícil de probar y mezcla responsabilidades).
- **Hook de mutaciones, no contexto global.** Un solo consumidor (`App`) y un solo ciclo de vida;
  añadir un provider sería ceremonia sin beneficio. Alternativa descartada: contexto de mutaciones.
- **`create`/`update` relanzan; `remove` devuelve booleano.** Conserva el mensaje inline del
  formulario y permite que el diálogo solo se cierre tras un borrado correcto. Alternativa
  descartada: tragar todos los errores en el hook (perdería el detalle en el formulario).
- **`StatusNotice` reutilizado para RF-16.** Ya existe, es accesible (`role="status"`) y evita un
  sistema de toasts. Alternativa descartada: aviso global nuevo con temporizador.
- **Reutilizar `formatDateLong`.** Coherencia con el resto de la interfaz y sin formateadores nuevos.
  Alternativa descartada: formato completo nuevo solo para el diálogo.

## Riesgos

- **El hash persiste entre tests de jsdom.** Mitigación: restaurarlo en `setup.js` y comprobar la
  suite completa.
- **`history.back()` en jsdom puede no disparar eventos como un navegador real.** Mitigación: probar
  el listener con `hashchange` y verificar Atrás/Adelante de verdad en Chrome DevTools.
- **Duplicar el error entre formulario y aviso global.** Mitigación: suprimir el aviso mientras hay
  diálogo abierto y limpiar el error al abrir/cerrar.
- **Carrera entre navegación y escritura en curso.** Mitigación: RF-16 y test con promesa diferida
  que rechaza después de cambiar el hash.
- **Regresión del estado de guardado al moverlo a una prop.** Mitigación: mantener los tests
  existentes de `SessionForm` y añadir uno específico de `saving`.
- **Doble efecto de `StrictMode` al normalizar la URL.** Mitigación: normalización idempotente con
  `replaceState` y comparación previa.

## Verificación contra la constitución

- **Principio 1:** sin dependencias nuevas ni cambios en `package.json`; no hace falta `npm outdated`.
- **Principio 2:** spec aprobada antes del código; RF-1 a RF-18 con criterio de verificación.
- **Principio 3:** navegación y mutaciones salen de `App`; HTTP en `*.api.js`, estado en hooks y UI en
  componentes.
- **Principio 4:** test antes del cambio en cada tarea, `npm test` y `npm run lint` en verde y
  mutación por regla nueva.
- **Principio 5:** sin cambios de datos, almacenamiento ni secretos; no se toca `backend/data`.
- **Principio 6:** textos en español, direcciones con palabras visibles sin tildes, identificadores y
  código en inglés.

## Plan de pruebas (RF → test)

| RF | Caso | Test |
|---|---|---|
| RF-1 | Cada pestaña tiene su dirección. | `test/navigation/tabs.test.js` |
| RF-2 | Elegir otra pestaña añade entrada; reelegir la activa no. | `test/navigation/useTabRoute.test.jsx` |
| RF-3 | Hash válido abre esa pestaña al montar. | `test/navigation/useTabRoute.test.jsx` y `test/App.test.jsx` |
| RF-4 | `hashchange` cambia pestaña y cierra diálogos. | `test/navigation/useTabRoute.test.jsx` y `test/App.test.jsx` |
| RF-5 | Hash vacío o `#/` normaliza a Inicio sin entrada extra. | `test/navigation/useTabRoute.test.jsx` |
| RF-6 | Hash desconocido normaliza a Inicio. | `test/navigation/useTabRoute.test.jsx` |
| RF-7 | Enlace directo a Historial/Estadísticas. | `test/App.test.jsx` |
| RF-8 | Pestaña marcada, contenido y dirección coinciden. | `test/navigation/useTabRoute.test.jsx` |
| RF-9 | Filtros y periodo no cambian la dirección; al remontar vuelven al estado inicial. | `test/App.test.jsx` |
| RF-10 | Guardar crea/edita y refresca. | `test/sessions/useSessionMutations.test.jsx` y `test/App.test.jsx` |
| RF-11 | Error al guardar mantiene el formulario y el mensaje. | `test/sessions/useSessionMutations.test.jsx` y `test/App.test.jsx` |
| RF-12 | Borrar cierra el diálogo y refresca. | `test/App.test.jsx` |
| RF-13 | Error al borrar mantiene el diálogo y permite reintentar. | `test/App.test.jsx` |
| RF-14 | «Guardando…»/«Eliminando…» y controles deshabilitados. | `test/sessions/useSessionMutations.test.jsx`, `test/sessions/SessionForm.test.jsx` y `test/App.test.jsx` |
| RF-15 | La vista contenedora solo orquesta; escrituras en un punto. | Revisión estructural: `App` sin llamadas de escritura y `sessionsApi.create`/`update`/`remove` solo en `useSessionMutations`. |
| RF-16 | Escritura que falla tras navegar muestra aviso. | `test/App.test.jsx` |
| RF-17 | Fecha de borrado en formato largo. | `test/sessions/deleteMessage.test.js` y `test/App.test.jsx` |
| RF-18 | Fecha no interpretable se omite. | `test/sessions/deleteMessage.test.js` |

## Orden de implementación

1. `tabs.js` y sus tests puros (RF-1).
2. `useTabRoute` y sus tests (RF-2 a RF-8); integrar en `App`, actualizar `setup.js` y los tests de
   `App` (RF-3, RF-7, RF-9).
3. `useSessionMutations` y sus tests (RF-10, RF-11, RF-14); refactorizar `App` y `SessionForm`.
4. `deleteMessage` y sus tests (RF-17, RF-18); integrar en `App`.
5. Efecto de cierre de diálogos al navegar y aviso de RF-16 con test de promesa diferida.
6. Revisión estructural de RF-15 (la vista contenedora no contiene llamadas de escritura y
   `sessionsApi.create`/`update`/`remove` solo aparecen en el hook), documentación, deuda y memoria;
   suite completa, lint, mutación y comprobación manual en Chrome DevTools a 375 px.

Cada paso revierte archivo por archivo si algo falla; no hay cambios de datos ni de backend que
deshacer.

## Fuera de alcance

El de la spec: filtros y periodos en la URL, recordar la última pestaña, router o pathname, rutas
anidadas, conservar estado entre pestañas, cambios de negocio/API y cambios de formato de fecha fuera
del diálogo de borrado.
