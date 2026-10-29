import { assertSession, assertSessionList } from 'domain-contracts';
import { request } from '../api/client.js';

export const sessionsApi = {
  async list({ from, to, q } = {}) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    const query = params.toString();
    const data = await request(`/sessions${query ? `?${query}` : ''}`);
    return assertSessionList(data);
  },

  async create(payload) {
    const data = await request('/sessions', { method: 'POST', body: JSON.stringify(payload) });
    return assertSession(data);
  },

  async update(id, payload) {
    const data = await request(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return assertSession(data);
  },

  remove(id) {
    return request(`/sessions/${id}`, { method: 'DELETE' });
  },
};
