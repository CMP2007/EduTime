import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import { DataRefreshProvider } from '../src/context/DataRefreshContext.jsx';

const { sessionsApiMock, statsApiMock, themesApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { list: vi.fn(), remove: vi.fn() },
  statsApiMock: { get: vi.fn() },
  themesApiMock: { list: vi.fn(), create: vi.fn(), rename: vi.fn(), remove: vi.fn() },
}));

vi.mock('../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));
vi.mock('../src/stats/stats.api.js', () => ({ statsApi: statsApiMock }));
vi.mock('../src/themes/themes.api.js', () => ({ themesApi: themesApiMock }));

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
    expect(within(dialog).getByText(/clase de "Matemáticas"/)).toBeTruthy();
  });
});
