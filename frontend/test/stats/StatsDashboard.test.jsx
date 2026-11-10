import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DataRefreshProvider } from '../../src/context/DataRefreshContext.jsx';
import StatsDashboard from '../../src/stats/StatsDashboard.jsx';
import { buildStats } from '../fixtures/contracts.js';

const { statsApiMock } = vi.hoisted(() => ({
  statsApiMock: { get: vi.fn() },
}));

vi.mock('../../src/stats/stats.api.js', () => ({ statsApi: statsApiMock }));

const CLAMP_NOTICE =
  'El rango solicitado se ha recortado a los límites admitidos (1990-01-01 – 9999-12-31).';

beforeEach(() => {
  statsApiMock.get.mockReset();
});

function renderDashboard() {
  return render(
    <DataRefreshProvider>
      <StatsDashboard />
    </DataRefreshProvider>,
  );
}

describe('StatsDashboard · aviso de recorte (RF-11)', () => {
  it('muestra el aviso con role="status" y el texto exacto', async () => {
    statsApiMock.get.mockResolvedValue(buildStats({ notice: CLAMP_NOTICE }));

    renderDashboard();

    const notice = await screen.findByRole('status');
    expect(notice.textContent).toBe(CLAMP_NOTICE);
    expect(screen.getByText('Meta de hoy')).toBeTruthy();
  });

  it('no muestra aviso cuando notice es null', async () => {
    statsApiMock.get.mockResolvedValue(buildStats({ notice: null }));

    renderDashboard();

    expect(await screen.findByText('Meta de hoy')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
