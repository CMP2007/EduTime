# Spec 003 — Red, proxy y CORS seguros

> Origen: DEUDA_TECNICA.md · B1-6, B1-7, B1-10, B1-11
> Estado: implementada (corrección 2026-11-06)

## Contexto y objetivo

Hoy la comunicación entre el frontend y el backend depende de cabeceras CORS abiertas: el
servidor de aplicaciones acepta cualquier origen, el servidor de desarrollo se expone a toda la
red local y el servidor de aplicaciones escucha en todas las interfaces. Además, el frontend
contacta directamente con el puerto del backend, sin pasar por el proxy de desarrollo, y la
configuración del proxy no lee el entorno de la raíz, por lo que el destino no se puede ajustar
desde un archivo.

El objetivo es que el frontend y el backend se comuniquen a través del proxy de desarrollo, que
el servidor de aplicaciones deje de emitir cabeceras CORS, que ambos servidores escuchen solo en
la interfaz local por defecto y que el destino del proxy se pueda configurar desde el entorno de
la raíz. No se añaden dependencias nuevas.

## Usuarios / actores

- **Estudiante / usuario de StudyTrack**: interactúa con el frontend en desarrollo local; debe ver
  errores de red en español, sin datos falsos.
- **Programador**: configura el entorno local (`.env`, variables de red); necesita que el proxy
  funcione de forma predecible, que el backend no dependa de CORS y que la API no quede expuesta
  en la red local por defecto.

## Historias de usuario

- H1: Como programador quiero que el proxy de desarrollo reenvíe `/api` al backend para que el
  frontend y el backend compartan el mismo origen y CORS deje de ser necesario.
- H2: Como usuario quiero que cualquier error de red se muestre en español con un mensaje claro,
  sin datos falsos (como `"0m"`).
- H3: Como programador quiero que el backend escuche solo en la interfaz local por defecto para
  que la API no quede accesible desde la red local.

## Definiciones

- **Proxy activo**: el servidor de desarrollo del frontend reenvía las peticiones que empiezan con
  `/api` al backend, sin que el navegador contacte directamente con otro puerto.
- **Sin CORS (servidor de aplicaciones)**: el backend no emite cabeceras
  `Access-Control-Allow-Origin` y no rechaza peticiones por `Origin`; la lectura entre orígenes
  distintos la bloquea el navegador. La configuración CORS del servidor de desarrollo no forma
  parte de este requisito.
- **Bind local**: el servidor de aplicaciones escucha en la interfaz de loopback por defecto. Solo
  una variable de entorno explícita puede hacerlo escuchar en otra interfaz.
- **Error de red manejado**: cualquier respuesta con código de error o fallo de conexión se
  traduce en un mensaje visible en español, sin ocultar el estado ni mostrar datos por defecto.

## Requisitos funcionales (EARS)

- RF-1: EL FRONTEND solicita siempre los datos mediante la ruta relativa `/api`; ninguna variable
  de entorno desvía las peticiones a otro origen. CUANDO el frontend solicita datos mediante esa
  ruta, EL SISTEMA reenvía la petición al backend a través del proxy activo.
- RF-2: CUANDO el servidor de aplicaciones recibe una petición, no emite cabeceras
  `Access-Control-Allow-Origin` y no rechaza peticiones por `Origin`; la lectura entre orígenes
  distintos la bloquea el navegador.
- RF-3: CUANDO la variable `VITE_PROXY_TARGET` está definida en el entorno del proceso, EL SISTEMA
  usa ese valor como destino del proxy; CUANDO no está definida en el proceso pero sí en el archivo
  `.env` de la raíz, EL SISTEMA usa el valor del archivo; MIENTRAS no haya un valor definido o el
  valor esté vacío, EL SISTEMA usa `http://localhost:3001` como destino por defecto.
- RF-4: CUANDO ocurre un error en la comunicación con el backend (respuesta con código de error o
  conexión fallida), EL SISTEMA muestra al usuario un mensaje en español que indica que hay un
  problema de red o de servicio, sin mostrar datos por defecto falsos.
- RF-5: CUANDO se inicia el servidor de desarrollo, EL SISTEMA lo hace escuchar solo en la
  interfaz local, nunca en todas las interfaces de red. El servidor de aplicaciones escucha solo
  en la interfaz local por defecto; solo una variable de entorno explícita puede cambiarlo.

