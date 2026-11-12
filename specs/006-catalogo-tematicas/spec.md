# Spec 006 — Catálogo de temáticas con identificador

> Origen: `DEUDA_TECNICA.md` · B5-2 + petición del mantenedor
> Estado: aprobada (2026-11-10)

## Contexto y objetivo

Hoy cada clase guarda su temática como texto libre. Dos clases con la misma temática pueden
escribirse de formas distintas («Matemáticas», «matematicas», «Matemática») y el sistema las trata
como temáticas diferentes; además, no existe una lista común que el usuario pueda reutilizar. Esto
afecta a las estadísticas por temática y a la búsqueda del historial.

El objetivo es que las temáticas sean un catálogo persistente: cada temática tiene un identificador
estable y un nombre único, las clases se asocian a la temática por su identificador, y el usuario
puede crear, renombrar y eliminar temáticas desde la interfaz. Los datos de la versión anterior son
de muestra y se descartan: no se migran. En su lugar, la aplicación arranca vacía y ofrece cargar
datos de ejemplo solo si el usuario lo acepta. Con ello queda resuelta B5-2 (agrupación por texto
exacto).

## Usuarios / actores

- **Persona que registra sus clases** (único actor). No hay roles ni permisos diferenciados: quien
  usa la aplicación puede gestionar el catálogo y sus clases.

## Historias de usuario

- H1: Como persona que registra clases, quiero elegir la temática de una clase de una lista ya
  creada para no reescribirla cada vez y evitar variantes del mismo nombre.
- H2: Como persona que registra clases, quiero crear una temática nueva sin salir del formulario de
  la clase para no perder lo que estaba escribiendo.
- H3: Como persona que registra clases, quiero gestionar el catálogo (crear, renombrar y eliminar
  temáticas) desde un mismo sitio para mantenerlo ordenado.
- H4: Como persona que registra clases, quiero que al eliminar una temática con clases se me
  pregunte si las reasigno a otra temática o las elimino para no perder datos por accidente.
- H5: Como persona que registra clases, quiero decidir si cargo datos de ejemplo cuando la
  aplicación está vacía para ver cómo funciona sin mezclarlos con mis datos.
- H6: Como persona que registra clases, quiero filtrar el historial por temática y buscar en las
  observaciones para encontrar clases concretas.

## Definiciones

- **Temática**: entrada del catálogo con un identificador estable y un nombre. Es la temática de una
  clase. La interfaz y la documentación usan «Temática» (singular) y «Temáticas» (plural); «Tema» no
  se usa como etiqueta visible.
- **Nombre de temática**: texto obligatorio, recortado en los extremos, de 1 a 80 caracteres. Se
  conserva tal como lo escribe el usuario (sin cambiar mayúsculas ni tildes).
- **Temática repetida**: temática cuyo nombre coincide con otra tras recortar espacios en los
  extremos y comparar sin distinguir mayúsculas, minúsculas ni tildes. La comparación **no** distingue
  tildes, pero el nombre visible conserva las que escribió el usuario.
- **Clase**: registro de estudio con fecha, duración, observaciones y una temática.
- **Temática en uso**: temática que tiene al menos una clase asociada.
- **Catálogo**: conjunto persistente de temáticas; sobrevive al reinicio de la aplicación.
- **Reasignar clases**: mover todas las clases de una temática a otra temática del catálogo antes de
  eliminar la primera. Es el flujo de borrado, no la carga de datos de ejemplo.
- **Eliminar todo**: eliminar la temática y todas sus clases de forma definitiva.
- **Aviso de temática creada**: mensaje que informa de que la temática creada desde el formulario de
  clase se conserva aunque la clase no se guarde, y de que su edición se hace desde la gestión de
  temáticas.
- **Aplicación vacía**: no hay ninguna clase registrada; puede haber temáticas o no. Un listado de
  clases vacío cuenta como aplicación vacía.
- **Datos de ejemplo**: conjunto de temáticas y clases de muestra que se cargan solo si el usuario
  los acepta y la aplicación está vacía; siguen las mismas reglas de asociación que las clases
  nuevas.
- **Rechazo de datos de ejemplo**: el usuario no los carga; no se escribe ningún dato y se vuelve a
  preguntar en la siguiente carga de la aplicación mientras siga vacía.

## Requisitos funcionales (EARS)

### Catálogo

- RF-1: EL SISTEMA mantiene un catálogo persistente de temáticas; cada temática tiene un
  identificador estable y un nombre.
- RF-2: CUANDO el usuario da de alta una temática con un nombre válido y no repetido, EL SISTEMA crea
  la temática con su identificador y la deja disponible para asociarla a clases.
