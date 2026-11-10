import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataRefreshProvider } from '../../src/context/DataRefreshContext.jsx';
import HistoryView from '../../src/sessions/HistoryView.jsx';
import { useSessions } from '../../src/sessions/useSessions.js';
import { buildSession } from '../fixtures/contracts.js';

const { sessionsApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { list: vi.fn() },
}));

vi.mock('../../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));

beforeEach(() => {
  sessionsApiMock.list.mockReset();
});

function renderHistory() {
  return render(
    <DataRefreshProvider>
      <HistoryView onEdit={vi.fn()} onDelete={vi.fn()} />
    </DataRefreshProvider>,
  );
}

function wrapper({ children }) {
  return <DataRefreshProvider>{children}</DataRefreshProvider>;
}

function renderSessionsHook(initialFilters = { from: '', to: '', q: '' }) {
  return renderHook(({ filters }) => useSessions(filters), {
    wrapper,
    initialProps: { filters: initialFilters },
  });
}

describe('HistoryView · rango invertido (RF-6)', () => {
  it('muestra el aviso, no consulta y conserva el listado anterior', async () => {
    sessionsApiMock.list.mockResolvedValue([buildSession()]);

    renderHistory();

    expect(await screen.findByText('Matemáticas')).toBeTruthy();
    expect(sessionsApiMock.list).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-20' } });
    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(2));

    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-15' } });

    const notice = await screen.findByRole('status');
    expect(notice.textContent).toMatch(/invertido/);
    expect(sessionsApiMock.list).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Matemáticas')).toBeTruthy();
    expect(screen.queryByText('Cargando clases…')).toBeNull();
  });

  it('oculta el error anterior mientras el rango está invertido', async () => {
    sessionsApiMock.list.mockResolvedValueOnce([buildSession()]);

    renderHistory();

    expect(await screen.findByText('Matemáticas')).toBeTruthy();

    sessionsApiMock.list.mockRejectedValueOnce(new Error('Fallo de red'));
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-01' } });
    expect(await screen.findByText('Fallo de red')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } });

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.queryByText('Fallo de red')).toBeNull();
    expect(screen.getByText('Matemáticas')).toBeTruthy();
  });
});

describe('useSessions · guarda de rango invertido (RF-6)', () => {
  it('conserva el error anterior y no consulta mientras el rango está invertido', async () => {
    sessionsApiMock.list.mockRejectedValueOnce(new Error('Fallo de red'));

    const { result, rerender } = renderSessionsHook();

    await waitFor(() => expect(result.current.error).toBe('Fallo de red'));

    rerender({ filters: { from: '2026-10-20', to: '2026-10-15', q: '' } });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Fallo de red');
    expect(sessionsApiMock.list).toHaveBeenCalledTimes(1);
  });

  it('ignora la respuesta en vuelo que llega después de invertir el rango', async () => {
    let resolveStale;
    sessionsApiMock.list
      .mockResolvedValueOnce([buildSession()])
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveStale = resolve;
        }),
      );

    const { result, rerender } = renderSessionsHook();

    await waitFor(() => expect(result.current.sessions).toHaveLength(1));

    rerender({ filters: { from: '2026-10-20', to: '', q: '' } });
    await waitFor(() => expect(result.current.loading).toBe(true));

    rerender({ filters: { from: '2026-10-20', to: '2026-10-15', q: '' } });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      resolveStale([buildSession({ title: 'Respuesta obsoleta' })]);
    });

    expect(result.current.sessions[0].title).toBe('Matemáticas');
    expect(result.current.error).toBe('');
  });

  it('no aplica la guarda con un filtro mal formado y consulta la API', async () => {
    sessionsApiMock.list.mockResolvedValue([]);

    const { result } = renderSessionsHook({ from: 'abc', to: '2026-10-15', q: '' });

    await waitFor(() =>
      expect(sessionsApiMock.list).toHaveBeenCalledWith({ from: 'abc', to: '2026-10-15', q: '' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('');
  });
});
