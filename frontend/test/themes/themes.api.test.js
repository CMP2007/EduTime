import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractError } from 'domain-contracts';
import { ApiError } from '../../src/api/ApiError.js';
import { request } from '../../src/api/client.js';
import { themesApi } from '../../src/themes/themes.api.js';
import { buildTheme } from '../fixtures/contracts.js';

vi.mock('../../src/api/client.js', () => ({ request: vi.fn() }));

describe('themesApi · contrato en el borde', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('lista las temáticas validadas contra el contrato', async () => {
    request.mockResolvedValue([buildTheme(), buildTheme({ id: 'theme-2', name: 'Física' })]);

    await expect(themesApi.list()).resolves.toEqual([
      buildTheme(),
      buildTheme({ id: 'theme-2', name: 'Física' }),
    ]);
    expect(request).toHaveBeenCalledWith('/themes');
  });

  it('crea una temática con POST y devuelve la respuesta validada', async () => {
    request.mockResolvedValue(buildTheme({ name: 'Álgebra' }));

    await expect(themesApi.create('Álgebra')).resolves.toEqual(buildTheme({ name: 'Álgebra' }));
    expect(request).toHaveBeenCalledWith('/themes', {
      method: 'POST',
      body: JSON.stringify({ name: 'Álgebra' }),
    });
  });

  it('renombra una temática con PUT', async () => {
    request.mockResolvedValue(buildTheme({ name: 'Álgebra' }));

    await expect(themesApi.rename('theme-1', 'Álgebra')).resolves.toEqual(
      buildTheme({ name: 'Álgebra' }),
    );
    expect(request).toHaveBeenCalledWith('/themes/theme-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Álgebra' }),
    });
  });

  it('elimina una temática con DELETE y devuelve null en 204', async () => {
    request.mockResolvedValue(null);

    await expect(themesApi.remove('theme-1')).resolves.toBeNull();
    expect(request).toHaveBeenCalledWith('/themes/theme-1', { method: 'DELETE' });
  });

  it('rechaza una lista que no cumple el contrato', async () => {
    request.mockResolvedValue([buildTheme(), { id: 'theme-2' }]);

    const error = await themesApi.list().catch((requestError) => requestError);

    expect(error).toBeInstanceOf(ContractError);
    expect(error.issue).toContain('[1].name');
  });

  it('rechaza una temática creada que no cumple el contrato', async () => {
    request.mockResolvedValue({ id: 'theme-1', name: 'Matemáticas', sessionCount: 'dos' });

    const error = await themesApi.create('Matemáticas').catch((requestError) => requestError);

    expect(error).toBeInstanceOf(ContractError);
    expect(error.issue).toContain('sessionCount');
  });

  it('propaga el ApiError con su status HTTP', async () => {
    request.mockRejectedValue(new ApiError('Ya existe una temática con ese nombre.', 409));

    const error = await themesApi.create('Matemáticas').catch((requestError) => requestError);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.message).toBe('Ya existe una temática con ese nombre.');
  });
});
