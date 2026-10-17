import cors from 'cors';
import express from 'express';
import sessionsRoutes from './sessions/sessions.routes.js';
import statsRoutes from './stats/stats.routes.js';
import { ValidationError } from './sessions/sessions.service.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', app: 'StudyTrack' });
});

app.use('/api/sessions', sessionsRoutes);
app.use('/api/stats', statsRoutes);

app.use((_request, response) => {
  response.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((error, _request, response, _next) => {
  if (error instanceof ValidationError) {
    return response.status(400).json({ error: error.message });
  }

  // Los errores con estado 4xx (p. ej. el SyntaxError de express.json con
  // body malformado) son fallos del cliente, no del servidor: se respetan y
  // no se registran con stacktrace.
  const status = Number(error.status || error.statusCode);
  if (status >= 400 && status < 500) {
    const message = error.type === 'entity.parse.failed'
      ? 'JSON inválido en el cuerpo de la petición'
      : error.message;
    return response.status(status).json({ error: message });
  }

  console.error(error);
  return response.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
