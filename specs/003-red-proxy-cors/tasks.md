# Tasks 003 — Red, proxy y CORS seguros

> Spec: specs/003-red-proxy-cors/spec.md · Plan: specs/003-red-proxy-cors/plan.md
> Estado: completada (corrección 2026-11-06)

Cada tarea es un cambio pequeño y verificable. El campo «Test» indica qué prueba debe existir antes de dar la tarea por hecha; si el test no falla al revertir el cambio, la tarea no está terminada.

## T0 — Reabrir estados y dejar de dar la feature por cerrada

- [x] En `spec.md`, cambiar `Estado: implementada` por `Estado: aprobada (corregida 2026-11-06)`.
- [x] En `tasks.md`, cambiar `Estado: completada` por `Estado: en curso`.
- [x] En `MEMORY.md`, cambiar el estado de 003 a «en validación».
- [x] Desmarcar todas las tareas hasta que tengan tests y verificación real de esta corrección.
- Test: revisión manual de los tres estados.
- Hecho cuando: spec sigue `aprobada`, tareas en `en curso` y `MEMORY.md` no afirma que está
  implementada.

## T1 — Corregir el contrato funcional de `spec.md`

- [x] Reescribir el contexto e incluir el bind del backend a todas las interfaces.
- [x] RF-1: el frontend usa siempre `/api` relativo; ninguna variable lo desvía.
- [x] RF-2: limitarlo al servidor de aplicaciones; la configuración CORS del servidor de
  desarrollo queda fuera de alcance.
- [x] RF-3: precedencia entorno del proceso > `.env` de la raíz > `http://localhost:3001`; valor
  vacío equivale a no definido.
- [x] RF-5: el servidor de desarrollo escucha solo en local y el backend escucha en loopback por
  defecto, con override explícito.
- [x] Actualizar definiciones, NFR de seguridad, casos límite, fuera de alcance, criterios de
  finalización y dudas abiertas.
- [x] Eliminar el criterio de 375 px y registrar que el layout queda fuera de alcance (`B11-7`).
- Test: revisión manual contra `RF-1`–`RF-5` y `rg -n "VITE_API_URL|375|bind" spec.md`.
- Hecho cuando: la spec describe un único modelo coherente y no exige trabajo de UI.

## T2 — Limpiar `spec.md` de implementación y ambigüedades

- [x] Eliminar del cuerpo de la spec los nombres `frontend/vite.config.js`, `backend/src/app.js`,
  `ApiError`, `cors()`, `--host`, `loadEnv`, `client.js` y `app.js`.
- [x] Expresar RF-5 como comportamiento del servidor de desarrollo y del servidor de aplicaciones.
- [x] Cambiar la NFR de dependencias por: «no se añaden dependencias; se permite retirar `cors` y
  ajustar scripts de desarrollo».
- [x] Cambiar la NFR de capas para que no nombre archivos.
- Test: `rg -n "frontend/|backend/|ApiError|loadEnv|vite\.config|client\.js|app\.js|--host" spec.md`
  no debe devolver nada.
- Hecho cuando: la spec solo describe comportamiento observable y no queda ambigüedad de
  configuración.

## T3 — Corregir `plan.md`

- [x] Actualizar el mapa RF → test con los casos de RF-1 a RF-5.
- [x] Añadir `backend/src/serverConfig.js`, `backend/src/server.js` y
  `backend/test/serverConfig.test.js` a la tabla de archivos.
- [x] Documentar `loadEnv` con la raíz y prefijo `VITE_`, la precedencia de `VITE_PROXY_TARGET` y
  el valor vacío.
- [x] Documentar el bind del backend en `127.0.0.1` con `HOST` explícito.
- [x] Añadir el riesgo de reintroducir un bypass por `VITE_API_URL`.
- [x] Retirar el layout a 375 px del alcance y enlazarlo con `B11-7`.
- [x] Incluir en el orden: corregir spec → plan → tareas → tests/código → docs → verificación.
- Test: revisión manual de que cada RF aparece en un paso y en el mapa RF → test.
- Hecho cuando: el plan se puede ejecutar sin adivinar archivos, tests ni configuración de entorno.

## T4 — Rehacer `tasks.md` con tests y estados reales

