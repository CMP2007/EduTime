# Registro de deuda técnica — StudyTrack

Registro global de debilidades detectadas durante la revisión de calidad del proyecto. Se organiza **por secciones (bloques) de la explicación**: cada bloque aporta sus hallazgos. La mayoría sigue **pendiente**; los marcados como `resuelto` ya se corrigieron (ver `MEMORY.md`).

> **Registro histórico.** No se añaden ítems nuevos: el trabajo futuro se planifica con specs. Se actualiza solo para cambiar el estado de ítems existentes.

- **Estados:** `pendiente` · `en curso` · `resuelto`.
- **Severidad:** `baja` · `media` · `alta`.
- **IDs:** `B<n>-<m>` = bloque `n`, hallazgo `m` (estables aunque se reordene el resumen).
- **Referencias de código:** citar `archivo` + símbolo (función, constante…), no números de línea: se pudren con cada cambio (verificado al limpiar este archivo).

## Índice

- [Resumen por bloque](#resumen-por-bloque)
- [Bloque 0 — Mapa general y arquitectura](#bloque-0--mapa-general-y-arquitectura) ([deuda/bloque_0.md](deuda/bloque_0.md))
- [Bloque 1 — Cimientos y configuración](#bloque-1--cimientos-y-configuración) ([deuda/bloque_1.md](deuda/bloque_1.md))
- [Bloque 2 — Backend: arranque y composición](#bloque-2--backend-arranque-y-composición) ([deuda/bloque_2.md](deuda/bloque_2.md))
- [Bloque 3 — Backend: persistencia y tiempo](#bloque-3--backend-persistencia-y-tiempo) ([deuda/bloque_3.md](deuda/bloque_3.md))
- [Bloque 4 — Backend: dominio de sesiones](#bloque-4--backend-dominio-de-sesiones) ([deuda/bloque_4.md](deuda/bloque_4.md))
- [Bloque 5 — Backend: dominio de estadísticas](#bloque-5--backend-dominio-de-estadísticas) ([deuda/bloque_5.md](deuda/bloque_5.md))
- [Bloque 6 — Frontend: arranque y orquestación](#bloque-6--frontend-arranque-y-orquestación) ([deuda/bloque_6.md](deuda/bloque_6.md))
- [Bloque 7 — Frontend: red y datos](#bloque-7--frontend-red-y-datos) ([deuda/bloque_7.md](deuda/bloque_7.md))
- [Bloque 8 — Frontend: utilidades y componentes base](#bloque-8--frontend-utilidades-y-componentes-base) ([deuda/bloque_8.md](deuda/bloque_8.md))
- [Bloque 9 — Frontend: feature Historial](#bloque-9--frontend-feature-historial) ([deuda/bloque_9.md](deuda/bloque_9.md))
- [Bloque 10 — Frontend: feature Inicio/Estadísticas](#bloque-10--frontend-feature-inicioestadísticas) ([deuda/bloque_10.md](deuda/bloque_10.md))
- [Bloque 11 — Frontend: estilos](#bloque-11--frontend-estilos) ([deuda/bloque_11.md](deuda/bloque_11.md))
- [Bloque 12 — Veredicto transversal](#bloque-12--veredicto-transversal) ([deuda/bloque_12.md](deuda/bloque_12.md))
- [Prioridad global y orden sugerido](#prioridad-global-y-orden-sugerido)

## Resumen por bloque

### Bloque 0 — Mapa general y arquitectura

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B0-1 | Constantes de dominio duplicadas entre backend y frontend | Media | resuelto |
| B0-2 | Sin tests ni linter configurado | Alta | resuelto |
| B0-3 | Persistencia acoplada al proceso (condiciones de carrera) | Media-Alta | resuelto |
| B0-4 | `README.md` desincronizado con la regla real de racha | Baja | resuelto |
| B0-5 | Patrón `version` / refresh por props (invalidación gruesa) | Media | resuelto |
| B0-6 | Sin TypeScript ni validación del contrato de datos | Media-Alta | resuelto |
| B0-7 | Sin tests de frontend ni E2E (requisito de culminación) | Alta | en curso |

### Bloque 1 — Cimientos y configuración

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B1-1 | Falta `"engines"` (versión de Node) en los `package.json` | Baja-Media | resuelto |
| B1-2 | Sin scripts de `test`/`lint` en los paquetes (refuerza B0-2) | Baja | resuelto |
| B1-3 | Proxy de Vite acoplado al puerto `3001` del backend | Baja | resuelto |
| B1-4 | `.gitignore` con entradas redundantes de `node_modules` | Trivial | resuelto |
| B1-5 | Estructura/funcionalidades duplicadas: `README.md` vs `AGENTS.md` | Baja | resuelto |
| B1-6 | Configuración de red permisiva (`cors()` abierto + `--host 0.0.0.0`) | Baja | **resuelto (003)** |
| B1-7 | El proxy de Vite no se usa: la URL por defecto de la API es absoluta | Baja | **resuelto (003)** |
| B1-8 | Dependencias con vulnerabilidades conocidas (`esbuild`/`vite`) | Media | resuelto |
| B1-9 | Mayores de dependencias pendientes (`react` 19, `express` 5, `concurrently` 10) | Media | resuelto |
| B1-10 | El proxy de Vite no lee `.env` (solo shell); falta `loadEnv` para configurar el destino desde archivo | Baja | **resuelto (003)** |
| B1-11 | Bind del backend a todas las interfaces (`*:3001`) | Baja | **resuelto (003)** |

### Bloque 2 — Backend: arranque y composición

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B2-1 | JSON malformado responde 500 en lugar de 400 | Media | resuelto |
| B2-2 | `app.js` acoplado a `ValidationError` de sessions | Baja-Media | resuelto |
| B2-3 | Boilerplate de `try/catch` en cada ruta | Baja | resuelto |
| B2-4 | Sin logging de peticiones/errores | Baja | resuelto |

### Bloque 3 — Backend: persistencia y tiempo

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B3-1 | Fichero JSON corrupto se trata como vacío (riesgo de pérdida de datos) | Media-Alta | resuelto |
| B3-2 | `fromDateString` no valida la entrada (fechas `NaN` silenciosas) | Baja | resuelto |
| B3-3 | `enumerateDays` trunca en silencio a 4000 días (número mágico) | Baja | resuelto |
| B3-4 | Periodos inválidos degradan en silencio a `week` | Baja | resuelto |

### Bloque 4 — Backend: dominio de sesiones

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B4-1 | `sessionsService.getById` sin usar (código muerto) | Baja | resuelto |
| B4-2 | Update parcial de duración exige horas y minutos juntos | Baja-Media | **resuelto (005)** |
| B4-3 | `clone` superficial en el repositorio | Baja | resuelto |
| B4-4 | Filtros `from`/`to` sin validar | Baja | resuelto |
| B4-5 | El seed se persiste sin pasar por la validación del servicio | Baja | resuelto |

### Bloque 5 — Backend: dominio de estadísticas

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B5-1 | Sin tests en la lógica crítica de estadísticas | Alta | resuelto |
| B5-2 | Agrupación por temática por título exacto (sin normalizar) | Baja | resuelto |
| B5-3 | Racha recalculada en cada petición (sin caché) | Baja | resuelto |
| B5-4 | Meta diaria fija (180) y duplicada backend/frontend | Baja | resuelto |

### Bloque 6 — Frontend: arranque y orquestación

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B6-1 | Sin Error Boundary (un error deja la pantalla en blanco) | Media | resuelto |
| B6-2 | Error de borrado no gestionado (se traga el fallo) | Media | resuelto |
| B6-3 | Sin enrutado/URL (recargar siempre vuelve a Inicio) | Baja | resuelto |
| B6-4 | `App` accede a la API directamente (mezcla capas) | Baja | resuelto |
| B6-5 | Fecha cruda `YYYY-MM-DD` en el diálogo de borrado | Baja | resuelto |
| B6-6 | Sin test del reintento tras un error de guardado o borrado (RF-11 y RF-13) | Baja | resuelto |

### Bloque 7 — Frontend: red y datos

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B7-1 | `request` pierde el código de estado HTTP | Media | resuelto |
| B7-2 | Sin cancelación ni orden de respuestas (race en los hooks) | Baja-Media | resuelto |
| B7-3 | Merge de cabeceras frágil (`Content-Type` se puede borrar) | Baja | resuelto |
| B7-4 | `Content-Type` enviado también en peticiones `GET` | Muy baja | resuelto |

### Bloque 8 — Frontend: utilidades y componentes base

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B8-1 | Formateadores de fecha sin validar (producen `Invalid Date`) | Baja-Media | resuelto |
| B8-2 | `Modal` sin focus trap, sin restaurar foco ni bloquear scroll | Media | resuelto |
| B8-3 | `goalProgress` sin límite inferior (acepta negativos) | Baja | resuelto |
| B8-4 | Lógica "lunes = 0" duplicada (`formatDateLong` vs `weekdayIndex`) | Baja | resuelto |
| B8-5 | `combineDuration` convierte valores inválidos en `0` en silencio | Muy baja | **resuelto (008)** |

### Bloque 9 — Frontend: feature Historial

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B9-1 | Validación de dominio duplicada en `SessionForm` (refuerza B0-1) | Baja-Media | resuelto |
| B9-2 | Búsqueda sin `debounce` (una petición por pulsación) | Media | resuelto |
| B9-3 | Límite de duración: el mensaje del backend dice "23 h" pero admite 23h59; el cliente solo valida el mínimo en JS | Baja | **resuelto (008)** |
| B9-4 | Mensajes de error del formulario sin rol accesible | Baja | **resuelto (008)** |
| B9-5 | Filtros `from`/`to` sin comprobar rango invertido | Baja | resuelto |
| B9-6 | `Number(...) || 0` enmascara entradas inválidas del formulario | Muy baja | **resuelto (008)** |

### Bloque 10 — Frontend: feature Inicio/Estadísticas

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B10-1 | `StatsPanel` refiltra el periodo en cliente y carga todas las clases | Media | resuelto |
| B10-2 | `PERIOD_OPTIONS` duplica `PERIODS` del backend (refuerza B0-1) | Baja | resuelto |
| B10-3 | Umbrales del heatmap (`level`) hardcodeados sin documentar | Baja | resuelto |
| B10-4 | `buildColumns` asume serie contigua y no rellena la última semana | Baja | resuelto |
| B10-5 | Tarjetas con `?? 0` silencian cambios de forma del contrato | Baja | resuelto |
| B10-6 | El error/estado de `useSessions` en `StatsPanel` no se muestra | Baja-Media | resuelto |

### Bloque 11 — Frontend: estilos

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B11-1 | Colores hardcodeados mezclados con variables CSS | Baja | resuelto |
| B11-2 | Estilos de elemento globales (`input/select/textarea`) con posible fuga | Baja | resuelto |
| B11-3 | `styles.css` monolítico (771 líneas) frente a "un archivo por responsabilidad" | Baja-Media | resuelto |
| B11-4 | Sin `:focus-visible` ni `prefers-reduced-motion` | Baja | pendiente |
| B11-5 | Valores mágicos de layout (`z-index`, anchos fijos) sin tokens | Baja | pendiente |
| B11-6 | `textarea { resize: none }` quita el control de redimensionado | Muy baja | pendiente |
| B11-7 | Barra de pestañas con overflow horizontal a 375 px | Baja | resuelto |
| B11-8 | El campo de duración del formulario desborda su contenedor a 375 px | Baja | pendiente |

---

## Prioridad global y orden sugerido

### B0-7 · Sin tests de frontend ni E2E (requisito de culminación)

**Prioridad:** *Crítica*

Los tests de frontend ya existen; lo que falta es la capa de extremo a extremo. El **anuncio real
con lector de pantalla** de los errores del formulario de clases (spec `008`, asociación
`aria-describedby`, `aria-invalid` y rol de alerta) se comprobará en esa capa, todavía pendiente;
los tests unitarios de la feature verifican el rol, la asociación y el estado.

### B1-1, B1-10, B1-11 · Fijación de host/puerto, proxy y entorno

**Prioridad:** *Alta* (la Red proxy/cors está ya en `specs/003-red-proxy-cors/`).

### B3-2, B3-3 · Validación y límites de fecha/tiempo

**Resueltos (2026-11-10)** en `specs/004-validacion-fechas/`: paquete compartido
`packages/domain-dates` (`isValidDateString` con fecha real y rango 1990–9999,
`compareDateStrings` por tupla, `MAX_RANGE_DAYS`), `fromDateString` lanza `RangeError` y
`enumerateDays` rechaza más de 4000 días. Evidencia: `domain-dates` (12 tests),
`backend/test/date.test.js` y `backend/test/app.test.js`.

### B4-2 · Update parcial de duración

**Resuelto (2026-11-10)** en `specs/005-duracion-parcial-sesiones/`: `POST`/`PUT` aceptan horas y
minutos juntos o por separado (la parte ausente vale 0); `PUT` sin duración conserva y ajusta a
15–1439; `durationMinutes` directo se ignora. Evidencia: `backend/test/sessions.service.test.js`
y `backend/test/app.test.js`.

### B4-3, B4-5 · Copia profunda y validación del seed

**B4-3 resuelto (2026-11-10):** el repositorio de sesiones usa `structuredClone` en los bordes
(salida de `findAll`/`findById` y entrada de `insert`/`update`), así que ninguna estructura
anidada se comparte con el exterior. Evidencia: `backend/test/sessions.repository.test.js`
(tres tests de aislamiento con un campo anidado de ejemplo, verificados con mutación). Refactor
sin cambio observable (el modelo actual solo tiene campos primitivos): no requiere spec.

**B4-1 resuelto (2026-11-10):** se eliminó `sessionsService.getById`, que no tenía consumidor
(no existe `GET /api/sessions/:id` y `update` usa `sessionsRepository.findById` directamente).
Es un refactor sin cambio observable, por lo que no requiere spec ni test nuevo; la suite
existente lo verifica.

**B4-5 resuelto (2026-11-10):** la validación de campos se extrajo a
`sessions.validation.js` (`validateSessionInput`), que usan tanto el servicio como
`buildSeed`. La semilla se valida entrada por entrada antes de que el repositorio la escriba:
si una entrada deja de cumplir las reglas, el arranque falla en vez de persistir datos
inválidos. Evidencia: `backend/test/seed.test.js` (tres tests, verificados con mutación).
Refactor defensivo sin cambio observable: no requiere spec.

**Prioridad:** *Media* (invariante).

### B5-2, B5-3, B5-4 · Normalización, caché y fuente única de períodos/constantes

**Prioridad:** *Media* (evitar divergencias).

**B5-2 resuelto (2026-11-13):** el catálogo de temáticas (`specs/006-catalogo-tematicas/`) da a cada
temática un identificador estable y un nombre único; las clases se asocian por `themeId` y las
estadísticas agrupan por ese identificador, no por texto. La comparación de nombres ignora
espacios de los extremos, mayúsculas y tildes (`packages/domain-themes`), y un renombrado se
refleja en historial y estadísticas sin recalcular horas.

**B5-3 resuelto (2026-11-15):** `stats.service.js` memoiza la racha con `createStreakMemo`, cuya
clave es «día de referencia + fechas con meta»: dos peticiones idénticas reutilizan el resultado
y cualquier cambio de datos o de día fuerza el recálculo, sin invalidación explícita ni acoplar
las estadísticas a la cola de escrituras. Medido con 3650 clases: de ~9 ms a ~1,5 ms por
petición. Evidencia: `backend/test/stats.service.test.js` (tres tests del memo y uno de
integración, verificados con mutación).

**B5-4 resuelto (2026-11-15):** `GOAL_MINUTES` tiene una sola definición, en
`packages/domain-constants/index.js`; el backend (`stats.service.js`) y el frontend
(`utils/time.js`) la importan de `domain-constants` desde el refactor `46c0d4c` (2026-10-27), el
mismo que cerró B0-1. No queda ninguna copia en el frontend. Sin cambios de código: lo cubre la
suite existente (`backend/test/stats.service.test.js` y `frontend/test/utils/time.test.js`). La
meta sigue siendo fija (180 min); hacerla configurable sería funcionalidad nueva y no forma parte
de esta deuda.

### B6-3, B6-4, B6-5 · Router, separación de capas y formato del diálogo de borrado

**Prioridad:** *Media* (experiencia de usuario).

**Resuelto (2026-11-17)** en `specs/007-orquestacion-app/`:

- **B6-3**: cada pestaña tiene dirección propia (`#/inicio`, `#/historial`, `#/estadisticas`), con
  lectura inicial del hash, normalización sin entrada extra para direcciones vacías o desconocidas y
  Atrás/Adelante sincronizados. Evidencia: `frontend/test/navigation/tabs.test.js`,
  `frontend/test/navigation/useTabRoute.test.jsx` y `frontend/test/App.test.jsx`.
- **B6-4**: las escrituras de clases viven en `useSessionMutations` (HTTP, estado y refresco); `App`
  solo orquesta pestaña, diálogos y avisos. Evidencia estructural: `App` no importa `sessionsApi` ni
  `useDataRefresh`, y `sessionsApi.create`/`update`/`remove` solo aparece en el hook. Cubierto por
  `frontend/test/sessions/useSessionMutations.test.jsx` y los tests de guardado de `App`.
- **B6-5**: el diálogo de borrado usa `buildDeleteMessage` con `formatDateLong` y omite la fecha si
  no se puede interpretar. Evidencia: `frontend/test/sessions/deleteMessage.test.js` y
  `frontend/test/App.test.jsx`.

**B6-6 resuelto (2026-11-18):** `frontend/test/App.test.jsx` añade dos casos de reintento: el
guardado falla una vez, el formulario sigue abierto con el mensaje y los controles habilitados, y
el segundo envío persiste y cierra el formulario; el borrado falla una vez, el diálogo sigue
abierto y el segundo intento elimina, cierra y limpia el error. Evidencia: los dos casos nuevos de
`frontend/test/App.test.jsx`, verificados por mutación (`if (error) return` en `SessionForm` y
`if (mutationError) return` en `App` hacen fallar el caso correspondiente). Su cobertura cierra el
«reintentar» de RF-11 y RF-13, sin cambio de comportamiento ni spec nueva.

### B7-2, B7-3, B7-4 · Race de peticiones, fusión de cabeceras y Content-Type en GET

**Prioridad:** *Media* (conexión robusta).

**B7-2 parcialmente resuelto (2026-11-17):** los tres hooks (`useSessions`, `useStats` y
`useThemes`) descartan las respuestas fuera de orden con `requestIdRef`; la guarda queda cubierta
por `frontend/test/sessions/useSessions.test.jsx` (verificada por mutación). Sigue pendiente la
**cancelación** de la petición en vuelo (`AbortController`), que se abordará junto con B7-3 y
B7-4 en la spec de red.

**B7-2 resuelto (2026-11-18):** los tres hooks de lectura cancelan la petición en vuelo al
recargar (incluido el reintento manual) y al desmontar mediante un `AbortController` por hook; el
`signal` viaja por `sessions.api.js`, `stats.api.js` y `themes.api.js` hasta `request`, y `request`
relanza un abort en vez de disfrazarlo de error de red (en `useThemes`, cerrar el consumidor con
una petición en vuelo ya no deja el mensaje inglés del abort). Evidencia: 20 tests nuevos en
`frontend/test/api/client.test.js`, los tres `*.api.test.js`, `useSessions.test.jsx`,
`useStats.test.jsx` (archivo nuevo) y `useThemes.test.jsx`; 11 mutaciones comprobadas (una por
regla, todas detectadas).

**B7-3 y B7-4 resueltos (2026-11-18):** `request` desestructura las `headers` del llamador y las
fusiona con el valor por defecto, de modo que un llamador puede añadir cabeceras propias o
sobrescribir `Content-Type` sin que se pierda el valor JSON; la cabecera solo se añade cuando hay
`body` (`!== undefined` y `!== null`), así que las lecturas (`GET`) y los `DELETE` sin cuerpo dejan
de enviarla, mientras que el `DELETE` de temáticas con estrategia (que sí lleva cuerpo) la
conserva. `method`, `body` y `signal` siguen llegando íntegros a `fetch`. Evidencia:
`frontend/test/api/client.test.js` (cinco casos nuevos: fusión, sobrescritura, `GET` sin cuerpo,
`DELETE` con cuerpo y conservación del resto de opciones), verificado por mutación (con el
`client.js` anterior fallan 3 de los 13 casos del archivo). Refactor sin cambio observable: no
requiere spec.

### B8-1, B8-3, B8-4, B8-5 · Validación de formateadores, límites inferiores, lógica duplicada y silenciamiento de inválidos

**B8-1 resuelto (2026-11-10)** en `specs/004-validacion-fechas/`: `fromDateString` del frontend
devuelve `null`, los formateadores devuelven `''` y `weekdayIndex` devuelve `null` con fechas
inválidas; `ActivityHeatmap` omite los días inválidos. Evidencia: `frontend/test/utils/date.test.js`
y `frontend/test/stats/ActivityHeatmap.test.jsx`.

**B8-4 resuelto (2026-11-18):** la regla «lunes = 0» tiene una sola definición en
`frontend/src/utils/date.js`: el helper interno `weekdayIndexFromDate` calcula
`(date.getDay() + 6) % 7` y lo usan tanto `formatDateLong` como `weekdayIndex`. Evidencia:
`frontend/test/utils/date.test.js` (test de coherencia entre ambas funciones), verificado por
mutación (con `date.getDay() % 7` fallan los tests de `formatDateLong` y de `weekdayIndex`).
Refactor sin cambio observable: no requiere spec.

**B8-3 resuelto (2026-11-18):** `goalProgress` aplica el límite inferior además del superior
(`Math.max(0, Math.min(100, …))`), de modo que unos minutos negativos no generan un porcentaje
negativo en `aria-valuenow` ni en el ancho de la barra de progreso. Evidencia:
`frontend/test/utils/time.test.js` (dos casos nuevos, el del negativo verificado por mutación).
Es una defensa sin cambio observable con datos válidos: no requiere spec.

**B8-5 resuelto (2026-11-18)** en `specs/008-validacion-duracion-formulario/`: `combineDuration`
desaparece de `utils/time.js` (no quedan consumidores) y el formulario valida con
`parseDurationInput` (`sessions/durationInput.js`), una función pura que interpreta vacíos como 0,
rechaza entradas no enteras o negativas y aplica el máximo y el mínimo con la precedencia del
servidor. El envío usa los enteros que devuelve la validación, sin `Number(...) || 0`. Evidencia:
`frontend/test/sessions/durationInput.test.js` (17 tests) y los casos de duración de
`frontend/test/sessions/SessionForm.test.jsx`, verificados por mutación.

**Prioridad:** *Media* (defensa de datos).

### B9-1, B9-2, B9-3, B9-4, B9-5, B9-6 · Validación de dominio duplicada, búsqueda sin debounce, ajuste de mensajes, accesibilidad, validación de filtros y silenciamiento de inválidos

**B9-5 resuelto (2026-11-10)** en `specs/004-validacion-fechas/`: `useSessions` detecta el rango
invertido solo con fechas válidas, invalida la petición en vuelo, no consulta y conserva listado
y error; `HistoryView` muestra un `StatusNotice` con `role="status"` y oculta el error anterior.
Evidencia: `frontend/test/sessions/HistoryView.test.jsx`.

**B9-1 resuelto (2026-11-17):** `SessionForm` ya no redefine reglas de dominio: importa
`DURATION_MIN` y `NOTES_MAX` de `packages/domain-constants`, la misma fuente que usa
`sessions.validation.js`; no queda ninguna copia local ni `TITLE_MAX`. Refactor sin cambio
observable, cubierto por la suite existente. B9-3, B9-4 y B9-6 se cerraron en
`specs/008-validacion-duracion-formulario/` (2026-11-18).

**B9-2 resuelto (2026-11-20):** el buscador del historial estabiliza el texto con
`useDebouncedValue` (`frontend/src/hooks/useDebouncedValue.js`, 300 ms) antes de pasarlo a
`useSessions`; el campo sigue mostrando lo tecleado al instante y fechas y temática siguen
inmediatas. Escribir «integrales» pasa de una petición por pulsación a una sola tras la pausa.
Evidencia: `frontend/test/hooks/useDebouncedValue.test.jsx` (valor inicial, retardo, último valor
y reinicio) y el caso nuevo de `frontend/test/sessions/HistoryView.test.jsx`, verificados por
mutación (sin el debounce hay 6 llamadas en vez de 1; sin `clearTimeout` falla el reinicio). Sin
cambio de API, de resultados ni de spec: mejora técnica dentro de RF-29 de
`specs/006-catalogo-tematicas/`.

**B9-3, B9-4 y B9-6 resueltos (2026-11-18)** en `specs/008-validacion-duracion-formulario/`:

- **B9-3**: el formulario valida el máximo (1439 min) además del mínimo en JavaScript, con el
  mensaje «La clase no puede superar las 23:59», equivalente al del servidor; el control nativo
  deja de decidir el resultado (`noValidate` en el formulario). Evidencia:
  `frontend/test/sessions/durationInput.test.js` (24 h, 23 h 60 min y `1e2` h) y los casos de
  máximo de `SessionForm.test.jsx`.
- **B9-4**: cada mensaje visible se pinta una sola vez con `role="alert"`, identificador propio y
  `aria-describedby` en el grupo de duración o en el selector de temática; los controles
  afectados llevan `aria-invalid` solo mientras el error está visible. Evidencia: casos de ARIA
  de `SessionForm.test.jsx`, verificados por mutación.
- **B9-6**: el envío usa los enteros que devuelve `parseDurationInput`; ya no hay
  `Number(...) || 0` en el formulario.

**Prioridad:** *Media* (datos sincronizados y UX accesible).

### B10-1, B10-2, B10-3, B10-4, B10-5, B10-6 · Filtro de periodo en cliente, listas duplicadas, umbrales del heatmap, calendario, valores por defecto y error/estado visibles

**B10-2 resuelto (2026-11-17):** `PERIODS` y `PERIOD_OPTIONS` viven en
`packages/domain-constants`; `PeriodFilter.jsx` y `stats.service.js` importan de ahí, así que ya
no hay listas duplicadas entre capas. Evidencia:
`packages/domain-constants/test/constants.test.js` (las claves deben coincidir y no repetirse),
verificado por mutación. B10-4 se resolvió el 2026-11-22 (ver más abajo).

**B10-1 resuelto (2026-11-21):** `StatsPanel` deja de cargar todas las clases y de refiltrarlas
en el navegador: pide el listado con el rango `from`/`to` que ya calculó `/api/stats` (el backend
es la autoridad del periodo) y lo muestra tal cual. Para no lanzar una petición sin filtros
mientras aún no hay métricas, `useSessions` acepta `enabled` (por defecto `true`); con `false` no
pide nada y deja `loading` en `false` hasta que se conoce el rango. Evidencia:
`frontend/test/stats/StatsPanel.test.jsx` (argumentos del rango y una clase devuelta por la API
que se pinta sin refiltrado) y `frontend/test/sessions/useSessions.test.jsx` (no pide
deshabilitado y pide una sola vez al habilitarse), verificados por mutación (el filtrado antiguo
y la ausencia del gate hacen fallar su test). Refactor sin cambio observable ni de contrato: no
requiere spec.

**B10-3 resuelto (2026-11-22):** la escala de intensidad del calendario deja de ser un bloque de
`if` con cortes sueltos dentro de `ActivityHeatmap`. Vive en
`frontend/src/stats/heatmapLevel.js`, que documenta los tres cortes (`HEATMAP_THRESHOLDS`:
60, 120 y la meta diaria) y expone `heatmapLevel`, `HEATMAP_LEVEL_MAX` y `HEATMAP_LEVEL_COUNT`.
El componente aplica la función a cada celda y genera la leyenda desde el conteo de niveles, así
que ya no repite el `4`. Evidencia: `frontend/test/stats/heatmapLevel.test.js` (límite de cada
nivel y coherencia de la escala) y dos casos nuevos de
`frontend/test/stats/ActivityHeatmap.test.jsx` (nivel por celda y una celda de leyenda por
nivel), verificados por mutación (un umbral cambiado, la guarda del 0 eliminada, el conteo de la
leyenda y un nivel de celda fijo hacen fallar su test). Refactor sin cambio observable ni de
contrato: no requiere spec. De paso se eliminó el JSDoc huérfano de
`frontend/src/utils/time.js`, resto de la extracción de `GOAL_MINUTES` a `domain-constants`
(commit `46c0d4c`).

**B10-4 resuelto (2026-11-22):** `buildColumns` construye la rejilla por la fecha de cada día y
no por su posición en el array: ordena la serie con `compareDateStrings`, calcula el offset de
cada fecha con `Date.UTC` (sin DST), rellena con celdas vacías los huecos internos y completa la
última semana hasta el domingo. Con la serie completa y ordenada que devuelve el backend el
resultado visible no cambia, salvo que la última columna deja de quedar más corta. Evidencia:
`frontend/test/stats/ActivityHeatmap.test.jsx` (seis casos: huecos/desorden, última semana y el
caso existente de fecha inválida ajustado a 7 celdas), verificado por mutación (con el
`buildColumns` anterior fallan los tres casos). Refactor defensivo sin cambio de contrato ni de
API: no requiere spec.

**Prioridad:** *Media* (estática del tablero de inicio).

### B11-1, B11-2, B11-3, B11-4, B11-5, B11-6, B11-7, B11-8 · Duplicación de estilos, monoliticidad, accesibilidad y layout

**B11-1 resuelto (2026-11-26):** todos los colores de `styles.css` viven en `:root` como
tokens semánticos (`--surface-muted`, `--text-soft`, `--on-accent`, `--danger-*`, `--warning-*`,
`--track`, `--heatmap-*`, `--overlay`, `--modal-shadow`). Los literales sueltos se sustituyen
por `var(...)` y los valores que ya coincidían con un token existente (`--border`,
`--primary-soft`) se reutilizan. La paleta no cambia: los valores son idénticos. Evidencia:
`frontend/test/styles.test.js` (tres casos: bloque `:root`, ausencia de literales de color
fuera de él y coherencia de todos los `var()`), verificado en rojo → verde. Refactor sin
cambio observable: no requiere spec.

**B11-2 resuelto (2026-11-26):** los controles de formulario dejan de estilizarse por elemento:
`styles.css` aplica las declaraciones compartidas a `.control` y las propias del área de texto a
`.control--textarea`, y los 17 controles de la interfaz llevan la clase explícita. Las
declaraciones se copiaron literales (mismos valores y misma cascada), así que la apariencia no
cambia; los `radio` la conservan a propósito, porque quitarles el estilo de campo de texto sería
un cambio visual y exigiría spec. Evidencia: `frontend/test/styles.test.js` (dos casos nuevos:
ninguna regla global por elemento y todo control JSX con la clase, verificados en rojo → verde) y
comparación de estilos calculados con Chrome DevTools a 375 px en los controles de historial,
estadísticas, inicio, formulario y diálogos (incluidos foco, `radio` y `select` del borrado):
cero diferencias y sin scroll horizontal. Refactor sin cambio observable: no requiere spec.

**B11-3 resuelto (2026-11-26):** `frontend/src/styles.css` se divide en
`frontend/src/styles/`, con `index.css` como único manifiesto de carga (solo `@import`, en orden de
cascada) y 12 hojas por responsabilidad: `tokens`, `base`, `buttons`, `tabs`, `cards`, `forms`,
`sessions`, `stats`, `heatmap`, `modal`, `themes` y `utilities`. Ninguna hoja supera las 200
líneas (la mayor, `heatmap.css`, tiene 159). Las declaraciones se copiaron literales y el orden de
carga reproduce la cascada anterior, así que la apariencia no cambia. Evidencia:
`frontend/test/styles.test.js` conserva las cinco guardas anteriores sobre el conjunto y añade
cuatro estructurales (manifiesto solo con `@import`, cada hoja importada una vez sin huérfanas,
ninguna hoja monolítica y `main.jsx` importando el manifiesto), verificadas en rojo → verde;
comparación de estilos calculados con Chrome DevTools a 375 px en inicio, historial y modal: cero
diferencias y sin scroll horizontal. Refactor sin cambio observable: no requiere spec.

**B11-7 resuelto (2026-11-17):** la media query de `styles.css` (`max-width: 560px`) hace que
`.tabs` ocupe el ancho del contenedor y envuelva los botones. Medido con Chrome DevTools a 375 px
y 320 px: `scrollWidth === clientWidth` (sin scroll horizontal) y `flex-wrap: wrap`. El arreglo
llegó con el selector de temáticas (`e7babd3`, 2026-11-14). **B11-4 parcialmente resuelto:**
`prefers-reduced-motion` ya existe; `:focus-visible` solo cubre `button` y `a` y falta aplicarlo a
los controles de formulario. Quedan pendientes B11-5, B11-6, B11-8 y el resto
de B11-4.

**B11-8 registrado (2026-11-18):** durante la validación de
`specs/008-validacion-duracion-formulario/` se midió con Chrome DevTools que, a 375 px, el
`fieldset` de duración ocupa 311 px dentro de un formulario de 303 px (8 px de desbordamiento
interno). La página no genera scroll horizontal (`scrollWidth === clientWidth`), pero el grupo de
horas y minutos puede provocar scroll dentro del formulario. Es un problema de layout preexistente
y ajeno al alcance funcional de 008, que excluye el control de desbordamiento a 375 px de sus
criterios de cierre. **Mitigación:** permitir que la fila de horas y minutos se ajuste
(`flex-wrap`), reducir el ancho mínimo de los controles o aplicar `max-width: 100%` al grupo;
abordarlo en la feature de estilos/UI.

**Prioridad:** *Media* (consistencia visual).

---

### Resumen

**Setenta** debilidades técnicas registradas en la tabla (B0-1 … B11-8), con 65 resueltas, 4 pendientes y 1 en curso (B0-7). El principal impedimento para la culminación es **B0-7** (sin tests E2E; los de frontend ya existen). Con B6-3, B6-4 y B6-5 resueltos, la deuda pendiente restante es de prioridad media o baja. Las debilidades de fechas B3-2, B3-3, B4-4, B8-1 y B9-5 quedaron resueltas en `specs/004-validacion-fechas/` (2026-11-10); B4-2 quedó resuelto en `specs/005-duracion-parcial-sesiones/` (2026-11-10); B4-3 y B4-5 quedaron resueltos como refactor defensivo (2026-11-10); B5-2 quedó resuelto en `specs/006-catalogo-tematicas/` (2026-11-13); B5-4 quedó resuelto con la extracción de constantes a `packages/domain-constants` (commit `46c0d4c`, 2026-10-27). El 2026-11-17 se cerraron sin cambio de comportamiento B9-1 (reglas compartidas), B10-2 (periodos en una sola fuente, con test) y B11-7 (pestañas sin overflow a 375/320 px); B6-3, B6-4 y B6-5 se cerraron en `specs/007-orquestacion-app/` (2026-11-17); B6-6 se cerró el 2026-11-18 con dos tests de reintento en `frontend/test/App.test.jsx` (guardado y borrado), verificados por mutación; B7-2 se cerró el 2026-11-18 con la cancelación de la petición en vuelo en los tres hooks de lectura (20 tests y 11 mutaciones detectadas); B7-3 y B7-4 se cerraron el 2026-11-18 con la fusión de cabeceras y el `Content-Type` solo en peticiones con cuerpo (5 tests nuevos, mutación detectada); B8-3 se cerró el 2026-11-18 con el límite inferior de `goalProgress` (dos tests en `frontend/test/utils/time.test.js`, mutación detectada); B8-4 se cerró el 2026-11-18 al unificar la regla «lunes = 0» en `weekdayIndexFromDate`, compartida por `formatDateLong` y `weekdayIndex` (test de coherencia y mutación detectada); B8-5, B9-3, B9-4 y B9-6 se cerraron el 2026-11-18 en `specs/008-validacion-duracion-formulario/` con la validación explícita de la duración (mínimo, máximo, rango de minutos y precedencia), el anuncio accesible asociado al campo y el envío de enteros (17 tests de la función pura y 20 casos de formulario, verificados por mutación); B9-2 se cerró el 2026-11-20 con el `debounce` del buscador del historial (300 ms antes de consultar, el campo responde al instante) y un test de comportamiento que comprueba que teclear cinco letras deja una sola petición, además de los tests del hook, verificados por mutación; B10-1 se cerró el 2026-11-21 al pedir las clases con el rango del periodo que calcula `/api/stats` y eliminar el refiltrado en cliente (opción `enabled` en `useSessions` para esperar al rango), con dos tests y ambas mutaciones detectadas; B10-3 se cerró el 2026-11-22 al extraer la escala del heatmap a `frontend/src/stats/heatmapLevel.js` (umbrales documentados y leyenda derivada), con dos archivos de test y cuatro mutaciones detectadas; B10-4 se cerró ese mismo día al construir la rejilla del calendario por posición de fecha, rellenando los huecos internos y la última semana (tres casos de `ActivityHeatmap.test.jsx`, mutación detectada); B11-1 se cerró el 2026-11-26 con un token semántico por color en `:root` y una guarda de test que impide literales fuera de él (paleta idéntica, rojo → verde); B11-2 se cerró ese mismo día con la clase `.control` en los 17 controles y dos guardas que impiden selectores globales de elemento (estilos calculados idénticos a 375 px); B11-3 se cerró ese mismo día al dividir `styles.css` en `frontend/src/styles/` (manifiesto `index.css` + 12 hojas por responsabilidad, ninguna de más de 200 líneas), con guardas estructurales en `frontend/test/styles.test.js` y estilos calculados idénticos a 375 px; B11-4 sigue parcial y su resto entra en la spec de estilos; B11-8 quedó registrado el 2026-11-18 al validar 008 (desbordamiento interno del campo de duración a 375 px) y también corresponde a la feature de estilos. Todas las categorías de riesgo de negocio — acoplamiento, datos, UI, red, estilos — están cubiertas y el proyecto sigue siendo funcional en verde.

La estructura propuesta (resumen + 13 bloques) mantiene el alcance de cada archivo y la tabla de contenidos original.