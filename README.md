# StudyTrack

Aplicación para el **control de tus horas de estudio**.

- **Frontend**: React 19 + Vite. Ver [`frontend/src/`](frontend/src/)
- **Backend**: Node.js + Express 5. Ver [`backend/src/`](backend/src/)
- **Persistencia**: archivos JSON (`backend/data/sessions.json` y `backend/data/themes.json`), ignorados por git.
- **Documentación oficial**: este archivo (`README.md`) es la fuente de verdad de funcionalidades, reglas y estructura; [`AGENTS.md`](./AGENTS.md) es la guía operativa para agentes (convenciones, capas, flujo SDD).

## Funcionalidades

- **Catálogo de temáticas**: cada temática tiene un identificador estable y un nombre único; se crea,
  renombra y elimina desde la gestión de temáticas (botón «Temáticas» en la cabecera).
- Registrar clases eligiendo la temática del catálogo, con fecha, duración (horas y minutos, o solo
  una parte) y observaciones. La temática se puede crear sin salir del formulario con el botón «+».
- Al eliminar una temática con clases se pregunta si reasignarlas a otra temática o eliminarlas junto
  con ella.
- **Inicio**: meta diaria (3h), racha actual y récord, horas de la semana, días con meta cumplida y calendario de actividad (heatmap).
- **Historial**: listado completo con filtros por fecha, por temática y búsqueda en las observaciones; editar y eliminar (con confirmación).
- **Estadísticas**: horas por periodo (día, semana, mes, 3/6/12 meses y año), horas por temática, clase más larga y totales históricos.
- **Datos de ejemplo**: si la aplicación está vacía, se ofrece cargarlos; no se escriben hasta que el
  usuario los acepta y nunca se mezclan con clases existentes.

## Reglas de negocio

- Un **día con meta cumplida** es el que suma **3 horas o más** (aunque sean varias clases).
- La **racha** son días consecutivos en los que se **cumplió la meta diaria (≥ 180 min)**. Si hoy aún no se llega a la meta, la racha sigue viva hasta fin del día. Se guarda la **racha más extensa** (récord).
- Cada clase dura como **mínimo 15 minutos** y como **máximo 23:59** (`durationMinutes`, 1439).
- La duración se puede enviar como **horas + minutos**, **solo horas** o **solo minutos**; la parte
  ausente (no enviada, `null` o cadena vacía) vale `0`.
- Al **editar sin enviar horas ni minutos**, se conserva la duración actual; si está fuera del rango
  válido se ajusta al límite más cercano (15 o 1439), sin aviso.
- Enviar `durationMinutes` directamente no se acepta: se ignora; si también llegan horas o minutos,
  mandan horas y minutos.
- El **nombre de la temática** es obligatorio, se recorta en los extremos y admite de 1 a 80
  caracteres; se conserva tal como lo escribe el usuario. Dos nombres que coinciden al recortar
  espacios y al ignorar mayúsculas y tildes son la misma temática: no se permite duplicarlos.
- Cada clase **debe** asociarse a una temática del catálogo por su `themeId`; el nombre que se muestra
  se toma siempre del catálogo, así que un renombrado se refleja en historial y estadísticas.
- La **fecha** debe ser una fecha real en formato `YYYY-MM-DD`, entre `1990-01-01` y
  `9999-12-31`; se rechaza con `400` si no lo es (no se recorta la entrada del usuario).
- `notes` es opcional, máx. 500.

## Modelo (resumen)

### Temática

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | UUID estable |
| `name` | string | Obligatorio, 1–80, único sin distinguir mayúsculas ni tildes |
| `sessionCount` | int | Solo en la API: número de clases asociadas |

### Clase

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | UUID estable |
| `themeId` | string | Obligatorio; debe existir en el catálogo |
| `themeName` | string | Solo en la API: nombre actual de la temática |
| `date` | string | `YYYY-MM-DD` real, 1990–9999 |
| `durationMinutes` | int | 15 – 1439 (23:59) |
| `notes` | string | Opcional, max 500 |

## API (resumen)

- `GET /api/health`
- `GET /api/themes` (listado con `sessionCount`), `POST /api/themes` (`{ name }`),
  `PUT /api/themes/:id` (`{ name }`) y `DELETE /api/themes/:id`
  (sin cuerpo si no tiene clases; con clases, `{ strategy: 'reassign', targetThemeId }` o
  `{ strategy: 'delete' }`)
- `GET /api/sessions` (filtros `from`/`to`/`themeId`; `q` busca solo en las observaciones),
  `POST /api/sessions`, `PUT /api/sessions/:id`, `DELETE /api/sessions/:id`
- `GET /api/stats` (params `period`, `date`, `heatmap`, `heatmapDate`)
- `POST /api/seed` carga los datos de ejemplo; responde `204` y `409` si ya hay clases.

