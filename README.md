# StudyTrack

Aplicación para el **control de tus horas de estudio**.

- **Frontend**: React 18 + Vite.
- **Backend**: Node.js + Express.
- **Persistencia**: archivo JSON (`backend/data/sessions.json`).

## Funcionalidades

- Registrar clases con temática, fecha, duración (horas + minutos) y observaciones.
- **Inicio**: meta diaria (3h), racha actual y récord, horas de la semana, días con meta cumplida y calendario de actividad (heatmap).
- **Historial**: listado completo con filtros por fecha y temática; editar y eliminar (con confirmación).
- **Estadísticas**: horas por periodo (día, semana, mes, 3/6/12 meses y año), horas por temática, clase más larga y totales históricos.

## Reglas de negocio

- Un **día con meta cumplida** es el que suma **3 horas o más** (aunque sean varias clases).
- La **racha** son días consecutivos con **al menos una clase**.
- Cada clase dura como **mínimo 15 minutos**.

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

La documentación para el desarrollo (estructura y convenciones) está en [`AGENTS.md`](./AGENTS.md), y el diario del proyecto en [`MEMORY.md`](./MEMORY.md).
