# Spec 007 — Orquestación de la aplicación: pestañas en la URL, capas y fecha legible

> Origen: `DEUDA_TECNICA.md` · B6-3 + B6-4 + B6-5
> Estado: implementada (2026-11-17)

## Contexto y objetivo

Hoy la pestaña activa (Inicio, Historial o Estadísticas) vive solo en memoria: al recargar siempre
se vuelve a Inicio, no se puede compartir ni marcar un enlace a una pestaña concreta y los botones
Atrás/Adelante del navegador no recorren las pestañas visitadas. Además, la vista contenedora de la
aplicación conoce los detalles de las operaciones de escritura de clases (crear, editar y eliminar),
cuando su papel debería limitarse a orquestar la interfaz. Por último, el diálogo que confirma el
borrado de una clase muestra la fecha en formato técnico (`AAAA-MM-DD`), distinto del formato
legible que usa el resto de la aplicación.

El objetivo es que cada pestaña tenga una dirección propia que sobreviva a la recarga y a la
navegación del navegador, que las escrituras de clases se concentren en un único punto de la capa de
estado de la interfaz sin cambiar lo que ve el usuario, y que la fecha del diálogo de borrado se
muestre en el mismo formato largo que el resto de la aplicación. Con ello quedan resueltos B6-3,
B6-4 y B6-5.

## Usuarios / actores

- **Persona que registra sus clases** (único actor). No hay roles ni permisos diferenciados.
- **Persona que mantiene la aplicación** (mantenedor): comprueba que la interfaz respeta la
  separación entre presentación y acceso a datos.

## Historias de usuario

- H1: Como persona que registra clases, quiero que la pestaña en la que estoy quede reflejada en la
  dirección para poder recargar sin perderla y guardarla en marcadores.
- H2: Como persona que registra clases, quiero compartir un enlace que abra directamente Historial o
  Estadísticas para enseñar una vista concreta sin explicar dónde pulsar.
- H3: Como persona que registra clases, quiero que Atrás y Adelante del navegador cambien de pestaña
  como cambian de página en el resto de la web.
- H4: Como persona que registra clases, quiero que el diálogo de borrado muestre la fecha como la
  muestra el resto de la aplicación para reconocer de un vistazo qué clase voy a eliminar.
- H5: Como persona que mantiene la aplicación, quiero que la vista contenedora no conozca los detalles
  de acceso a datos para poder cambiar la presentación o la red sin mezclar responsabilidades.

## Definiciones

- **Pestaña**: cada una de las tres secciones principales de la aplicación: Inicio, Historial y
  Estadísticas.
- **Dirección de pestaña**: dirección web que identifica una pestaña. Se usan `#/inicio`,
  `#/historial` y `#/estadisticas` (sin tildes en la parte de la dirección).
- **Dirección válida**: dirección cuyo fragmento coincide exactamente con una de las tres direcciones
  de pestaña. Las mayúsculas, los espacios, una barra final o fragmentos adicionales no cuentan como
  coincidencia.
- **Dirección vacía**: dirección sin fragmento, o con un fragmento vacío o equivalente a la raíz.
- **Dirección desconocida**: dirección con fragmento que no es válido ni vacío.
- **Formato largo de fecha**: el ya usado en la aplicación para mostrar una fecha completa: día de la
  semana abreviado, día del mes, mes abreviado y año (por ejemplo, «jue 15 oct 2026»).
- **Operación de escritura**: alta, edición o eliminación de una clase.
- **Capa de estado de la interfaz**: parte de la interfaz que conoce las operaciones de escritura y
  su estado (en curso, error), separada de la vista que pinta la pantalla.

## Requisitos funcionales (EARS)

### Direcciones y navegación

- RF-1: EL SISTEMA asigna a cada pestaña una dirección propia: `#/inicio`, `#/historial` y
  `#/estadisticas`.
- RF-2: CUANDO el usuario elige una pestaña distinta de la activa, EL SISTEMA muestra su contenido y
  actualiza la dirección a la de esa pestaña, añadiendo una entrada nueva al historial de navegación.
  SI el usuario vuelve a elegir la pestaña que ya está activa, ENTONCES EL SISTEMA no recarga la
  vista ni añade ninguna entrada al historial.
