import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { assertSession, assertSessionList } from 'domain-contracts';
import { sessionsRepository } from '../src/sessions/sessions.repository.js';
import { themesRepository } from '../src/themes/themes.repository.js';
import { sessionsService } from '../src/sessions/sessions.service.js';

const INVALID_DATES = [
  '2026-02-31',
  '2026-1-1',
  '1989-12-31',
  ' 2026-10-15 ',
  '',
  null,
  20261015,
];

const THEMES = [
  { id: 'theme-1', name: 'Matemáticas' },
  { id: 'theme-2', name: 'Física' },
];

function buildSession(overrides = {}) {
  return {
    id: 'session-1',
    themeId: 'theme-1',
    date: '2026-10-15',
    durationMinutes: 120,
    notes: '',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    ...overrides,
  };
}

/** Simula el catálogo con las mismas temáticas para listar y buscar por id. */
function mockThemes(themes = THEMES) {
  mock.method(themesRepository, 'findAll', async () => themes.map((theme) => ({ ...theme })));
  mock.method(themesRepository, 'findById', async (id) => {
    const found = themes.find((theme) => theme.id === id);
    return found ? { ...found } : null;
  });
}

/** Simula una clase existente y la actualización sobre ella. */
function mockExisting(overrides = {}) {
  const existing = buildSession(overrides);
  mock.method(sessionsRepository, 'findById', async () => ({ ...existing }));
  const update = mock.method(sessionsRepository, 'update', async (id, data) => ({
    ...existing,
    ...data,
    id,
  }));
  return { existing, update };
}

afterEach(() => {
  mock.restoreAll();
});

describe('sessionsService · fechas inválidas', () => {
  it('create rechaza fechas inválidas sin llamar a insert', async () => {
    const insert = mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));

    for (const date of INVALID_DATES) {
      await assert.rejects(
        sessionsService.create({ themeId: 'theme-1', date, hours: 1, minutes: 0, notes: '' }),
        { name: 'ValidationError', message: 'La fecha no es válida.' },
      );
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('update rechaza fechas inválidas sin llamar a update', async () => {
    mock.method(sessionsRepository, 'findById', async () => buildSession());
    const update = mock.method(sessionsRepository, 'update', async (id, data) => ({ ...data, id }));

    for (const date of INVALID_DATES) {
      await assert.rejects(
        sessionsService.update('session-1', { date, hours: 1, minutes: 0 }),
        { name: 'ValidationError', message: 'La fecha no es válida.' },
      );
    }

    assert.equal(update.mock.callCount(), 0);
  });
});

describe('sessionsService · filtros estrictos (RF-3, RF-4, RF-5)', () => {
  beforeEach(() => {
    mockThemes();
  });

  it('list valida antes de leer el repositorio', async () => {
    const findAll = mock.method(sessionsRepository, 'findAll', async () => []);

    await assert.rejects(
      sessionsService.list({ from: '2026-02-31' }),
      { name: 'ValidationError', message: 'El filtro «desde» no es una fecha válida.' },
    );
    await assert.rejects(
      sessionsService.list({ to: '2026-13-01' }),
      { name: 'ValidationError', message: 'El filtro «hasta» no es una fecha válida.' },
    );
    await assert.rejects(
      sessionsService.list({ from: 123, to: null }),
      { name: 'ValidationError', message: 'El filtro «desde» no es una fecha válida.' },
    );
    await assert.rejects(
      sessionsService.list({ from: ['a', 'b'] }),
      { name: 'ValidationError', message: 'El filtro «desde» no es una fecha válida.' },
    );
    await assert.rejects(
      sessionsService.list({ from: '2026-10-20', to: '2026-10-15' }),
      {
        name: 'ValidationError',
        message: 'El rango de fechas está invertido: «desde» es posterior a «hasta».',
      },
    );

    assert.equal(findAll.mock.callCount(), 0);
  });

  it('list ignora from/to vacíos y no filtra', async () => {
    const sessions = [
      buildSession(),
      buildSession({ id: 'session-2', date: '2026-10-20' }),
    ];
    mock.method(sessionsRepository, 'findAll', async () =>
      sessions.map((session) => ({ ...session })),
    );

    const listed = await sessionsService.list({ from: '', to: '' });

    assert.equal(listed.length, 2);
  });
});

describe('sessionsService · contrato de la respuesta (B0-6)', () => {
  beforeEach(() => {
    mockThemes();
  });

  it('create devuelve una sesión que cumple el contrato con themeName resuelto', async () => {
    mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));

    const created = await sessionsService.create({
      themeId: 'theme-1',
      date: '2026-10-15',
      hours: 2,
      minutes: 0,
      notes: '',
    });

    assertSession(created);
    assert.equal(created.themeId, 'theme-1');
    assert.equal(created.themeName, 'Matemáticas');
    assert.equal(created.durationMinutes, 120);
  });

  it('list devuelve un listado que cumple el contrato con themeName resuelto', async () => {
    const sessions = [
      buildSession(),
      buildSession({ id: 'session-2', themeId: 'theme-2', date: '2026-10-16' }),
    ];
    mock.method(sessionsRepository, 'findAll', async () =>
      sessions.map((session) => ({ ...session })),
    );

    const listed = await sessionsService.list();

    assertSessionList(listed);
    assert.equal(listed.length, 2);
    assert.deepEqual(
      listed.map((session) => session.themeName).sort(),
      ['Física', 'Matemáticas'],
    );
  });
});

