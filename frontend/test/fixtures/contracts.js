/** Fixtures completas del contrato de la API para los tests de frontend. */

export function buildTheme(overrides = {}) {
  return {
    id: 'theme-1',
    name: 'Matemáticas',
    sessionCount: 0,
    ...overrides,
  };
}

export function buildSession(overrides = {}) {
  return {
    id: 'abc-123',
    themeId: 'theme-1',
    themeName: 'Matemáticas',
    date: '2026-10-15',
    durationMinutes: 120,
    notes: '',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    ...overrides,
  };
}

export function buildStats(overrides = {}) {
  return {
    period: { key: 'week', label: 'Semana actual', from: '2026-10-12', to: '2026-10-18' },
    summary: {
      totalMinutes: 240,
      totalSessions: 2,
      activeDays: 2,
      goalDays: 1,
      longestClass: {
        id: 'abc-123',
        themeId: 'theme-1',
        name: 'Matemáticas',
        date: '2026-10-15',
        durationMinutes: 120,
      },
      subjects: [{ themeId: 'theme-1', name: 'Matemáticas', minutes: 240, sessions: 2 }],
    },
    global: {
      totalMinutes: 1440,
      totalSessions: 10,
      activeDays: 8,
      goalDays: 6,
      streak: { current: 2, best: 5 },
    },
    today: { date: '2026-10-15', minutes: 120, goalMinutes: 180, goalMet: false },
    heatmap: {
      range: 'week',
      label: 'Semana actual',
      from: '2026-10-12',
      to: '2026-10-18',
      goalMinutes: 180,
      days: [
        { date: '2026-10-12', minutes: 0, goalMet: false },
        { date: '2026-10-15', minutes: 120, goalMet: false },
      ],
    },
    notice: null,
    ...overrides,
  };
}
