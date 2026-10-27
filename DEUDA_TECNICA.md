# Registro de deuda técnica — StudyTrack

Registro global de debilidades detectadas durante la revisión de calidad del proyecto. Se
organiza **por secciones (bloques) de la explicación**: cada bloque aporta sus hallazgos. La
mayoría sigue **pendiente**; los marcados como `resuelto` ya se corrigieron (ver `MEMORY.md`).

- **Estados:** `pendiente` · `en curso` · `resuelto`.
- **Severidad:** `baja` · `media` · `alta`.
- **IDs:** `B<n>-<m>` = bloque `n`, hallazgo `m` (estables aunque se reordene el resumen).
- **Referencias de código:** citar `archivo` + símbolo (función, constante…), no números de
  línea: se pudren con cada cambio (verificado al limpiar este archivo).

## Índice

- [Resumen por bloque](#resumen-por-bloque)
- [Bloque 0 — Mapa general y arquitectura](#bloque-0--mapa-general-y-arquitectura)
- [Bloque 1 — Cimientos y configuración](#bloque-1--cimientos-y-configuración)
- [Bloque 2 — Backend: arranque y composición](#bloque-2--backend-arranque-y-composición)
- [Bloque 3 — Backend: persistencia y tiempo](#bloque-3--backend-persistencia-y-tiempo)
- [Bloque 4 — Backend: dominio de sesiones](#bloque-4--backend-dominio-de-sesiones)
- [Bloque 5 — Backend: dominio de estadísticas](#bloque-5--backend-dominio-de-estadísticas)
- [Bloque 6 — Frontend: arranque y orquestación](#bloque-6--frontend-arranque-y-orquestación)
- [Bloque 7 — Frontend: red y datos](#bloque-7--frontend-red-y-datos)
- [Bloque 8 — Frontend: utilidades y componentes base](#bloque-8--frontend-utilidades-y-componentes-base)
- [Bloque 9 — Frontend: feature Historial](#bloque-9--frontend-feature-historial)
- [Bloque 10 — Frontend: feature Inicio/Estadísticas](#bloque-10--frontend-feature-inicioestadísticas)
- [Bloque 11 — Frontend: estilos](#bloque-11--frontend-estilos)
- [Bloque 12 — Veredicto transversal](#bloque-12--veredicto-transversal)
- [Prioridad global y orden sugerido](#prioridad-global-y-orden-sugerido)

## Resumen por bloque

### Bloque 0 — Mapa general y arquitectura

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B0-1 | Constantes de dominio duplicadas entre backend y frontend | Media | resuelto |
| B0-2 | Sin tests ni linter configurado | Alta | resuelto |
| B0-3 | Persistencia acoplada al proceso (condiciones de carrera) | Media-Alta | resuelto |
| B0-4 | `README.md` desincronizado con la regla real de racha | Baja | resuelto |
| B0-5 | Patrón `version` / refresh por props (invalidación gruesa) | Media | pendiente |
| B0-6 | Sin TypeScript ni validación del contrato de datos | Media-Alta | pendiente |
| B0-7 | Sin tests de frontend ni E2E (requisito de culminación) | Alta | en curso |

### Bloque 1 — Cimientos y configuración

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B1-1 | Falta `"engines"` (versión de Node) en los `package.json` | Baja-Media | pendiente |
| B1-2 | Sin scripts de `test`/`lint` en los paquetes (refuerza B0-2) | Baja | resuelto |
| B1-3 | Proxy de Vite acoplado al puerto `3001` del backend | Baja | pendiente |
| B1-4 | `.gitignore` con entradas redundantes de `node_modules` | Trivial | pendiente |
| B1-5 | Estructura/funcionalidades duplicadas: `README.md` vs `AGENTS.md` | Baja | pendiente |
| B1-6 | Configuración de red permisiva (`cors()` abierto + `--host 0.0.0.0`) | Baja | pendiente |
| B1-7 | El proxy de Vite no se usa: la URL por defecto de la API es absoluta | Baja | pendiente |
| B1-8 | Dependencias con vulnerabilidades conocidas (`esbuild`/`vite`) | Media | resuelto |
| B1-9 | Mayores de dependencias pendientes (`react` 19, `express` 5, `concurrently` 10) | Media | resuelto |

### Bloque 2 — Backend: arranque y composición

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B2-1 | JSON malformado responde 500 en lugar de 400 | Media | resuelto |
| B2-2 | `app.js` acoplado a `ValidationError` de sessions | Baja-Media | resuelto |
| B2-3 | Boilerplate de `try/catch` en cada ruta | Baja | pendiente |
| B2-4 | Sin logging de peticiones/errores | Baja | pendiente |

### Bloque 3 — Backend: persistencia y tiempo

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B3-1 | Fichero JSON corrupto se trata como vacío (riesgo de pérdida de datos) | Media-Alta | resuelto |
| B3-2 | `fromDateString` no valida la entrada (fechas `NaN` silenciosas) | Baja | pendiente |
| B3-3 | `enumerateDays` trunca en silencio a 4000 días (número mágico) | Baja | pendiente |
| B3-4 | Periodos inválidos degradan en silencio a `week` | Baja | resuelto |

### Bloque 4 — Backend: dominio de sesiones

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B4-1 | `sessionsService.getById` sin usar (código muerto) | Baja | pendiente |
| B4-2 | Update parcial de duración exige horas y minutos juntos | Baja-Media | pendiente |
| B4-3 | `clone` superficial en el repositorio | Baja | pendiente |
| B4-4 | Filtros `from`/`to` sin validar | Baja | pendiente |
| B4-5 | El seed se persiste sin pasar por la validación del servicio | Baja | pendiente |

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
| B8-1 | Formateadores de fecha sin validar (producen `Invalid Date`) | Baja-Media | pendiente |
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
| B9-5 | Filtros `from`/`to` sin comprobar rango invertido | Baja | pendiente |
| B9-6 | `Number(...) || 0` enmascara entradas inválidas del formulario | Muy baja | pendiente |

### Bloque 10 — Frontend: feature Inicio/Estadísticas

| ID | Debilidad | Severidad | Estado |
|----|-----------|-----------|--------|
| B10-1 | `StatsPanel` refiltra el periodo en cliente y carga todas las clases | Media | pendiente |
| B10-2 | `PERIOD_OPTIONS` duplica `PERIODS` del backend (refuerza B0-1) | Baja | pendiente |
| B10-3 | Umbrales del heatmap (`level`) hardcodeados sin documentar | Baja | pendiente |
| B10-4 | `buildColumns` asume serie contigua y no rellena la última semana | Baja | pendiente |
| B10-5 | Tarjetas con `?? 0` silencian cambios de forma del contrato | Baja | pendiente |
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

---

## Bloque 0 — Mapa general y arquitectura

### B0-1 · Constantes de dominio duplicadas entre backend y frontend

La misma regla vive en dos (o más) sitios, sin fuente única de verdad. Si cambia una, hay
que recordar tocar la otra o se desincronizan silenciosamente.

| Constante | Backend | Frontend |
|-----------|---------|----------|
| `GOAL_MINUTES = 180` | `backend/src/stats/stats.service.js:4` | `frontend/src/utils/time.js:2` |
| `TITLE_MAX = 80` | `backend/src/sessions/sessions.service.js:4` | `frontend/src/sessions/SessionForm.jsx:6` |
| `NOTES_MAX = 500` | `backend/src/sessions/sessions.service.js:5` | `frontend/src/sessions/SessionForm.jsx:7` |
| `DURATION_MIN = 15` (`MIN_DURATION`) | `backend/src/sessions/sessions.service.js:8` | `frontend/src/sessions/SessionForm.jsx:8` |
| `HOURS_MAX = 23`, `MINUTES_MAX = 59` | `backend/src/sessions/sessions.service.js:6-7` | valores `max="23"` / `max="59"` en `SessionForm.jsx:110,120` |
| Lista de periodos y etiquetas | `PERIODS` (`backend/src/utils/date.js:72`) | `PERIOD_OPTIONS` (`frontend/src/stats/PeriodFilter.jsx:1-9`) |

**Impacto:** divergencia de reglas entre validación del cliente y del servidor.
**Mitigación sugerida:** módulo de constantes compartido (o, al menos, un único sitio por
lado referenciado desde el resto) y usarlo en ambos extremos.

### B0-2 · Sin tests ni linter configurado

**Resuelto:** 49 tests con el runner nativo de Node (`node --test`, en `backend/test/`) y
ESLint con flat config en la raíz (`eslint.config.js`); de paso se retiró un `eslint-disable`
sin efecto en `app.js`. Detalle en `MEMORY.md` y en el commit `6e4c1d5`.

### B0-3 · Persistencia acoplada al proceso (condiciones de carrera)

**Resuelto:** el ciclo `load()` → mutar → `persist()` era *read-modify-write* sin
coordinación: dos lecturas en frío solapadas se quedaban cada una con su propio array
(**lost update**), el primer arranque podía siembrar dos veces y las escrituras usaban el
mismo tmp fijo (`sessions.json.tmp`). Ahora `sessions.repository.js` es una fábrica
(`createSessionsRepository(store)`) que cachea la **promesa** de lectura (single-flight),
serializa las escrituras en una cola (`writeChain`) y escribe en un tmp único
(`pid + randomUUID`). Verificado con pruebas de mutación.
**Alcance:** un proceso; multi-proceso (lock de fichero o SQLite) queda fuera.
Tests: `backend/test/sessions.repository.test.js`. Evidencia y detalle: commit `158b325`.

### B0-4 · `README.md` desincronizado con la regla real de racha

**Resuelto:** `README.md` corregido para reflejar que la racha son días consecutivos con
**meta cumplida (≥ 180 min)** (coincide con `AGENTS.md` y `backend/src/stats/stats.service.js`).
Si hoy aún no se llega a la meta, la racha sigue viva hasta fin del día y se guarda la
**racha más extensa** (récord).

### B0-5 · Patrón `version` / refresh por props (invalidación gruesa)

`App.jsx:18` guarda un contador `version` que se incrementa en `refresh()` (`App.jsx:23-25`)
y se pasa a las vistas (`App.jsx:76-78`). Los hooks lo incluyen en las dependencias
(`useStats.js:21`, `useSessions.js:25`), de modo que cambiar `version` provoca refetch.

#### Lo bueno

- Cero dependencias e infraestructura.
- El render condicional de pestañas (`App.jsx:76-78`) desmonta/remonta y ya refresca al
  cambiar de pestaña; el `version` cubre sobre todo la pestaña activa.

#### Lo malo

- **Invalidación global y gruesa:** un solo número no indica **qué** cambió. `StatsPanel`
  dispara 2 peticiones en cada `refresh()` (`/api/stats` + `/api/sessions`).
- **Prop drilling:** toda vista que quiera refrescar debe aceptar y reenviar `version`.
- **Sin cancelación de peticiones obsoletas:** no hay `AbortController`; si dos refreshes se
  solapan, gana el último en responder (riesgo de pisar datos nuevos con viejos).
- **Sin updates optimistas:** siempre hay round-trip de red.
- **Frágil ante olvidos:** un hook nuevo que no reciba `version` no se refresca y no avisa.

#### Mitigación sugerida

- Context con claves por recurso (`sessions`, `stats`, `heatmap`) y que cada hook dependa
  solo de su clave.
- Cancelar peticiones con `AbortController`.
- Alternativa con dependencia: React Query / SWR (requiere justificar la dep).

**Estado actual (22/10/2026):** ESLint emite **2 avisos** `react-hooks/exhaustive-deps`
intencionados (`useSessions.js`, `useStats.js`) que desaparecen al resolver este hallazgo.

### B0-6 · Sin TypeScript ni validación del contrato de datos

El contrato de la API solo está **documentado** (tabla en `AGENTS.md`), no verificado. El
backend valida bien la **entrada** del usuario (`sessions.service.js:35-55`), pero la forma
de la **salida** no se comprueba y el frontend la asume.

#### Fallo silencioso (verificado)

Los componentes son defensivos (`today?.minutes ?? 0`, defaults). Ejecutando el propio código:

```
formatMinutes(undefined) -> "0m"
goalProgress(undefined)  -> 0
formatMinutes(NaN)       -> "0m"
```

Un campo ausente o renombrado se pinta como `"0m"` / `0` — un valor **plausible pero falso**
— en lugar de fallar. Para un tablero de métricas, un dato incorrecto silencioso es peor que
un error visible.

#### Otros puntos

- Sin TypeScript, PropTypes ni JSDoc con `// @ts-check`.
- Sin tests de contrato que detecten la deriva backend↔frontend.

#### Mitigación sugerida

- JSDoc + `// @ts-check` (chequeo de tipos **sin** dependencias).
- Módulo de constantes/contratos compartido (enlaza con B0-1).
- Schemas en runtime (zod/joi) o TypeScript si se justifica la dependencia.

### B0-7 · Sin tests de frontend ni E2E (requisito de culminación)

La suite (49 casos con `node --test`) cubre **solo el backend**. El frontend no tiene ninguna
prueba automatizada: ni tests unitarios/DOM de hooks y componentes, ni tests de integración, ni
E2E de punta a punta.

**Impacto:** cualquier refactor de frontend es a ciegas (regresiones de UX: errores tragados,
estados mal mostrados) y, sobre todo, **el proyecto no puede considerarse culminado** sin tests
en ambas capas, de integración y E2E.
**Mitigación:** (1) tests unitarios/DOM con **Vitest + Testing Library + jsdom** en
`frontend/test/` (espejo de `src/`, misma convención que `backend/test/`); (2) tests HTTP del
backend (`app.test.js`) como nivel de integración; (3) tests E2E con **Playwright** (flujo
completo: crear/editar/borrar + fallos de red).

**En curso (infraestructura hecha):** en la sesión del punto 3 se montó la infraestructura
(**Vitest 5 + jsdom + Testing Library**, versiones exactas en `frontend/package.json`;
`frontend/vitest.config.js`, `frontend/test/` espejo de `src/`, script `test` por workspace) y
ya hay **28 tests unitarios/DOM** en verde junto a los 59 de backend (87 en total con
`npm test`). Quedan, para la culminación, los tests de **integración ampliados** y los **E2E**
(Playwright: dependencia aparte, a aprobar).

---

## Bloque 1 — Cimientos y configuración

Revisión de `package.json` (raíz, `backend`, `frontend`), `frontend/vite.config.js`,
`frontend/index.html`, `.gitignore` y `.opencode/commands/feature.md`.

### B1-1 · Falta `"engines"` (versión de Node) en los `package.json`

Ninguno de los tres `package.json` declara la versión de Node que necesita el proyecto. El
código usa APIs modernas (`crypto.randomUUID` en `utils/date.js:1,105`, `structuredClone`
disponible, `fs/promises`), y el entorno verificado es **Node 22.22.2 / npm 10.9.7**. Con un
Node antiguo fallaría en runtime sin aviso previo.

**Impacto:** el proyecto podría no arrancar en otra máquina/CI y el error sería tardío y
confuso.
**Mitigación sugerida:** `"engines": { "node": ">=18" }` en la raíz y/o un archivo `.nvmrc`.

### B1-2 · Sin scripts de `test`/`lint` en los paquetes

**Resuelto:** la raíz expone `npm test` (`node --test` por workspace) y `npm run lint`
(ESLint); `backend` expone su propio `test`. Detalle: commit `6e4c1d5`.

### B1-3 · Proxy de Vite acoplado al puerto `3001` del backend

`frontend/vite.config.js:9` fija `proxy: { '/api': 'http://localhost:3001' }` con el puerto
*hardcodeado*, pero el backend lo toma de `PORT` (`backend/src/server.js:3`). Si se cambia el
puerto del backend, el frontend deja de encontrar la API **sin error de build** (falla en
runtime con 404/proxy error).

**Impacto:** acoplamiento oculto entre dos archivos de configuración.
**Mitigación sugerida:** leer el destino del proxy de una variable de entorno
(`process.env.VITE_BACKEND_URL || 'http://localhost:3001'`) o documentar el acoplamiento.

### B1-4 · `.gitignore` con entradas redundantes de `node_modules`

`.gitignore` lista `node_modules/`, `frontend/node_modules/` y `backend/node_modules/`. Por
el *hoisting* de workspaces, las dos últimas no existen normalmente (las deps van al
`node_modules/` de la raíz), así que son redundantes.

**Impacto:** nulo funcional; solo ruido.
**Mitigación sugerida:** dejar únicamente `node_modules/`.

### B1-5 · Estructura/funcionalidades duplicadas: `README.md` vs `AGENTS.md`

`README.md` describe funcionalidades y estructura que también mantiene `AGENTS.md` como
fuente de desarrollo. Esa doble fuente ya divergió una vez (ver **B0-4**, la regla de racha).

**Impacto:** documentación que puede contradecirse; coste de mantener dos sitios.
**Mitigación sugerida:** que `README.md` sea de usuario y remita a `AGENTS.md` para la
estructura/convenciones, sin repetirlas.

### B1-6 · Configuración de red permisiva (`cors()` abierto + `--host 0.0.0.0`)

`backend/src/app.js:9` usa `cors()` **sin `origin`** (acepta cualquier origen) y
`frontend/package.json:7` arranca con `vite --host 0.0.0.0` por defecto (expone el servidor a
la red local). Aceptable para desarrollo local; a revisar si el proyecto se despliega o se
expone en una red no confiable.

**Mitigación sugerida:** restringir `origin` al frontend esperado y no usar `0.0.0.0` por
defecto (o dejarlo tras un flag/script aparte).

### B1-7 · El proxy de Vite no se usa: la URL por defecto de la API es absoluta

`frontend/src/api/client.js:1` define `API_URL` como
`import.meta.env.VITE_API_URL || 'http://localhost:3001/api'`. Al ser una **URL absoluta** (con
dominio y puerto), las peticiones del navegador van **directas** al `:3001` y **nunca llegan al
servidor de Vite**, de modo que el proxy de `frontend/vite.config.js:8-10` **no se usa** en la
práctica. Para colmo, `AGENTS.md` afirma que "el proxy de Vite ya reenvía `/api`", lo que
induce a creer que sí actúa. Como consecuencia inevitable, en desarrollo el navegador habla con
un origen distinto (`:5173` → `:3001`) y **CORS sí es necesario** (de ahí el `cors()` abierto,
ver **B1-6**).

**Impacto:** configuración muerta y engañosa; se cree tener proxy cuando no lo hay.
**Mitigación sugerida:** usar una ruta relativa por defecto (`VITE_API_URL || '/api'`) para que
el proxy haga su trabajo (y CORS deje de ser necesario en desarrollo), **o** eliminar el proxy
y documentar explícitamente que las peticiones van directas al backend.

### B1-8 · Dependencias con vulnerabilidades conocidas (`npm audit`)

`npm audit` detectó 5 vulnerabilidades. **Todas están en `devDependencies`** (herramientas de
desarrollo/build): ninguna llega al código de producción.

| Paquete | Vía | Severidad | Causa |
|---------|-----|-----------|-------|
| `shell-quote` | `concurrently` | Crítica | Inyección de comandos en `quote()` |
| `concurrently` | raíz | Crítica | Depende de la `shell-quote` vulnerable |
| `source-map-js` | `vite` → `postcss` | Alta | DoS con offsets de source-map |
| `vite` | frontend | Alta | Depende de `esbuild` vulnerable |
| `esbuild` | `vite` | Moderada | El dev-server acepta peticiones de cualquier web |

**Resuelto (parcial):** `npm audit fix` (sin `--force`) actualizó `concurrently` a 9.2.5
(`shell-quote` 1.12.0) y `source-map-js` a 1.2.2 → quedan **2** de las 5.
**Resuelto (en la sesión del punto 3):** se subió el stack de build a `vite@8.3.4` +
`@vitejs/plugin-react@6.1.2` (Vite 8 exige Node `^20.19 || >=22.12`; el entorno, Node 22.22.2,
lo cumple). El momento elegido evita retrabajo: la infraestructura de tests de frontend necesita
Vitest y solo Vitest 5+ convive con Vite ≥6 — subir primero el build permite montar los tests
directamente sobre lo último. Verificación: `npm run build`, `npm run dev` (humo con
`VITE v8.3.4 ready`), `npm run lint`, suites completas en verde y **`npm audit` → 0
vulnerabilidades** (desaparecen `esbuild`/`vite`).

### B1-9 · Mayores de dependencias pendientes (`react` 19, `express` 5, `concurrently` 10)

`npm outdated` (17-10-2026) muestra estas dependencias por detrás de su *major* actual. Todas
dentro de su rango están actualizadas (lo último de la serie); **faltan los saltos de major**:

| Paquete | Instalada | Última | Impacto del salto |
|---------|-----------|--------|-------------------|
| `react` / `react-dom` | 18.3.1 | 19.3.1 | Compatible con el código actual (componentes funcionales + hooks). Testing Library 16 soporta 18 **y** 19: los tests escritos sobre 18 **no se rehacen**. |
| `express` | 4.22.3 (última 4.x) | 5.3.0 | El contrato HTTP no cambia (mismos `app.use`, `response.status().json()`, middleware de errores); los tests de backend son a nivel HTTP y siguen siendo válidos. Revisar guía de migración de Express 5. |
| `concurrently` | 9.2.5 | 10.0.6 | Solo afecta al script `dev` de la raíz. |

**Impacto:** series *major* antiguas dejan de recibir mejoras (Express 4 queda en mantenimiento);
sin vulnerabilidades conocidas asociadas (las de `esbuild`/`vite` son B1-8).
**Mitigación:** subirlas **en la sesión siguiente al punto 3 y antes del encarar el punto 4**,
con la suite como red de seguridad. Ninguna obliga a rehacer el trabajo del punto 3.

**Resuelto (18-10-2026):** los tres saltos ejecutados **de menor a mayor riesgo**, con
verificación tras cada uno (commits `cded6f2`, `b6a9e51`, `eaa9b69`):

| Paquete | De → a | Verificación |
|---------|--------|--------------|
| `concurrently` | 9.2.5 → **10.0.6** | Humo de `npm run dev`: frontend (5173) y backend (3001) arrancan y responden. |
| `express` | 4.22.3 → **5.3.0** | 55 tests HTTP en verde; en vivo: health 200, 404, JSON malformado → 400, validaciones → 400, stats 200 (mismos mensajes que en 4.x). Sin cambios de código: rutas `/:id` sin comodines (path-to-regexp v8 no afecta) y manejador de errores compatible con body-parser 2. |
| `react`/`react-dom` | 18.3.1 → **19.3.1** | 13 tests RTL en verde sin reescribir ninguno; lint y build en verde. Sin cambios de código (createRoot + hooks). |

**Incidencia resuelta:** tras instalar React 19 quedó una copia 18.3.1 hoisteada en la raíz
(resolución *peer* vieja de `@testing-library/react` en el lockfile) junto a la 19 anidada en
`frontend/node_modules/`: RTL habría renderizado con 18 y la app con 19. `npm dedupe` colapsó
ambas a una única 19.3.1 (`npm ls react react-dom --all` lo confirma).
**De paso:** los tres `package.json` pasan de rangos `^` a **versiones exactas** (coherente con
`save-exact=true`). Cierre: `npm outdated` vacío, 68 tests y lint en verde, `npm audit` → 0.

---

## Bloque 2 — Backend: arranque y composición

Revisión de `backend/src/server.js` (bootstrap) y `backend/src/app.js` (composición:
middlewares, rutas, 404 y manejador de errores).

### B2-1 · JSON malformado responde 500 en lugar de 400

El manejador de errores de `app.js` solo traduce a 400 los `ValidationError`. Cuando `express.json()` no puede
parsear el body, lanza un `SyntaxError` de `body-parser` con `status: 400` y
`type: 'entity.parse.failed'`, pero **no es** `ValidationError`, así que cae en el `500`.

**Evidencia ejecutada** (app real en puerto efímero, sin escribir en disco):

| Petición | Esperado | Obtenido |
|----------|----------|----------|
| `GET /api/health` | 200 | 200 |
| `GET /api/nope` | 404 | 404 |
| `POST` body `{bad json` | 400 | **500** ❌ |
| `POST` título vacío | 400 | 400 |
| `POST` duración 5 min | 400 | 400 |

**Impacto:** un error del cliente se reporta como fallo del servidor; el frontend muestra
"Error interno del servidor" y se ensucia el log con un stacktrace.
**Mitigación:** respetar `error.status`/`error.statusCode` (o detectar
`error.type === 'entity.parse.failed'`) y responder 400.

**Resuelto:** el manejador de errores de `app.js` respeta ahora cualquier `status`/`statusCode`
4xx **antes** de caer al 500; para `entity.parse.failed` responde 400 con un mensaje amigable
("JSON inválido en el cuerpo de la petición") en vez del mensaje crudo del parser, y los 4xx ya
**no** se registran con `console.error` (el log solo ve fallos reales del servidor). Sin nuevas
dependencias y **sin adelantar el punto 8**: en esa sesión la rama `instanceof ValidationError`
quedó intacta. Se retiró después al resolver **B2-2** (25/10/2026); B2-3/B2-4 siguen pendientes.
Tests: `backend/test/app.test.js` (app real en puerto efímero; ningún caso escribe en disco),
verificado por mutación.

### B2-2 · `app.js` acoplado a `ValidationError` de sessions

`app.js:5` importa `ValidationError` desde `sessions/sessions.service.js`. La capa de
composición (transversal) depende de un dominio concreto. Si `stats` u otro dominio define su
propia validación, hay que añadir otro `instanceof` aquí.

**Mitigación:** extraer una clase base de error (p. ej. `HttpError`/`AppError` con `status`)
en un módulo propio, que cada dominio extienda; el handler decide por `error.status`.

**Resuelto (25/10/2026):** `ValidationError` vive en `backend/src/errors.js` y extiende
`AppError` (`status = 400`). `app.js` ya no importa nada de `sessions`: decide por
`error.status`, así que cualquier dominio puede lanzar errores 4xx sin añadir un `instanceof`.

### B2-3 · Boilerplate de `try/catch` en cada ruta

Cada handler de `sessions.routes.js`/`stats.routes.js` repite el mismo
`try { ... } catch (error) { next(error) }`. Es propenso a olvidos: una ruta nueva sin
`try/catch` no reporta errores.

**Mitigación:** un wrapper `asyncHandler(fn)` que capture el rechazo y llame a `next(error)`,
sin dependencias.

### B2-4 · Sin logging de peticiones/errores

No hay logger; solo `console.error(error)` en el handler de errores (que además imprime el
body problemático del `SyntaxError`). No se registra método, ruta, estado ni duración.

**Mitigación:** middleware de logging simple (o `morgan`, si se justifica) y no volcar el
body en los logs.

---

## Bloque 3 — Backend: persistencia y tiempo

Revisión de `backend/src/storage/fileStore.js` (leer/escribir el JSON) y
`backend/src/utils/date.js` (fechas y periodos).

### B3-1 · Fichero JSON corrupto se trata como vacío (riesgo de pérdida de datos)

**Resuelto:** `readData` (`backend/src/storage/fileStore.js`) ya no devuelve `[]` ante
contenido inválido: distingue `ENOENT` (no existe → `null`, primer arranque → semilla) de
cualquier contenido que no sea un array JSON válido (corrupto, **vacío**, no-array) → **lanza
error y no toca el fichero**. Se eligió fallar en vez de copiar a `.bak` y arrancar vacío: un
arranque vacío ocultaría la pérdida y normalizaría el "sobrescribe y sigue". `app.js` no se
tocó: el manejador actual ya responde 500 y registra el mensaje en el log (mejora de mensajes
= punto 3). Tests: `backend/test/fileStore.test.js` (el fichero corrupto queda intacto),
verificado por mutación. Evidencia y detalle: commit `158b325`.

### B3-2 · `fromDateString` no valida la entrada

`date.js:12-15` hace `value.split('-').map(Number)` y construye la fecha sin comprobar nada.
Con una cadena basura produce un `Date` inválido y `toDateString` devolvería `NaN-NaN-NaN`,
que se propaga a los cálculos. Está mitigado porque la entrada de usuario se valida en
`sessions.service.js` (patrón de fecha), pero la función es frágil por sí sola.

**Mitigación:** validar el formato dentro de `fromDateString` o lanzar error si la fecha es
inválida.

### B3-3 · `enumerateDays` trunca en silencio a 4000 días

`date.js:60-70` corta el bucle con `guard < 4000` (≈ 11 años) sin avisar. Un rango mayor
daría un heatmap **incompleto** sin ningún error.

**Mitigación:** extraer el límite a una constante con nombre y, o bien justificarlo (cubre
12m/año con holgura), o lanzar error si se supera.

### B3-4 · Periodos inválidos degradan en silencio a `week`

`getRange` (`date.js:97-99`) usa `default:` → `week`, y `stats.service.js:71-72` vuelve a caer
a `'week'` con `isValidPeriod`. Un error de tipeo en el parámetro `period`/`heatmap` no se
detecta: se sirve otra cosa.

**Mitigación:** devolver `400` ante un periodo inválido en vez de degradar.

**Resuelto (25/10/2026):** `statsService.getStats` valida `period` y `heatmap` antes de leer
datos y lanza `ValidationError` (400) con la lista de valores permitidos; si se omiten, siguen
usando `week`. `getRange` ya no tiene un `default` silencioso: sin periodo usa `week`, pero un
periodo desconocido lanza `RangeError`. Tests en `date.test.js`, `stats.service.test.js` y
`app.test.js` (peticiones HTTP reales).

> **Nota:** la lista de periodos está además duplicada entre backend y frontend (ampliación de
> **B0-1**).

---

## Bloque 4 — Backend: dominio de sesiones

Revisión de `backend/src/sessions/seed.js`, `sessions.repository.js`, `sessions.service.js`
y `sessions.routes.js` (capas datos / reglas / HTTP).

### B4-1 · `sessionsService.getById` sin usar (código muerto)

`sessions.service.js:76-78` exporta `getById`, pero ninguna ruta lo usa (no hay
`GET /api/sessions/:id`); `update` llama directamente a `repository.findById`. Es código sin
consumidor.

**Mitigación:** eliminarlo o exponer la ruta que lo justifique.

### B4-2 · Update parcial de duración exige horas y minutos juntos

En `sessions.service.js:92-110`, si `update` recibe solo `hours` **o** solo `minutes`, el otro
queda `undefined`; `parseDuration` hace `Number(undefined)` → `NaN` y lanza un mensaje confuso
("Los minutos deben ser un número entre 0 y 59"). El frontend siempre manda ambos, pero la API
lo permite y falla de forma poco clara.

**Mitigación:** documentar que la duración va en pareja o derivar el campo que falte desde el
valor existente (como ya se hace cuando no viene ninguno).

### B4-3 · `clone` superficial en el repositorio

El `clone` de `sessions.repository.js` (dentro de la fábrica) clona con una copia superficial
`{ ...session }`. Hoy todos los campos
son primitivos, así que aísla bien; pero si se añadiera un campo anidado (p. ej. un array de
etiquetas), la copia compartiría esa referencia y el estado interno quedaría expuesto.

**Mitigación:** usar una copia profunda (`structuredClone`) cuando haya estructuras anidadas.

### B4-4 · Filtros `from`/`to` sin validar

`matchesFilters` (`sessions.service.js:57-66`) compara `session.date` con `from`/`to` como
texto, sin comprobar el formato. Una fecha mal formada en el query string no da error: filtra
de forma silenciosa y potencialmente errónea.

**Mitigación:** validar el formato `YYYY-MM-DD` de los filtros y responder 400 si son
inválidos.

> **Refuerza B0-1:** las reglas de validación (título, notas, 15 min, 23 h) están duplicadas
> en `frontend/src/sessions/SessionForm.jsx`.

### B4-5 · El seed se persiste sin pasar por la validación del servicio

En `sessions.repository.js`, cuando no existe el fichero, `load()` construye la semilla
(`buildSeed()`) y la escribe **directamente**, sin pasar por `sessionsService`. Las entradas
de ejemplo nunca se validan (título máx. 80, duración mín. 15,
etc.). Si alguien añade una entrada de seed inválida, se guardaría una sesión que la API
rechazaría si se enviara por HTTP, rompiendo el invariante "toda sesión persistida cumple las
reglas del dominio".

**Impacto:** bajo (los datos de ejemplo son fijos y hoy válidos), pero es un invariante no
garantizado.
**Mitigación sugerida:** validar el seed antes de escribirlo, o documentar explícitamente que
el seed es de confianza y se construye conforme al modelo.

---

## Bloque 5 — Backend: dominio de estadísticas

Revisión de `backend/src/stats/stats.service.js` (cálculo de métricas) y `stats.routes.js`
(endpoint único `GET /api/stats`).

### B5-1 · Sin tests en la lógica crítica de estadísticas

**Resuelto:** `backend/test/stats.service.test.js` cubre racha (`current`/`best`), meta del
día, periodos, resumen y heatmap con el repositorio simulado (`mock.method`), verificado con
pruebas de mutación. Commit `6e4c1d5`.

### B5-2 · Agrupación por temática por título exacto (sin normalizar)

`groupBySubject` agrupa por `session.title` tal cual. "Programación" y "programacion" (ambos
aparecen en los datos locales de ejemplo) cuentan como temáticas distintas. La app no tiene un
catálogo de temáticas: la identidad es el texto.

**Mitigación:** normalizar (trim + minúsculas/acentos) para agrupar, o introducir temáticas
con id propio.

### B5-3 · Racha recalculada en cada petición (sin caché)

`computeStreaks` reordena y recorre todas las fechas con meta en **cada** llamada a
`/api/stats`. A esta escala es irrelevante, pero es trabajo repetido que podría memoizarse.

**Mitigación:** cachear el resultado invalidando al escribir (o dejarlo, por simplicidad).

### B5-4 · Meta diaria fija (180) y duplicada backend/frontend

`GOAL_MINUTES = 180` está en `stats.service.js:4` y otra vez en `frontend/src/utils/time.js:2`
(ver **B0-1**). Si se quisiera configurar por usuario, habría que tocar ambos lados.

**Mitigación:** fuente única de constantes compartida.

---

## Bloque 6 — Frontend: arranque y orquestación

Revisión de `frontend/src/main.jsx` (montaje de React) y `frontend/src/App.jsx`
(contenedor/orquestador y modales globales).

### B6-1 · Sin Error Boundary (un error deja la pantalla en blanco)

`main.jsx` envuelve `<App/>` en `StrictMode`, pero **no** en un *Error Boundary*. Si cualquier
vista lanza durante el render, React desmonta todo el árbol y el usuario ve una pantalla en
blanco sin mensaje ni opción de recuperación.

**Mitigación:** añadir un *Error Boundary* (clase con `componentDidCatch`) o
`react-error-boundary` alrededor de las vistas.

**Resuelto:** nuevo `frontend/src/components/ErrorBoundary.jsx` (clase: React lo exige, los hooks
no cubren `componentDidCatch`; excepción documentada a "sin clases") con fallback en español
(`role="alert"` + botón "Recargar página"), envolviendo el `<main>` de `App.jsx` con `key={tab}`:
la cabecera y las pestañas siguen utilizables y **cambiar de pestaña reinicia el límite de error**.
Sin `react-error-boundary` (regla 1: sin dependencias innecesarias).
Tests: `frontend/test/components/ErrorBoundary.test.jsx`, verificado por mutación.

### B6-2 · Error de borrado no gestionado (se traga el fallo)

`App.jsx:49-59`, `handleConfirmDelete` tiene `try/finally` pero **sin `catch`**. Si
`sessionsApi.remove` falla, la promesa rechazada queda **sin manejar**: el diálogo no muestra
error, permanece abierto y no se informa al usuario.

**Mitigación:** capturar el error y mostrarlo (p. ej. pasarlo a `ConfirmDialog`), o notificar
con un aviso.

**Resuelto:** `handleConfirmDelete` (`App.jsx`) añade `catch` que guarda el mensaje en
`deleteError` y lo pasa al `ConfirmDialog` (nuevo prop `error`, pintado con `role="alert"`);
el diálogo queda **abierto** para reintentar o cancelar y el error se limpia al cancelar o al
volver a intentar (mismo patrón inline que `SessionForm`). Tests:
`frontend/test/App.test.jsx` y `frontend/test/components/ConfirmDialog.test.jsx`, verificados
por mutación.

### B6-3 · Sin enrutado/URL (recargar siempre vuelve a Inicio)

La pestaña activa es solo estado en memoria (`tab`). No hay router ni sincronización con la
URL: no se puede compartir un enlace a "Estadísticas" y recargar la página siempre vuelve a
Inicio. Tampoco hay navegación atrás/adelante entre pestañas.

**Mitigación:** sincronizar `tab` con `location.hash` o introducir un router ligero.

### B6-4 · `App` accede a la API directamente (mezcla capas)

`App.jsx` importa `sessionsApi` y llama a `create`/`update`/`remove` dentro de sus handlers,
mientras que las lecturas pasan por hooks. Mezcla orquestación de UI con acceso a datos.

**Mitigación:** centralizar las mutaciones en un hook/servicio de datos para que `App` solo
orqueste.

### B6-5 · Fecha cruda `YYYY-MM-DD` en el diálogo de borrado

El mensaje de `ConfirmDialog` interpola `toDelete.date` tal cual, en lugar de usar
`formatDateLong` como el resto de la app (inconsistencia de formato para el usuario).

**Mitigación:** formatear la fecha con `formatDateLong`.

---

## Bloque 7 — Frontend: red y datos

Revisión de `frontend/src/api/client.js` (fetch genérico), `sessions/sessions.api.js`,
`stats/stats.api.js` (endpoints) y los hooks `useSessions.js` / `useStats.js` (estado de carga).

### B7-1 · `request` pierde el código de estado HTTP

`client.js:13-14` lanza `new Error(data.error || '...')`: solo conserva el **mensaje**, no el
`status`. El consumidor no puede distinguir un `404` de un `400`/`500` para reaccionar
distinto (p. ej. mostrar "no encontrado" frente a "error de red").

**Mitigación:** lanzar un error con `status` (clase propia o `error.status = response.status`).

**Resuelto:** clase `ApiError extends Error` con `status`, en su propio archivo
`frontend/src/api/ApiError.js`; `request` la lanza con el `status` de la respuesta. Los
consumidores actuales no cambian (usan `.message`) pero ya pueden distinguir 400/404/500.
Test: `frontend/test/api/client.test.js` (con `fetch` simulado), verificado por mutación.

### B7-2 · Sin cancelación ni orden de respuestas (race en los hooks)

`useSessions`/`useStats` no usan `AbortController` ni comprueban el orden de las respuestas. Si
dos recargas se solapan, una respuesta lenta puede **pisar** a una más nueva; además, se hace
`setState` sobre componentes ya desmontados. (Relacionado con **B0-5**.)

**Mitigación:** `AbortController` y/o descartar respuestas fuera de orden.

### B7-3 · Merge de cabeceras frágil (`Content-Type` se puede borrar)

En `client.js:5-8` el orden `{ headers: {...}, ...options }` hace que, si un llamador pasa su
propio `headers`, se reemplace el objeto entero y se **pierda** `Content-Type`. Hoy ningún
llamador lo hace, pero es una trampa latente.

**Mitigación:** fusionar cabeceras explícitamente
(`headers: { 'Content-Type': '...', ...options.headers }`).

### B7-4 · `Content-Type` enviado también en peticiones `GET`

Se añade la cabecera `Content-Type` a todas las peticiones, incluidas las `GET` (que no tienen
cuerpo). Es inocuo, pero innecesario.

**Mitigación:** añadir la cabecera solo cuando hay body.

---

## Bloque 8 — Frontend: utilidades y componentes base

Revisión de `frontend/src/utils/time.js`, `frontend/src/utils/date.js` y los componentes
`frontend/src/components/{Card,Modal,ConfirmDialog,Tabs}.jsx`.

### B8-1 · Formateadores de fecha sin validar (producen `Invalid Date`)

`fromDateString` (`date.js:18-21`) construye un `Date` a partir de un string sin comprobar su
formato. Con un valor mal formado, el `Date` queda inválido y `formatDateLong` devuelve texto
con `NaN` ("NaN undefined NaN") **sin lanzar error**. Es el mismo patrón de validación de fechas
ausente que en **B3-2** y **B4-4**.

**Mitigación:** validar el formato `YYYY-MM-DD` centralizadamente y devolver `''` o lanzar.

### B8-2 · `Modal` sin focus trap, sin restaurar foco ni bloquear scroll

El `Modal` cierra con Escape y clic en el fondo, pero **no atrapa el foco** (se puede tabular
fuera), **no devuelve el foco** al elemento que lo abrió al cerrarse y **no bloquea el scroll**
del fondo. Funciona visualmente, pero es incompleto en accesibilidad.

**Mitigación:** focus trap (o librería de diálogos), restaurar foco al cerrar y `overflow` del
`body`.

**Resuelto (22/10/2026, spec `specs/001-modal-accesible/`):** `Modal` enfoca al abrir el primer
campo editable, si no el primer botón del cuerpo y, si no, el contenedor; atrapa Tab/Shift+Tab
(saltando deshabilitados y `[hidden]`); al desmontar devuelve el foco al disparador o, si ya no
existe, a `main` (`tabIndex={-1}`); bloquea el scroll del `body` y restaura el `overflow` previo;
y el fondo ya **no** cierra el diálogo. Se retiró el `autoFocus` de `SessionForm` para que la
regla viva solo en `Modal`. Sin dependencias nuevas. Tests: `frontend/test/components/Modal.test.jsx`
(15 casos), verificados por mutación (foco inicial, trampa, restauración, fallback, scroll y
cierre por fondo e interior).

### B8-3 · `goalProgress` sin límite inferior (acepta negativos)

`time.js:27-29` hace `Math.min(100, Math.round((minutes || 0) / GOAL_MINUTES * 100))` pero **no**
aplica `Math.max(0, …)`. Con minutos negativos (dato corrupto) el porcentaje sería negativo.
`formatMinutes` sí normaliza a 0; aquí falta la guarda.

**Mitigación:** añadir `Math.max(0, …)`.

### B8-4 · Lógica "lunes = 0" duplicada (`formatDateLong` vs `weekdayIndex`)

`formatDateLong` (`date.js:34`) calcula en línea `(date.getDay() + 6) % 7`, cuando ya existe
`weekdayIndex` (`date.js:70-72`) para exactamente esa regla. Duplicación que puede
desincronizarse.

**Mitigación:** reutilizar `weekdayIndex` dentro de `formatDateLong`.

### B8-5 · `combineDuration` convierte valores inválidos en `0` en silencio

`time.js:22-24` usa `Number(hours) || 0` y `Number(minutes) || 0`, de modo que un valor no
numérico se convierte en `0` sin avisar, enmascarando posibles errores de entrada.

**Mitigación:** validar y señalar la entrada inválida en lugar de asumir `0`.

> **Notas menores de accesibilidad/cohesión** (sin ID, no accionables por separado): `Tabs`
> usa `role="tab"` sin `aria-controls`/`tabpanel`; `Card` no enlaza su título como encabezado.

---

## Bloque 9 — Frontend: feature Historial

Revisión de `frontend/src/sessions/*` (`HistoryView`, `SessionFilters`, `SessionForm`,
`SessionList`, `SessionRow`).

### B9-1 · Validación de dominio duplicada en `SessionForm` (refuerza B0-1)

`SessionForm.jsx:6-8` redefine `TITLE_MAX = 80`, `NOTES_MAX = 500` y `MIN_DURATION = 15`, las
mismas reglas que valida el backend (`sessions.service.js`). Al no compartir fuente, ambas
capas pueden divergir sin que nada avise.

**Mitigación:** compartir las reglas desde un módulo común.

### B9-2 · Búsqueda sin `debounce` (una petición por pulsación)

`SessionFilters` → `HistoryView.filters` → `useSessions`: cada tecla en "Buscar" cambia `q`,
`reload` cambia y el `useEffect` dispara una petición. Escribir "Matemáticas" son ~11 llamadas.

**Mitigación:** `debounce` (o búsqueda al enviar).

### B9-3 · Límite de duración: el mensaje no coincide con el máximo real (front y back sí coinciden)

> **Corrección (auditoría del código):** una lectura previa afirmaba que el front permitía
> 23h59m y el backend solo 23h. **Es incorrecto.** `SessionForm.jsx` limita a `max="23"` h y
> `max="59"` m, y el backend calcula `DURATION_MAX = HOURS_MAX * 60 + MINUTES_MAX = 1439` min
> (23h 59m). **Ambas capas coinciden**; no hay inconsistencia de límites.

Lo que sí queda como debilidad:

- El mensaje de error del backend (`sessions.service.js:30`) dice "no puede superar las 23
  horas", pero en realidad admite hasta 23h 59m: el texto no describe el límite real.
- `SessionForm.jsx:59` **solo** valida el mínimo en JS; el máximo se delega al atributo HTML
  `max`, no a una comprobación explícita. Si ese atributo se saltara (navegador permisivo,
  pegado, scripts), el cliente no lo detectaría.

**Mitigación:** alinear el texto del mensaje con el límite real (o cambiar el límite) y validar
el máximo también en JavaScript.

### B9-4 · Mensajes de error del formulario sin rol accesible

`SessionForm.jsx:143` pinta `<p className="error">` sin `role="alert"` ni `aria-describedby`
asociado al campo. Los lectores de pantalla pueden no anunciar el error.

**Mitigación:** `role="alert"` y asociar el mensaje al campo.

### B9-5 · Filtros `from`/`to` sin comprobar rango invertido

`SessionFilters` permite elegir `from > to`; la lista queda vacía sin explicar por qué. Mismo
vacío de validación de fechas que **B3-2** / **B4-4**, ahora en el cliente.

**Mitigación:** validar el orden y avisar.

### B9-6 · `Number(...) || 0` enmascara entradas inválidas del formulario

`SessionForm.jsx:69-70` usa `Number(form.hours) || 0` (mismo patrón que **B8-5**).

**Mitigación:** validar la entrada en vez de asumir `0`.

---

## Bloque 10 — Frontend: feature Inicio/Estadísticas

Revisión de `frontend/src/stats/*` (`StatsDashboard`, `StatsPanel`, `PeriodFilter`, tarjetas,
`ActivityHeatmap`, `SubjectBreakdown`, `useStats`).

### B10-1 · `StatsPanel` refiltra el periodo en cliente y carga todas las clases

`StatsPanel.jsx:19` llama a `useSessions({}, version)` (todas las clases) y luego, en
`StatsPanel.jsx:21-23`, filtra por `stats.period.from/to` **otra vez** en el navegador. Duplica
la lógica de periodos del backend y puede desincronizarse con `summary`; además transfiere más
datos de los necesarios.

**Mitigación:** pedir al backend las sesiones del periodo (`from`/`to`) y no refiltrar.

### B10-2 · `PERIOD_OPTIONS` duplica `PERIODS` del backend (refuerza B0-1)

`PeriodFilter.jsx:1-9` define la lista de periodos y etiquetas, mientras el backend tiene
`PERIODS` en `utils/date.js`. `StatsDashboard` además deriva `HEATMAP_OPTIONS` filtrando
`day`. Dos listas que pueden divergir.

**Mitigación:** fuente única de periodos.

### B10-3 · Umbrales del heatmap (`level`) hardcodeados sin documentar

`ActivityHeatmap.jsx:4-10` fija los cortes de color en 60, 120 y `GOAL_MINUTES` (180). La escala
es arbitraria y solo el último corte se relaciona con la meta; no está en `AGENTS.md`.

**Mitigación:** definir la escala como constantes documentadas.

### B10-4 · `buildColumns` asume serie contigua y no rellena la última semana

`ActivityHeatmap.jsx:13-46` solo rellena los huecos de la **primera** semana del lado izquierdo;
asume que los días llegan contiguos y en orden. Si el backend devolviera huecos, el calendario
se desalinearía (frágil, aunque hoy el backend siempre devuelve serie completa).

**Mitigación:** construir la rejilla por posición de fecha (día de la semana) en vez de asumir
contigüidad.

### B10-5 · Tarjetas con `?? 0` silencian cambios de forma del contrato

`StreakCard` y `GoalTodayCard` usan valores por defecto (`?? 0`) y `ActivityDaysCard`
parámetros por defecto, todo sobre los datos del backend. Si el contrato cambiara, mostrarían
`0` en vez de fallar (relacionado con **B0-6**).

**Mitigación:** validar el contrato en el borde.

### B10-6 · El error/estado de `useSessions` en `StatsPanel` no se muestra

`StatsPanel.jsx:19` desestructura solo `sessions` de `useSessions` (ignora su `error`/`loading`)
y pasa a `SessionList` el `loading`/`error` de `useStats`. Si falla la carga de **sesiones**,
`periodSessions` queda vacío y la lista dice "No hay clases" (incorrecto) en vez de mostrar el
error.

**Mitigación:** propagar también el estado de `useSessions`.

**Resuelto:** `StatsPanel` desestructura `loading`/`error` de `useSessions` y los combina con los
de `useStats` para `SessionList` (`loading || sessionsLoading`, `error || sessionsError`): si la
carga de sesiones falla, la lista muestra el error en vez de "No hay clases".
Test: `frontend/test/stats/StatsPanel.test.jsx`, verificado por mutación.

---

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

---

## Bloque 12 — Veredicto transversal

Síntesis de la revisión. **No añade IDs nuevos** (los hallazgos son transversales y ya están
registrados arriba). Temas recurrentes, ordenados por impacto:

1. **Ausencia de red de seguridad**: sin tests ni linter — **B0-2 / B1-2 / B5-1**.
2. **Validación de fechas transversal**: el mismo vacío reaparece en backend y frontend —
   **B3-2 / B4-4 / B8-1 / B9-5**.
3. **Duplicación de reglas y constantes entre capas**: meta, periodos, validaciones, filtrado —
   **B0-1 / B5-4 / B9-1 / B10-1 / B10-2**.
4. **Concurrencia e invalidación**: carga/escritura en disco y recargas en cliente —
   **B0-3 / B0-5 / B7-2**.
5. **Accesibilidad de modales y mensajes**: **B8-2 / B9-4 / B11-4**.

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
5. **B0-6** — contratos (JSDoc + `@ts-check`, constantes compartidas).
6. **B0-5 / B7-2** — invalidación de datos (Context por recurso + `AbortController`) y orden de
   respuestas en los hooks.
7. **B0-1 / B5-4 / B9-1 / B10-1 / B10-2** — fuente única de constantes y reglas de dominio
   (meta diaria, periodos, validaciones) y eliminar el filtrado duplicado en cliente.
8. **B0-4 / B1-5** — sincronizar documentación.
9. **Resto de pendientes de baja severidad** — ajustes de configuración y limpieza suelta,
   atacables por orden de bloque y severidad según las tablas de resumen.
10. **B4-2** — endurecer/documentar el update parcial de duración.
11. **B8-2 / B9-4 / B11-4** — accesibilidad: `Modal` (focus trap, restaurar foco, bloquear
    scroll), mensajes de error accesibles y `:focus-visible`/`prefers-reduced-motion`.
12. **B9-2** — `debounce` en la búsqueda por temática.
13. ✅ **B1-8** — subir **Vite a una *major*** para eliminar las vulnerabilidades `esbuild`/`vite`
    (cambio *breaking*: afecta a `vite.config.js` y `@vitejs/plugin-react`). Hacerlo con
    `npm test` y `npm run lint` como red de seguridad. *(hecho en la sesión del punto 3:
    `vite@8.3.4` + `@vitejs/plugin-react@6.1.2`, `npm audit` → 0 vulnerabilidades; de paso quedó
    montada la infraestructura de tests de frontend sobre Vite 8)*.
