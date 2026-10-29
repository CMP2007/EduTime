import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { assertStats } from 'domain-contracts';
import { sessionsRepository } from '../src/sessions/sessions.repository.js';
import { GOAL_MINUTES, statsService } from '../src/stats/stats.service.js';
import { addDays, todayString } from '../src/utils/date.js';

/**
 * Construye una sesión con la forma del modelo de datos.
 * No importa el `id` para estos tests: basta con que sea único.
 */
function buildSession(date, durationMinutes, title = 'Matemáticas') {
  return {
    id: `${date}-${durationMinutes}-${title}`,
    title,
    date,
    durationMinutes,
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/** Sustituye la lectura del repositorio por una lista en memoria. */
function seed(sessions) {
  mock.method(sessionsRepository, 'findAll', async () => sessions.map((session) => ({ ...session })));
}

afterEach(() => {
  mock.restoreAll();
});

describe('statsService.getStats · racha', () => {
  it('cuenta días consecutivos con meta cumplida hasta hoy (current y best)', async () => {
    const hoy = todayString();
    seed([
      buildSession(hoy, GOAL_MINUTES + 20),
      buildSession(addDays(hoy, -1), GOAL_MINUTES),
      buildSession(addDays(hoy, -2), GOAL_MINUTES + 10),
    ]);

    const stats = await statsService.getStats();

    assert.deepEqual(stats.global.streak, { current: 3, best: 3 });
  });

  it('guarda la mejor racha aunque no sea la actual', async () => {
    const hoy = todayString();
    seed([-10, -9, -8, -7, -6].map((offset) => buildSession(addDays(hoy, offset), 200)));

    const stats = await statsService.getStats();

    assert.equal(stats.global.streak.best, 5);
    assert.equal(stats.global.streak.current, 0);
  });

  it('mantiene viva la racha si hoy todavía no se alcanzó la meta', async () => {
    const hoy = todayString();
    seed([
      buildSession(addDays(hoy, -1), 200),
      buildSession(addDays(hoy, -2), 200),
      buildSession(hoy, 30), // hoy aún no llega a la meta
    ]);

    const stats = await statsService.getStats();

    assert.equal(stats.global.streak.current, 2);
  });

  it('no mezcla días con y sin meta cumplida', async () => {
    const hoy = todayString();
    seed([
      buildSession(hoy, 200),
      // hueco: el día -1 no cumple meta
      buildSession(addDays(hoy, -2), 200),
    ]);

    const stats = await statsService.getStats();

    assert.equal(stats.global.streak.current, 1);
    assert.equal(stats.global.streak.best, 1);
  });
});

describe('statsService.getStats · meta del día', () => {
  it('suma varias clases del mismo día para decidir si se cumple la meta', async () => {
    seed([buildSession('2026-10-15', 100), buildSession('2026-10-15', 80)]);

    const stats = await statsService.getStats({ date: '2026-10-15' });

    assert.equal(stats.today.minutes, 180);
    assert.equal(stats.today.goalMet, true);
    assert.equal(stats.today.goalMinutes, GOAL_MINUTES);
    assert.equal(stats.global.goalDays, 1);
  });

  it('marca la meta como no cumplida por debajo del umbral', async () => {
    seed([buildSession('2026-10-15', GOAL_MINUTES - 1)]);

    const stats = await statsService.getStats({ date: '2026-10-15' });

    assert.equal(stats.today.goalMet, false);
  });
});

describe('statsService.getStats · periodos y resumen', () => {
  it('limita el resumen al periodo pero mantiene los globales', async () => {
    seed([
      buildSession('2026-10-15', 100),
      buildSession('2026-10-14', 50),
      buildSession('2026-10-01', 30),
    ]);

    const stats = await statsService.getStats({ period: 'day', date: '2026-10-15' });

    assert.equal(stats.period.key, 'day');
    assert.equal(stats.summary.totalSessions, 1);
    assert.equal(stats.summary.totalMinutes, 100);
    assert.equal(stats.global.totalSessions, 3);
    assert.equal(stats.global.totalMinutes, 180);
  });

  it('ordena las temáticas por minutos y detecta la clase más larga', async () => {
    seed([
      buildSession('2026-10-15', 30, 'Física'),
      buildSession('2026-10-15', 120, 'Matemáticas'),
      buildSession('2026-10-16', 60, 'Matemáticas'),
    ]);

    const stats = await statsService.getStats({ period: 'month', date: '2026-10-15' });

    assert.equal(stats.summary.longestClass.title, 'Matemáticas');
    assert.equal(stats.summary.longestClass.durationMinutes, 120);
    assert.deepEqual(
      stats.summary.subjects.map((subject) => subject.title),
      ['Matemáticas', 'Física'],
    );
    assert.equal(stats.summary.subjects[0].minutes, 180);
  });

  it('rechaza un periodo inválido en vez de degradarlo a semana', async () => {
    seed([]);

    await assert.rejects(
      () => statsService.getStats({ period: 'foo', date: '2026-10-17' }),
      (error) => {
        assert.equal(error.status, 400);
        assert.match(error.message, /Periodo inválido/);
        return true;
      },
    );
  });

  it('rechaza un heatmap inválido', async () => {
    seed([]);

    await assert.rejects(
      () => statsService.getStats({ heatmap: 'foo', heatmapDate: '2026-10-17' }),
      (error) => {
        assert.equal(error.status, 400);
        assert.match(error.message, /Periodo del heatmap inválido/);
        return true;
      },
    );
  });
});

describe('statsService.getStats · heatmap', () => {
  it('devuelve un día por cada fecha del rango y marca la meta cumplida', async () => {
    seed([buildSession('2026-10-13', 200), buildSession('2026-10-15', 30)]);

    const stats = await statsService.getStats({ heatmap: 'week', heatmapDate: '2026-10-17' });

    assert.equal(stats.heatmap.days.length, 7);
    assert.deepEqual(stats.heatmap.days[0], { date: '2026-10-12', minutes: 0, goalMet: false });

    const conMeta = stats.heatmap.days.find((day) => day.date === '2026-10-13');
    assert.equal(conMeta.minutes, 200);
    assert.equal(conMeta.goalMet, true);

    const sinMeta = stats.heatmap.days.find((day) => day.date === '2026-10-15');
    assert.equal(sinMeta.minutes, 30);
    assert.equal(sinMeta.goalMet, false);
  });
});

describe('statsService.getStats · contrato de la respuesta (B0-6)', () => {
  it('la respuesta real cumple el contrato compartido', async () => {
    seed([buildSession('2026-10-13', 200)]);

    const stats = await statsService.getStats({ date: '2026-10-17' });

    assertStats(stats);
  });
});

describe('statsService.getStats · sin datos', () => {
  it('devuelve ceros y racha vacía cuando no hay sesiones', async () => {
    seed([]);

    const stats = await statsService.getStats({ date: '2026-10-17' });

    assert.equal(stats.summary.totalMinutes, 0);
    assert.equal(stats.global.totalSessions, 0);
    assert.deepEqual(stats.global.streak, { current: 0, best: 0 });
    assert.equal(stats.summary.longestClass, null);
    assert.deepEqual(stats.summary.subjects, []);
  });
});
