import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { assertSession, assertSessionList } from 'domain-contracts';
import { sessionsRepository } from '../src/sessions/sessions.repository.js';
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

afterEach(() => {
  mock.restoreAll();
});

describe('sessionsService · fechas inválidas', () => {
  it('create rechaza fechas inválidas sin llamar a insert', async () => {
    const insert = mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));

    for (const date of INVALID_DATES) {
      await assert.rejects(
        sessionsService.create({ title: 'Matemáticas', date, hours: 1, minutes: 0, notes: '' }),
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
    mock.method(sessionsRepository, 'findAll', async () => sessions.map((session) => ({ ...session })));

    const listed = await sessionsService.list({ from: '', to: '' });

    assert.equal(listed.length, 2);
  });
});

describe('sessionsService · contrato de la respuesta (B0-6)', () => {
  it('create devuelve una sesión que cumple el contrato', async () => {
    mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));

    const created = await sessionsService.create({
      title: 'Matemáticas',
      date: '2026-10-15',
      hours: 2,
      minutes: 0,
      notes: '',
    });

    assertSession(created);
    assert.equal(created.title, 'Matemáticas');
    assert.equal(created.durationMinutes, 120);
  });

  it('list devuelve un listado que cumple el contrato', async () => {
    const sessions = [
      buildSession(),
      buildSession({ id: 'session-2', title: 'Física', date: '2026-10-16' }),
    ];
    mock.method(sessionsRepository, 'findAll', async () =>
      sessions.map((session) => ({ ...session })),
    );

    const listed = await sessionsService.list();

    assertSessionList(listed);
    assert.equal(listed.length, 2);
  });
});
