import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractError } from 'domain-contracts';
import { ApiError } from '../../src/api/ApiError.js';
import { DataRefreshProvider, useDataRefresh } from '../../src/context/DataRefreshContext.jsx';
import StatsPanel from '../../src/stats/StatsPanel.jsx';
import { buildSession, buildStats } from '../fixtures/contracts.js';

const { sessionsApiMock, statsApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { list: vi.fn() },
  statsApiMock: { get: vi.fn() },
}));

vi.mock('../../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));
vi.mock('../../src/stats/stats.api.js', () => ({ statsApi: statsApiMock }));

function renderPanel() {
  return render(
    <DataRefreshProvider>
      <StatsPanel onEdit={vi.fn()} onDelete={vi.fn()} />
    </DataRefreshProvider>,
  );
}

/** Panel con un botón que fuerza la recarga de métricas, como hace App al editar. */
function RefreshHarness() {
  const { refreshStats } = useDataRefresh();

  return (
    <>
      <button type="button" onClick={refreshStats}>
        Actualizar
      </button>
      <StatsPanel onEdit={vi.fn()} onDelete={vi.fn()} />
    </>
  );
}

beforeEach(() => {
  sessionsApiMock.list.mockReset();
  statsApiMock.get.mockReset();
});

describe('StatsPanel', () => {
  it('muestra el error de la carga de sesiones en la lista, no "No hay clases"', async () => {
    statsApiMock.get.mockResolvedValue(buildStats());
    sessionsApiMock.list.mockRejectedValue(new Error('Fallo cargando las clases'));

    renderPanel();

    expect(await screen.findByText('Fallo cargando las clases')).toBeTruthy();
    expect(screen.queryByText(/No hay clases/)).toBeNull();
  });

  it('muestra las clases del periodo cuando todo carga correctamente', async () => {
    statsApiMock.get.mockResolvedValue(buildStats());
    sessionsApiMock.list.mockResolvedValue([buildSession()]);

    renderPanel();

    expect(await screen.findByText('Horas del periodo')).toBeTruthy();
    expect((await screen.findAllByText('4h')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Matemáticas')).length).toBeGreaterThan(0);
  });

  it('muestra el error de contrato y ninguna tarjeta si la primera carga es inválida', async () => {
    statsApiMock.get.mockRejectedValue(
      new ContractError(
        '/api/stats',
        'summary.totalMinutes debe ser un número finito (recibido: undefined)',
      ),
    );
    sessionsApiMock.list.mockResolvedValue([]);

    renderPanel();

    expect(await screen.findByText(/summary\.totalMinutes/)).toBeTruthy();
    expect(screen.queryByText('0m')).toBeNull();
    expect(screen.queryByText('Horas del periodo')).toBeNull();
  });

  it('muestra el error de red en español y no datos falsos', async () => {
    statsApiMock.get.mockRejectedValue(
      new ApiError(
        'No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.',
        0,
      ),
    );
    sessionsApiMock.list.mockResolvedValue([]);

    renderPanel();

    expect(await screen.findByText(/No se pudo conectar con el servicio/)).toBeTruthy();
    expect(screen.queryByText('0m')).toBeNull();
    expect(screen.queryByText('Horas del periodo')).toBeNull();
  });

  it('oculta los datos anteriores cuando una recarga incumple el contrato', async () => {
    statsApiMock.get.mockResolvedValue(buildStats());
    sessionsApiMock.list.mockResolvedValue([buildSession()]);

    render(
      <DataRefreshProvider>
        <RefreshHarness />
      </DataRefreshProvider>,
    );

    expect(await screen.findByText('Horas del periodo')).toBeTruthy();

    statsApiMock.get.mockRejectedValue(
      new ContractError('/api/stats', 'today.goalMet debe ser un booleano (recibido: "sí")'),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));

    expect(await screen.findByText(/today\.goalMet/)).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Horas del periodo')).toBeNull());
    expect(screen.queryAllByText('4h')).toHaveLength(0);
    expect(screen.queryAllByText('Matemáticas')).toHaveLength(0);
  });
});
