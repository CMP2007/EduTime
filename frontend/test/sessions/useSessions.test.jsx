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
    });
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
      }),
    );
  });
});
