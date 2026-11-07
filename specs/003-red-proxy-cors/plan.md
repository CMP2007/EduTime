# Plan 003 — Red, proxy y CORS seguros

> Spec: specs/003-red-proxy-cors/spec.md
> Estado: aprobado (2026-10-30, corregido 2026-11-06)

## Contexto técnico

Punto de partida detectado en la validación: el backend emitía cabeceras CORS abiertas; el
servidor de desarrollo se arrancaba expuesto a la red local; el acceso HTTP del frontend usaba
una URL absoluta por defecto, de modo que el proxy no se ejercitaba; la configuración del proxy
leía el entorno del proceso pero no el `.env` de la raíz; y el backend escuchaba en todas las
interfaces. La feature `002-contrato-datos` ya cubrió la validación del contrato de datos; esta
feature no toca datos ni persistencia.

## Enfoque

Orden de trabajo: corregir spec → plan → tareas → tests y código → documentación → verificación.

1. El backend deja de montar el middleware CORS y se retira la dependencia del `package.json`.
2. El acceso HTTP del frontend usa siempre `/api` relativo, sin `VITE_API_URL`, de modo que el
   navegador habla con el mismo origen y el proxy de Vite reenvía la petición.
3. La configuración del proxy lee el `.env` de la **raíz del repositorio** (no el directorio de
   trabajo del workspace, que es `frontend`), solo con prefijo `VITE_`, aplica la precedencia
   entorno del proceso > `.env` > valor por defecto y restringe `server.host` a `localhost`.
4. Los scripts de desarrollo y previsualización no fuerzan `0.0.0.0`.
5. Un rechazo de `fetch` (fallo de transporte) se traduce a un `ApiError` con mensaje en español y
   `status` 0.
6. La UI muestra ese mensaje sin tarjetas ni valores por defecto (`"0m"`).
7. El backend escucha en `127.0.0.1` por defecto; solo una variable de entorno explícita (`HOST`)
   puede cambiar la interfaz.
8. Se verifica con tests, lint, build, mutación y Chrome DevTools.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `backend/src/app.js` | Sin middleware CORS. |
| `backend/package.json` | Sin la dependencia `cors`. |
| `backend/src/server.js` | Usa la configuración de arranque y escucha en el host configurado. |
| `backend/src/serverConfig.js` | Nuevo: puerto y host por defecto, con override explícito. |
| `backend/test/serverConfig.test.js` | Nuevo: host/puerto por defecto, override y valores vacíos. |
| `frontend/src/api/client.js` | `/api` relativo fijo; rechazo de `fetch` → `ApiError` español. |
| `frontend/vite.config.js` | `loadEnv` desde la raíz con prefijo `VITE_`; precedencia y host local. |
| `frontend/package.json` | Scripts sin `--host 0.0.0.0`. |
| `backend/test/app.test.js` | Casos de ausencia de cabeceras CORS y servidor de test en loopback. |
| `frontend/test/api/client.test.js` | URL relativa, `VITE_API_URL` ignorada y error de transporte. |
| `frontend/test/vite.config.test.js` | `loadEnv` desde la raíz, prefijo, precedencia, destino y host. |
| `frontend/test/stats/StatsPanel.test.jsx` | Error de red visible sin `0m`. |
| `eslint.config.js` | Verificar que la configuración del proxy sigue cubierta (entorno Node). |
| `AGENTS.md` | Comandos, estructura y configuración de red. |
| `MEMORY.md` | Estado real y recuento de tests. |
| `DEUDA_TECNICA.md` | B1-6/B1-7/B1-10/B1-11 resueltos y deuda B11-7 del layout. |
| `specs/003-red-proxy-cors/*` | Artefactos coherentes y estados finales. |

## Decisiones y alternativas

- **Eliminar el middleware CORS en vez de restringirlo.** La spec exige no emitir cabeceras; con
  el proxy activo no es necesario. Alternativa descartada: restringir a `localhost:5173`, que deja
  una cabecera innecesaria y no protege el acceso directo al backend.
- **RF-2 se limita al servidor de aplicaciones.** El servidor de desarrollo de Vite tiene su
  propia configuración CORS, pero la aplicación siempre habla con el mismo origen a través del
  proxy. Incluirla en RF-2 obligaría a tocar una capa que no interviene en el flujo.
- **Ruta relativa `/api` fija, sin `VITE_API_URL`.** Activa el proxy y elimina una segunda vía sin
  cobertura. Alternativa descartada: mantener el override; si algún día hay despliegue separado,
  se añadirá con gating por entorno y su propio test.
- **Leer el `.env` de la raíz con `loadEnv(mode, rootDir, 'VITE_')`.** El cwd del workspace de
  frontend es `frontend`, así que `process.cwd()` ignoraría el `.env` de la raíz. El prefijo evita
  cargar variables ajenas al cliente. Se calcula `rootDir` desde la ubicación del archivo de
  configuración.
