import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractError } from 'domain-contracts';
import { request } from '../../src/api/client.js';
import { sessionsApi } from '../../src/sessions/sessions.api.js';
import { buildSession } from '../fixtures/contracts.js';

vi.mock('../../src/api/client.js', () => ({ request: vi.fn() }));

describe('sessionsApi · contrato en el borde', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('devuelve el listado cuando cumple el contrato', async () => {
    request.mockResolvedValue([buildSession()]);

    await expect(sessionsApi.list()).resolves.toEqual([buildSession()]);
    expect(request).toHaveBeenCalledWith('/sessions');
  });

  it('rechaza un listado con un elemento inválido', async () => {
    request.mockResolvedValue([buildSession(), buildSession({ durationMinutes: 'dos horas' })]);

    const error = await sessionsApi.list().catch((requestError) => requestError);

    expect(error).toBeInstanceOf(ContractError);
    expect(error.issue).toMatch(/\[1\]\.durationMinutes/);
  });

  it('valida la sesión creada', async () => {
    request.mockResolvedValue(buildSession());

    await expect(sessionsApi.create({ hours: 2, minutes: 0 })).resolves.toEqual(buildSession());
    expect(request).toHaveBeenCalledWith('/sessions', {
      method: 'POST',
      body: JSON.stringify({ hours: 2, minutes: 0 }),
    });
  });

  it('rechaza una sesión creada que no cumple el contrato', async () => {
    request.mockResolvedValue(buildSession({ title: undefined }));

    const error = await sessionsApi.create({ hours: 2, minutes: 0 }).catch(
      (requestError) => requestError,
    );

    expect(error).toBeInstanceOf(ContractError);
    expect(error.issue).toMatch(/title/);
  });

  it('valida la sesión editada', async () => {
    request.mockResolvedValue(buildSession({ title: 'Física' }));

    await expect(sessionsApi.update('abc-123', { hours: 2, minutes: 0 })).resolves.toEqual(
      buildSession({ title: 'Física' }),
    );
    expect(request).toHaveBeenCalledWith('/sessions/abc-123', {
      method: 'PUT',
      body: JSON.stringify({ hours: 2, minutes: 0 }),
    });
  });

  it('no valida el borrado correcto sin cuerpo', async () => {
    request.mockResolvedValue(null);

    await expect(sessionsApi.remove('abc-123')).resolves.toBeNull();
  });
});