- RF-3: SI el nombre de una temática está vacío, solo tiene espacios o supera los 80 caracteres,
  ENTONCES EL SISTEMA rechaza el alta con un mensaje claro y no crea nada.
- RF-4: SI ya existe una temática con el mismo nombre (según «temática repetida»), ENTONCES EL
  SISTEMA no crea un duplicado y muestra un error claro, tanto en el alta desde el formulario de
  clase como en la gestión de temáticas.
- RF-5: CUANDO el usuario renombra una temática con un nombre válido y no repetido, EL SISTEMA
  actualiza el nombre de la temática y todas las vistas que lo muestran (clases, historial y
  estadísticas) pasan a mostrar el nombre nuevo.
- RF-6: SI el renombrado deja el nombre vacío, solo con espacios, supera los 80 caracteres o
  coincide con otra temática, ENTONCES EL SISTEMA rechaza el cambio, muestra el error y conserva el
  nombre anterior.
- RF-7: CUANDO el usuario confirma el renombrado de una temática sin cambiar el texto exacto de su
  nombre, EL SISTEMA lo acepta sin cambios. SI el texto solo cambia en mayúsculas, minúsculas o
  tildes, ENTONCES EL SISTEMA actualiza el nombre visible y la considera la misma temática.

### Eliminación de temáticas

- RF-8: CUANDO el usuario pide eliminar una temática sin clases, EL SISTEMA pide confirmación y, si
  el usuario confirma, la elimina del catálogo.
- RF-9: CUANDO el usuario pide eliminar una temática con clases, EL SISTEMA muestra cuántas clases
  tiene y ofrece dos acciones: reasignarlas a otra temática o eliminarlas junto con la temática.
- RF-10: SI el usuario elige reasignar las clases, ENTONCES EL SISTEMA exige elegir una temática
  destino distinta de la que se elimina, de entre las demás ordenadas alfabéticamente; si no existe
  otra temática, la opción no está disponible y se explica por qué.
- RF-11: CUANDO el usuario confirma la reasignación, EL SISTEMA reasigna todas las clases a la
  temática destino, conserva fecha, duración y observaciones, y elimina la temática original.
- RF-12: CUANDO el usuario confirma la eliminación total, EL SISTEMA elimina la temática y todas sus
  clases de forma definitiva.
- RF-13: SI el usuario cancela el diálogo de eliminación, ENTONCES EL SISTEMA no modifica el catálogo
  ni las clases.

### Formulario de clase

- RF-14: CUANDO el usuario abre el formulario de nueva clase, EL SISTEMA muestra un selector,
  ordenado alfabéticamente en español, con todas las temáticas del catálogo (tengan o no clases) y
  una acción para crear una temática nueva.
- RF-15: SI el catálogo está vacío, ENTONCES EL SISTEMA indica que hay que crear una temática y no
  permite guardar la clase hasta que exista una seleccionada.
- RF-16: CUANDO el usuario activa la acción «+» junto al selector, EL SISTEMA despliega un campo de
  texto para el nombre de la temática nueva y coloca el foco en él.
- RF-17: CUANDO el usuario confirma el nombre y el alta es válida, EL SISTEMA registra la temática,
  cierra el campo de texto y deja seleccionada en el selector la temática recién creada.
- RF-18: SI el alta de la temática falla, ENTONCES EL SISTEMA mantiene el campo de texto abierto,
  muestra el error y no cambia la selección anterior.
- RF-19: CUANDO el usuario cancela el alta de la temática, EL SISTEMA oculta el campo de texto y
  conserva la selección anterior.
- RF-20: SI el usuario intenta guardar una clase sin temática, ENTONCES EL SISTEMA muestra un error y
  no guarda la clase.
- RF-21: CUANDO el usuario guarda una clase, EL SISTEMA la asocia a la temática elegida por su
  identificador; el nombre que se muestra proviene siempre del catálogo.
- RF-22: CUANDO el usuario edita una clase existente, EL SISTEMA preselecciona la temática que tenía
  asociada.
- RF-23: SI la lista de temáticas no se puede cargar, ENTONCES EL SISTEMA muestra el error y ofrece
  una acción «Reintentar» que vuelve a cargar la lista. En el formulario de clase, además, no permite
  guardar hasta que la lista esté disponible.
- RF-24: SI la temática seleccionada deja de existir antes de guardar la clase, ENTONCES EL SISTEMA
  no guarda, informa de que la temática ya no existe y pide elegir otra.