## Requisitos no funcionales

- **Seguridad (principio 5)**: el proxy activo es la única vía de comunicación en desarrollo; el
  backend no emite cabeceras CORS y escucha en loopback por defecto. Exponer el backend en otra
  interfaz exige una variable de entorno explícita.
- **Idioma (principio 6)**: todos los mensajes de error de red deben estar en español; los
  identificadores y nombres técnicos siguen en inglés.
- **Dependencias (principio 1)**: no se añaden dependencias; se permite retirar la dependencia que
  aportaba CORS y ajustar los scripts de desarrollo.
- **Capas (principio 3)**: la configuración de red, el acceso HTTP del frontend, la composición
  del backend y el entorno mantienen responsabilidades separadas; no se mezclan reglas de dominio.

## Casos límite

- `.env` no existe o está vacío: el proxy debe seguir funcionando con valores por defecto.
- `.env` contiene `VITE_PROXY_TARGET` con un valor inválido (puerto incorrecto): el proxy debe
  intentar conectarse; el error debe ser manejado como error de red (RF-4) sin datos falsos.
- `VITE_PROXY_TARGET` está definida pero vacía: se usa el valor por defecto.
- La variable `VITE_API_URL` está definida: el frontend la ignora y sigue usando `/api` relativo.
- Una petición del frontend al backend falla antes de recibir respuesta: la UI muestra el mensaje
  español de RF-4 y no datos por defecto.
- El navegador bloquea la lectura de respuestas entre orígenes distintos por falta de
  `Access-Control-Allow-Origin`: el error de red se muestra en español.
- La variable de host del backend está vacía: se usa la interfaz local por defecto.

## Fuera de alcance

- Convertir CORS en un mecanismo de control de acceso.
- Cabeceras de red (`Content-Type` en `GET`, merge de cabeceras) — cubiertas por B7-3 / B7-4.
- `B1-3` (proxy acoplado al puerto `3001`) — ya resuelto.
- La configuración CORS del servidor de desarrollo de Vite: RF-2 se refiere solo al servidor de
  aplicaciones y el flujo de la aplicación es de mismo origen.
- Cambios de layout o UI de componentes (`Modal`, `Tabs`, `ErrorBoundary`), incluido el
  comportamiento a 375 px; se registra como deuda `B11-7`.
- Pruebas E2E completas con Playwright; esta feature solo requiere verificación manual con Chrome
  DevTools.
- Nuevas constantes de dominio compartidas — ya cubierto por `002-contrato-datos`.

## Criterios de finalización

- RF-1 a RF-5 cubiertos por tests automatizados y, cuando corresponde, verificación manual con
  Chrome DevTools.
- `npm test` pasa en verde (backend + frontend + contrato) desde la raíz.
- `npm run lint` pasa en verde desde la raíz.
- `npm run build` pasa desde la raíz.
- El `.env` de la raíz cambia el destino del proxy y un fallo de conexión muestra un mensaje en
  español sin `"0m"`.
- El backend escucha en `127.0.0.1` por defecto y solo cambia de interfaz con una variable
  explícita.
- Mutación: revertir cada cambio protegido por test hace fallar el test correspondiente.

## Dudas abiertas

- [RESUELTO] Se elimina por completo el soporte CORS del backend; el proxy cubre la comunicación
  en desarrollo.
- [RESUELTO] `.env` se limita al archivo de la raíz del proyecto (`.env.local` queda fuera de
  alcance).
- [RESUELTO] El mecanismo de lectura de `.env` se define en `plan.md` / `tasks.md`, no en esta
  spec.
- [RESUELTO] El host del frontend es siempre local en desarrollo; no se configura desde `.env`.
- [RESUELTO] RF-2 se limita al servidor de aplicaciones; el CORS del servidor de desarrollo queda
  fuera de alcance.
- [RESUELTO] El frontend usa siempre `/api` relativo; `VITE_API_URL` se elimina y no hay una
  segunda vía de comunicación.
- [RESUELTO] `VITE_PROXY_TARGET` sigue la precedencia entorno del proceso > `.env` > valor por
  defecto; un valor vacío equivale a no definido.
- [RESUELTO] El bind del backend entra en alcance (`B1-11`): `127.0.0.1` por defecto y override
  explícito por variable de entorno.
- [RESUELTO] El layout a 375 px no pertenece a esta feature; se registra como deuda `B11-7`.