- RF-3: CUANDO el usuario abre o recarga la aplicación con una dirección de pestaña válida, EL SISTEMA
  muestra directamente esa pestaña, sin pasar por Inicio.
- RF-4: CUANDO el usuario usa Atrás o Adelante del navegador, EL SISTEMA muestra la pestaña
  correspondiente a la dirección resultante, actualiza la pestaña marcada como activa y cierra
  cualquier diálogo abierto.
- RF-5: SI la dirección está vacía, ENTONCES EL SISTEMA muestra Inicio y normaliza la dirección a
  `#/inicio` sin añadir una entrada adicional al historial de navegación.
- RF-6: SI la dirección es desconocida, ENTONCES EL SISTEMA muestra Inicio y normaliza la dirección a
  `#/inicio` sin añadir una entrada adicional al historial de navegación.
- RF-7: EL SISTEMA abre una dirección de pestaña válida aunque se haya escrito a mano o se haya
  abierto en una pestaña nueva del navegador.
- RF-8: EL SISTEMA mantiene una sola pestaña activa a la vez: la marcada como seleccionada coincide
  siempre con la pestaña cuyo contenido se muestra y con la dirección actual.
- RF-9: EL SISTEMA no refleja en la dirección los filtros del Historial, el periodo de Estadísticas ni
  los diálogos abiertos. Al recargar, esos estados se pierden y la vista vuelve a su estado inicial,
  como hoy.

### Escrituras de clases y separación de capas

- RF-10: CUANDO el usuario guarda una clase nueva o editada con datos válidos, EL SISTEMA la persiste,
  cierra el formulario y actualiza las vistas que muestran clases y estadísticas, igual que hoy.
- RF-11: SI el guardado de una clase falla mientras el formulario sigue abierto, ENTONCES EL SISTEMA
  mantiene el formulario abierto, muestra el error y permite corregir y reintentar, igual que hoy.
- RF-12: CUANDO el usuario confirma la eliminación de una clase, EL SISTEMA la elimina, cierra el
  diálogo y actualiza las vistas que muestran clases y estadísticas, igual que hoy.
- RF-13: SI la eliminación falla mientras el diálogo de confirmación sigue abierto, ENTONCES EL
  SISTEMA mantiene el diálogo abierto, muestra el error y permite reintentar o cancelar, igual que hoy.
- RF-14: MIENTRAS hay una escritura de clase en curso, EL SISTEMA deshabilita los controles que
  podrían repetirla e indica la operación con «Guardando…» al guardar y «Eliminando…» al eliminar.
- RF-15: EL SISTEMA gestiona las escrituras de clases en la capa de estado de la interfaz; la vista
  contenedora no conoce detalles de acceso a datos y se limita a decidir qué pestaña y qué diálogos
  mostrar.
- RF-16: SI una escritura falla después de que su diálogo se haya cerrado por una navegación,
  ENTONCES EL SISTEMA muestra el error como aviso visible en la pestaña activa, sin ocultarlo.

### Fecha en el diálogo de borrado

- RF-17: CUANDO el usuario pide eliminar una clase, EL SISTEMA muestra en la confirmación la fecha de
  la clase en formato largo, no en formato técnico.
- RF-18: SI la fecha de la clase no se puede interpretar, ENTONCES EL SISTEMA omite la fecha del
  mensaje y no muestra el formato técnico, de modo que la confirmación sigue siendo comprensible.

## Requisitos no funcionales

- **Accesibilidad**: las pestañas conservan su comportamiento actual de teclado, su estado seleccionado
  accesible y el foco del diálogo; los errores de escritura se siguen anunciando en una región viva;
  el cambio de pestaña no atrapa ni pierde el foco del usuario.
- **Idioma**: textos de interfaz y mensajes de error en español; las direcciones usan las palabras
  visibles sin tildes (`inicio`, `historial`, `estadisticas`); identificadores y código en inglés.
- **Compatibilidad**: la aplicación sigue funcionando sin desbordes horizontales a 375 px y sin
  dependencias nuevas. Las direcciones de pestaña funcionan con el servidor de desarrollo local sin
  configuración adicional.
