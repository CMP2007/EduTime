import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ContractError,
  assertSession,
  assertSessionList,
  assertStats,
  validateSession,
  validateSessionList,
  validateStats,
} from '../index.js';

function buildSession(overrides = {}) {
  return {
    id: 'session-1',
    title: 'Matemáticas',
    date: '2026-10-15',
    durationMinutes: 120,
    notes: '',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    ...overrides,
  };
}

function buildStats(overrides = {}) {
  return {
    period: { key: 'week', label: 'Semana actual', from: '2026-10-12', to: '2026-10-18' },
    summary: {
      totalMinutes: 240,
      totalSessions: 2,
      activeDays: 2,
      goalDays: 1,
      longestClass: {
        id: 'session-1',
        title: 'Matemáticas',
        date: '2026-10-15',
        durationMinutes: 120,
      },
      subjects: [{ title: 'Matemáticas', minutes: 240, sessions: 2 }],
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
        { date: '2026-10-13', minutes: 200, goalMet: true },
      ],
    },
    ...overrides,
  };
}

describe('domain-contracts · métricas', () => {
  it('acepta una respuesta válida', () => {
    assert.deepEqual(validateStats(buildStats()), []);
  });

  it('acepta la clase más larga nula', () => {
    const stats = buildStats();
    stats.summary.longestClass = null;

    assert.deepEqual(validateStats(stats), []);
  });

  it('tolera campos adicionales', () => {
    const stats = buildStats({ extra: 'permitido' });
    stats.summary.extra = 42;

    assert.deepEqual(validateStats(stats), []);
  });

  it('señala un campo ausente con su ruta', () => {
    const stats = buildStats();
    delete stats.summary.totalMinutes;

    const issues = validateStats(stats);

    assert.equal(issues.length, 1);
    assert.match(issues[0], /summary\.totalMinutes/);
  });

  it('señala un campo renombrado con su ruta', () => {
    const stats = buildStats();
    stats.global.racha = stats.global.streak;
    delete stats.global.streak;

    const issues = validateStats(stats);

    assert.equal(issues.length, 1);
    assert.match(issues[0], /global\.streak/);
  });

  it('señala un tipo incorrecto con su ruta', () => {
    const stats = buildStats();
    stats.today.goalMet = 'sí';

    const issues = validateStats(stats);

    assert.equal(issues.length, 1);
    assert.match(issues[0], /today\.goalMet/);
  });

  it('señala el elemento inválido de una lista con índice y campo', () => {
    const stats = buildStats();
    stats.heatmap.days[1].minutes = 'mucho';

    const issues = validateStats(stats);

    assert.equal(issues.length, 1);
    assert.match(issues[0], /heatmap\.days\[1\]\.minutes/);
  });

  it('rechaza un cuerpo que no es un objeto', () => {
    const issues = validateStats(null);

    assert.equal(issues.length, 1);
    assert.match(issues[0], /la respuesta debe ser un objeto/);
  });
});

describe('domain-contracts · sesiones', () => {
  it('acepta una sesión válida', () => {
    assert.deepEqual(validateSession(buildSession()), []);
  });

  it('tolera campos adicionales en una sesión', () => {
    assert.deepEqual(validateSession(buildSession({ extra: true })), []);
  });

  it('señala un campo de sesión con su ruta', () => {
    const session = buildSession();
    delete session.title;

    const issues = validateSession(session);

    assert.equal(issues.length, 1);
    assert.match(issues[0], /title/);
  });

  it('acepta una lista vacía y una lista válida', () => {
    assert.deepEqual(validateSessionList([]), []);
    assert.deepEqual(validateSessionList([buildSession()]), []);
  });

  it('señala el elemento inválido de una lista con índice y campo', () => {
    const sessions = [buildSession(), buildSession({ durationMinutes: 'dos horas' })];

    const issues = validateSessionList(sessions);

    assert.equal(issues.length, 1);
    assert.match(issues[0], /\[1\]\.durationMinutes/);
  });

  it('rechaza una lista donde se espera un objeto', () => {
    const issues = validateSessionList({});

    assert.equal(issues.length, 1);
    assert.match(issues[0], /lista/);
  });
});

describe('domain-contracts · aserciones', () => {
  it('assertStats no lanza con una respuesta válida', () => {
    assert.doesNotThrow(() => assertStats(buildStats()));
  });

  it('assertStats lanza ContractError con el primer fallo', () => {
    const stats = buildStats();
    delete stats.summary.totalMinutes;

    assert.throws(
      () => assertStats(stats),
      (error) => {
        assert.ok(error instanceof ContractError);
        assert.equal(error.name, 'ContractError');
        assert.match(error.message, /summary\.totalMinutes/);
        return true;
      },
    );
  });

  it('assertSession y assertSessionList lanzan ContractError', () => {
    assert.throws(() => assertSession({}), ContractError);
    assert.throws(() => assertSessionList([{}]), ContractError);
  });
});
