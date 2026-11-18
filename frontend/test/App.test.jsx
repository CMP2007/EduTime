import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import { DataRefreshProvider } from '../src/context/DataRefreshContext.jsx';

const { sessionsApiMock, statsApiMock, themesApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  statsApiMock: { get: vi.fn() },
  themesApiMock: { list: vi.fn(), create: vi.fn(), rename: vi.fn(), remove: vi.fn() },
}));

vi.mock('../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));
vi.mock('../src/stats/stats.api.js', () => ({ statsApi: statsApiMock }));
vi.mock('../src/themes/themes.api.js', () => ({ themesApi: themesApiMock }));

beforeEach(() => {
  sessionsApiMock.create.mockReset();
  sessionsApiMock.update.mockReset();
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const session = {
  id: 'abc-123',
  themeId: 'theme-1',
  themeName: 'Matemáticas',
  date: '2026-10-15',
  durationMinutes: 90,
  notes: '',
  createdAt: '2026-10-15T10:00:00.000Z',
  updatedAt: '2026-10-15T10:00:00.000Z',
};

describe('App · borrado de clases', () => {
  beforeEach(() => {
    sessionsApiMock.list.mockReset();
    sessionsApiMock.remove.mockReset();
    statsApiMock.get.mockReset();
    themesApiMock.list.mockReset();
    themesApiMock.list.mockResolvedValue([]);
  });

  it('muestra el error en el diálogo si el borrado falla (no se traga el fallo)', async () => {
    statsApiMock.get.mockRejectedValue(new Error('Backend caído'));
    sessionsApiMock.list.mockResolvedValue([session]);
    sessionsApiMock.remove.mockRejectedValue(new Error('No se pudo eliminar la clase.'));

    render(
      <DataRefreshProvider>
        <App />
      </DataRefreshProvider>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));

    const rowTitle = await screen.findByText('Matemáticas');
    // Con clases no se ofrece cargar datos de ejemplo.
    expect(screen.queryByRole('dialog')).toBeNull();

    const row = rowTitle.closest('li');
    fireEvent.click(within(row).getByRole('button', { name: 'Eliminar' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    // Tras el fallo: el error se muestra dentro del diálogo y el diálogo sigue
    // abierto para poder reintentar o cancelar.
    expect(await within(dialog).findByText('No se pudo eliminar la clase.')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(sessionsApiMock.remove).toHaveBeenCalledWith('abc-123');
  });

  it('cierra el diálogo y refresca cuando el borrado funciona', async () => {
    statsApiMock.get.mockRejectedValue(new Error('Backend caído'));
    // Primera carga: SeedPrompt y, al abrir Historial, su propio hook. Tras
    // borrar, ambos se recargan y el listado queda vacío.
    sessionsApiMock.list
      .mockResolvedValueOnce([session])
      .mockResolvedValueOnce([session])
      .mockResolvedValue([]);
    sessionsApiMock.remove.mockResolvedValue(null);

    render(
      <DataRefreshProvider>
        <App />
      </DataRefreshProvider>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));

    const rowTitle = await screen.findByText('Matemáticas');
    expect(sessionsApiMock.list).toHaveBeenCalledTimes(2);

    const row = rowTitle.closest('li');
    fireEvent.click(within(row).getByRole('button', { name: 'Eliminar' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sessionsApiMock.remove).toHaveBeenCalledWith('abc-123');

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(4));
    expect(await screen.findByText(/No hay clases registradas/)).toBeTruthy();
    expect(screen.queryByText('Matemáticas')).toBeNull();
    // Tras borrar todas las clases no se vuelve a ofrecer la semilla en la misma carga.
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('App · temáticas', () => {
  beforeEach(() => {
    sessionsApiMock.list.mockReset();
    sessionsApiMock.remove.mockReset();
    statsApiMock.get.mockReset();
    themesApiMock.list.mockReset();
    themesApiMock.list.mockResolvedValue([]);
    statsApiMock.get.mockRejectedValue(new Error('Backend caído'));
    sessionsApiMock.list.mockResolvedValue([session]);
  });

  it('muestra el botón «Temáticas» y abre el gestor', async () => {
    themesApiMock.list.mockResolvedValue([
      { id: 'theme-1', name: 'Matemáticas', sessionCount: 1 },
    ]);

    render(
      <DataRefreshProvider>
        <App />
      </DataRefreshProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Temáticas' }));

    const dialog = await screen.findByRole('dialog', { name: 'Temáticas' });
    expect(within(dialog).getByText('Matemáticas')).toBeTruthy();
    expect(themesApiMock.list).toHaveBeenCalledTimes(1);
  });

  it('usa themeName en el mensaje de borrado de la clase', async () => {
    render(
      <DataRefreshProvider>
        <App />
      </DataRefreshProvider>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    const rowTitle = await screen.findByText('Matemáticas');
    fireEvent.click(within(rowTitle.closest('li')).getByRole('button', { name: 'Eliminar' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        '¿Seguro que quieres eliminar la clase de "Matemáticas" del jue 15 oct 2026? Esta acción no se puede deshacer.',
      ),
    ).toBeTruthy();
  });
});

describe('App · navegación por URL', () => {
  beforeEach(() => {
    sessionsApiMock.list.mockReset();
    sessionsApiMock.remove.mockReset();
    statsApiMock.get.mockReset();
    themesApiMock.list.mockReset();
    sessionsApiMock.list.mockResolvedValue([session]);
    statsApiMock.get.mockRejectedValue(new Error('Backend caído'));
    themesApiMock.list.mockResolvedValue([]);
  });

  function renderApp() {
    return render(
      <DataRefreshProvider>
        <App />
      </DataRefreshProvider>,
    );
  }

  it('abre directamente la pestaña de la dirección inicial', () => {
    window.history.replaceState(null, '', '/#/estadisticas');

    renderApp();

    expect(
      screen.getByRole('tab', { name: 'Estadísticas' }).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('actualiza la dirección al cambiar de pestaña y no al reelegir la activa', async () => {
    renderApp();
    const before = window.history.length;

    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    await waitFor(() => expect(window.location.hash).toBe('#/historial'));
    expect(window.history.length).toBe(before + 1);

    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    expect(window.location.hash).toBe('#/historial');
    expect(window.history.length).toBe(before + 1);
  });

  it('cierra el diálogo de borrado al navegar con la URL', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));

    const rowTitle = await screen.findByText('Matemáticas');
    fireEvent.click(within(rowTitle.closest('li')).getByRole('button', { name: 'Eliminar' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();

    act(() => {
      window.history.replaceState(null, '', '/#/estadisticas');
      window.dispatchEvent(new Event('hashchange'));
    });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(
      screen.getByRole('tab', { name: 'Estadísticas' }).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('no refleja los filtros del historial en la dirección y los reinicia al remontar', async () => {
    const view = renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));

    const from = await screen.findByLabelText('Desde');
    fireEvent.change(from, { target: { value: '2026-10-01' } });
    expect(window.location.hash).toBe('#/historial');

    view.unmount();
    renderApp();

    expect(
      screen.getByRole('tab', { name: 'Historial' }).getAttribute('aria-selected'),
    ).toBe('true');
    expect(screen.getByLabelText('Desde').value).toBe('');
  });

  it('no refleja el periodo de estadísticas en la dirección y lo reinicia al remontar', async () => {
    const view = renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Estadísticas' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Mes' }));
    expect(window.location.hash).toBe('#/estadisticas');

    view.unmount();
    renderApp();

    expect(screen.getByRole('button', { name: 'Semana' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Mes' }).getAttribute('aria-pressed')).toBe('false');
  });
});

describe('App · guardado de clases', () => {
  beforeEach(() => {
    sessionsApiMock.list.mockReset();
    sessionsApiMock.remove.mockReset();
    sessionsApiMock.create.mockReset();
    sessionsApiMock.update.mockReset();
    statsApiMock.get.mockReset();
    themesApiMock.list.mockReset();
    sessionsApiMock.list.mockResolvedValue([session]);
    statsApiMock.get.mockRejectedValue(new Error('Backend caído'));
    themesApiMock.list.mockResolvedValue([
      { id: 'theme-1', name: 'Matemáticas', sessionCount: 1 },
    ]);
  });

  function renderApp() {
    return render(
      <DataRefreshProvider>
        <App />
      </DataRefreshProvider>,
    );
  }

  async function fillNewSession() {
    fireEvent.click(screen.getByRole('button', { name: /Nueva clase/ }));
    const select = await screen.findByLabelText('Temática');
    fireEvent.change(select, { target: { value: 'theme-1' } });
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '1' } });
  }

  it('crea una clase, cierra el formulario y refresca', async () => {
    sessionsApiMock.create.mockResolvedValue({ ...session, id: 'session-new' });

    renderApp();
    await fillNewSession();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sessionsApiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ themeId: 'theme-1', hours: 1, minutes: 0 }),
    );
  });

  it('si el guardado falla, mantiene el formulario y muestra el error', async () => {
    sessionsApiMock.create.mockRejectedValue(new Error('No se pudo guardar la clase.'));

    renderApp();
    await fillNewSession();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('No se pudo guardar la clase.')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Nueva clase' })).toBeTruthy();
  });

  it('actualiza una clase existente y cierra el formulario', async () => {
    sessionsApiMock.update.mockResolvedValue(session);

    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    // El filtro de temática también contiene «Matemáticas» en un <option>,
    // así que buscamos el título dentro del listado.
    const list = await screen.findByRole('list');
    const rowTitle = await within(list).findByText('Matemáticas');
    fireEvent.click(within(rowTitle.closest('li')).getByRole('button', { name: 'Editar' }));

    const dialog = await screen.findByRole('dialog', { name: 'Editar clase' });
    // El filtro de la vista también tiene una «Temática»: esperamos al del diálogo.
    await within(dialog).findByLabelText('Temática');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sessionsApiMock.update).toHaveBeenCalledWith(
      'abc-123',
      expect.objectContaining({ themeId: 'theme-1' }),
    );
  });

  it('muestra «Guardando…» y bloquea los controles mientras se guarda', async () => {
    const pending = deferred();
    sessionsApiMock.create.mockReturnValue(pending.promise);

    renderApp();
    await fillNewSession();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const saving = await screen.findByRole('button', { name: 'Guardando…' });
    expect(saving.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancelar' }).disabled).toBe(true);

    await act(async () => {
      pending.resolve({ ...session, id: 'session-new' });
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('muestra «Eliminando…» y bloquea los controles mientras se elimina', async () => {
    const pending = deferred();
    sessionsApiMock.remove.mockReturnValue(pending.promise);

    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    const list = await screen.findByRole('list');
    const rowTitle = await within(list).findByText('Matemáticas');
    fireEvent.click(within(rowTitle.closest('li')).getByRole('button', { name: 'Eliminar' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    const deleting = await screen.findByRole('button', { name: 'Eliminando…' });
    expect(deleting.disabled).toBe(true);
    expect(within(dialog).getByRole('button', { name: 'Cancelar' }).disabled).toBe(true);

    await act(async () => {
      pending.resolve(null);
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('muestra el error como aviso si la escritura falla después de navegar', async () => {
    const pending = deferred();
    sessionsApiMock.remove.mockReturnValue(pending.promise);

    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));
    const list = await screen.findByRole('list');
    const rowTitle = await within(list).findByText('Matemáticas');
    fireEvent.click(within(rowTitle.closest('li')).getByRole('button', { name: 'Eliminar' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    // La navegación cierra el diálogo mientras el borrado sigue en curso.
    act(() => {
      window.history.replaceState(null, '', '/#/estadisticas');
      window.dispatchEvent(new Event('hashchange'));
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await act(async () => {
      pending.reject(new Error('No se pudo eliminar la clase.'));
    });

    const notice = await screen.findByRole('status');
    expect(notice.textContent).toBe('No se pudo eliminar la clase.');

    // El aviso se oculta con un diálogo abierto y reaparece al cerrarlo.
    fireEvent.click(screen.getByRole('button', { name: 'Temáticas' }));
    const themesDialog = await screen.findByRole('dialog', { name: 'Temáticas' });
    expect(screen.queryByRole('status')).toBeNull();

    fireEvent.click(within(themesDialog).getByRole('button', { name: 'Cerrar' }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('No se pudo eliminar la clase.');
  });
});
