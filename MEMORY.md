#### #MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

#### ##Estado actual

- v1 de StudyTrack funcionando: monorepo con frontend (React 18 + Vite) y backend
  (Node + Express 4).
- Registrar clases (temática, fecha, duración y observaciones) desde un formulario
  emergente.
- Pestañas: Inicio (meta del día, racha, horas de la semana, días con actividad y heatmap),
  Historial (listado con filtros, editar y eliminar) y Estadísticas (métricas por
  periodo y horas por temática).
- En Inicio, pulsar un día del heatmap enfoca las cuatro tarjetas en esa fecha; un botón
  "Deshacer" vuelve a los valores actuales (hoy/semana en curso). El calendario se ancla a
  hoy (no se mueve al seleccionar) y se muestra junto al selector, cada uno en un panel sutil.
- Persistencia en `backend/data/sessions.json` (ignorado por git).

#### ##Decisiones (y por qué)

- Persistencia en archivo JSON con `fs`: sobrevive a reinicios sin añadir dependencias.
- Un archivo por funcionalidad: cada componente, hook, ruta, servicio y repositorio en
  su propio archivo, para que el código sea fácil de leer y mantener.
- El backend calcula las métricas (`/api/stats`): racha, periodos, temáticas y heatmap.
- Meta diaria = 180 min (≥ 3h). La racha cuenta días consecutivos con la meta cumplida
  y se calcula hasta la fecha de referencia. La tarjeta "Días con actividad" muestra el
  conteo de días con clases, cuántos cumplieron la meta y el porcentaje de cumplimiento.
- Duración en dos campos (horas + minutos) con mínimo de 15 min por clase.

#### ##Aprendizajes y errores a evitar

- Mantener `MEMORY.md` y `AGENTS.md` sincronizados con el estado real del proyecto.
- Cuidado con las fechas: usar siempre fecha local y comparar como `YYYY-MM-DD`.

#### ##Próximos pasos

- Añadir tests (backend y frontend) más adelante.
- Posibles mejoras: exportar datos, gráficos de evolución, temas de color.
