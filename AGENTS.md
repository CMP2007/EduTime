# AGENTS.md

Guía para agentes de IA que trabajen en este repositorio. Léela antes de tocar código.

## Descripción del proyecto

**StudyTrack**: aplicación para el control de horas de estudio.

- **Frontend**: React 18 + Vite (JavaScript/JSX).
- **Backend**: Node.js + Express 4.
- **Persistencia**: archivo JSON (`backend/data/sessions.json`).

Es un monorepo con **npm workspaces** (`frontend` y `backend`).

## Comandos

Todos se ejecutan desde la raíz.

```bash
npm install          # instala dependencias de todos los workspaces
npm run dev          # levanta frontend (5173) y backend (3001) juntos
npm run frontend     # solo frontend (vite --host 0.0.0.0)
npm run backend      # solo backend (node --watch src/server.js)
npm run build        # build de producción del frontend (vite build)
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- No hay suite de tests ni linter configurados actualmente.

## Estructura

Un archivo = una responsabilidad. Nada de mezclar funcionalidades o roles en un archivo.

```
backend/src/
  server.js                    # arranque del servidor (puerto 3001, variable PORT)
  app.js                       # monta las rutas /api y maneja errores
  storage/fileStore.js         # lectura/escritura del JSON en disco
  utils/date.js                # utilidades de fecha y periodos
  sessions/
    sessions.repository.js     # CRUD sobre el almacenamiento
    sessions.service.js        # validación + reglas de negocio
    sessions.routes.js         # endpoints /api/sessions
    seed.js                    # datos de ejemplo iniciales
  stats/
    stats.service.js           # racha, periodos, temáticas, heatmap
    stats.routes.js            # endpoint /api/stats

frontend/src/
  main.jsx                     # punto de entrada de React
  App.jsx                      # layout + pestaña activa + modales globales
  api/client.js                # fetch genérico a la API
  components/                  # componentes reutilizables (Modal, Tabs, Card…)
  sessions/                    # feature de clases: api, hook, formulario, historial
  stats/                       # feature de métricas: api, hook, tarjetas, heatmap
  utils/                       # helpers de tiempo y fecha
  styles.css                   # estilos globales
```

## Modelo de datos (clase/sesión)

| Campo             | Tipo    | Reglas                                            |
|-------------------|---------|---------------------------------------------------|
| `id`              | string  | `crypto.randomUUID()`, estable entre reinicios    |
| `title`           | string  | Obligatorio, máx. 80 caracteres (temática)        |
| `date`            | string  | `YYYY-MM-DD`, obligatorio                          |
| `durationMinutes` | integer | Mínimo 15 min, máximo 23h                          |
| `notes`           | string  | Opcional, máx. 500 caracteres                      |
| `createdAt`       | string  | ISO 8601                                           |
| `updatedAt`       | string  | ISO 8601                                           |

## Reglas de negocio

- **Meta diaria**: 180 minutos (3h). Un "día con meta cumplida" suma **≥ 180 min**, da igual si es una o varias clases.
- **Racha**: días consecutivos con **al menos una clase**. Si hoy aún no hay clase, la racha sigue viva hasta fin del día. Se guarda la **racha más extensa** (récord).
- **Semana**: lunes a domingo. **Mes**: calendario. **Año**: natural.
- **Periodos** de estadísticas: `day`, `week`, `month`, `3m`, `6m`, `12m`, `year`.
- **Heatmap**: días coloreados según horas; los días con meta cumplida se marcan con un borde.

## API

| Método | Ruta                     | Descripción                                   |
|--------|--------------------------|-----------------------------------------------|
| GET    | `/api/health`            | Healthcheck.                                  |
| GET    | `/api/sessions`          | Lista clases. Filtros: `from`, `to`, `q`.     |
| POST   | `/api/sessions`          | Crea una clase (valida).                      |
| PUT    | `/api/sessions/:id`      | Edita una clase.                              |
| DELETE | `/api/sessions/:id`      | Elimina una clase (204).                      |
| GET    | `/api/stats`             | Métricas. Params: `period`, `date`, `heatmap`.|

Los errores de validación responden `400`; los recursos inexistentes, `404`.

## Convenciones de código

- **ES Modules** (`import`/`export`) en backend y frontend. Los `package.json` usan `"type": "module"`.
- **Idioma**: identificadores y nombres técnicos en inglés; textos de UI, mensajes de error y comentarios dirigidos al usuario en español.
- **Backend**: `server.js` solo arranca; las rutas viven en `*.routes.js`; la lógica en `*.service.js`; el acceso a datos en `*.repository.js`. No mezclar capas.
- **Frontend**: un componente por archivo. La lógica de datos en hooks (`use*.js`) y las llamadas HTTP en `*.api.js`.
- **Estilo**: punto y coma al final, comillas simples, indentación de 2 espacios, funciones flecha, sin clases.
- Los repositorios y servicios devuelven copias (`{ ...item }`) para no exponer el estado interno.
- El frontend usa `VITE_API_URL` (por defecto `http://localhost:3001/api`); el proxy de Vite ya reenvía `/api`.

## Reglas al modificar el proyecto

1. **No añadir dependencias** sin justificar por qué no se resuelve con lo existente.
2. Mantener la separación por capas: `repository` (datos) / `service` (reglas) / `routes` (HTTP).
3. Mantener la regla de **un archivo por funcionalidad/componente**.
4. Validar toda entrada del usuario en el backend antes de usarla.
5. **Persistencia en archivo JSON** (`backend/data/sessions.json`, ignorado por git). No dejar datos solo en memoria. Los IDs son estables.
6. Al añadir una funcionalidad, actualizar este `AGENTS.md` (si cambia la estructura, el modelo o los comandos) y `MEMORY.md`.
7. Para planificar una funcionalidad antes de codificar, usar el comando `/feature`.

## Notas

- `MEMORY.md` es el diario de estudio del proyecto (estado, decisiones, aprendizajes). Revisarlo al empezar una sesión.
- `.opencode/commands/feature.md` define el flujo de planificación previa.
