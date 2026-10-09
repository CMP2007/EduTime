import { request } from '../api/client.js';

export const statsApi = {
  get({ period, date, heatmap } = {}) {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (date) params.set('date', date);
    if (heatmap) params.set('heatmap', heatmap);
    const query = params.toString();
    return request(`/stats${query ? `?${query}` : ''}`);
  },
};