describe('sessionsService · temática de la clase (RF-20 a RF-24, RF-30)', () => {
  beforeEach(() => {
    mockThemes();
  });

  it('create exige themeId y rechaza una temática inexistente sin insertar', async () => {
    const insert = mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));

    await assert.rejects(
      sessionsService.create({ date: '2026-10-15', hours: 1, minutes: 0, notes: '' }),
      { name: 'ValidationError', message: 'La temática es obligatoria.' },
    );
    await assert.rejects(
      sessionsService.create({
        themeId: 'no-existe',
        date: '2026-10-15',
        hours: 1,
        minutes: 0,
        notes: '',
      }),
      { name: 'ValidationError', message: 'La temática seleccionada no existe.' },
    );

    assert.equal(insert.mock.callCount(), 0);
  });

  it('list filtra por themeId y conserva los filtros de fecha', async () => {
    mock.method(sessionsRepository, 'findAll', async () => [
      buildSession({ id: 's1', date: '2026-10-15' }),
      buildSession({ id: 's2', themeId: 'theme-2', date: '2026-10-16' }),
      buildSession({ id: 's3', date: '2026-10-20' }),
    ]);

    const listed = await sessionsService.list({ themeId: 'theme-2' });
    assert.deepEqual(listed.map((session) => session.id), ['s2']);

    const ranged = await sessionsService.list({
      themeId: 'theme-1',
      from: '2026-10-16',
      to: '2026-10-19',
    });
    assert.deepEqual(ranged, []);
  });

  it('list rechaza themeId repetido o de otro tipo antes de leer', async () => {
    const findAll = mock.method(sessionsRepository, 'findAll', async () => []);

    for (const themeId of [['theme-1', 'theme-2'], 42, '   ']) {
      await assert.rejects(() => sessionsService.list({ themeId }), {
        name: 'ValidationError',
        message: 'El filtro «temática» no es válido.',
      });
    }

    assert.equal(findAll.mock.callCount(), 0);
  });

  it('list busca q solo en las observaciones, no en el nombre de la temática', async () => {
    mock.method(sessionsRepository, 'findAll', async () => [
      buildSession({ id: 's1', themeId: 'theme-2', notes: '' }),
      buildSession({ id: 's2', themeId: 'theme-1', notes: 'Repaso de física cuántica' }),
    ]);

    const byThemeName = await sessionsService.list({ q: 'física' });
    assert.deepEqual(byThemeName.map((session) => session.id), ['s2']);

    const byNotes = await sessionsService.list({ q: 'cuántica' });
    assert.deepEqual(byNotes.map((session) => session.id), ['s2']);
  });

  it('list falla si una clase referencia una temática inexistente', async () => {
    mock.method(sessionsRepository, 'findAll', async () => [
      buildSession({ id: 'rota', themeId: 'no-existe' }),
    ]);

    await assert.rejects(() => sessionsService.list(), {
      message: 'La clase rota referencia una temática inexistente.',
    });
  });

  it('update conserva la temática actual si no llega themeId', async () => {
    mockExisting();

    const updated = await sessionsService.update('session-1', { hours: 1, minutes: 30 });

    assert.equal(updated.themeId, 'theme-1');
    assert.equal(updated.themeName, 'Matemáticas');
  });

  it('update cambia la temática y resuelve el nombre nuevo', async () => {
    mockExisting();

    const updated = await sessionsService.update('session-1', {
      themeId: 'theme-2',
      hours: 1,
      minutes: 30,
    });

    assert.equal(updated.themeId, 'theme-2');
    assert.equal(updated.themeName, 'Física');
  });

  it('update rechaza una temática inexistente sin actualizar', async () => {
    const { update } = mockExisting();

    await assert.rejects(
      sessionsService.update('session-1', {
        themeId: 'no-existe',
        hours: 1,
        minutes: 30,
      }),
      { name: 'ValidationError', message: 'La temática seleccionada no existe.' },
    );

    assert.equal(update.mock.callCount(), 0);
  });
});

