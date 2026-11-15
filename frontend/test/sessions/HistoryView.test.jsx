import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataRefreshProvider, useDataRefresh } from '../../src/context/DataRefreshContext.jsx';
import HistoryView from '../../src/sessions/HistoryView.jsx';
import { useSessions } from '../../src/sessions/useSessions.js';
import { buildSession, buildTheme } from '../fixtures/contracts.js';

const { sessionsApiMock, themesApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { list: vi.fn() },
  themesApiMock: { list: vi.fn() },
}));

vi.mock('../../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));
vi.mock('../../src/themes/themes.api.js', () => ({ themesApi: themesApiMock }));

const THEMES = [
  buildTheme({ id: 'theme-1', name: 'Matemáticas' }),
  buildTheme({ id: 'theme-2', name: 'Física' }),
];

let catalogue;

beforeEach(() => {
  sessionsApiMock.list.mockReset();
  sessionsApiMock.list.mockResolvedValue([buildSession()]);
  themesApiMock.list.mockReset();
  catalogue = THEMES;
  themesApiMock.list.mockImplementation(async () => catalogue.map((theme) => ({ ...theme })));
});

function renderHistory() {
  return render(
    <DataRefreshProvider>
      <HistoryView onEdit={vi.fn()} onDelete={vi.fn()} />
    </DataRefreshProvider>,
  );
}

/** Historial con un botón para forzar la recarga del catálogo. */
function Harness() {
  const { refreshThemes } = useDataRefresh();
  return (
    <>
      <button type="button" onClick={refreshThemes}>Refrescar temáticas</button>
      <HistoryView onEdit={vi.fn()} onDelete={vi.fn()} />
    </>
  );
}

function renderHistoryWithRefresh() {
  return render(
    <DataRefreshProvider>
      <Harness />
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
    renderHistory();

    const list = await screen.findByRole('list');
    expect(within(list).getByText('Matemáticas')).toBeTruthy();
    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-20' } });
    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(2));

    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-15' } });

    const notice = await screen.findByRole('status');
    expect(notice.textContent).toMatch(/invertido/);
    expect(sessionsApiMock.list).toHaveBeenCalledTimes(2);
    expect(within(screen.getByRole('list')).getByText('Matemáticas')).toBeTruthy();
    expect(screen.queryByText('Cargando clases…')).toBeNull();
  });

  it('oculta el error anterior mientras el rango está invertido', async () => {
    sessionsApiMock.list.mockResolvedValueOnce([buildSession()]);

    renderHistory();

    const list = await screen.findByRole('list');
    expect(within(list).getByText('Matemáticas')).toBeTruthy();

    sessionsApiMock.list.mockRejectedValueOnce(new Error('Fallo de red'));
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-01' } });
    expect(await screen.findByText('Fallo de red')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } });

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.queryByText('Fallo de red')).toBeNull();
    expect(within(screen.getByRole('list')).getByText('Matemáticas')).toBeTruthy();
  });
});

describe('useSessions · guarda de rango invertido (RF-6)', () => {
  it('conserva el error anterior y no consulta mientras el rango está invertido', async () => {
    sessionsApiMock.list.mockRejectedValueOnce(new Error('Fallo de red'));

    const { result, rerender } = renderSessionsHook();

    await waitFor(() => expect(result.current.error).toBe('Fallo de red'));

    rerender({ filters: { from: '2026-10-20', to: '2026-10-15', q: '', themeId: '' } });

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

    rerender({ filters: { from: '2026-10-20', to: '', q: '', themeId: '' } });
    await waitFor(() => expect(result.current.loading).toBe(true));

    rerender({ filters: { from: '2026-10-20', to: '2026-10-15', q: '', themeId: '' } });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      resolveStale([buildSession({ themeName: 'Respuesta obsoleta' })]);
    });

    expect(result.current.sessions[0].themeName).toBe('Matemáticas');
    expect(result.current.error).toBe('');
  });

  it('no aplica la guarda con un filtro mal formado y consulta la API', async () => {
    sessionsApiMock.list.mockResolvedValue([]);

    const { result } = renderSessionsHook({ from: 'abc', to: '2026-10-15', q: '' });

    await waitFor(() =>
      expect(sessionsApiMock.list).toHaveBeenCalledWith({
        from: 'abc',
        to: '2026-10-15',
        q: '',
        themeId: '',
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('');
  });
});

describe('HistoryView · filtro por temática (RF-29)', () => {
  it('ofrece el catálogo y consulta la temática elegida', async () => {
    renderHistory();

    const select = await screen.findByLabelText('Temática');
    await waitFor(() =>
      expect(
        within(select).getAllByRole('option').map((option) => option.textContent),
      ).toEqual(['Todas', 'Física', 'Matemáticas']),
    );

    fireEvent.change(select, { target: { value: 'theme-2' } });

    await waitFor(() =>
      expect(sessionsApiMock.list).toHaveBeenLastCalledWith({
        from: '',
        to: '',
        q: '',
        themeId: 'theme-2',
      }),
    );
  });

  it('busca el texto en las observaciones junto con la temática', async () => {
    renderHistory();

    const select = await screen.findByLabelText('Temática');
    fireEvent.change(select, { target: { value: 'theme-1' } });
    fireEvent.change(screen.getByLabelText('Buscar en observaciones'), {
      target: { value: 'integrales' },
    });

    await waitFor(() =>
      expect(sessionsApiMock.list).toHaveBeenLastCalledWith({
        from: '',
        to: '',
        q: 'integrales',
        themeId: 'theme-1',
      }),
    );
  });

  it('si la temática elegida desaparece, limpia los cuatro filtros (RF-30)', async () => {
    renderHistoryWithRefresh();

    const select = await screen.findByLabelText('Temática');
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-02-01' } });
    fireEvent.change(screen.getByLabelText('Buscar en observaciones'), {
      target: { value: 'repaso' },
    });
    fireEvent.change(select, { target: { value: 'theme-2' } });

    await waitFor(() =>
      expect(sessionsApiMock.list).toHaveBeenLastCalledWith({
        from: '2026-01-01',
        to: '2026-02-01',
        q: 'repaso',
        themeId: 'theme-2',
      }),
    );

    catalogue = THEMES.filter((theme) => theme.id !== 'theme-2');
    fireEvent.click(screen.getByRole('button', { name: 'Refrescar temáticas' }));

    await waitFor(() =>
      expect(sessionsApiMock.list).toHaveBeenLastCalledWith({
        from: '',
        to: '',
        q: '',
        themeId: '',
      }),
    );

    expect(screen.getByLabelText('Desde').value).toBe('');
    expect(screen.getByLabelText('Hasta').value).toBe('');
    expect(screen.getByLabelText('Buscar en observaciones').value).toBe('');
    expect(screen.getByLabelText('Temática').value).toBe('');
  });
});
