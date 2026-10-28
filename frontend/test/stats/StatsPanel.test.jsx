import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StatsPanel from '../../src/stats/StatsPanel.jsx';

const { sessionsApiMock, statsApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { list: vi.fn() },
  statsApiMock: { get: vi.fn() },
}));

vi.mock('../../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));
vi.mock('../../src/stats/stats.api.js', () => ({ statsApi: statsApiMock }));

const stats = {
  period: { key: 'week', label: 'Semana actual', from: '2026-10-12', to: '2026-10-18' },
  summary: { totalMinutes: 240, totalSessions: 2, goalDays: 1, longestClass: null, subjects: [] },
  global: { totalMinutes: 1440, goalDays: 6, streak: { current: 2, best: 5 } },
};

describe('StatsPanel', () => {
  it('muestra el error de la carga de sesiones en la lista, no "No hay clases"', async () => {
    statsApiMock.get.mockResolvedValue(stats);
    sessionsApiMock.list.mockRejectedValue(new Error('Fallo cargando las clases'));

    render(<StatsPanel onEdit={vi.fn()} onDelete={vi.fn()} />);


    expect(await screen.findByText('Fallo cargando las clases')).toBeTruthy();
    expect(screen.queryByText(/No hay clases/)).toBeNull();
  });

  it('muestra las clases del periodo cuando todo carga correctamente', async () => {
    statsApiMock.get.mockResolvedValue(stats);
    sessionsApiMock.list.mockResolvedValue([
      {
        id: 'abc-123',
        title: 'Matemáticas',
        date: '2026-10-15',
        durationMinutes: 120,
        notes: '',
        createdAt: '2026-10-15T10:00:00.000Z',
        updatedAt: '2026-10-15T10:00:00.000Z',
      },
    ]);

    render(<StatsPanel onEdit={vi.fn()} onDelete={vi.fn()} />);


    expect(await screen.findByText('Matemáticas')).toBeTruthy();
  });
});
