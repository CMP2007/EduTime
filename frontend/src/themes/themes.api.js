import { assertTheme, assertThemeList } from 'domain-contracts';
import { request } from '../api/client.js';

export const themesApi = {
  async list({ signal } = {}) {
    const data = signal ? await request('/themes', { signal }) : await request('/themes');
    return assertThemeList(data);
  },

  async create(name) {
    const data = await request('/themes', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return assertTheme(data);
  },

  async rename(id, name) {
    const data = await request(`/themes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    return assertTheme(data);
  },

  remove(id, options) {
    if (!options) {
      return request(`/themes/${id}`, { method: 'DELETE' });
    }
    return request(`/themes/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(options),
    });
  },
};
