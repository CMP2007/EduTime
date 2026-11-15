import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

import { validateStoredData } from '../../src/startup/validateStoredData.js';

/** Almacén en memoria que registra si alguien intenta escribir. */
function createStore(data) {
  return {
    readData: async () => (data === null ? null : structuredClone(data)),
    writeData: async () => {
      throw new Error('validateStoredData no debe escribir');
    },
  };
}

function buildTheme(overrides = {}) {
  return { id: 'theme-1', name: 'Matemáticas', ...overrides };
}

function buildSession(overrides = {}) {
  return {
    id: 'session-1',
    themeId: 'theme-1',
    date: '2026-10-15',
    durationMinutes: 60,
    notes: '',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    ...overrides,
  };
}

function validate({ sessions = null, themes = null } = {}) {
  return validateStoredData({
    sessionsStore: createStore(sessions),
    themesStore: createStore(themes),
  });
}

describe('validateStoredData · arranque', () => {
  it('acepta un arranque sin archivos y deja los datos vacíos', async () => {
    await assert.doesNotReject(() => validate());
  });

  it('acepta datos coherentes', async () => {
    await assert.doesNotReject(() =>
      validate({
        themes: [buildTheme()],
        sessions: [buildSession()],
      }),
    );
  });

  it('acepta un catálogo con temáticas y ninguna clase', async () => {
    await assert.doesNotReject(() =>
      validate({
        themes: [buildTheme(), buildTheme({ id: 'theme-2', name: 'Física' })],
        sessions: [],
      }),
    );
  });
});

describe('validateStoredData · formato antiguo e integridad', () => {
  it('falla si una clase conserva el campo antiguo title', async () => {
    await assert.rejects(
      () =>
        validate({
          themes: [buildTheme()],
          sessions: [buildSession({ title: 'Matemáticas' })],
        }),
      /formato antiguo de temática.*borra backend\/data\//,
    );
  });

  it('falla si una clase no tiene themeId', async () => {
    const session = buildSession();
    delete session.themeId;

    await assert.rejects(
      () => validate({ themes: [buildTheme()], sessions: [session] }),
      /no tiene una temática válida.*borra backend\/data\//,
    );
  });

  it('falla si una clase referencia una temática inexistente', async () => {
    await assert.rejects(
      () =>
        validate({
          themes: [buildTheme()],
          sessions: [buildSession({ themeId: 'theme-inexistente' })],
        }),
      /no tiene una temática válida/,
    );
  });

  it('falla si una temática no tiene identificador', async () => {
    await assert.rejects(
      () => validate({ themes: [buildTheme({ id: '' })], sessions: [] }),
      /sin identificador o repetida/,
    );
  });

  it('falla si hay identificadores de temática repetidos', async () => {
    await assert.rejects(
      () =>
        validate({
          themes: [buildTheme(), buildTheme({ name: 'Física' })],
          sessions: [],
        }),
      /sin identificador o repetida/,
    );
  });

  it('falla si una temática no tiene un nombre válido', async () => {
    await assert.rejects(
      () => validate({ themes: [buildTheme({ name: '   ' })], sessions: [] }),
      /no tiene un nombre válido.*obligatorio/,
    );

    await assert.rejects(
      () => validate({ themes: [buildTheme({ name: 'x'.repeat(81) })], sessions: [] }),
      /no tiene un nombre válido.*80 caracteres/,
    );
  });

  it('no escribe nada, ni siquiera cuando los datos son válidos', async () => {
    const sessionsStore = createStore([buildSession()]);
    const themesStore = createStore([buildTheme()]);
    const sessionsWrite = mock.method(sessionsStore, 'writeData', async () => {});
    const themesWrite = mock.method(themesStore, 'writeData', async () => {});

    await validateStoredData({ sessionsStore, themesStore });

    assert.equal(sessionsWrite.mock.callCount(), 0);
    assert.equal(themesWrite.mock.callCount(), 0);
  });

  it('propaga el fallo de lectura de cualquiera de los dos almacenes', async () => {
    await assert.rejects(
      () =>
        validateStoredData({
          sessionsStore: { readData: async () => { throw new Error('JSON corrupto'); } },
          themesStore: createStore([]),
        }),
      /JSON corrupto/,
    );
  });
});
