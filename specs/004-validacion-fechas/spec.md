# Spec 004 — Validación de fechas de entrada

> Origen: DEUDA_TECNICA.md · B3-2, B3-3, B4-4, B8-1, B9-5
> Estado: implementada (2026-11-10)

## Contexto y objetivo

Hoy las fechas se tratan como texto en varios puntos del sistema y una entrada inválida
no siempre se detecta:

- La consulta de estadísticas acepta fechas de referencia y de calendario mal formadas y
  puede responder con valores `NaN` o fechas inválidas.
- Los filtros de fecha del historial se comparan como texto: una fecha mal formada filtra
  de forma silenciosa y un rango con inicio posterior al fin devuelve una lista vacía sin
  explicar por qué.
- Los textos de fecha del frontend pueden mostrar `NaN` o `Invalid Date` cuando reciben un
  valor que no es una fecha.
- El cálculo de una serie de calendario corta en silencio al superar un máximo, de modo que
  podría devolver una serie incompleta sin avisar.
- La fecha de una clase se valida de forma laxa: se aceptan fechas que no existen en el
  calendario, como `2026-02-31`, y se guardan tal cual.
- Al fijar un rango de años válido, un periodo o un calendario calculado desde una fecha
  límite puede salirse de ese rango; hoy no hay una regla común para recortarlo ni para
  avisar.

El objetivo es que una fecha inválida nunca se use para calcular, guardar o pintar datos:
debe rechazarse con un mensaje claro en español, o quedar vacía en la interfaz cuando solo
se trate de un texto de presentación. Las fechas válidas deben conservar el comportamiento
actual salvo cuando un periodo o calendario calculado desde una fecha límite se salga de
los años admitidos: en ese caso el rango se recorta a los límites y se avisa.

## Usuarios / actores

- **Estudiante / usuario de StudyTrack**: registra clases, filtra su historial y consulta
  estadísticas. Necesita que una fecha mal introducida no produzca datos falsos ni listados
  vacíos sin explicación.
- **Cliente de la API**: programa o herramienta que consulta o modifica datos. Necesita una
  respuesta de validación clara y coherente cuando envía una fecha inválida.
- **Mantenedor**: evoluciona el sistema y necesita una única regla de fechas, comprobable y
  sin truncados silenciosos.

## Historias de usuario

- H1: Como estudiante quiero que una fecha imposible sea rechazada para no guardar ni
  calcular datos que no existen.
- H2: Como estudiante quiero que un rango de fechas invertido me avise en el historial para
  no interpretar una lista vacía como ausencia de clases.
- H3: Como cliente de la API quiero recibir un error de validación claro cuando envío una
  fecha inválida para poder corregirla.
- H4: Como mantenedor quiero que los cálculos de calendario fallen de forma explícita antes
  que devolver una serie incompleta sin avisar.
- H5: Como estudiante quiero que un periodo o calendario en el límite se recorte y me avise
  para no ver datos fuera del calendario admitido.

## Definiciones

- **Fecha válida**: cadena de exactamente diez caracteres con el formato `YYYY-MM-DD`, con
  un año entre 1990 y 9999 y una fecha que exista realmente en el calendario gregoriano. No
  se aceptan fechas imposibles ni normalizaciones (por ejemplo, `2026-02-31` no es válida).
  La fecha es local y no se convierte de zona horaria.
- **Fecha inválida**: cualquier valor que no cumpla la definición anterior, incluidos los
  formatos alternativos, los espacios alrededor y los valores que no sean texto.
- **Parámetro vacío**: parámetro opcional de fecha de consulta presente pero con cadena
  vacía. Se trata como si no se hubiera enviado. No se aplica a la fecha obligatoria de una
  clase: una fecha de clase vacía es inválida.
- **Rango invertido**: los dos extremos de un filtro están presentes y el inicio es
  posterior al fin.
- **Periodo**: intervalo de estadísticas calculado desde la fecha de referencia; puede ser
  un día, una semana, un mes, 3, 6 o 12 meses, o un año.
- **Calendario de actividad**: intervalo de días que se muestra como mapa de actividad,
  calculado desde la fecha del calendario; puede ser una semana, un mes, 3, 6 o 12 meses, o
  un año.
- **Rango derivado**: intervalo de fechas que el sistema calcula a partir de una fecha de
  referencia y un periodo, o de una fecha del calendario y un calendario de actividad.
- **Recorte de rango**: ajuste del inicio o del fin de un rango derivado a `1990-01-01` o
  `9999-12-31` cuando se sale de los años admitidos.