Los errores de validación responden `400` (incluidos `period` y `heatmap` inválidos en `/api/stats`,
fechas inválidas en `POST`/`PUT /api/sessions` y en los filtros `from`/`to`/`themeId`, y rangos
invertidos); los recursos inexistentes, `404`; los datos de ejemplo con clases existentes, `409`.

### Duración de las clases

- `POST /api/sessions` acepta `hours` y `minutes` juntos o por separado; si no llega ninguno, responde
  `400` con el mínimo de 15 minutos.
- `PUT /api/sessions/:id` sigue las mismas reglas, pero si no llega ninguna parte conserva la duración
  guardada y la ajusta a 15–1439 si estaba fuera de rango.
- Una duración guardada no numérica o no entera queda fuera de alcance: se asume un entero.

### Fechas y rangos

- Toda fecha de la API (`date`, `from`, `to`, `date` y `heatmapDate` de estadísticas) debe ser una
  fecha **real** `YYYY-MM-DD` (sin espacios ni ceros omitidos) entre `1990-01-01` y
  `9999-12-31`; si no, la respuesta es `400`.
- En `GET /api/sessions`, un `from` posterior a `to` responde `400`; el historial muestra un aviso
  visible y no llega a consultar.
- Los rangos **derivados** de un periodo (`week`, `month`, `3m`, `6m`, `12m`, `year`) y del
  calendario se recortan a `1990-01-01`–`9999-12-31`. Cuando hay recorte, `/api/stats` incluye
  `notice` con el aviso; un rango interior devuelve `notice: null`.
- La enumeración de días (`enumerateDays`) rechaza con error los rangos de **más de 4000 días**
  en lugar de truncarlos en silencio.

### Respuesta de `/api/stats`

`date` es el **día de referencia** (define el periodo y el campo `today`); `heatmapDate` ancla el calendario (por defecto, `date`).

```jsonc
{
  "period":  { "key": "week", "label": "…", "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" },
  "summary": { "totalMinutes", "totalSessions",
               "activeDays",   // días con clases en el periodo
               "goalDays",     // días con meta cumplida en el periodo
               "longestClass": { "id", "themeId", "name", "date", "durationMinutes" },
               "subjects": [ { "themeId", "name", "minutes", "sessions" } ] },
  "global":  { "totalMinutes", "totalSessions",
               "activeDays", "goalDays",              // históricos (todos los días)
               "streak": { "current", "best" } },      // global hasta hoy
  "today":   { "date", "minutes", "goalMinutes", "goalMet" },  // día de referencia
  "heatmap": { "range", "label", "from", "to", "goalMinutes",
               "days": [ { "date", "minutes", "goalMet" } ] },
  "notice":  null  // aviso de recorte del rango, o null si no hubo recorte
}
```

Las horas se agrupan por `themeId` del catálogo y el nombre mostrado es el actual: renombrar una
temática cambia `name` en `longestClass` y `subjects` sin recalcular las horas. Una clase que
referencie una temática inexistente hace fallar la respuesta con un error explícito.

## Ejecutar

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

> **Actualización desde una versión anterior:** los datos de `backend/data/` son de muestra y
> no se migran. Borra esa carpeta antes de arrancar esta versión. Si queda una clase con el
> formato antiguo (`title`), sin `themeId` o con una temática inexistente, el arranque falla con
> un mensaje explícito y no sobrescribe nada.

### Datos de ejemplo

- Al arrancar no se crea ningún dato. Si no hay clases, la aplicación pregunta si cargar datos de
  ejemplo; solo se escriben si el usuario los acepta (`POST /api/seed`).
- Rechazar, cerrar el diálogo o pulsar Escape no escribe nada y se vuelve a preguntar en la
  siguiente carga mientras no exista ninguna clase.
- Si ya hay clases, el diálogo no aparece y la API rechaza la carga con `409`.
- Al aceptar se reutilizan las temáticas existentes cuyo nombre coincide (sin distinguir
  mayúsculas ni tildes) y solo se crean las que faltan.

## Scripts

| Comando | Acción |
|---------|--------|
| `npm run dev` | Frontend + backend a la vez |
| `npm run frontend` | Solo frontend |
| `npm run backend` | Solo backend |
| `npm run build` | Build de producción del frontend |

La documentación oficial (funcionalidades, reglas, modelo, API) está en este archivo (`README.md`). La guía operativa para agentes (capas, convenciones de código, flujo SDD, tests) está en [`AGENTS.md`](./AGENTS.md); el diario del proyecto en [`MEMORY.md`](./MEMORY.md). Ver [`DEUDA_TECNICA.md`](DEUDA_TECNICA.md) para pendientes documentadas.