- **Precedencia explícita de `VITE_PROXY_TARGET`.** El entorno del proceso gana al `.env`, que
  gana al valor por defecto; un valor vacío o de solo espacios equivale a no definido. Es la
  precedencia documentada por Vite y evita que un `.env` pise una variable exportada.
- **Bind del backend a `127.0.0.1` por defecto.** Cierra B1-11 y evita que el proxy o la ausencia
  de CORS den una falsa sensación de seguridad. `HOST` queda como opt-in explícito para exponerlo.

## Riesgos y mitigaciones

- **Eliminar CORS sin que el proxy funcione** → el frontend no puede contactar con el backend.
  Mitigación: tests de URL relativa y de configuración del proxy antes de cerrar.
- **`loadEnv` con el directorio equivocado** → el `.env` de la raíz se ignora en silencio.
  Mitigación: test que capture el segundo argumento de `loadEnv` y lo compare con la raíz.
- **Un `fetch` rechazado no pasa por el manejo de respuestas HTTP** → se propaga
  `Failed to fetch`. Mitigación: `try/catch` alrededor de `fetch` y tests de cliente y UI.
- **Reintroducir un bypass por variable** → el proxy deja de ser la única vía. Mitigación: test
  que define `VITE_API_URL` y comprueba que se ignora.
- **Marcar tareas sin test** → cierre optimista. Mitigación: test primero y mutación real con
  restauración desde `/tmp/opencode/003-correcciones/`.
- **Cambiar el bind del backend rompe la UI o los tests** → el test de la app debe escuchar en
  loopback y la verificación manual con `ss` confirma el resultado.
- **Mantener el arreglo de 375 px dentro de 003** → mezcla una feature de red con layout.
  Mitigación: retirarlo y registrar `B11-7`.

## Plan de pruebas (RF → test)

| RF | Caso |
|---|---|
| RF-1 | `frontend/test/api/client.test.js`: `request('/sessions')` llama a `fetch('/api/sessions', …)`; definir `VITE_API_URL` no cambia la URL. |
| RF-2 | `backend/test/app.test.js`: petición con `Origin` externo responde sin `Access-Control-Allow-Origin`; `OPTIONS` tampoco añade cabeceras CORS. |
| RF-3 | `frontend/test/vite.config.test.js`: `loadEnv` se llama con la raíz y prefijo `VITE_`; sin variable usa `http://localhost:3001`; con `VITE_PROXY_TARGET` usa ese valor; el entorno del proceso gana al `.env`; vacío usa el defecto. Verificación manual con `.env` temporal. |
| RF-4 | `frontend/test/api/client.test.js`: `fetch` rechazado → `ApiError` con `status` 0, mensaje español y sin `Failed to fetch`. `frontend/test/stats/StatsPanel.test.jsx`: la UI muestra el mensaje y no `0m`. |
| RF-5 | `frontend/test/vite.config.test.js`: `config.server.host` es `localhost`; scripts `dev`/`preview` sin `0.0.0.0`. `backend/test/serverConfig.test.js`: host `127.0.0.1` por defecto y override explícito. Verificación manual con `ss`. |

## Orden de implementación

1. Corregir `spec.md`, `plan.md` y `tasks.md`.
2. Añadir los tests de RF-1 a RF-5.
3. Ajustar la configuración del proxy, el cliente HTTP y el arranque del backend.
4. Actualizar `AGENTS.md`, `MEMORY.md` y `DEUDA_TECNICA.md`.
5. Ejecutar `npm test`, `npm run lint` y `npm run build`.
6. Aplicar la mutación de cada cambio protegido y restaurar.
7. Verificar la UI y el bind con Chrome DevTools y `ss`.

## Verificación contra la constitución

- Principio 1: sin dependencias nuevas; se retira una dependencia existente.
- Principio 2: la spec `003` está aprobada y los RF cubren B1-6, B1-7, B1-10 y B1-11.
- Principio 3: cada archivo mantiene su responsabilidad (composición HTTP, acceso HTTP, proxy,
  configuración de arranque y scripts).
- Principio 4: cada cambio lleva un test que falla sin él; tests, lint y build bloquean el cierre.
- Principio 5: sin CORS abierto; backend en loopback por defecto; `.env` no expone secretos y no
  se versiona.
- Principio 6: mensajes de error en español; identificadores en inglés.

## Fuera de alcance

- CORS como control de acceso.
- CORS del servidor de desarrollo de Vite.
- Cabeceras (`B7-3`, `B7-4`), persistencia (`B3-1`), estadísticas (`B5-*`), componente `Modal`
  (`B8-2`) y contratos (`002` ya cubierto).
- Layout/UI a 375 px (deuda `B11-7`).
- E2E completos (Playwright) — solo verificación manual con Chrome DevTools.
