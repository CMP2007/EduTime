import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataRefreshProvider, useDataRefresh } from '../../src/context/DataRefreshContext.jsx';
import SeedPrompt from '../../src/seed/SeedPrompt.jsx';

const { sessionsApiMock, seedApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { list: vi.fn() },
  seedApiMock: { apply: vi.fn() },
}));

vi.mock('../../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));
vi.mock('../../src/seed/seed.api.js', () => ({ seedApi: seedApiMock }));

/** Promesa controlable para observar el estado de carga. */
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function renderPrompt() {
  return render(
    <DataRefreshProvider>
      <SeedPrompt />
    </DataRefreshProvider>,
  );
}

/** Arnés con un botón que fuerza la recarga de sesiones, como el resto de la app. */
function Harness() {
  const { refreshAll } = useDataRefresh();

  return (
    <>
      <button type="button" onClick={refreshAll}>Refrescar</button>
      <SeedPrompt />
    </>
  );
}

beforeEach(() => {
  sessionsApiMock.list.mockReset();
  seedApiMock.apply.mockReset();
});

describe('SeedPrompt · cuándo se muestra (RF-35, RF-39)', () => {
  it('muestra el diálogo cuando la aplicación termina de cargar sin clases', async () => {
    sessionsApiMock.list.mockResolvedValue([]);

    renderPrompt();

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(screen.getByText(/No hay clases registradas/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cargar datos de ejemplo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Empezar sin datos' })).toBeTruthy();
  });

  it('no muestra nada mientras carga', async () => {
    const pending = deferred();
    sessionsApiMock.list.mockReturnValue(pending.promise);

    renderPrompt();

    expect(screen.queryByRole('dialog')).toBeNull();

    await act(async () => {
      pending.resolve([]);
    });

    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('no muestra nada si la carga falla', async () => {
    sessionsApiMock.list.mockRejectedValue(new Error('Backend caído'));

    renderPrompt();

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));
    await act(async () => {});

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('no pregunta si ya hay al menos una clase', async () => {
    sessionsApiMock.list.mockResolvedValue([{ id: 'session-1' }]);

    renderPrompt();

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));
    await act(async () => {});

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('SeedPrompt · aceptar y rechazar (RF-36, RF-37)', () => {
  it('al aceptar carga los datos, refresca y cierra', async () => {
    sessionsApiMock.list.mockResolvedValue([]);
    seedApiMock.apply.mockResolvedValue(null);

    renderPrompt();

    fireEvent.click(await screen.findByRole('button', { name: 'Cargar datos de ejemplo' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(seedApiMock.apply).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(2));
  });

  it('al rechazar cierra sin escribir nada', async () => {
    sessionsApiMock.list.mockResolvedValue([]);

    renderPrompt();

    fireEvent.click(await screen.findByRole('button', { name: 'Empezar sin datos' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(seedApiMock.apply).not.toHaveBeenCalled();
  });

  it('Escape cierra sin escribir nada', async () => {
    sessionsApiMock.list.mockResolvedValue([]);

    renderPrompt();

    await screen.findByRole('dialog');
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(seedApiMock.apply).not.toHaveBeenCalled();
  });

  it('no vuelve a preguntar en la misma carga tras rechazar', async () => {
    sessionsApiMock.list.mockResolvedValue([]);

    render(<DataRefreshProvider><Harness /></DataRefreshProvider>);

    fireEvent.click(await screen.findByRole('button', { name: 'Empezar sin datos' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: 'Refrescar' }));

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(2));
    await act(async () => {});
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('no vuelve a preguntar si las clases desaparecen después de la carga', async () => {
    sessionsApiMock.list.mockResolvedValueOnce([{ id: 'session-1' }]).mockResolvedValue([]);

    render(<DataRefreshProvider><Harness /></DataRefreshProvider>);

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Refrescar' }));

    await waitFor(() => expect(sessionsApiMock.list).toHaveBeenCalledTimes(2));
    await act(async () => {});
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('SeedPrompt · error al cargar (RF-38)', () => {
  it('mantiene el diálogo, muestra el error y permite reintentar', async () => {
    sessionsApiMock.list.mockResolvedValue([]);
    seedApiMock.apply
      .mockRejectedValueOnce(new Error('No se pudieron cargar los datos de ejemplo.'))
      .mockResolvedValueOnce(null);

    renderPrompt();

    fireEvent.click(await screen.findByRole('button', { name: 'Cargar datos de ejemplo' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('No se pudieron cargar los datos de ejemplo.');
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cargar datos de ejemplo' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(seedApiMock.apply).toHaveBeenCalledTimes(2);
  });
});
