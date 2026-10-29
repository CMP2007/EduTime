# Spec 002 — Contrato de datos de la API

> Origen: DEUDA_TECNICA.md · B0-6
> Estado: implementada (2026-10-29)

## Contexto y objetivo

La forma de las respuestas de la API solo está documentada; ni se comprueba ni se comparte entre
backend y frontend. El frontend asume esa forma y, cuando un campo falta o se renombra, pinta un
valor por defecto plausible pero falso (un `0` o un «0m») en lugar de fallar. En un tablero de
métricas, un dato incorrecto silencioso es peor que un error visible.

El objetivo es que el contrato de datos tenga una definición única, que las respuestas se
verifiquen al entrar en la aplicación y que una deriva entre backend y frontend se convierta en un
error visible y localizable, no en ceros silenciosos.

## Usuarios / actores

- El estudiante que consulta métricas e historial y necesita saber cuándo un dato no es fiable.
- El mantenedor que evoluciona backend y frontend y necesita que la deriva se detecte sola.

## Historias de usuario

- H1: Como estudiante quiero que un fallo de datos se muestre como error para no decidir con
  información falsa.
- H2: Como mantenedor quiero una única definición del contrato para que backend y frontend no se
  separen sin que un test lo detecte.

## Definiciones

- **Contrato de datos**: campos, tipos y obligatoriedad que la API promete en sus respuestas
  correctas. No incluye la validación de la entrada del usuario ni las reglas de negocio.
- **Respuesta correcta**: respuesta con estado de éxito y cuerpo con datos. Las respuestas de
  error HTTP conservan su tratamiento actual y no pasan por el contrato.
- **Deriva**: diferencia entre lo que el backend devuelve y lo que el frontend espera.
- **Campo obligatorio**: debe estar presente y con el tipo declarado. Un campo que admite «sin
  valor» debe estar presente con el valor nulo; ausente es un error.
- **Campo adicional**: campo presente en la respuesta y no declarado en el contrato. Se tolera.
- **Ruta del campo**: nombre que sitúa el fallo dentro de la respuesta, p. ej.
  `summary.totalMinutes` o `[2].title`.
- **Primer fallo**: cualquiera de los campos inválidos; el orden de comprobación no forma parte
  del contrato.

## Requisitos funcionales (EARS)

- RF-1: EL SISTEMA dispondrá de una única definición del contrato de las respuestas de la API,
  usada tanto por el backend como por el frontend.
- RF-2: CUANDO la aplicación reciba una respuesta de métricas que no cumpla el contrato, EL
  SISTEMA mostrará, en la zona de error de la pantalla afectada, el primer fallo encontrado en un
  mensaje en español que incluya la ruta del campo inválido, sin pintar en su lugar un valor por
  defecto.
- RF-3: CUANDO la aplicación reciba un listado de clases o una clase suelta que no cumplan el
  contrato, EL SISTEMA mostrará un error visible con la misma forma que RF-2.
- RF-4: CUANDO las respuestas cumplan el contrato, EL SISTEMA conservará el comportamiento actual:
  mismos datos, mismas pantallas y mismos textos.
- RF-5: EL SISTEMA comprobará en sus tests que las respuestas reales del backend cumplen el
  contrato compartido, reutilizando los casos existentes en lugar de duplicarlos.
- RF-6: SI una respuesta contiene un campo adicional no declarado, ENTONCES EL SISTEMA la
  aceptará y solo fallará ante campos ausentes o con tipo incorrecto.
- RF-7: SI una recarga devuelve una respuesta que no cumple el contrato y la pantalla ya mostraba
  datos, ENTONCES EL SISTEMA mostrará el error y dejará de mostrar los datos de esa pantalla hasta
  que llegue una respuesta válida.

## Requisitos no funcionales

- Sin dependencias nuevas.
- Los mensajes visibles van en español; identificadores y código, en inglés.
- La validación no transforma ni normaliza los datos: o los acepta tal cual, o falla.
- El coste de validar un listado es lineal con el número de elementos mostrados.

## Casos límite

- Listado vacío: es válido y no produce error.
- Métricas sin sesiones: los ceros son válidos y no producen error.
- Clase más larga inexistente: el campo está presente con valor nulo y es válido.
- Listado con un elemento inválido: el error identifica la posición y el campo.
- Recarga inválida con datos previos: se mantiene el error visible y no se muestran los datos
  anteriores como si fueran actuales.
- Respuesta sin cuerpo (borrado correcto): no se valida y no produce error.
- Respuesta de error HTTP (validación, recurso inexistente, fallo del servidor): mantiene el
  mensaje actual del backend y no pasa por el contrato.
- Cuerpo que no es un objeto (texto, número, lista donde se espera objeto): es un error de
  contrato.

## Fuera de alcance

- Validar de nuevo la entrada del usuario: el backend ya la valida.
- Revalidar reglas de negocio (meta diaria, racha, periodos, duración).
- Rechazar campos adicionales.
- Reintentos, telemetría o registro de las derivas detectadas.
- Pruebas de extremo a extremo.

## Criterios de finalización

- RF-1 a RF-7 cubiertos por tests del backend, del frontend y de la definición compartida.
- `npm test` y `npm run lint` en verde desde la raíz.
- Cada test nuevo falla si se revierte la regla que cubre (mutación).
- Comprobación manual: con una respuesta alterada, la pantalla muestra el error y ningún `0` ni
  «0m» en el lugar del campo afectado.

## Dudas abiertas

- Ninguna bloqueante.