- **Rendimiento**: el enrutado no añade peticiones de datos por sí mismo; el cambio de pestaña sigue
  cargando la vista como hasta ahora.
- **Separación de responsabilidades**: las lecturas de datos siguen en sus puntos actuales; las
  escrituras de clases quedan concentradas en un único punto de la capa de estado de la interfaz.
- **Contrato**: no cambia la forma de las respuestas ni las reglas de validación existentes; un fallo
  de escritura se muestra como error visible, nunca como éxito silencioso.

## Casos límite

- Abrir la aplicación sin fragmento en la dirección: se muestra Inicio y la dirección queda como
  `#/inicio`, sin una entrada extra en el historial.
- Abrir con `#`, `#/` o un fragmento vacío: mismo comportamiento que sin fragmento.
- Abrir con una dirección desconocida, con mayúsculas (`#/Historial`), con barra final
  (`#/historial/`) o con segmentos adicionales: se muestra Inicio y se normaliza la dirección.
- Recargar estando en Historial o Estadísticas: se conserva esa pestaña.
- Abrir directamente un enlace a Historial o Estadísticas en una pestaña nueva: se muestra la pestaña
  pedida.
- Usar Atrás después de normalizar una dirección desconocida: no se vuelve a la dirección desconocida.
- Recorrer varias pestañas con Atrás y Adelante: la pestaña marcada y el contenido mostrado coinciden
  en cada paso.
- Volver a elegir la pestaña activa: no se recarga la vista y no se añade una entrada; Atrás vuelve
  a la pestaña anterior real.
- Navegar con Atrás o Adelante mientras hay un diálogo abierto: el diálogo se cierra (aunque tenga
  cambios sin guardar o una escritura en curso) y la pestaña de fondo cambia. Si la escritura falla
  después de cerrarse, el error se muestra como aviso visible en la pestaña activa.
- Guardar una clase con error del servidor: el formulario permanece abierto con el mensaje y se puede
  reintentar sin duplicar la clase.
- Eliminar una clase con error del servidor: el diálogo permanece abierto con el mensaje, se puede
  reintentar y cancelar limpia el error.
- Cancelar el diálogo de borrado: no se elimina nada ni se modifica la dirección.
- Fecha de clase que no se puede interpretar: el mensaje no muestra `AAAA-MM-DD` y sigue siendo
  comprensible.

## Fuera de alcance

- Reflejar en la dirección filtros del Historial, periodo de Estadísticas, búsqueda o diálogos abiertos.
- Recordar la última pestaña visitada en el almacenamiento local del navegador.
- Introducir una librería de enrutado o rutas basadas en la ruta de la dirección (sin `#`).
- Rutas anidadas, parámetros de ruta, transiciones, animaciones o carga diferida por ruta.
- Conservar los datos o filtros de una pestaña al cambiar a otra y volver.
- Cambiar el orden, las etiquetas o la apariencia de las pestañas.
- Cambiar las reglas de negocio, la validación o la forma de las respuestas de la API.
- Cambiar el formato de fecha en otras vistas o añadir zonas horarias.
- Mover las lecturas de datos a la capa de estado de escritura.

## Criterios de finalización

- RF-1 a RF-14, RF-16, RF-17 y RF-18 cubiertos por tests automatizados del frontend.
- RF-15 verificado por revisión estructural: la vista contenedora solo orquesta y no contiene llamadas
  de escritura, y las escrituras de clases se gestionan en un único punto de la capa de estado.
- `npm test` y `npm run lint` en verde desde la raíz.
- Cada test nuevo falla si se revierte la regla que cubre (mutación).
- Comprobación manual en navegador: abrir cada dirección directamente, recargar en cada pestaña,
  recorrer pestañas con Atrás/Adelante, abrir una dirección desconocida, compartir un enlace, borrar
  una clase con error y comprobar la fecha del diálogo; revisar el layout a 375 px.
- `README.md` (funcionalidades y direcciones), `MEMORY.md` y `DEUDA_TECNICA.md` (B6-3, B6-4 y B6-5)
  actualizados al cerrar.

## Dudas abiertas

Ninguna.