- RF-25: CUANDO el usuario cancela el formulario de la clase después de haber creado una o más
  temáticas en él, EL SISTEMA muestra el aviso de temática creada (enumerando las temáticas creadas)
  y, al cerrarlo, cierra el formulario. SI el usuario guarda la clase, ENTONCES EL SISTEMA no muestra
  ese aviso.

### Gestión de temáticas

- RF-26: EL SISTEMA muestra, junto al botón de nueva clase, un botón secundario «Temáticas» que abre
  la gestión de temáticas.
- RF-27: CUANDO se abre la gestión de temáticas, EL SISTEMA muestra el listado de temáticas, ordenado
  alfabéticamente en español, con su nombre y acciones de renombrar y eliminar, además de un campo
  para crear una temática nueva. El listado no muestra el número de clases; ese dato aparece en el
  diálogo de eliminación.
- RF-28: CUANDO el usuario crea una temática desde la gestión, EL SISTEMA la añade al listado y la
  deja disponible en el formulario de clase sin recargar la aplicación.

### Historial y estadísticas

- RF-29: EL SISTEMA muestra en el filtro del historial todas las temáticas del catálogo, ordenadas
  alfabéticamente en español. CUANDO el usuario elige una temática, EL SISTEMA muestra solo las
  clases de esa temática; el filtro de texto busca en las observaciones.
- RF-30: SI la temática elegida en el filtro del historial se elimina, ENTONCES EL SISTEMA limpia el
  filtro y muestra el historial completo.
- RF-31: EL SISTEMA mantiene los filtros de fecha del historial y sus reglas de validación actuales.
- RF-32: EL SISTEMA agrupa las horas por temática registrada (no por texto) y muestra el nombre
  actual de la temática; un renombrado se refleja sin recalcular datos.
- RF-33: EL SISTEMA muestra el nombre actual de la temática (no un texto guardado) en el historial,
  en la clase más larga y en las estadísticas.

### Datos de ejemplo y arranque

- RF-34: EL SISTEMA no crea datos de ejemplo al arrancar por sí solo; un arranque sin datos deja la
  aplicación vacía.
- RF-35: CUANDO la aplicación termina de cargar y no existe ninguna clase, EL SISTEMA muestra un
  diálogo que pregunta si se quieren cargar datos de ejemplo.
- RF-36: CUANDO el usuario acepta cargar datos de ejemplo, EL SISTEMA crea las temáticas y clases de
  ejemplo, las asocia por identificador y las muestra sin recargar la página. SI ya existe una
  temática con el mismo nombre, ENTONCES EL SISTEMA reutiliza su identificador en lugar de crear
  otra.
- RF-37: SI el usuario rechaza, cierra o descarta el diálogo, ENTONCES EL SISTEMA no escribe ningún
  dato y deja la aplicación vacía; mientras no exista ninguna clase, el diálogo vuelve a mostrarse
  en la siguiente carga de la aplicación.
- RF-38: SI la carga de datos de ejemplo falla, ENTONCES EL SISTEMA mantiene el diálogo abierto,
  muestra un error claro y permite reintentar sin dejar clases a medias ni duplicar temáticas al
  reintentar.
- RF-39: SI ya existe al menos una clase, ENTONCES EL SISTEMA no muestra el diálogo de datos de
  ejemplo y rechaza cualquier intento de cargarlos con un error claro.
- RF-40: SI los datos almacenados no son coherentes (una clase sin temática asociada o con una
  temática inexistente, o una clase con el campo antiguo de título), ENTONCES el arranque falla con
  un error explícito y no sobrescribe los datos.

## Requisitos no funcionales

- **Accesibilidad**: todos los controles nuevos tienen etiqueta asociada; el botón «+» se opera con
  teclado; al desplegarse el campo de texto recibe el foco; si el alta inline está abierta, Escape
  cierra solo ese campo, y si no lo está, Escape cierra el formulario; los errores se anuncian en una
  región viva; el diálogo de eliminación atrapa el foco y lo devuelve al cerrarse (comportamiento ya
  existente del diálogo); el aviso de temática creada se puede cerrar con teclado; el diálogo de
  datos de ejemplo atrapa el foco, se cierra con Escape (equivale a rechazar) y anuncia su error en
  una región viva.
- **Idioma**: textos de interfaz y mensajes de error en español; se usa «Temática» (singular) y
  «Temáticas» (plural) de forma consistente; identificadores y código en inglés.
- **Compatibilidad**: la interfaz se usa sin desbordes horizontales a 375 px; sin dependencias nuevas.
- **Integridad**: toda escritura del catálogo es atómica; un dato corrupto provoca un fallo explícito,
  no una sobrescritura silenciosa.
