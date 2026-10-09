import { Router } from 'express';
import { statsService } from './stats.service.js';

const router = Router();

router.get('/', async (request, response, next) => {
  try {
    const stats = await statsService.getStats({
      period: request.query.period,
      date: request.query.date,
      heatmap: request.query.heatmap,
      heatmapDate: request.query.heatmapDate,
    });
    response.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
