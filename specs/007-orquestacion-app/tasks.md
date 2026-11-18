# Tasks 007 — Orquestación de la aplicación: pestañas en la URL, capas y fecha legible

> Spec: specs/007-orquestacion-app/spec.md · Plan: specs/007-orquestacion-app/plan.md
> Estado: completada

Cada tarea es un cambio pequeño y verificable. El campo «Test» indica qué prueba debe existir
antes de dar la tarea por hecha; si el test no falla al revertir el cambio, la tarea no está
terminada.

## T1 — Módulo de pestañas y direcciones

- [x] Crear `frontend/src/navigation/tabs.js` con `TABS`, `DEFAULT_TAB`, `tabFromHash` y
      `pathForTab`.
- [x] Cubrir direcciones válidas, vacías, `#`, `#/`, desconocidas, con mayúsculas, con barra final y
      con segmentos adicionales.
- Test: RF-1, RF-5 y RF-6 (resolución pura de direcciones).
- Hecho cuando: `npm test -w frontend -- test/navigation/tabs.test.js` pasa y una dirección mal
  resuelta hace fallar el test.

## T2 — Hook de ruta sincronizado con la URL

- [x] Crear `frontend/src/navigation/useTabRoute.js` con lectura inicial del hash, normalización con
      `replaceState`, escucha de `hashchange` y `selectTab` que actualiza estado y URL a la vez
      (asignar el hash que ya está activo es inocuo para el navegador).
- [x] Restaurar la dirección a `/` después de cada test en `frontend/test/setup.js`.
- [x] Cubrir: hash válido inicial, hash vacío, hash desconocido, selección con entrada nueva,
      reelegir la activa sin entrada, `hashchange`, Atrás/Adelante y coincidencia entre pestaña,
      contenido y dirección.
- [x] Si jsdom no dispara la navegación real del historial, disparar un `hashchange` sintético y
      dejar la comprobación real de Atrás/Adelante para T10. (jsdom sí disparó Atrás/Adelante; no
      hizo falta el plan B.)
- Test: RF-2, RF-3, RF-4, RF-5, RF-6, RF-7 y RF-8.
- Hecho cuando: `npm test -w frontend -- test/navigation/useTabRoute.test.jsx` pasa y ningún test
  depende del hash dejado por otro.

## T3 — Integración de la ruta en la aplicación

- [x] Sustituir el estado local de pestaña por `useTabRoute` y usar `TABS` como única fuente.
- [x] Cerrar formulario, diálogo de borrado y gestor de temáticas cuando cambie la pestaña.
- [x] Cubrir: abrir con hash válido, clic en pestaña actualiza la dirección, reelegir no añade
      entrada, navegación con diálogo abierto y filtros/periodo que no cambian el hash.
- [x] Comprobar que al remontar la vista los filtros y el periodo vuelven a su estado inicial.
- Test: RF-3, RF-4, RF-8 y RF-9.
- Hecho cuando: los tests de `App` pasan y cambiar un filtro o un periodo deja el hash intacto.

## T4 — Hook de mutaciones de clases

- [x] Crear `frontend/src/sessions/useSessionMutations.js` con `createSession`, `updateSession`,
      `removeSession`, `saving`, `deleting`, `error` y `clearError`.
- [x] Refrescar las vistas tras el éxito y conservar el error de la operación.
- [x] Cubrir éxito de alta/edición/borrado, error con mensaje, retorno booleano del borrado, flags
      de operación en curso y refresco de versiones.
- Test: RF-10, RF-11 y RF-14 (parte del hook).
- Hecho cuando: `npm test -w frontend -- test/sessions/useSessionMutations.test.jsx` pasa y el
  refresco se observa en el componente sonda.

## T5 — La aplicación deja de acceder a los datos de escritura

- [x] Usar `useSessionMutations` en `App` y eliminar la importación de `sessionsApi` y el refresco
      directo.
- [x] Pasar el error de borrado al diálogo, limpiarlo al abrir/cerrar y actualizar los mocks de
      `App.test.jsx` con `create` y `update`.