- [x] Mantener la lista de tareas alineada con la spec y el plan corregidos.
- [x] Ninguna tarea puede seguir `[x]` sin test y verificación de esta corrección.
- [x] Añadir T10 para el bind del backend (`B1-11`) y T14 para retirar el layout de 375 px.
- Test: revisión manual de que cada RF tiene tarea, test y «hecho cuando».
- Hecho cuando: el estado de las tareas refleja la realidad y no hay checkboxes optimistas.

## T5 — RF-1: ruta relativa fija `/api`

- [x] En `frontend/src/api/client.js`, usar `const API_URL = '/api';` y eliminar la lectura de
  `VITE_API_URL`.
- [x] En `frontend/test/api/client.test.js`, mantener el caso que afirma `fetch('/api/sessions')`.
- [x] Añadir un caso que defina `VITE_API_URL` con `vi.stubEnv` y `vi.resetModules()`, importe el
  cliente de nuevo y compruebe que sigue usando `/api/sessions`.
- [x] Limpiar el entorno simulado en `afterEach` con `vi.unstubAllEnvs()`.
- Test: el caso debe fallar si se vuelve a leer `VITE_API_URL`.
- Hecho cuando: `npm run test --workspace frontend` pasa y la mutación del bypass hace fallar
  este test.

## T6 — RF-2: ausencia de cabeceras CORS en el backend

- [x] En `backend/test/app.test.js`, mantener el caso que pide `/api/health` con
  `Origin: http://evil.example`.
- [x] Afirmar que la respuesta es `200` y que
  `response.headers.get('access-control-allow-origin')` es `null`.
- [x] Mantener el caso `OPTIONS` con `Origin` externo y afirmar que no hay cabeceras CORS.
- [x] Arrancar el servidor de test con `app.listen(0, '127.0.0.1')`.
- [x] No cambiar `backend/src/app.js`: `cors()` ya está eliminado.
- Test: añadir una cabecera `Access-Control-Allow-Origin` debe hacer fallar estos casos.
- Hecho cuando: `npm run test --workspace backend` pasa y la mutación con `cors()` falla.

## T7 — RF-3: leer el `.env` de la raíz, precedencia y vacío

- [x] En `frontend/vite.config.js`, calcular el directorio raíz desde `import.meta.dirname`.
- [x] Llamar a `loadEnv(mode, rootDir, 'VITE_')`.
- [x] Calcular el destino con
  `process.env.VITE_PROXY_TARGET?.trim() || env.VITE_PROXY_TARGET?.trim() || 'http://localhost:3001'`.
- [x] En `frontend/test/vite.config.test.js`, afirmar que `loadEnv` se llama con la raíz y el
  prefijo `VITE_`.
- [x] Añadir casos: sin variable usa el defecto; con `VITE_PROXY_TARGET` usa ese valor; el
  entorno del proceso gana al `.env`; un valor vacío usa el defecto.
- Test: el test debe fallar si se vuelve a `process.cwd()`, si se invierte la precedencia o si un
  valor vacío se propaga.
- Verificación manual: crear un `.env` temporal en la raíz con
  `VITE_PROXY_TARGET=http://localhost:3999`, arrancar `npm run dev` y comprobar que
  `curl http://localhost:5173/api/health` no devuelve 200 del backend real; borrar el `.env`
  después. El `.env` está ignorado por git.
- Hecho cuando: los tests pasan, la mutación falla y el `.env` raíz cambia el destino del proxy.

## T8 — RF-4: errores de red en español

- [x] En `frontend/src/api/client.js`, mantener `fetch` dentro de `try/catch`.
- [x] En el `catch`, lanzar
  `new ApiError('No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.', 0)`.
- [x] Mantener el comportamiento de respuestas HTTP no `ok` y el `204`.
- [x] En `frontend/test/api/client.test.js`, mantener el caso con `fetch` rechazando
  `TypeError('Failed to fetch')`; afirmar `ApiError`, `status` 0, mensaje español y ausencia de
  `Failed to fetch`.
- [x] En `frontend/test/stats/StatsPanel.test.jsx`, mantener el caso con `statsApi.get` rechazando
  un `ApiError` de red; afirmar el mensaje español y que no aparece `0m`.
- Test: quitar el `try/catch` debe hacer fallar el test del cliente.
- Hecho cuando: la UI muestra el mensaje español ante un `fetch` rechazado y no muestra datos
  falsos.

## T9 — RF-5 (frontend): host y scripts sin `0.0.0.0`

