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
**Mitigación sugerida:** declarar `"engines"` que cubra el mínimo del toolchain real
(`vite@8.3.4`: `>=22.12.0`; `vitest@5.0.5`: `^22.12.0 || ^24 || >=26`).

**Resuelto (30/10/2026):** añadido `"engines"` en `package.json`, `backend/package.json` y
`frontend/package.json` con `"node": "^22.12.0 || ^24.0.0 || >=26.0.0"` y `"npm": ">=10.0.0"`.
No se tocaron dependencias ni `package-lock.json`; verificación con `npm test`
(119 pasados: 40 frontend + 62 backend + 17 contract) y `npm run lint` limpio.
El rango es la intersección de Vite 8.3.4 (`^20.19.0 || >=22.12.0`) y Vitest 5.0.5
(`^22.12.0 || ^24.0.0 || >=26.0.0`). `engine-strict` sigue `false`; `.npmrc` no se añadió.

### B1-2 · Sin scripts de `test`/`lint` en los paquetes

**Resuelto:** la raíz expone `npm test` (`node --test` por workspace) y `npm run lint`
(ESLint); `backend` expone su propio `test`. Detalle: commit `6e4c1d5`.

### B1-3 · Proxy de Vite acoplado al puerto `3001` del backend

`frontend/vite.config.js:9` fijaba `proxy: { '/api': 'http://localhost:3001' }` con el puerto
*hardcodeado*, pero el backend lo toma de `PORT` (`backend/src/server.js:3`). Si se cambiaba el
puerto del backend, el frontend dejaba de encontrar la API **sin error de build** (fallaba en
runtime con 404/proxy error).

**Impacto:** acoplamiento oculto entre dos archivos de configuración.
**Resuelto:** `frontend/vite.config.js:9` ahora usa `globalThis.process?.env?.VITE_PROXY_TARGET || 'http://localhost:3001'`; el puerto no está hardcodeado y se puede configurar por entorno. No se tocó `client.js` (ese es `B1-7`). Solo lee variables del shell; leer `.env` requiere `loadEnv` (ver `B1-10`, **resuelto**).

### B1-4 · `.gitignore` con entradas redundantes de `node_modules`

**Resuelto:** `.gitignore` ajustado para dejar únicamente `node_modules/`; se retiraron
`frontend/node_modules/` y `backend/node_modules/` (redundantes por hoisting de workspaces).
Sin impacto funcional; solo limpieza del archivo de configuración.

### B1-5 · Estructura/funcionalidades duplicadas: `README.md` vs `AGENTS.md`

`README.md` describe funcionalidades y estructura que también mantiene `AGENTS.md` como
fuente de desarrollo. Esa doble fuente ya divergió una vez (ver **B0-4**, la regla de racha).

**Impacto:** documentación que puede contradecirse; coste de mantener dos sitios.
**Mitigación aplicada:** `README.md` es la fuente oficial (funcionalidades, reglas, modelo, API); `AGENTS.md` conserva lo operativo (capas, convenciones, flujo SDD, comandos) y remite a `README.md`. Se evita duplicación de reglas de negocio.

### B1-6 · Configuración de red permisiva (`cors()` abierto + `--host 0.0.0.0`)

`backend/src/app.js:9` usa `cors()` **sin `origin`** (acepta cualquier origen) y
`frontend/package.json:7` arranca con `vite --host 0.0.0.0` por defecto (expone el servidor a
la red local). Aceptable para desarrollo local; a revisar si el proyecto se despliega o se
expone en una red no confiable.

**Mitigación sugerida:** restringir `origin` al frontend esperado y no usar `0.0.0.0` por
defecto (o dejarlo tras un flag/script aparte).

**Resuelto (2026-11-06):** `specs/003-red-proxy-cors/` cubre B1-6, B1-7, B1-10 y B1-11. El middleware CORS se elimina (`backend/src/app.js` + `package.json`): el backend ya no emite `Access-Control-Allow-Origin` ni rechaza por `Origin`; el proxy activo con `/api` relativa (`frontend/src/api/client.js`) es la vía de desarrollo. `loadEnv` en `frontend/vite.config.js` lee el `.env` de la raíz y `host` queda restringido a `localhost` (`frontend/vite.config.js`). Ver `spec.md`, `plan.md`, `tasks.md`.

