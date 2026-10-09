import { request } from '../api/client.js';

export const sessionsApi = {
  list({ from, to, q } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    const query = params.toString();
    return request(`/sessions${query ? `?${query}` : ''}`);
  },

  create(payload) {
    return request('/sessions', { method: 'POST', body: JSON.stringify(payload) });
  },

  update(id, payload) {
    return request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  remove(id) {
    return request(`/sessions/${id}`, { method: 'DELETE' });
  },
};
