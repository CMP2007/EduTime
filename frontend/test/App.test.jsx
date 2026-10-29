import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import { DataRefreshProvider } from '../src/context/DataRefreshContext.jsx';

const { sessionsApiMock, statsApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { list: vi.fn(), remove: vi.fn() },
  statsApiMock: { get: vi.fn() },
}));

vi.mock('../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));
vi.mock('../src/stats/stats.api.js', () => ({ statsApi: statsApiMock }));

const session = {
  id: 'abc-123',
  title: 'Matemáticas',
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
    sessionsApiMock.list
      .mockResolvedValueOnce([session])
      .mockResolvedValueOnce([]);
    sessionsApiMock.remove.mockResolvedValue(null);

    render(
      <DataRefreshProvider>
        <App />
      </DataRefreshProvider>,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }));

    const rowTitle = await screen.findByText('Matemáticas');
    expect(sessionsApiMock.list).toHaveBeenCalledTimes(1);

    const row = rowTitle.closest('li');
    fireEvent.click(within(row).getByRole('button', { name: 'Eliminar' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sessionsApiMock.remove).toHaveBeenCalledWith('abc-123');

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/No hay clases registradas/)).toBeTruthy();
    expect(screen.queryByText('Matemáticas')).toBeNull();
  });
});