describe('sessionsService · duración parcial en create (RF-1 a RF-4, RF-9 a RF-13, RF-15)', () => {
  beforeEach(() => {
    mockThemes();
  });

  function mockInsert() {
    return mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));
  }

  it('create suma horas y minutos y acepta cadenas numéricas', async () => {
    mockInsert();

    const created = await sessionsService.create({
      themeId: 'theme-1',
      date: '2026-10-15',
      hours: '2',
      minutes: 30,
      notes: '',
    });

    assert.equal(created.durationMinutes, 150);
  });

  it('create con solo horas interpreta los minutos ausentes como 0', async () => {
    mockInsert();

    const created = await sessionsService.create({
      themeId: 'theme-1',
      date: '2026-10-15',
      hours: 2,
      notes: '',
    });

    assert.equal(created.durationMinutes, 120);
  });

  it('create con solo minutos interpreta las horas ausentes como 0', async () => {
    mockInsert();

    const created = await sessionsService.create({
      themeId: 'theme-1',
      date: '2026-10-15',
      minutes: 45,
      notes: '',
    });

    assert.equal(created.durationMinutes, 45);
  });

  it('create acepta exactamente 15 y 1439 minutos', async () => {
    mockInsert();

    const min = await sessionsService.create({
      themeId: 'theme-1',
      date: '2026-10-15',
      minutes: 15,
      notes: '',
    });
    const max = await sessionsService.create({
      themeId: 'theme-1',
      date: '2026-10-15',
      hours: 23,
      minutes: 59,
      notes: '',
    });

    assert.equal(min.durationMinutes, 15);
    assert.equal(max.durationMinutes, 1439);
  });

  it('create sin duración o con null/cadena vacía rechaza con el mínimo', async () => {
    const insert = mockInsert();
    const payloads = [
      {},
      { hours: null, minutes: null },
      { hours: '', minutes: '' },
      { hours: null },
      { minutes: '' },
      { durationMinutes: 60 },
      { hours: 0, minutes: 0 },
      { hours: 0 },
      { minutes: 0 },
      { hours: 0, minutes: 14 },
    ];

    for (const duration of payloads) {
      await assert.rejects(
        sessionsService.create({
          themeId: 'theme-1',
          date: '2026-10-15',
          notes: '',
          ...duration,
        }),
        { name: 'ValidationError', message: 'La clase debe durar al menos 15 minutos.' },
      );
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('create rechaza el total superior a 1439 con el mensaje de máximo', async () => {
    const insert = mockInsert();
    const payloads = [
      { hours: 24 },
      { hours: 23, minutes: 60 },
      { hours: 24, minutes: 60 },
    ];

    for (const duration of payloads) {
      await assert.rejects(
        sessionsService.create({
          themeId: 'theme-1',
          date: '2026-10-15',
          notes: '',
          ...duration,
        }),
        { name: 'ValidationError', message: 'La clase no puede superar las 23:59.' },
      );
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('create rechaza horas inválidas con el mensaje de horas', async () => {
    const insert = mockInsert();

    for (const hours of [-1, 1.5, 'abc']) {
      await assert.rejects(
        sessionsService.create({
          themeId: 'theme-1',
          date: '2026-10-15',
          hours,
          minutes: 0,
          notes: '',
        }),
        {
          name: 'ValidationError',
          message: 'Las horas deben ser un número entero mayor o igual que 0.',
        },
      );
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('create rechaza minutos inválidos con el mensaje de minutos', async () => {
    const insert = mockInsert();

    for (const minutes of [-1, 1.5, 'abc']) {
      await assert.rejects(
        sessionsService.create({
          themeId: 'theme-1',
          date: '2026-10-15',
          hours: 0,
          minutes,
          notes: '',
        }),
        {
          name: 'ValidationError',
          message: 'Los minutos deben ser un número entero mayor o igual que 0.',
        },
      );
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('create rechaza minutos mayores que 59 cuando el total no supera 1439', async () => {
    const insert = mockInsert();

    await assert.rejects(
      sessionsService.create({
        themeId: 'theme-1',
        date: '2026-10-15',
        hours: 0,
        minutes: 60,
        notes: '',
      }),
      {
        name: 'ValidationError',
        message: 'Los minutos deben ser un número entero entre 0 y 59.',
      },
    );

    assert.equal(insert.mock.callCount(), 0);
  });

  it('create aplica la precedencia acordada entre errores de duración', async () => {
    mockInsert();

    await assert.rejects(
      sessionsService.create({
        themeId: 'theme-1',
        date: '2026-10-15',
        hours: -1,
        minutes: -1,
        notes: '',
      }),
      {
        name: 'ValidationError',
        message: 'Las horas deben ser un número entero mayor o igual que 0.',
      },
    );
    await assert.rejects(
      sessionsService.create({
        themeId: 'theme-1',
        date: '2026-10-15',
        hours: 'abc',
        minutes: 'abc',
        notes: '',
      }),
      {
        name: 'ValidationError',
        message: 'Las horas deben ser un número entero mayor o igual que 0.',
      },
    );
    await assert.rejects(
      sessionsService.create({
        themeId: 'theme-1',
        date: '2026-10-15',
        hours: 23,
        minutes: 60,
        notes: '',
      }),
      { name: 'ValidationError', message: 'La clase no puede superar las 23:59.' },
    );
    await assert.rejects(
      sessionsService.create({
        themeId: 'theme-1',
        date: '2026-10-15',
        hours: 0,
        minutes: 0,
        notes: '',
      }),
      { name: 'ValidationError', message: 'La clase debe durar al menos 15 minutos.' },
    );
  });
});

describe('sessionsService · edición parcial y ajuste (RF-5 a RF-10, RF-14)', () => {
  beforeEach(() => {
    mockThemes();
  });

  it('update con ambos actualiza la duración y conserva el resto de campos', async () => {
    mockExisting();

    const updated = await sessionsService.update('session-1', { hours: 1, minutes: 30 });

    assertSession(updated);
    assert.equal(updated.durationMinutes, 90);
    assert.equal(updated.themeId, 'theme-1');
    assert.equal(updated.themeName, 'Matemáticas');
    assert.equal(updated.date, '2026-10-15');
    assert.equal(updated.notes, '');
  });

  it('update con solo horas interpreta los minutos ausentes como 0', async () => {
    mockExisting();

    const updated = await sessionsService.update('session-1', { hours: 1 });

    assert.equal(updated.durationMinutes, 60);
  });

  it('update con solo minutos interpreta las horas ausentes como 0', async () => {
    mockExisting();

    const updated = await sessionsService.update('session-1', { minutes: 45 });

    assert.equal(updated.durationMinutes, 45);
  });

  it('update con una sola parte a 0 rechaza con el mínimo', async () => {
    const { update } = mockExisting();

    await assert.rejects(
      sessionsService.update('session-1', { hours: 0 }),
      { name: 'ValidationError', message: 'La clase debe durar al menos 15 minutos.' },
    );
    await assert.rejects(
      sessionsService.update('session-1', { minutes: 0 }),
      { name: 'ValidationError', message: 'La clase debe durar al menos 15 minutos.' },
    );

    assert.equal(update.mock.callCount(), 0);
  });

  it('update rechaza el total superior a 1439 con el mensaje de máximo', async () => {
    const { update } = mockExisting();
    const payloads = [
      { hours: 24 },
      { hours: 23, minutes: 60 },
      { hours: 24, minutes: 60 },
    ];

    for (const duration of payloads) {
      await assert.rejects(
        sessionsService.update('session-1', duration),
        { name: 'ValidationError', message: 'La clase no puede superar las 23:59.' },
      );
    }

    assert.equal(update.mock.callCount(), 0);
  });

  for (const duration of [120, 15, 1439]) {
    it(`update sin duración conserva ${duration}`, async () => {
      mockExisting({ durationMinutes: duration });

      const updated = await sessionsService.update('session-1', {});

      assert.equal(updated.durationMinutes, duration);
    });
  }

  for (const [duration, expected] of [
    [10, 15],
    [0, 15],
    [1440, 1439],
    [2000, 1439],
  ]) {
    it(`update sin duración ajusta ${duration} a ${expected}`, async () => {
      mockExisting({ durationMinutes: duration });

      const updated = await sessionsService.update('session-1', {});

      assert.equal(updated.durationMinutes, expected);
    });
  }

  it('update trata null y cadena vacía como partes ausentes', async () => {
    mockExisting();

    const bothAbsent = await sessionsService.update('session-1', {
      hours: null,
      minutes: '',
    });
    const hoursAbsent = await sessionsService.update('session-1', {
      hours: null,
      minutes: 30,
    });
    const minutesAbsent = await sessionsService.update('session-1', {
      hours: 2,
      minutes: '',
    });

    assert.equal(bothAbsent.durationMinutes, 120);
    assert.equal(hoursAbsent.durationMinutes, 30);
    assert.equal(minutesAbsent.durationMinutes, 120);
  });

  it('update ignora durationMinutes directo y conserva la duración existente', async () => {
    mockExisting({ durationMinutes: 2000 });

    const updated = await sessionsService.update('session-1', { durationMinutes: 60 });

    assert.equal(updated.durationMinutes, 1439);
  });
});
