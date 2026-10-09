import { Router } from 'express';
import { sessionsService } from './sessions.service.js';

const router = Router();

router.get('/', async (request, response, next) => {
  try {
    const sessions = await sessionsService.list({
      from: request.query.from,
      to: request.query.to,
      q: request.query.q,
    });
    response.json(sessions);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (request, response, next) => {
  try {
    const created = await sessionsService.create(request.body || {});
    response.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (request, response, next) => {
  try {
    const updated = await sessionsService.update(request.params.id, request.body || {});
    if (!updated) {
      return response.status(404).json({ error: 'Clase no encontrada' });
    }
    return response.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (request, response, next) => {
  try {
    const removed = await sessionsService.remove(request.params.id);
    if (!removed) {
      return response.status(404).json({ error: 'Clase no encontrada' });
    }
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});

export default router;