- **Aviso de recorte**: mensaje visible en español que indica que el rango se ha limitado y
  los límites aplicados. El mensaje es: «El rango solicitado se ha recortado a los límites
  admitidos (1990-01-01 – 9999-12-31).»
- **Error de validación**: respuesta de error con estado `400` y mensaje en español que
  explica el campo inválido, sin exponer datos internos.
- **Serie de calendario**: secuencia de días consecutivos entre dos fechas, usada para
  representar la actividad en el calendario.
- **Rango de calendario máximo**: 4000 días. Un rango de hasta 4000 días es válido; uno
  mayor se rechaza con un error explícito.

## Requisitos funcionales (EARS)

- RF-1: CUANDO se cree o edite una clase con una fecha que no sea válida, EL SISTEMA
  responderá con un error de validación y no guardará la clase.
- RF-2: CUANDO la fecha de referencia o la fecha del calendario de actividad de la consulta
  de estadísticas no sea válida, EL SISTEMA responderá con un error de validación y no
  devolverá valores `NaN` ni fechas inválidas.
- RF-3: CUANDO un filtro de fecha del historial no sea válido, EL SISTEMA responderá con un
  error de validación y no aplicará el filtro.
- RF-4: CUANDO los dos filtros de fecha del historial estén presentes y el inicio sea
  posterior al fin, EL SISTEMA responderá con un error de validación y no devolverá una
  lista vacía como si fuera un resultado válido.
- RF-5: SI un parámetro opcional de fecha de consulta está presente pero vacío, ENTONCES EL
  SISTEMA lo tratará como no enviado y no lo validará como fecha. Una fecha obligatoria de
  clase vacía sigue siendo un error de validación.
- RF-6: CUANDO el usuario seleccione en el historial un rango con inicio posterior al fin,
  EL SISTEMA mostrará un aviso visible en español y no realizará la consulta; mantendrá el
  último listado válido junto al aviso, sin presentarlo como resultado del rango inválido.
- RF-7: CUANDO un texto de fecha del frontend se derive de un valor inválido, EL SISTEMA no
  mostrará `NaN` ni `Invalid Date`; el texto completo quedará vacío y la pantalla seguirá
  operativa. En un rango con un extremo inválido, se vacía el texto completo.
- RF-8: SI un cálculo de serie de calendario necesita enumerar más de 4000 días, ENTONCES EL
  SISTEMA rechazará el cálculo con un error explícito en lugar de devolver una serie
  truncada.
- RF-9: MIENTRAS las fechas y los rangos derivados estén dentro de los límites de
  `1990-01-01` a `9999-12-31`, EL SISTEMA conservará el comportamiento actual de creación,
  edición, filtros, estadísticas y calendario.
- RF-10: CUANDO un rango derivado para el periodo o el calendario de actividad empiece antes
  de `1990-01-01` o termine después de `9999-12-31`, EL SISTEMA recortará ese rango a los
  límites admitidos, devolverá los datos del rango recortado y un aviso en español con los
  límites aplicados.
- RF-11: CUANDO la consulta de estadísticas haya recortado un rango derivado, EL SISTEMA
  mostrará el aviso de recorte en la interfaz, de forma visible y accesible.

## Requisitos no funcionales

- **Idioma (principio 6)**: los mensajes visibles y los errores de validación van en
  español; los identificadores y nombres técnicos, en inglés.
- **Dependencias (principio 1)**: no se añaden dependencias externas nuevas.
- **Datos (principio 5)**: la validación ocurre antes de leer, calcular o escribir; una
  fecha inválida no deja datos parciales ni modifica el almacenamiento.
- **Rendimiento**: validar una fecha es una operación de coste constante y el rango máximo
  evita cálculos de calendario desproporcionados.
- **Accesibilidad**: los avisos de rango invertido y de recorte serán texto visible, no
  dependerán solo del color y no impedirán usar los campos de fecha con teclado. Esta
  feature no cambia la accesibilidad de los mensajes de error ya existentes del formulario.
- **Compatibilidad**: las respuestas y pantallas con fechas y rangos dentro de los límites
  mantienen su forma, textos y datos actuales. En los límites, el rango se recorta y se
  avisa.

## Casos límite

