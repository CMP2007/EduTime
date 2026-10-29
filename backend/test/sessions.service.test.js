import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { assertSession, assertSessionList } from 'domain-contracts';
import { sessionsRepository } from '../src/sessions/sessions.repository.js';
import { sessionsService } from '../src/sessions/sessions.service.js';

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
