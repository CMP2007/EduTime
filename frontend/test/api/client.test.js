import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/api/ApiError.js';
import { request } from '../../src/api/client.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
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

  it('usa la ruta relativa /api por defecto', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await request('/sessions');

    expect(fetchMock).toHaveBeenCalledWith('/api/sessions', expect.anything());
  });

  it('ignora VITE_API_URL y usa siempre la ruta relativa /api', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_API_URL', 'http://evil.example/api');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { request: requestWithEnv } = await import('../../src/api/client.js');
    await requestWithEnv('/sessions');

    expect(fetchMock).toHaveBeenCalledWith('/api/sessions', expect.anything());
  });

  it('traduce un fallo de transporte a un ApiError en español', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await request('/sessions').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/No se pudo conectar con el servicio/);
    expect(error.message).not.toContain('Failed to fetch');
  });

  it('reenvía el signal de cancelación a fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await request('/sessions', { signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sessions',
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('no disfraza una petición cancelada como error de red', async () => {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

    const error = await request('/sessions').catch((caught) => caught);

    expect(error).toBe(abortError);
    expect(error).not.toBeInstanceOf(ApiError);
  });

  it('conserva Content-Type cuando el llamador aporta cabeceras propias', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ date: '2026-11-18' }),
      headers: { 'X-Cliente': 'demo' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sessions',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', 'X-Cliente': 'demo' },
      }),
    );
  });

  it('permite al llamador sobrescribir el Content-Type por defecto', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await request('/sessions', {
      method: 'POST',
      body: 'texto plano',
      headers: { 'Content-Type': 'text/plain' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sessions',
      expect.objectContaining({ headers: { 'Content-Type': 'text/plain' } }),
    );
  });

  it('no envía Content-Type en una petición sin cuerpo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await request('/stats');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers?.['Content-Type']).toBeUndefined();
  });

  it('envía Content-Type cuando un DELETE lleva cuerpo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await request('/themes/theme-1', {
      method: 'DELETE',
      body: JSON.stringify({ strategy: 'delete' }),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/themes/theme-1',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('conserva method, body y signal al fusionar las cabeceras', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await request('/sessions/session-1', {
      method: 'PUT',
      body: JSON.stringify({ date: '2026-11-18' }),
      headers: { 'X-Cliente': 'demo' },
      signal: controller.signal,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sessions/session-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ date: '2026-11-18' }),
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-Cliente': 'demo' },
      }),
    );
  });
});
