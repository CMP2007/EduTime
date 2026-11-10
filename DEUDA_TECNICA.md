# Registro de deuda técnica — StudyTrack

Registro global de debilidades detectadas durante la revisión de calidad del proyecto. Se organiza **por secciones (bloques) de la explicación**: cada bloque aporta sus hallazgos. La mayoría sigue **pendiente**; los marcados como `resuelto` ya se corrigieron (ver `MEMORY.md`).

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
| B5-2 | Agrupación por temática por título exacto (sin normalizar) | Baja | pendiente |
| B5-3 | Racha recalculada en cada petición (sin caché) | Baja | pendiente |
| B5-4 | Meta diaria fija (180) y duplicada backend/frontend | Baja | pendiente |

### Bloque 6 — Frontend: arranque y orquestación

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B6-1 | Sin Error Boundary (un error deja la pantalla en blanco) | Media | resuelto |
| B6-2 | Error de borrado no gestionado (se traga el fallo) | Media | resuelto |
| B6-3 | Sin enrutado/URL (recargar siempre vuelve a Inicio) | Baja | pendiente |
| B6-4 | `App` accede a la API directamente (mezcla capas) | Baja | pendiente |
| B6-5 | Fecha cruda `YYYY-MM-DD` en el diálogo de borrado | Baja | pendiente |

### Bloque 7 — Frontend: red y datos

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B7-1 | `request` pierde el código de estado HTTP | Media | resuelto |
| B7-2 | Sin cancelación ni orden de respuestas (race en los hooks) | Baja-Media | pendiente |
| B7-3 | Merge de cabeceras frágil (`Content-Type` se puede borrar) | Baja | pendiente |
| B7-4 | `Content-Type` enviado también en peticiones `GET` | Muy baja | pendiente |

### Bloque 8 — Frontend: utilidades y componentes base

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B8-1 | Formateadores de fecha sin validar (producen `Invalid Date`) | Baja-Media | resuelto |
| B8-2 | `Modal` sin focus trap, sin restaurar foco ni bloquear scroll | Media | resuelto |
| B8-3 | `goalProgress` sin límite inferior (acepta negativos) | Baja | pendiente |
| B8-4 | Lógica "lunes = 0" duplicada (`formatDateLong` vs `weekdayIndex`) | Baja | pendiente |
| B8-5 | `combineDuration` convierte valores inválidos en `0` en silencio | Muy baja | pendiente |

### Bloque 9 — Frontend: feature Historial

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B9-1 | Validación de dominio duplicada en `SessionForm` (refuerza B0-1) | Baja-Media | pendiente |
| B9-2 | Búsqueda sin `debounce` (una petición por pulsación) | Media | pendiente |
| B9-3 | Límite de duración: el mensaje del backend dice "23 h" pero admite 23h59; el cliente solo valida el mínimo en JS | Baja | pendiente |
| B9-4 | Mensajes de error del formulario sin rol accesible | Baja | pendiente |
| B9-5 | Filtros `from`/`to` sin comprobar rango invertido | Baja | resuelto |
| B9-6 | `Number(...) || 0` enmascara entradas inválidas del formulario | Muy baja | pendiente |

### Bloque 10 — Frontend: feature Inicio/Estadísticas

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B10-1 | `StatsPanel` refiltra el periodo en cliente y carga todas las clases | Media | pendiente |
| B10-2 | `PERIOD_OPTIONS` duplica `PERIODS` del backend (refuerza B0-1) | Baja | pendiente |
| B10-3 | Umbrales del heatmap (`level`) hardcodeados sin documentar | Baja | pendiente |
| B10-4 | `buildColumns` asume serie contigua y no rellena la última semana | Baja | pendiente |
| B10-5 | Tarjetas con `?? 0` silencian cambios de forma del contrato | Baja | resuelto |
| B10-6 | El error/estado de `useSessions` en `StatsPanel` no se muestra | Baja-Media | resuelto |