- [x] En `frontend/test/vite.config.test.js`, afirmar que `config.server.host` es `localhost`.
- [x] Afirmar que `package.json.scripts.dev` y `package.json.scripts.preview` no contienen
  `0.0.0.0`.
- [x] Mantener `frontend/package.json` con `dev: "vite"` y `preview: "vite preview"`.
- Test: cambiar `host` a `0.0.0.0` o volver a `vite --host 0.0.0.0` debe hacer fallar el test.
- Verificación manual: `ss -ltnp | grep 5173` debe mostrar `127.0.0.1:5173`, no `0.0.0.0:5173`.
- Hecho cuando: el test pasa y `ss` confirma el bind local.

## T10 — RF-5 (backend) y B1-11: bind local por defecto

- [x] Crear `backend/src/serverConfig.js` con `DEFAULT_PORT`, `DEFAULT_HOST` y
  `getServerConfig(env = process.env)`.
- [x] `getServerConfig` devuelve `{ port, host }`: puerto por defecto `3001` y host por defecto
  `127.0.0.1`; `HOST` y `PORT` explícitos se respetan; valores vacíos usan el defecto.
- [x] En `backend/src/server.js`, usar `getServerConfig()` y `app.listen(port, host, ...)`.
- [x] Crear `backend/test/serverConfig.test.js` con casos de valores por defecto, override,
  `PORT` y cadenas vacías.
- Test: cambiar el host por defecto a `0.0.0.0` debe hacer fallar el test.
- Verificación manual: `ss -ltnp | grep 3001` debe mostrar `127.0.0.1:3001`, no `0.0.0.0:3001`
  ni `*:3001`.
- Hecho cuando: el test pasa, `ss` confirma loopback y `HOST=0.0.0.0` solo expone si se pide de
  forma explícita.

## T11 — Actualizar `AGENTS.md`

- [x] Añadir `backend/src/serverConfig.js` y `backend/test/serverConfig.test.js` a la estructura.
- [x] Documentar que el frontend usa siempre `/api` relativo y que `VITE_API_URL` ya no existe.
- [x] Documentar que `VITE_PROXY_TARGET` se lee del entorno del proceso o del `.env` de la raíz,
  con precedencia del proceso y valor por defecto `http://localhost:3001`.
- [x] Documentar que el backend escucha en `127.0.0.1` por defecto y que `HOST` permite exponerlo
  de forma explícita.
- [x] Revisar si hay más referencias a `0.0.0.0`, `http://localhost:3001/api` o CORS abierto.
- Test: `rg -n "0\\.0\\.0\\.0|http://localhost:3001/api|VITE_API_URL" AGENTS.md` y revisar que no
  quede una instrucción falsa.
- Hecho cuando: la guía operativa coincide con la implementación.

## T12 — Sincronizar documentación, deuda y estados (solo tras T13)

- [x] En `DEUDA_TECNICA.md`, confirmar B1-6, B1-7, B1-10 y B1-11 como resueltos con fecha y
  referencia a `specs/003-red-proxy-cors/`.
- [x] Documentar B1-11: `127.0.0.1` por defecto y `HOST` explícito.
- [x] Añadir `B11-7` para el layout a 375 px, indicando que es preexistente y que se sacó de 003.
- [x] En `MEMORY.md`, actualizar el estado de 003 y el número de tests tras T13; mantener el
  archivo dentro de ~50 líneas.
- [x] Solo si T13 pasa: `spec.md` → `implementada`, `tasks.md` → `completada`, `MEMORY.md` →
  `implementada`.
- [x] Si T13 falla: dejar `spec.md` en `aprobada`, `tasks.md` en `en curso` y `MEMORY.md` en
  «en validación».
- Test: revisión manual de coherencia entre spec, tasks y MEMORY.
- Hecho cuando: no hay estado que afirme más de lo verificado.

## T13 — Verificación final, mutación y UI

- [x] Ejecutar `npm test` desde la raíz; deben pasar backend, frontend y contrato.
- [x] Ejecutar `npm run lint`; debe quedar limpio.
- [x] Ejecutar `npm run build`; no debe fallar la configuración de Vite.
- [x] Ejecutar la mutación copiando antes los archivos a `/tmp/opencode/003-correcciones/`:
  - `API_URL` con `VITE_API_URL` → debe fallar T5.
  - `middleware` que añada `Access-Control-Allow-Origin` → debe fallar T6.
  - `loadEnv(..., process.cwd(), ...)` → debe fallar T7.
  - precedencia invertida de `VITE_PROXY_TARGET` → debe fallar T7.
  - valor vacío propagado en lugar del defecto → debe fallar T7.
  - quitar el `try/catch` de `client.js` → debe fallar T8.
  - `host: '0.0.0.0'` o `dev: "vite --host 0.0.0.0"` → debe fallar T9.
  - host por defecto `0.0.0.0` en el backend → debe fallar T10.
