import { Router } from 'express';
import { sessionsService } from './sessions.service.js';

const router = Router();

router.get('/', async (request, response) => {
  const sessions = await sessionsService.list({
    from: request.query.from,
    to: request.query.to,
    q: request.query.q,
    themeId: request.query.themeId,
  });
  response.json(sessions);
});

router.post('/', async (request, response) => {
  const created = await sessionsService.create(request.body || {});
  response.status(201).json(created);
});

router.put('/:id', async (request, response) => {
  const updated = await sessionsService.update(request.params.id, request.body || {});
  if (!updated) {
    return response.status(404).json({ error: 'Clase no encontrada' });
  }
  return response.json(updated);
});

router.delete('/:id', async (request, response) => {
  const removed = await sessionsService.remove(request.params.id);
  if (!removed) {
    return response.status(404).json({ error: 'Clase no encontrada' });
  }
  return response.status(204).send();
});

export default router;
