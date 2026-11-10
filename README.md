# StudyTrack

Aplicación para el **control de tus horas de estudio**.

- **Frontend**: React 19 + Vite. Ver [`frontend/src/`](frontend/src/)
- **Backend**: Node.js + Express 5. Ver [`backend/src/`](backend/src/)
- **Persistencia**: archivo JSON (`backend/data/sessions.json`), ignorado por git.
- **Documentación oficial**: este archivo (`README.md`) es la fuente de verdad de funcionalidades, reglas y estructura; [`AGENTS.md`](./AGENTS.md) es la guía operativa para agentes (convenciones, capas, flujo SDD).

## Funcionalidades

- Registrar clases con temática, fecha, duración (horas y minutos, o solo una parte) y observaciones.
- **Inicio**: meta diaria (3h), racha actual y récord, horas de la semana, días con meta cumplida y calendario de actividad (heatmap).
- **Historial**: listado completo con filtros por fecha y temática; editar y eliminar (con confirmación).
- **Estadísticas**: horas por periodo (día, semana, mes, 3/6/12 meses y año), horas por temática, clase más larga y totales históricos.

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
- `title` obligatorio, máx. 80 caracteres; `notes` opcional, máx. 500.
- La **fecha** debe ser una fecha real en formato `YYYY-MM-DD`, entre `1990-01-01` y
  `9999-12-31`; se rechaza con `400` si no lo es (no se recorta la entrada del usuario).

## Modelo (resumen)

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | UUID estable |
| `title` | string | Obligatorio, max 80 |
| `date` | string | `YYYY-MM-DD` real, 1990–9999 |
| `durationMinutes` | int | 15 – 1439 (23:59) |
| `notes` | string | Opcional, max 500 |

## API (resumen)

- `GET /api/health`, `GET /api/sessions` (filtros `from`/`to`/`q`), `POST /api/sessions`, `PUT /api/sessions/:id`, `DELETE /api/sessions/:id`
- `GET /api/stats` (params `period`, `date`, `heatmap`, `heatmapDate`)

Los errores de validación responden `400` (incluidos `period` y `heatmap` inválidos en `/api/stats`,
fechas inválidas en `POST`/`PUT /api/sessions` y en los filtros `from`/`to`, y rangos invertidos);
los recursos inexistentes, `404`.

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
               "longestClass", "subjects" },
  "global":  { "totalMinutes", "totalSessions",
               "activeDays", "goalDays",              // históricos (todos los días)
               "streak": { "current", "best" } },      // global hasta hoy
  "today":   { "date", "minutes", "goalMinutes", "goalMet" },  // día de referencia
  "heatmap": { "range", "label", "from", "to", "goalMinutes",
               "days": [ { "date", "minutes", "goalMet" } ] },
  "notice":  null  // aviso de recorte del rango, o null si no hubo recorte
}
```

## Ejecutar

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Scripts

| Comando | Acción |
|---------|--------|
| `npm run dev` | Frontend + backend a la vez |
| `npm run frontend` | Solo frontend |
| `npm run backend` | Solo backend |
| `npm run build` | Build de producción del frontend |

La documentación oficial (funcionalidades, reglas, modelo, API) está en este archivo (`README.md`). La guía operativa para agentes (capas, convenciones de código, flujo SDD, tests) está en [`AGENTS.md`](./AGENTS.md); el diario del proyecto en [`MEMORY.md`](./MEMORY.md). Ver [`DEUDA_TECNICA.md`](DEUDA_TECNICA.md) para pendientes documentadas.