- [x] Restaurar cada archivo con `cp` desde `/tmp/opencode`; no usar `git checkout -- <carpeta>`.
- [x] Verificar `git diff` después de restaurar: no debe quedar ninguna mutación.
- [x] UI con Chrome DevTools: proxy 200 en `/api/sessions`; sin cabeceras CORS en el backend;
  hosts locales; error de red en español; sin `0m` falso.
- [x] Comprobar `git status`: solo cambios esperados; nada de `.env` ni `backend/data`.
- [x] Registrar en `tasks.md` los comandos, resultados y mutaciones.
- Hecho cuando: tests, lint, build, mutación y UI pasan; no queda deuda de verificación.

## T14 — Retirar el layout de 375 px del alcance

- [x] En `frontend/src/styles.css`, revertir el arreglo de 375 px (quitar `max-width: 100%` y
  `overflow-x: auto` de `.tabs`), dejando el archivo igual que en `HEAD`.
- [x] En `spec.md`, `plan.md`, `tasks.md` y `MEMORY.md`, dejar de exigir el arreglo de 375 px.
- [x] Registrar `B11-7` en `DEUDA_TECNICA.md` con el hallazgo y su origen preexistente.
- Test: revisión manual de que ninguna tarea o criterio de 003 exige layout.
- Hecho cuando: 003 no modifica estilos y la deuda está registrada.

## Orden y dependencias

```text
T0 → T1 → T2 → T3 → T4
                    ├→ T5 ─┐
                    ├→ T6 ─┤
                    ├→ T7 ─┤
                    ├→ T8 ─┤
                    ├→ T9 ─┤
                    └→ T10 ┘
T11 puede ir en paralelo con T5–T10.
T14 puede ir después de T4.
T13 depende de T5–T11 y T14.
T12 depende de T13.
```

- T1 y T2 van antes que T3 y T4 porque la spec manda sobre el plan y las tareas.
- T5–T10 pueden ejecutarse en paralelo, pero cada una debe tener su test antes de tocar código.
- T11 no bloquea los tests, pero sí el cierre.
- T12 no se ejecuta hasta que T13 esté en verde.

## Criterios de cierre global

- [x] La spec no se contradice sobre CORS, `Origin`, host, `.env` ni `VITE_API_URL`.
- [x] La spec no nombra archivos, funciones ni librerías de implementación.
- [x] Cada RF tiene un test que falla al revertir su cambio.
- [x] `npm test` pasa en backend, frontend y contrato.
- [x] `npm run lint` pasa.
- [x] `npm run build` pasa.
- [x] La mutación se hizo con tests, no con `grep`.
- [x] El `.env` de la raíz cambia el destino del proxy y el entorno del proceso tiene prioridad.
- [x] Un fallo de conexión muestra un mensaje español y no `Failed to fetch`.
- [x] El backend escucha en loopback por defecto.
- [x] `AGENTS.md` no conserva instrucciones falsas.
- [x] `spec.md`, `tasks.md` y `MEMORY.md` tienen estados coherentes.
- [x] 003 no modifica estilos y `B11-7` está registrado.
- [x] `git status` no muestra cambios inesperados ni `.env`/`backend/data`.

## Archivos que se tocarán al aplicar las tareas