- **Rendimiento**: la lista de temáticas se carga una vez por vista; guardar una clase no recalcula ni
  reescribe el catálogo completo innecesariamente.
- **Contrato**: las respuestas que consume la interfaz se validan en el borde y un cambio de forma se
  muestra como error visible, no como datos incompletos.

## Casos límite

- Catálogo vacío al abrir el formulario de clase.
- Alta de una temática repetida desde el formulario o desde la gestión: error visible, sin crear y sin
  cambiar la selección anterior.
- Renombrado al mismo texto exacto (sin cambios), solo cambiando mayúsculas o tildes (se actualiza el
  nombre visible) y a un nombre de otra temática (se rechaza).
- Eliminación de la única temática cuando tiene clases: solo se ofrece eliminar todo.
- Eliminación de una temática con clases eligiendo reasignar sin temática destino: no se permite
  confirmar.
- Temática seleccionada en un formulario abierto que se elimina antes de guardar: al guardar se
  informa de que la temática ya no existe y se pide elegir otra; no se guarda la clase.
- Clase editada cuya temática ya no existe en el catálogo: se informa del problema y no se guarda
  hasta elegir una temática válida.
- Fallo de carga de la lista de temáticas: se muestra el error, se ofrece «Reintentar» y no se permite
  guardar una clase.
- Temática elegida en el filtro del historial que se elimina: el filtro se limpia y se muestra el
  historial completo.
- Nombres con espacios en los extremos, mayúsculas distintas, tildes distintas y longitud máxima.
- Sin archivos de datos o con el listado de clases vacío: se muestra el diálogo de datos de ejemplo.
- Solo hay temáticas y ninguna clase: se muestra el diálogo; al aceptar se reutilizan las temáticas
  por nombre normalizado y no se duplican.
- Hay al menos una clase: no se muestra el diálogo y la carga de datos de ejemplo se rechaza con un
  error claro.
- El usuario rechaza, cierra con «×» o pulsa Escape: no se escribe nada y se vuelve a preguntar en la
  siguiente carga mientras no haya clases.
- Fallo al cargar los datos de ejemplo: error visible y reintento sin clases a medias ni temáticas
  duplicadas.
- Datos en formato antiguo (`title`) o incoherentes: el arranque falla con un error explícito y no
  sobrescribe; se resuelve borrando `backend/data/`, que solo contiene datos de muestra.
- Cancelar la clase después de crear una temática: se muestra el aviso de temática creada y la
  temática se conserva; guardar la clase no muestra el aviso.
- Escape con el alta inline abierta: cierra solo el campo, no el formulario.
- Datos de ejemplo: las clases de ejemplo crean o reutilizan sus temáticas con las mismas reglas de
  asociación.

## Fuera de alcance

- Fusionar dos temáticas existentes.
- Colores, iconos, orden manual o metas por temática.
- Deshacer una eliminación o papelera.
- Historial de cambios del catálogo o auditoría.
- Roles, permisos o multiusuario.
- Importación/exportación masiva del catálogo.
- Búsqueda o paginación dentro del selector de temáticas.
- Renombrado concurrente entre pestañas: si dos pestañas renombran la misma temática, gana la última
  escritura.
- Cambiar las reglas de duración, fecha u observaciones.
- Cambiar la forma de la respuesta de estadísticas más allá de identificar la temática.
- Migrar datos del formato anterior de temática libre: los datos actuales son de muestra y se
  eliminan antes de usar esta versión.
- Recordar el rechazo de los datos de ejemplo entre cargas de la aplicación.

## Criterios de finalización

- RF-1 a RF-40 cubiertos por tests automatizados de backend, frontend y contrato.
- `npm test` y `npm run lint` en verde desde la raíz.
- Cada test nuevo falla si se revierte la regla que cubre (mutación).
- Comprobación manual en navegador: alta inline desde el formulario, aviso al cancelar la clase,
  reintento de la lista, gestión de temáticas, eliminación con reasignación y con borrado total,
  limpieza del filtro al eliminar la temática elegida, Escape en el alta inline, diálogo de datos de
  ejemplo al arrancar vacío (aceptar, rechazar, reintentar y volver a preguntar tras recargar) y
  layout a 375 px.
- `README.md`, `AGENTS.md` (si cambia estructura o convenciones), `MEMORY.md` y `DEUDA_TECNICA.md`
  (B5-2) actualizados con la terminología «temática», el diálogo de datos de ejemplo y el borrado de
  `backend/data/` como paso de actualización.

## Dudas abiertas

Ninguna.
