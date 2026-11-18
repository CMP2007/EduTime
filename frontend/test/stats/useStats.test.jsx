import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataRefreshProvider } from '../../src/context/DataRefreshContext.jsx';
import { useStats } from '../../src/stats/useStats.js';
import { buildStats } from '../fixtures/contracts.js';

const { statsApiMock } = vi.hoisted(() => ({
  statsApiMock: { get: vi.fn() },
}));

vi.mock('../../src/stats/stats.api.js', () => ({ statsApi: statsApiMock }));

function wrapper({ children }) {
  return <DataRefreshProvider>{children}</DataRefreshProvider>;
}

const filters = { period: 'week', date: '2026-10-15', heatmap: 'week', heatmapDate: '2026-10-15' };

beforeEach(() => {
  statsApiMock.get.mockReset();
  statsApiMock.get.mockResolvedValue(buildStats());
});

describe('useStats · carga de métricas', () => {
  it('publica las métricas del periodo elegido', async () => {
    const { result } = renderHook(() => useStats(filters), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(statsApiMock.get).toHaveBeenCalledWith({
      ...filters,
      signal: expect.any(AbortSignal),
    });
    expect(result.current.stats).toEqual(buildStats());
    expect(result.current.error).toBe('');
  });
});

describe('useStats · cancelación', () => {
  it('cancela la petición anterior cuando cambia el periodo', async () => {
    const signals = [];
    statsApiMock.get.mockImplementation(({ signal }) => {
      signals.push(signal);
      return new Promise(() => {});
    });

    const { rerender } = renderHook(
      ({ period }) => useStats({ ...filters, period }),
      { wrapper, initialProps: { period: 'week' } },
    );

    await waitFor(() => expect(statsApiMock.get).toHaveBeenCalledTimes(1));

    rerender({ period: 'month' });
    await waitFor(() => expect(statsApiMock.get).toHaveBeenCalledTimes(2));

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('cancela la petición en vuelo cuando se reintenta a mano', async () => {
    const signals = [];
    statsApiMock.get.mockImplementation(({ signal }) => {
      signals.push(signal);
      return new Promise(() => {});
    });

    const { result } = renderHook(() => useStats(filters), { wrapper });

    await waitFor(() => expect(statsApiMock.get).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(statsApiMock.get).toHaveBeenCalledTimes(2));
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('cancela la petición en vuelo al desmontar', async () => {
    let signal;
    statsApiMock.get.mockImplementation((options) => {
      signal = options.signal;
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() => useStats(filters), { wrapper });

    await waitFor(() => expect(statsApiMock.get).toHaveBeenCalledTimes(1));

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it('no publica error cuando la petición se cancela', async () => {
    statsApiMock.get
      .mockImplementationOnce(
        ({ signal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => {
              const abortError = new Error('The operation was aborted.');
              abortError.name = 'AbortError';
              reject(abortError);
            });
          }),
      )
      .mockResolvedValueOnce(buildStats());

    const { result, rerender } = renderHook(
      ({ period }) => useStats({ ...filters, period }),
      { wrapper, initialProps: { period: 'week' } },
    );

    await waitFor(() => expect(statsApiMock.get).toHaveBeenCalledTimes(1));

    rerender({ period: 'month' });
    await waitFor(() => expect(result.current.stats).toEqual(buildStats()));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('');
  });
});
