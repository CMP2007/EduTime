import { request } from '../api/client.js';

export const statsApi = {
  get({ period, date, heatmap, heatmapDate } = {}) {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (date) params.set('date', date);
    if (heatmap) params.set('heatmap', heatmap);
    if (heatmapDate) params.set('heatmapDate', heatmapDate);
    const query = params.toString();
    return request(`/stats${query ? `?${query}` : ''}`);
  },
};