- `2024-02-29` es válida por ser año bisiesto; `2025-02-29` y `2026-02-29` son inválidas.
- `2026-04-31`, `2026-00-10`, `2026-10-00` y `2026-10-32` son inválidas.
- `2026-12-31`, `2026-01-01` y `2026-10-17` son válidas.
- `1990-01-01` y `9999-12-31` son válidas; `1989-12-31` es inválida.
- `1990-01-01` con el periodo `12m` produce un rango recortado a `1990-01-01` y un aviso de
  recorte.
- `9999-12-31` con el calendario de actividad semanal produce un rango recortado a
  `9999-12-31` y un aviso de recorte.
- Un rango derivado dentro de los límites de años no se recorta ni genera aviso.
- Un rango derivado fuera de los límites de años no produce un error de validación: se
  recorta y se avisa.
- El recorte se aplica por separado al periodo y al calendario de actividad.
- El recorte no convierte una fecha de entrada inválida en válida: una fecha inválida sigue
  produciendo un error de validación.
- `2026-1-1`, `2026/01/01`, `17-10-2026`, una marca de tiempo completa y una fecha con
  espacios alrededor son inválidas.
- Un parámetro opcional de consulta ausente o vacío no aplica filtro ni validación de
  fecha.
- Una fecha obligatoria de clase ausente o vacía es inválida.
- Un solo filtro de fecha presente es válido y aplica solo ese extremo.
- Un rango con inicio igual al fin es válido.
- `date` o `heatmapDate` inválidos en estadísticas producen error de validación, nunca
  `NaN` ni una fecha inválida en la respuesta.
- Una fecha inválida en la creación o edición de una clase produce error de validación y no
  se guarda.
- Un texto de fecha del frontend con valor nulo, vacío o inválido queda vacío y no rompe la
  pantalla; en un rango, el texto completo queda vacío si uno de sus extremos es inválido.
- Un rango invertido en el historial mantiene el último listado válido y muestra el aviso.
- Un rango de exactamente 4000 días es válido; uno de 4001 días produce error explícito.
- Una respuesta con fecha inválida procedente de una fuente externa no se pinta como
  `NaN`; el texto afectado queda vacío.

## Fuera de alcance

- Validar de nuevo la duración, el título o las notas de una clase (B9-3, B9-6 y otras
  reglas de dominio).
- Cambiar la construcción de la rejilla del calendario ni su alineación (B10-4).
- Mejorar la accesibilidad de los mensajes de error ya existentes del formulario (B9-4);
  solo los avisos nuevos de rango invertido y de recorte deben ser visibles y accesibles.
- Unificar la lógica duplicada de «lunes = 0» (B8-4).
- Cambiar el formato de la fecha en el diálogo de borrado (B6-5).
- Aceptar formatos de fecha distintos de `YYYY-MM-DD`, zonas horarias o localizaciones.
- Aceptar años anteriores a 1990 o posteriores a 9999 como fechas de entrada.
- Rechazar una fecha válida porque su rango derivado se salga de los límites; en ese caso
  se recorta y se avisa.
- Migrar o limpiar datos persistidos con fechas inválidas; los datos actuales no contienen
  fechas inválidas y la validación impide que entren en el futuro.
- Exponer una ruta o parámetro para consultar series de calendario de más de 4000 días.
- Pruebas de extremo a extremo completas con navegador automatizado.

## Criterios de finalización

- RF-1 a RF-11 cubiertos por tests de backend y de frontend: unitarios de fechas,
  integración de las respuestas de validación, pruebas de la interfaz del historial y
  pruebas de los avisos de recorte en Inicio y Estadísticas.
- RF-8 se verifica con un test unitario de la serie de calendario; no se exige una respuesta
  de API para rangos mayores, porque ningún caso de uso actual los solicita.
- RF-10 y RF-11 se verifican con tests de recorte en las estadísticas y con la comprobación
  de que la respuesta incluye el aviso y la interfaz lo muestra.
- El contrato de la respuesta de estadísticas cubre el aviso de recorte.
- `npm test` y `npm run lint` en verde desde la raíz.
- Cada test nuevo falla si se revierte la regla que cubre (mutación).
- Comprobación manual con Chrome DevTools del aviso de rango invertido en el historial y del
  aviso de recorte en Estadísticas a 375 px, sin overflow ni pérdida de accesibilidad. En el
  historial se comprueba que se mantiene el último listado válido. El aviso de recorte de
  Inicio se verifica con un test de componente, porque la pantalla usa siempre la fecha de
  hoy y no permite provocar el recorte desde la interfaz.
- Ninguna respuesta ni pantalla con fechas y rangos dentro de los límites cambia respecto al
  comportamiento actual.

## Dudas abiertas

- Ninguna bloqueante.
