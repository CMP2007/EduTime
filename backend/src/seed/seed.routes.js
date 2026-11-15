import { Router } from 'express';
import { seedService } from './seed.service.js';

const router = Router();

router.post('/', async (_request, response) => {
  await seedService.apply();
  response.status(204).send();
});

export default router;
