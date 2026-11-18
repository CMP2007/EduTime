import { assertStats } from 'domain-contracts';
import { request } from '../api/client.js';

export const statsApi = {
  async get({ period, date, heatmap, heatmapDate, signal } = {}) {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (date) params.set('date', date);
    if (heatmap) params.set('heatmap', heatmap);
    if (heatmapDate) params.set('heatmapDate', heatmapDate);
    const query = params.toString();
    const path = `/stats${query ? `?${query}` : ''}`;
    const data = signal ? await request(path, { signal }) : await request(path);
    return assertStats(data);
  },
};
