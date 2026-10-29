import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractError } from 'domain-contracts';
import { request } from '../../src/api/client.js';
import { statsApi } from '../../src/stats/stats.api.js';
import { buildStats } from '../fixtures/contracts.js';

vi.mock('../../src/api/client.js', () => ({ request: vi.fn() }));

describe('statsApi · contrato en el borde', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('devuelve las métricas cuando cumplen el contrato', async () => {
    request.mockResolvedValue(buildStats());

    await expect(statsApi.get({ period: 'week' })).resolves.toEqual(buildStats());
    expect(request).toHaveBeenCalledWith('/stats?period=week');
  });

  it('tolera campos adicionales', async () => {
    request.mockResolvedValue(buildStats({ extra: true }));

    await expect(statsApi.get()).resolves.toBeTruthy();
  });

  it('rechaza con ContractError y la ruta si falta un campo', async () => {
    const stats = buildStats();
    delete stats.summary.totalMinutes;
    request.mockResolvedValue(stats);

    const error = await statsApi.get().catch((requestError) => requestError);

    expect(error).toBeInstanceOf(ContractError);
    expect(error.issue).toMatch(/summary\.totalMinutes/);
    expect(error.message).toMatch(/\/api\/stats/);
  });

  it('rechaza si un tipo no coincide', async () => {
    const stats = buildStats();
    stats.today.goalMet = 'sí';
    request.mockResolvedValue(stats);

    const error = await statsApi.get().catch((requestError) => requestError);

    expect(error).toBeInstanceOf(ContractError);
    expect(error.issue).toMatch(/today\.goalMet/);
  });
});
