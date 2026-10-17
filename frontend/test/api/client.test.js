import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../../src/api/client.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request', () => {
  it('lanza un error que conserva el status HTTP cuando la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Clase no encontrada' }),
      }),
    );

    const error = await request('/sessions/123').catch((caught) => caught);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Clase no encontrada');
    expect(error.status).toBe(404);
  });

  it('distingue un 400 de un 500 mediante el status del error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'JSON inválido en el cuerpo de la petición' }),
      }),
    );

    const error = await request('/sessions', { method: 'POST', body: '{bad json' }).catch((caught) => caught);

    expect(error.status).toBe(400);
  });

  it('devuelve null ante un 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

    await expect(request('/sessions/123', { method: 'DELETE' })).resolves.toBeNull();
  });
});
