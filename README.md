# StudyTrack

Aplicación para el **control de tus horas de estudio**.

- **Frontend**: React 19 + Vite. Ver [`frontend/src/`](frontend/src/)
- **Backend**: Node.js + Express 5. Ver [`backend/src/`](backend/src/)
- **Persistencia**: archivo JSON (`backend/data/sessions.json`), ignorado por git.
- **Documentación oficial**: este archivo (`README.md`) es la fuente de verdad de funcionalidades, reglas y estructura; [`AGENTS.md`](./AGENTS.md) es la guía operativa para agentes (convenciones, capas, flujo SDD).

## Funcionalidades

- Registrar clases con temática, fecha, duración (horas + minutos) y observaciones.
- **Inicio**: meta diaria (3h), racha actual y récord, horas de la semana, días con meta cumplida y calendario de actividad (heatmap).
- **Historial**: listado completo con filtros por fecha y temática; editar y eliminar (con confirmación).
- **Estadísticas**: horas por periodo (día, semana, mes, 3/6/12 meses y año), horas por temática, clase más larga y totales históricos.

## Reglas de negocio

- Un **día con meta cumplida** es el que suma **3 horas o más** (aunque sean varias clases).
- La **racha** son días consecutivos en los que se **cumplió la meta diaria (≥ 180 min)**. Si hoy aún no se llega a la meta, la racha sigue viva hasta fin del día. Se guarda la **racha más extensa** (récord).
- Cada clase dura como **mínimo 15 minutos** y como **máximo 23h** (`durationMinutes`).
- `title` obligatorio, máx. 80 caracteres; `notes` opcional, máx. 500.

## Modelo (resumen)

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | UUID estable |
| `title` | string | Obligatorio, max 80 |
| `date` | string | `YYYY-MM-DD` |
| `durationMinutes` | int | 15 – 1380 (23h) |
| `notes` | string | Opcional, max 500 |

## API (resumen)

- `GET /api/health`, `GET /api/sessions` (filtros `from`/`to`/`q`), `POST /api/sessions`, `PUT /api/sessions/:id`, `DELETE /api/sessions/:id`
- `GET /api/stats` (params `period`, `date`, `heatmap`, `heatmapDate`)

Los errores de validación responden `400` (incluidos `period` y `heatmap` inválidos en `/api/stats`); los recursos inexistentes, `404`.

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
               "days": [ { "date", "minutes", "goalMet" } ] }
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
