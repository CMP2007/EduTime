import { Router } from 'express';
import { themesService } from './themes.service.js';

const router = Router();

router.get('/', async (_request, response) => {
  const themes = await themesService.list();
  response.json(themes);
});

router.post('/', async (request, response) => {
  const created = await themesService.create(request.body || {});
  response.status(201).json(created);
});

router.put('/:id', async (request, response) => {
  const updated = await themesService.rename(request.params.id, request.body || {});
  if (!updated) {
    return response.status(404).json({ error: 'Temática no encontrada' });
  }
  return response.json(updated);
});

router.delete('/:id', async (request, response) => {
  const removed = await themesService.remove(request.params.id, request.body || {});
  if (!removed) {
    return response.status(404).json({ error: 'Temática no encontrada' });
  }
  return response.status(204).send();
});

export default router;