| Archivo | Tarea | Cambio |
|---|---|---|
| `specs/003-red-proxy-cors/spec.md` | T0, T1, T2, T12 | Contrato funcional, limpieza y estado final |
| `specs/003-red-proxy-cors/plan.md` | T3 | Archivos, tests, precedencia y bind |
| `specs/003-red-proxy-cors/tasks.md` | T0, T4, T12, T13 | Reabrir, añadir tests y estado final |
| `backend/src/serverConfig.js` | T10 | Nuevo: configuración de arranque testeable |
| `backend/src/server.js` | T10 | Escucha en el host configurado |
| `backend/test/serverConfig.test.js` | T10 | Tests de host, puerto y valores vacíos |
| `backend/test/app.test.js` | T6 | Servidor de test en loopback |
| `frontend/src/api/client.js` | T5, T8 | `/api` fijo y error de transporte |
| `frontend/vite.config.js` | T7, T9 | `loadEnv` raíz, prefijo, precedencia y host |
| `frontend/test/api/client.test.js` | T5, T8 | URL relativa, bypass ignorado y transporte |
| `frontend/test/vite.config.test.js` | T7, T9 | Precedencia, vacío, host y scripts |
| `frontend/test/stats/StatsPanel.test.jsx` | T8 | Error de red visible sin `0m` |
| `frontend/src/styles.css` | T14 | Sin cambio neto: se revierte el arreglo de 375 px |
| `AGENTS.md` | T11 | Comandos, estructura y configuración de red |
| `MEMORY.md` | T0, T12 | Estado real y recuento de tests |
| `DEUDA_TECNICA.md` | T12, T14 | B1-11 resuelto y B11-7 registrado |

## Archivos que no deben cambiar

- `backend/src/app.js`: `cors()` ya está eliminado; solo se verifica.
- `backend/package.json`: `cors` ya está eliminado; solo se verifica.
- `frontend/package.json`: los scripts ya no fuerzan `0.0.0.0`; solo se verifica.
- `eslint.config.js`: la configuración de Vite ya está cubierta; solo se verifica.
- `package-lock.json`: no se añaden dependencias; revisar que no aparezca `cors` de nuevo.
- `README.md`: no documenta estas variables; no requiere cambio.
- `backend/data/` y `.env`: no se versionan; no deben aparecer en `git status`.

## Nota final

Este archivo es la lista de tareas definitiva de la corrección de la feature 003. Una tarea solo
puede marcarse `[x]` cuando su test exista, falle al revertir el cambio y la verificación
correspondiente se haya ejecutado.

## Resultado de la verificación (corrección 2026-11-06)

- `npm test`: **136 tests en verde** — 68 backend + 51 frontend + 17 contrato.
- `npm run lint`: limpio.
- `npm run build`: correcto (`vite build`).
- Mutaciones verificadas y restauradas desde `/tmp/opencode/003-correcciones/` con `cp` y
  `diff -q`:
  - `API_URL` volviendo a leer `VITE_API_URL` → falla el test de bypass.
  - quitar el `try/catch` de `client.js` → falla el test de transporte.
  - cabecera `Access-Control-Allow-Origin` manual → fallan los dos casos CORS.
  - `loadEnv(..., process.cwd(), ...)` → falla el test de la raíz.
  - precedencia invertida de `VITE_PROXY_TARGET` → falla el test de precedencia.
  - `??` en lugar de `||` para el valor vacío → fallan los tests de destino por defecto.
  - `host: '0.0.0.0'` en Vite → falla el test de host.
  - `dev: "vite --host 0.0.0.0"` → falla el test de scripts.
  - host por defecto `0.0.0.0` en el backend → fallan los tests de `serverConfig`.
- Bind real (`ss -ltnp`): `127.0.0.1:3001` para el backend y `127.0.0.1:5173` para Vite.
- CORS: `curl -H 'Origin: http://evil.example' http://127.0.0.1:3001/api/health` responde 200
  sin `Access-Control-Allow-Origin`; el backend no emite cabeceras CORS.
- Proxy: `/api/health`, `/api/sessions` y `/api/stats` se sirven desde `localhost:5173` y Express
  responde sin `Access-Control-Allow-Origin`; `/api/sessions` devuelve 200.
- Error de red: con el backend caído, la UI muestra «No se pudo completar la petición» y no
  muestra `0m` ni tarjetas con datos falsos.
- `.env` de la raíz: con `VITE_PROXY_TARGET=http://localhost:3999` y un servidor de prueba en 3999,
  `curl http://localhost:5173/api/health` devuelve `{"source":"target-3999"}`; el `.env` se
  eliminó después.
- 375 px: no es criterio de esta feature. La comprobación durante la sesión mostró overflow
  (`scrollWidth 382` frente a `clientWidth 375`), que queda registrado como `B11-7`.
  `frontend/src/styles.css` no tiene cambio neto respecto a `HEAD`: el arreglo se revirtió.
- `git status`: solo cambios esperados; sin `.env` ni `backend/data`.
