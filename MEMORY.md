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
- Persistencia en `backend/data/sessions.json` (ignorado por git). Robusta: lectura única
  (single-flight), cola de escrituras (sin solapes), tmp único y sin arranque vacío si el
  fichero está corrupto (falla en vez de sobrescribir).
- **Calidad**: 49 tests de backend (runner nativo de Node) sobre fechas, estadísticas y
  persistencia, y ESLint en todo el monorepo. `npm test` y `npm run lint` en verde.
- **Dependencias**: `npm audit fix` resolvió las vulnerabilidades crítica/alta (`concurrently`→9.2.5,
  `source-map-js`→1.2.2). Quedan `esbuild`/`vite` (solo se arreglan subiendo Vite de major; ver B1-8).

#### ##Decisiones (y por qué)

- Persistencia en archivo JSON con `fs`: sobrevive a reinicios sin añadir dependencias.
- Concurrencia en la persistencia (B0-3): el repositorio cachea la **promesa** de lectura
  (single-flight), serializa las escrituras en una cola y usa un tmp único. El repositorio es
  una **fábrica** (`createSessionsRepository(store)`) para poder simular el almacenamiento en
  tests; la app usa la instancia por defecto.
- Fichero de datos corrupto/vacío (B3-1): **fallar** (500) y no tocarlo, en vez de tratarlo como
  vacío y sobrescribirlo. Un fallo visible es mejor que una pérdida silenciosa de datos.
- Un archivo por funcionalidad: cada componente, hook, ruta, servicio y repositorio en
  su propio archivo, para que el código sea fácil de leer y mantener.
- El backend calcula las métricas (`/api/stats`): racha, periodos, temáticas y heatmap.
- Meta diaria = 180 min (≥ 3h). La racha cuenta días consecutivos con la meta cumplida
  (global hasta hoy). Las tarjetas "Racha" y "Días con actividad" son globales y no cambian
  al seleccionar un día; el calendario se ancla a hoy para no moverse.
- Duración en dos campos (horas + minutos) con mínimo de 15 min por clase.
- Tests con el runner **nativo de Node** (`node --test`): sin dependencias. La capa de datos se
  simula con `mock.method`, así los tests son rápidos y no tocan el disco.
- ESLint solo impone el estilo ya declarado (2 espacios, comillas simples, punto y coma) y no las
  opiniones del preset completo (evita un diff masivo de estilo sin acordar).

#### ##Aprendizajes y errores a evitar

- Mantener `MEMORY.md` y `AGENTS.md` sincronizados con el estado real del proyecto.
- Un test que pasa no prueba nada por sí solo: conviene **romper el código a propósito** y
  comprobar que la suite falla (prueba de mutación).
- Al deshacer cambios con git, revertir **archivo por archivo** (`git checkout -- <archivo>`), no la
  carpeta entera: un `git checkout -- <dir>` se llevó por delante cambios buenos sin querer.
- Cuidado con las fechas: usar siempre fecha local y comparar como `YYYY-MM-DD`.
- CSS: en un flex item, `width: 100%` cuenta para el corte de línea y provoca saltos; usar
  `flex: 1 1 0` + `min-width` para ocupar el espacio disponible sin saltar.

#### ##Próximos pasos

- Tests de frontend (requieren DOM: valorar Vitest + Testing Library más adelante).
- Posibles mejoras: exportar datos, gráficos de evolución, temas de color.
- Continuar con el orden de `DEUDA_TECNICA.md` (siguiente: manejo de errores, punto 3).
