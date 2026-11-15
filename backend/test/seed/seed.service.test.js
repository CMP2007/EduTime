import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { isSameThemeName } from 'domain-themes';

import { sessionsRepository } from '../../src/sessions/sessions.repository.js';
import { seedService } from '../../src/seed/seed.service.js';
import { themesRepository } from '../../src/themes/themes.repository.js';

afterEach(() => {
  mock.restoreAll();
});

function mockRead({ sessions = [], themes = [] } = {}) {
  mock.method(sessionsRepository, 'findAll', async () => structuredClone(sessions));
  mock.method(themesRepository, 'findAll', async () => structuredClone(themes));
}

describe('seedService.apply · condición de aplicación', () => {
  it('responde 409 y no escribe si ya hay al menos una clase', async () => {
    mockRead({
      sessions: [{ id: 'session-1', themeId: 'theme-1' }],
      themes: [{ id: 'theme-1', name: 'Matemáticas' }],
    });
    const themesInsert = mock.method(themesRepository, 'insertMany', async () => []);
    const sessionsInsert = mock.method(sessionsRepository, 'insertMany', async () => []);

    await assert.rejects(() => seedService.apply(), {
      name: 'ConflictError',
      status: 409,
      message: 'Ya hay clases registradas; no se cargan datos de ejemplo.',
    });

    assert.equal(themesInsert.mock.callCount(), 0);
    assert.equal(sessionsInsert.mock.callCount(), 0);
  });
});

describe('seedService.apply · aplicación de la semilla', () => {
  it('escribe primero las temáticas y después las clases, una vez cada una', async () => {
    mockRead();
    const calls = [];
    mock.method(themesRepository, 'insertMany', async (themes) => {
      calls.push({ store: 'themes', items: themes });
      return themes;
    });
    const sessionsInsert = mock.method(sessionsRepository, 'insertMany', async (sessions) => {
      calls.push({ store: 'sessions', items: sessions });
      return sessions;
    });

    const result = await seedService.apply();

    assert.equal(calls.length, 2);
    assert.equal(calls[0].store, 'themes');
    assert.equal(calls[1].store, 'sessions');
    assert.equal(sessionsInsert.mock.callCount(), 1);
    assert.ok(result.themes.length > 0);
    assert.ok(result.sessions.length > 0);
    assert.ok(
      result.sessions.every((session) =>
        result.themes.some((theme) => theme.id === session.themeId),
      ),
    );
  });

  it('reutiliza las temáticas existentes por nombre normalizado y crea solo las que faltan', async () => {
    const existing = { id: 'theme-existente', name: 'matematicas' };
    mockRead({ themes: [existing] });
    const themesInsert = mock.method(themesRepository, 'insertMany', async (themes) => themes);
    mock.method(sessionsRepository, 'insertMany', async (sessions) => sessions);

    const result = await seedService.apply();

    assert.ok(
      result.themes.every((theme) => !isSameThemeName(theme.name, existing.name)),
    );
    assert.ok(
      result.sessions
        .filter((session) => session.themeId === existing.id)
        .length > 0,
    );
    assert.ok(
      themesInsert.mock.calls[0].arguments[0].every(
        (theme) => !isSameThemeName(theme.name, existing.name),
      ),
    );
  });

  it('si falla la escritura de clases, conserva las temáticas y el reintento no las duplica', async () => {
    let storedThemes = [];
    let storedSessions = [];
    let failSessions = true;

    mock.method(sessionsRepository, 'findAll', async () => structuredClone(storedSessions));
    mock.method(themesRepository, 'findAll', async () => structuredClone(storedThemes));
    mock.method(themesRepository, 'insertMany', async (themes) => {
      storedThemes = [...storedThemes, ...structuredClone(themes)];
      return themes;
    });
    mock.method(sessionsRepository, 'insertMany', async (sessions) => {
      if (failSessions) {
        failSessions = false;
        throw new Error('disco lleno');
      }
      storedSessions = [...storedSessions, ...structuredClone(sessions)];
      return sessions;
    });

    await assert.rejects(() => seedService.apply(), /disco lleno/);
    assert.ok(storedThemes.length > 0);
    assert.equal(storedSessions.length, 0);

    const themeCount = storedThemes.length;
    const result = await seedService.apply();

    assert.equal(storedThemes.length, themeCount);
    assert.ok(storedSessions.length > 0);
    assert.equal(result.themes.length, 0);
  });

  it('si falla la escritura de temáticas, no escribe ninguna clase', async () => {
    mockRead();
    mock.method(themesRepository, 'insertMany', async () => {
      throw new Error('disco lleno');
    });
    const sessionsInsert = mock.method(sessionsRepository, 'insertMany', async () => []);

    await assert.rejects(() => seedService.apply(), /disco lleno/);

    assert.equal(sessionsInsert.mock.callCount(), 0);
  });
});