### B1-7 · El proxy de Vite no se usa: la URL por defecto de la API es absoluta

`frontend/src/api/client.js:1` define `API_URL` como
`import.meta.env.VITE_API_URL || 'http://localhost:3001/api'`. Al ser una **URL absoluta** (con
dominio y puerto), las peticiones del navegador van **directas** al `:3001` y **nunca llegan al
servidor de Vite**, de modo que el proxy de `frontend/vite.config.js:8-10` **no se usa** en la
práctica. Para colmo, `AGENTS.md` afirma que "el proxy de Vite ya reenvía `/api`", lo que
induce a creer que sí actúa. Como consecuencia inevitable, en desarrollo el navegador habla con
un origen distinto (`:5173` → `:3001`).

**Impacto:** configuración muerta y engañosa; se cree tener proxy cuando no lo hay.
**Mitigación sugerida:** usar una ruta relativa por defecto (`VITE_API_URL || '/api'`) para que
el proxy haga su trabajo (y CORS deje de ser necesario en desarrollo), **o** eliminar el proxy
y documentar explícitamente que las peticiones van directas al backend.

**Resuelto (2026-11-06):** `frontend/src/api/client.js` usa `/api` relativa (`specs/003-red-proxy-cors/spec.md` RF-1); proxy de Vite (`frontend/vite.config.js`) lee `.env` (`loadEnv`) y reenvía `/api`.

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

### B1-10 · El proxy de Vite no lee `.env` (solo variables del shell)

`frontend/vite.config.js:9` usa `globalThis.process?.env?.VITE_PROXY_TARGET`. Vite **no inyecta**
`.env`, `.env.local`, `.env.[mode]` ni `.env.[mode].local` en `process.env` durante la evaluación
de `vite.config.*`; solo están las variables que ya existen en el entorno del proceso (shell).
Para leer `.env` en la config hay que usar `loadEnv(mode, process.cwd(), '')` y consumir el
objeto que devuelve.

**Impacto:** si alguien define `VITE_PROXY_TARGET` en un `.env`, el proxy lo ignora y sigue
apuntando al `3001` por defecto, sin error visible.
**Mitigación:** envolver la config en `defineConfig(({ mode }) => { const env = loadEnv(mode, process.cwd(), ''); ... })`
y usar `env.VITE_PROXY_TARGET`. No cambia el contrato ni requiere dependencias nuevas.

**Resuelto (2026-11-06):** `frontend/vite.config.js` usa `loadEnv(mode, rootDir, 'VITE_')`, donde
`rootDir` es la raíz del repositorio calculada desde la ubicación del archivo de configuración
(no `process.cwd()`, que en el workspace es `frontend`); el `.env` de la raíz se lee y
`VITE_PROXY_TARGET` cambia el destino del proxy con precedencia del entorno del proceso
(`specs/003-red-proxy-cors/plan.md`).

### B1-11 · Bind del backend a todas las interfaces (`*:3001`)

`backend/src/server.js` arranca con `app.listen(PORT)` sin host, por lo que Express escucha en
todas las interfaces de red. En una red no confiable, cualquiera puede alcanzar la API
directamente; el proxy y la ausencia de CORS solo protegen al navegador, no el acceso HTTP.

**Impacto:** exposición de la API fuera de localhost en desarrollo.
**Resuelto (2026-11-06):** `backend/src/serverConfig.js` devuelve `127.0.0.1` como host por
defecto y `backend/src/server.js` escucha en ese host. `HOST` sigue disponible como override
explícito (`HOST=0.0.0.0 npm run backend`) para quien necesite exponerlo a propósito. Ver
`specs/003-red-proxy-cors/` y `backend/test/serverConfig.test.js`.

---

