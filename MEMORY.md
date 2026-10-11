#### #MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

#### ##Estado actual

- v1 de StudyTrack funcionando: monorepo con frontend (React 18 + Vite) y backend
  (Node + Express 4).
- Registrar clases (temática, fecha, duración y observaciones) desde un formulario
  emergente.
- Pestañas: Inicio (meta del día, horas del día/semana, racha, días con actividad y heatmap),
  Historial (listado con filtros, editar y eliminar) y Estadísticas (métricas por
  periodo y horas por temática).
- Inicio (terminado): tarjetas **Meta del día** y **Horas** (cambian al seleccionar un día en
  el heatmap, con botón "Deshacer") y **Racha** y **Días con actividad** (globales, fijas). El
  calendario se ancla a hoy para no moverse y va junto al selector (izquierda), cada uno en un panel.
- Persistencia en `backend/data/sessions.json` (ignorado por git).

#### ##Decisiones (y por qué)

- Persistencia en archivo JSON con `fs`: sobrevive a reinicios sin añadir dependencias.
- Un archivo por funcionalidad: cada componente, hook, ruta, servicio y repositorio en
  su propio archivo, para que el código sea fácil de leer y mantener.
- El backend calcula las métricas (`/api/stats`): racha, periodos, temáticas y heatmap.
- Meta diaria = 180 min (≥ 3h). La racha cuenta días consecutivos con la meta cumplida
  (global hasta hoy). Las tarjetas "Racha" y "Días con actividad" son globales y no cambian
  al seleccionar un día; el calendario se ancla a hoy para no moverse.
- Duración en dos campos (horas + minutos) con mínimo de 15 min por clase.

#### ##Aprendizajes y errores a evitar

- Mantener `MEMORY.md` y `AGENTS.md` sincronizados con el estado real del proyecto.
- Cuidado con las fechas: usar siempre fecha local y comparar como `YYYY-MM-DD`.
- CSS: en un flex item, `width: 100%` cuenta para el corte de línea y provoca saltos; usar
  `flex: 1 1 0` + `min-width` para ocupar el espacio disponible sin saltar.

#### ##Próximos pasos

- Añadir tests (backend y frontend) más adelante.
- Posibles mejoras: exportar datos, gráficos de evolución, temas de color.
