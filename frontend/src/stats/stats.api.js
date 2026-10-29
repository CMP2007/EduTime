import { assertStats } from 'domain-contracts';
import { request } from '../api/client.js';

export const statsApi = {
  async get({ period, date, heatmap, heatmapDate } = {}) {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (date) params.set('date', date);
    if (heatmap) params.set('heatmap', heatmap);
    if (heatmapDate) params.set('heatmapDate', heatmapDate);
    const query = params.toString();
    const data = await request(`/stats${query ? `?${query}` : ''}`);
    return assertStats(data);
  },
};
