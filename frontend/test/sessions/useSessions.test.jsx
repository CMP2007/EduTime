import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataRefreshProvider } from '../../src/context/DataRefreshContext.jsx';
import { useSessions } from '../../src/sessions/useSessions.js';
import { buildSession } from '../fixtures/contracts.js';

const { sessionsApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { list: vi.fn() },
}));

vi.mock('../../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));

function wrapper({ children }) {
  return <DataRefreshProvider>{children}</DataRefreshProvider>;
}

beforeEach(() => {
  sessionsApiMock.list.mockReset();
  sessionsApiMock.list.mockResolvedValue([buildSession()]);
});

describe('useSessions · filtros', () => {
  it('pasa la temática elegida a la API', async () => {
    const { result } = renderHook(() => useSessions({ themeId: 'theme-2' }), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(sessionsApiMock.list).toHaveBeenCalledWith({
      from: '',
      to: '',
      q: '',
      themeId: 'theme-2',
      signal: expect.any(AbortSignal),
    });
    expect(result.current.sessions).toHaveLength(1);
  });

  it('vuelve a pedir el listado cuando cambia la temática', async () => {
    const { rerender } = renderHook(
      ({ themeId }) => useSessions({ themeId }),
      { wrapper, initialProps: { themeId: '' } },
    );

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));

    rerender({ themeId: 'theme-1' });

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(2));
    expect(sessionsApiMock.list).toHaveBeenLastCalledWith({
      from: '',
      to: '',
      q: '',
      themeId: 'theme-1',
      signal: expect.any(AbortSignal),
    });
  });

  it('descarta una respuesta antigua que llega después de una más reciente', async () => {
    let resolveOld;
    const oldResponse = new Promise((resolve) => {
      resolveOld = resolve;
    });
    sessionsApiMock.list
      .mockImplementationOnce(() => oldResponse)
      .mockResolvedValueOnce([buildSession({ id: 'nueva', themeName: 'Nueva' })]);

    const { result, rerender } = renderHook(
      ({ themeId }) => useSessions({ themeId }),
      { wrapper, initialProps: { themeId: 'theme-1' } },
    );

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));

    rerender({ themeId: 'theme-2' });
    await waitFor(() => expect(result.current.sessions[0]?.id).toBe('nueva'));

    // La respuesta de la primera petición llega tarde: no debe pisar la nueva.
    await act(async () => {
      resolveOld([buildSession({ id: 'vieja', themeName: 'Vieja' })]);
      await Promise.resolve();
    });

    expect(result.current.sessions[0]?.id).toBe('nueva');
    expect(result.current.error).toBe('');
  });

  it('combina temática, fechas y búsqueda en la misma petición', async () => {
    renderHook(
      () => useSessions({ from: '2026-01-01', to: '2026-02-01', q: 'integrales', themeId: 'theme-1' }),
      { wrapper },
    );

    await waitFor(() =>
      expect(sessionsApiMock.list).toHaveBeenCalledWith({
        from: '2026-01-01',
        to: '2026-02-01',
        q: 'integrales',
        themeId: 'theme-1',
        signal: expect.any(AbortSignal),
      }),
    );
  });
});

describe('useSessions · carga habilitada', () => {
  it('no pide el listado mientras está deshabilitado y lo pide al habilitarse', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useSessions({ from: '2026-10-12', to: '2026-10-18' }, { enabled }),
      { wrapper, initialProps: { enabled: false } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(sessionsApiMock.list).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.sessions).toEqual([]);

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(sessionsApiMock.list).toHaveBeenCalledTimes(1);
    expect(sessionsApiMock.list).toHaveBeenCalledWith({
      from: '2026-10-12',
      to: '2026-10-18',
      q: '',
      themeId: '',
      signal: expect.any(AbortSignal),
    });
  });
});

describe('useSessions · cancelación', () => {
  it('cancela la petición anterior cuando cambian los filtros', async () => {
    const signals = [];
    sessionsApiMock.list.mockImplementation(({ signal }) => {
      signals.push(signal);
      return new Promise(() => {});
    });

    const { rerender } = renderHook(
      ({ themeId }) => useSessions({ themeId }),
      { wrapper, initialProps: { themeId: 'theme-1' } },
    );

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));

    rerender({ themeId: 'theme-2' });
    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(2));

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('cancela la petición en vuelo cuando el rango queda invertido', async () => {
    let signal;
    sessionsApiMock.list.mockImplementation((options) => {
      signal = options.signal;
      return new Promise(() => {});
    });

    const { rerender } = renderHook(
      ({ from, to }) => useSessions({ from, to }),
      { wrapper, initialProps: { from: '', to: '' } },
    );

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));

    rerender({ from: '2026-02-01', to: '2026-01-01' });

    await waitFor(() => expect(signal.aborted).toBe(true));
  });

  it('cancela la petición en vuelo cuando se reintenta a mano', async () => {
    const signals = [];
    sessionsApiMock.list.mockImplementation(({ signal }) => {
      signals.push(signal);
      return new Promise(() => {});
    });

    const { result } = renderHook(() => useSessions(), { wrapper });

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(2));
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('cancela la petición en vuelo al desmontar', async () => {
    let signal;
    sessionsApiMock.list.mockImplementation((options) => {
      signal = options.signal;
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() => useSessions(), { wrapper });

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it('no publica error cuando la petición se cancela', async () => {
    sessionsApiMock.list
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
      .mockResolvedValueOnce([buildSession({ id: 'nueva', themeName: 'Nueva' })]);

    const { result, rerender } = renderHook(
      ({ themeId }) => useSessions({ themeId }),
      { wrapper, initialProps: { themeId: 'theme-1' } },
    );

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));

    rerender({ themeId: 'theme-2' });
    await waitFor(() => expect(result.current.sessions[0]?.id).toBe('nueva'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe('');
  });
});