- [x] Cubrir alta, edición, borrado correcto y borrado fallido desde `App`.
- Test: RF-10, RF-11, RF-12, RF-13 y RF-15.
- Hecho cuando: los tests de `App` pasan y `rg "sessionsApi|useDataRefresh" frontend/src/App.jsx`
  no devuelve resultados.

## T6 — Estado de guardado y eliminación visible

- [x] Convertir `saving` de `SessionForm` en prop con valor por defecto `false` y eliminar el estado
      local duplicado.
- [x] Pasar `saving` desde `App` y `busy={deleting}` al diálogo de borrado.
- [x] Cubrir «Guardando…» y controles deshabilitados con una promesa pendiente, y «Eliminando…» en el
      diálogo.
- Test: RF-14.
- Hecho cuando: los tests de `SessionForm` y `App` pasan y no queda ningún `setSaving` local en el
  formulario.

## T7 — Fecha legible en el diálogo de borrado

- [x] Crear `frontend/src/sessions/deleteMessage.js` con `buildDeleteMessage`, usando
      `formatDateLong` y omitiendo la fecha si no se puede interpretar.
- [x] Usar el mensaje en `App` y cubrir el caso normal y el de fecha inválida.
- Test: RF-17 y RF-18.
- Hecho cuando: el mensaje contiene «jue 15 oct 2026» y no `2026-10-15`, y con fecha inválida no
  aparece ni la fecha técnica ni un hueco raro.

## T8 — Aviso de error después de navegar

- [x] Mostrar `StatusNotice` con el error de mutación solo cuando no hay formulario, borrado ni
      gestor de temáticas abiertos.
- [x] Limpiar el error de mutación en el efecto de navegación para que el aviso corresponda a la
      pestaña activa.
- [x] Cubrir con una promesa diferida: abrir borrado, cambiar el hash, rechazar la petición y
      comprobar el aviso en la pestaña activa.
- [x] Comprobar que el aviso se oculta mientras hay un diálogo abierto y reaparece al cerrarlo.
- Test: RF-16.
- Hecho cuando: el test de la promesa diferida pasa y no hay error duplicado dentro del diálogo.

## T9 — Documentación, deuda y evidencia de capas

- [x] Actualizar `README.md` con las direcciones `#/inicio`, `#/historial` y `#/estadisticas`.
- [x] Actualizar `AGENTS.md` con `frontend/src/navigation/`, `useSessionMutations.js` y
      `deleteMessage.js`.
- [x] Actualizar `MEMORY.md` con el resumen de la feature.
- [x] Marcar B6-3, B6-4 y B6-5 como resueltos en `DEUDA_TECNICA.md` y actualizar el recuento
      (48 resueltas, 19 pendientes, 1 en curso).
- [x] Registrar la evidencia de RF-15: `App` sin llamadas de escritura ni refresco directo, y
      `sessionsApi.create`/`update`/`remove` solo en el hook.
- Test: RF-15 y coherencia documental.
- Hecho cuando: los documentos reflejan el estado real y la evidencia de capas queda escrita.

## T10 — Validación final

- [x] Ejecutar `npm test` y `npm run lint` desde la raíz.
- [x] Mutar cada regla nueva: resolución de direcciones, reelegir la activa, normalización, cierre
      de diálogos, error/refresco del hook, flags de guardado, omisión de fecha y aviso posterior a
      la navegación.
- [x] Comprobar en Chrome DevTools: enlaces profundos, recarga en cada pestaña, Atrás/Adelante,
      dirección desconocida, error de borrado, fecha del diálogo y layout a 375 px.
- Test: matriz RF → test completa.
- Hecho cuando: `npm test` y `npm run lint` están en verde, cada mutación se detecta y la
  comprobación manual queda registrada.

## Orden y dependencias

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10.

T1 y T2 son independientes de T4, pero T3 necesita T2. T5 necesita T4 y T3. T6, T7 y T8 necesitan
T5 y tocan `App`, por eso van en ese orden. T9 cierra la documentación después del código y T10
valida todo el conjunto.
