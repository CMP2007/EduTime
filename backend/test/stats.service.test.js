import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { assertStats } from 'domain-contracts';
import { sessionsRepository } from '../src/sessions/sessions.repository.js';
import { themesRepository } from '../src/themes/themes.repository.js';
import { GOAL_MINUTES, statsService } from '../src/stats/stats.service.js';
import { addDays, todayString } from '../src/utils/date.js';

const THEMES = [
  { id: 'theme-1', name: 'Matemáticas' },
  { id: 'theme-2', name: 'Física' },
];

/**
 * Construye una sesión con la forma del modelo de datos.
 * No importa el `id` para estos tests: basta con que sea único.
 */
function buildSession(date, durationMinutes, themeId = 'theme-1') {
  return {
    id: `${date}-${durationMinutes}-${themeId}`,
    themeId,
    date,
    durationMinutes,
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

/** Sustituye la lectura de ambos repositorios por listas en memoria. */
function seed(sessions, themes = THEMES) {
  mock.method(sessionsRepository, 'findAll', async () => sessions.map((session) => ({ ...session })));
  mock.method(themesRepository, 'findAll', async () => themes.map((theme) => ({ ...theme })));
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
      buildSession('2026-10-15', 30, 'theme-2'),
      buildSession('2026-10-15', 120, 'theme-1'),
      buildSession('2026-10-16', 60, 'theme-1'),
    ]);

    const stats = await statsService.getStats({ period: 'month', date: '2026-10-15' });

    assert.deepEqual(stats.summary.longestClass, {
      id: '2026-10-15-120-theme-1',
      themeId: 'theme-1',
      name: 'Matemáticas',
      date: '2026-10-15',
      durationMinutes: 120,
    });
    assert.deepEqual(
      stats.summary.subjects.map((subject) => subject.name),
      ['Matemáticas', 'Física'],
    );
    assert.deepEqual(
      stats.summary.subjects.map((subject) => subject.themeId),
      ['theme-1', 'theme-2'],
    );
    assert.equal(stats.summary.subjects[0].minutes, 180);
    assert.equal(stats.summary.subjects[0].sessions, 2);
  });

  it('usa el nombre actual del catálogo aunque la temática se haya renombrado', async () => {
    seed(
      [buildSession('2026-10-15', 90, 'theme-1')],
      [{ id: 'theme-1', name: 'Matemáticas avanzadas' }],
    );

    const stats = await statsService.getStats({ period: 'day', date: '2026-10-15' });

    assert.equal(stats.summary.subjects[0].name, 'Matemáticas avanzadas');
    assert.equal(stats.summary.longestClass.name, 'Matemáticas avanzadas');
  });

  it('falla si una clase referencia una temática inexistente', async () => {
    seed([buildSession('2026-10-15', 90, 'no-existe')]);

    await assert.rejects(() => statsService.getStats({ period: 'day', date: '2026-10-15' }), {
      message: 'La clase 2026-10-15-90-no-existe referencia una temática inexistente.',
    });
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

// === Tests de validación y recorte de fechas (T4) ===
describe('statsService.getStats · validación y recorte de fechas (T4)', () => {
  it('date inválido lanza ValidationError antes de findAll', async () => {
    await assert.rejects(
      () => statsService.getStats({ date: '2026-02-31' }),
      { name: 'ValidationError', message: 'La fecha de referencia no es válida.' },
    );
  });

  it('heatmapDate inválido lanza ValidationError antes de findAll', async () => {
    await assert.rejects(
      () => statsService.getStats({ heatmapDate: '2026-13-01' }),
      { name: 'ValidationError', message: 'La fecha del calendario no es válida.' },
    );
  });

  it('1990-01-01 con 12m devuelve period.from === 1990-01-01 y notice con mensaje exacto', async () => {
    seed([buildSession('1990-01-01', GOAL_MINUTES)]);

    const stats = await statsService.getStats({ period: '12m', date: '1990-01-01' });

    assert.equal(stats.period.from, '1990-01-01');
    assert.equal(stats.notice, 'El rango solicitado se ha recortado a los límites admitidos (1990-01-01 – 9999-12-31).');
  });

  it('9999-12-31 con week devuelve heatmap.to === 9999-12-31 y notice', async () => {
    seed([buildSession('9999-12-31', GOAL_MINUTES)]);

    const stats = await statsService.getStats({ heatmap: 'week', heatmapDate: '9999-12-31' });

    assert.equal(stats.heatmap.to, '9999-12-31');
    assert.equal(stats.notice, 'El rango solicitado se ha recortado a los límites admitidos (1990-01-01 – 9999-12-31).');
  });

  it('rango interior devuelve notice: null', async () => {
    seed([
      buildSession('2025-01-01', GOAL_MINUTES),
      buildSession('2025-12-31', GOAL_MINUTES),
    ]);

    const stats = await statsService.getStats({ period: 'year', date: '2025-06-15' });

    assert.equal(stats.notice, null);
  });

  it('date/heatmapDate no textuales o repetidos lanzan ValidationError antes de findAll', async () => {
    const findAll = mock.method(sessionsRepository, 'findAll', async () => []);

    const filters = [
      { date: 123 },
      { date: ['2026-10-15', '2026-10-16'] },
      { heatmapDate: 123 },
      { heatmapDate: ['2026-10-15', '2026-10-16'] },
    ];

    for (const input of filters) {
      await assert.rejects(
        () => statsService.getStats(input),
        { name: 'ValidationError' },
      );
    }

    assert.equal(findAll.mock.callCount(), 0);
  });

  it('date vacío usa hoy y heatmapDate vacío usa la fecha de referencia', async () => {
    seed([]);

    const stats = await statsService.getStats({ date: '', heatmapDate: '', period: 'day', heatmap: 'day' });

    assert.equal(stats.today.date, todayString());
    assert.equal(stats.heatmap.from, todayString());
  });

  it('el recorte de periodo y el del calendario se evalúan por separado', async () => {
    seed([]);

    const onlyPeriod = await statsService.getStats({
      period: '12m',
      date: '1990-01-01',
      heatmap: 'day',
      heatmapDate: '2025-06-15',
    });
    assert.equal(onlyPeriod.period.from, '1990-01-01');
    assert.equal(onlyPeriod.heatmap.from, '2025-06-15');
    assert.ok(onlyPeriod.notice);

    const onlyHeatmap = await statsService.getStats({
      period: 'day',
      date: '2025-06-15',
      heatmap: 'week',
      heatmapDate: '9999-12-31',
    });
    assert.equal(onlyHeatmap.period.from, '2025-06-15');
    assert.equal(onlyHeatmap.heatmap.to, '9999-12-31');
    assert.ok(onlyHeatmap.notice);
  });
});