### Bloque 11 — Frontend: estilos

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B11-1 | Colores hardcodeados mezclados con variables CSS | Baja | pendiente |
| B11-2 | Estilos de elemento globales (`input/select/textarea`) con posible fuga | Baja | pendiente |
| B11-3 | `styles.css` monolítico (771 líneas) frente a "un archivo por responsabilidad" | Baja-Media | pendiente |
| B11-4 | Sin `:focus-visible` ni `prefers-reduced-motion` | Baja | pendiente |
| B11-5 | Valores mágicos de layout (`z-index`, anchos fijos) sin tokens | Baja | pendiente |
| B11-6 | `textarea { resize: none }` quita el control de redimensionado | Muy baja | pendiente |
| B11-7 | Barra de pestañas con overflow horizontal a 375 px | Baja | pendiente |

---

## Prioridad global y orden sugerido

### B0-7 · Sin tests de frontend ni E2E (requisito de culminación)

**Prioridad:** *Crítica*

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

### B6-3, B6-4, B6-5 · Router, separación de capas y formato del diálogo de borrado

**Prioridad:** *Media* (experiencia de usuario).

### B7-2, B7-3, B7-4 · Race de peticiones, fusión de cabeceras y Content-Type en GET

**Prioridad:** *Media* (conexión robusta).

### B8-1, B8-3, B8-4, B8-5 · Validación de formateadores, límites inferiores, lógica duplicada y silenciamiento de inválidos

**B8-1 resuelto (2026-11-10)** en `specs/004-validacion-fechas/`: `fromDateString` del frontend
devuelve `null`, los formateadores devuelven `''` y `weekdayIndex` devuelve `null` con fechas
inválidas; `ActivityHeatmap` omite los días inválidos. Evidencia: `frontend/test/utils/date.test.js`
y `frontend/test/stats/ActivityHeatmap.test.jsx`. Pendientes B8-3, B8-4 y B8-5.

**Prioridad:** *Media* (defensa de datos).

### B9-1, B9-2, B9-3, B9-4, B9-5, B9-6 · Validación de dominio duplicada, búsqueda sin debounce, ajuste de mensajes, accesibilidad, validación de filtros y silenciamiento de inválidos

**B9-5 resuelto (2026-11-10)** en `specs/004-validacion-fechas/`: `useSessions` detecta el rango
invertido solo con fechas válidas, invalida la petición en vuelo, no consulta y conserva listado
y error; `HistoryView` muestra un `StatusNotice` con `role="status"` y oculta el error anterior.
Evidencia: `frontend/test/sessions/HistoryView.test.jsx`. Pendientes B9-1, B9-2, B9-3, B9-4 y
B9-6.

**Prioridad:** *Media* (datos sincronizados y UX accesible).

### B10-1, B10-2, B10-3, B10-4, B10-5, B10-6 · Filtro de periodo en cliente, listas duplicadas, umbrales del heatmap, calendario, valores por defecto y error/estado visibles

**Prioridad:** *Media* (estática del tablero de inicio).

### B11-1, B11-2, B11-3, B11-4, B11-5, B11-6, B11-7 · Duplicación de estilos, monoliticidad, missing accesibilidad y layout tokens

**Prioridad:** *Media* (consistencia visual).

---

### Resumen

**Sesenta y ocho** debilidades técnicas registradas en la tabla (B0-1 … B11-7), con 39 resueltas, 28 pendientes y 1 en curso (B0-7). El principal impedimento para la culminación es **B0-7** (sin tests E2E; los de frontend ya existen). Con B4-5 resuelto, la deuda pendiente restante es de prioridad media o baja. Las debilidades de fechas B3-2, B3-3, B4-4, B8-1 y B9-5 quedaron resueltas en `specs/004-validacion-fechas/` (2026-11-10); B4-2 quedó resuelto en `specs/005-duracion-parcial-sesiones/` (2026-11-10); B4-3 y B4-5 quedaron resueltos como refactor defensivo (2026-11-10). Todas las categorías de riesgo de negocio — acoplamiento, datos, UI, red, estilos — están cubiertas y el proyecto sigue siendo funcional en verde.

La estructura propuesta (resumen + 13 bloques) mantiene el alcance de cada archivo y la tabla de contenidos original.