import { request } from '../api/client.js';

export const seedApi = {
  apply() {
    return request('/seed', { method: 'POST' });
  },
};
