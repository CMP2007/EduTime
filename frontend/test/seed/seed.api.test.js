import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/api/ApiError.js';
import { request } from '../../src/api/client.js';
import { seedApi } from '../../src/seed/seed.api.js';

vi.mock('../../src/api/client.js', () => ({ request: vi.fn() }));

describe('seedApi · carga de datos de ejemplo', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('llama a POST /api/seed y devuelve el cuerpo (null en 204)', async () => {
    request.mockResolvedValue(null);

    await expect(seedApi.apply()).resolves.toBeNull();
    expect(request).toHaveBeenCalledWith('/seed', { method: 'POST' });
  });

  it('propaga el ApiError con su status cuando ya hay clases', async () => {
    request.mockRejectedValue(
      new ApiError('Ya hay clases registradas; no se cargan datos de ejemplo.', 409),
    );

    const error = await seedApi.apply().catch((requestError) => requestError);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
  });
});
