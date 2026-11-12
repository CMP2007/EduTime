import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { createSessionsRepository } from '../src/sessions/sessions.repository.js';

const wait = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

/** Construye una sesión con la forma del modelo de datos. */
function buildSession(id, overrides = {}) {
  return {
    id,
    themeId: 'theme-1',
    date: '2026-01-05',
    durationMinutes: 60,
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Almacenamiento simulado: lento a propósito para abrir la ventana de carrera. */
function createStore(initial) {
  return {
    readData: async () => {
      await wait();
      if (initial === null) return null;
      return initial.map((session) => ({ ...session }));
    },
    writeData: async () => {
      await wait();
    },
  };
}

afterEach(() => {
  mock.restoreAll();
});

describe('sessionsRepository · lectura', () => {
  it('comparte una única lectura entre llamadas concurrentes (single-flight)', async () => {
    const store = createStore([]);
    mock.method(store, 'readData', async () => {
      await wait(20);
      return [];
    });
    const repository = createSessionsRepository(store);

    const [first, second] = await Promise.all([repository.findAll(), repository.findAll()]);

    assert.deepEqual(first, []);
    assert.deepEqual(second, []);
    assert.equal(store.readData.mock.callCount(), 1);
  });

  it('un archivo inexistente se lee como vacío y no siembra', async () => {
    const store = createStore(null);
    const writeData = mock.method(store, 'writeData', async () => {});
    const repository = createSessionsRepository(store);

    assert.deepEqual(await repository.findAll(), []);
    assert.equal(writeData.mock.callCount(), 0);
  });

  it('un fallo de lectura no envenena el repositorio: el siguiente intento reintenta', async () => {
    const store = createStore([]);
    let failing = true;
    mock.method(store, 'readData', async () => {
      await wait();
      if (failing) throw new Error('fichero corrupto');
      return [];
    });
    const repository = createSessionsRepository(store);

    await assert.rejects(() => repository.findAll(), /corrupto/);
    failing = false;

    assert.deepEqual(await repository.findAll(), []);
  });
});

describe('sessionsRepository · escritura', () => {
  it('dos inserciones simultáneas no se pierden y no solapan escrituras', async () => {
    const writes = [];
    let active = 0;
    let maxActive = 0;
    const store = createStore([]);
    mock.method(store, 'writeData', async (data) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await wait();
      writes.push(JSON.parse(JSON.stringify(data)));
      active -= 1;
    });
    const repository = createSessionsRepository(store);

    await Promise.all([repository.insert(buildSession('A')), repository.insert(buildSession('B'))]);

    assert.equal(maxActive, 1);
    assert.deepEqual(
      writes.at(-1).map((session) => session.id).sort(),
      ['A', 'B'],
    );
  });

  it('devuelve copias: mutar el resultado no toca el estado interno', async () => {
    const repository = createSessionsRepository(createStore([buildSession('X')]));

    const [returned] = await repository.findAll();
    returned.themeId = 'theme-2';

    const [again] = await repository.findAll();
    assert.equal(again.themeId, 'theme-1');
  });

  it('update y remove siguen funcionando sobre la caché', async () => {
    const repository = createSessionsRepository(createStore([buildSession('X')]));

    const updated = await repository.update('X', { durationMinutes: 90 });
    assert.equal(updated.durationMinutes, 90);
    assert.equal(await repository.update('no-existe', {}), null);

    assert.equal(await repository.remove('X'), true);
    assert.equal(await repository.remove('X'), false);
    assert.deepEqual(await repository.findAll(), []);
  });
});

describe('sessionsRepository · borrado de temáticas', () => {
  it('countByThemeId cuenta solo las clases de la temática', async () => {
    const repository = createSessionsRepository(
      createStore([
        buildSession('A'),
        buildSession('B', { themeId: 'theme-2' }),
        buildSession('C'),
      ]),
    );

    assert.equal(await repository.countByThemeId('theme-1'), 2);
    assert.equal(await repository.countByThemeId('theme-2'), 1);
    assert.equal(await repository.countByThemeId('no-existe'), 0);
  });

  it('reassignTheme cambia solo themeId y conserva el resto, incluido updatedAt', async () => {
    const store = createStore([
      buildSession('A', { notes: 'nota A', updatedAt: '2025-12-31T00:00:00.000Z' }),
      buildSession('B', { themeId: 'theme-2', notes: 'nota B' }),
    ]);
    const writeData = mock.method(store, 'writeData', async () => {});
    const repository = createSessionsRepository(store);

    await repository.reassignTheme('theme-1', 'theme-2');

    const sessions = await repository.findAll();
    const moved = sessions.find((session) => session.id === 'A');
    assert.equal(moved.themeId, 'theme-2');
    assert.equal(moved.notes, 'nota A');
    assert.equal(moved.updatedAt, '2025-12-31T00:00:00.000Z');
    assert.equal(sessions.find((session) => session.id === 'B').themeId, 'theme-2');
    assert.equal(writeData.mock.callCount(), 1);
  });

  it('reassignTheme sin clases no escribe', async () => {
    const store = createStore([buildSession('A', { themeId: 'theme-2' })]);
    const writeData = mock.method(store, 'writeData', async () => {});
    const repository = createSessionsRepository(store);

    await repository.reassignTheme('theme-1', 'theme-2');

    assert.equal(writeData.mock.callCount(), 0);
  });

  it('removeByThemeId elimina solo las clases de la temática y persiste', async () => {
    const store = createStore([
      buildSession('A'),
      buildSession('B', { themeId: 'theme-2' }),
      buildSession('C'),
    ]);
    const writeData = mock.method(store, 'writeData', async () => {});
    const repository = createSessionsRepository(store);

    await repository.removeByThemeId('theme-1');

    assert.deepEqual((await repository.findAll()).map((session) => session.id), ['B']);
    assert.equal(writeData.mock.callCount(), 1);
  });

  it('removeByThemeId sin coincidencias no escribe', async () => {
    const store = createStore([buildSession('A', { themeId: 'theme-2' })]);
    const writeData = mock.method(store, 'writeData', async () => {});
    const repository = createSessionsRepository(store);

    await repository.removeByThemeId('theme-1');

    assert.equal(writeData.mock.callCount(), 0);
  });

  it('una reasignación y un borrado simultáneos se aplican sin solapar escrituras', async () => {
    const store = createStore([
      buildSession('A'),
      buildSession('B', { themeId: 'theme-2' }),
      buildSession('C', { themeId: 'theme-2' }),
    ]);
    let active = 0;
    let maxActive = 0;
    mock.method(store, 'writeData', async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await wait();
      active -= 1;
    });
    const repository = createSessionsRepository(store);

    await Promise.all([
      repository.removeByThemeId('theme-1'),
      repository.reassignTheme('theme-2', 'theme-3'),
    ]);

    const sessions = await repository.findAll();
    assert.deepEqual(sessions.map((session) => session.id), ['B', 'C']);
    assert.ok(sessions.every((session) => session.themeId === 'theme-3'));
    assert.equal(maxActive, 1);
  });
});

describe('sessionsRepository · aislamiento de referencias', () => {
  it('devuelve copias profundas: mutar una estructura anidada no altera el estado interno', async () => {
    const repository = createSessionsRepository(createStore([{ ...buildSession('X'), tags: ['js'] }]));

    const [returned] = await repository.findAll();
    returned.tags.push('mutada');

    const found = await repository.findById('X');
    found.tags.push('mutada');

    assert.deepEqual((await repository.findById('X')).tags, ['js']);
  });

  it('insert aísla la entrada: mutar el objeto original no altera el estado interno', async () => {
    const repository = createSessionsRepository(createStore([]));
    const session = { ...buildSession('X'), tags: ['js'] };

    await repository.insert(session);
    session.tags.push('mutada');

    const [stored] = await repository.findAll();
    assert.deepEqual(stored.tags, ['js']);
  });

  it('update aísla los cambios: mutarlos después no altera el estado interno', async () => {
    const repository = createSessionsRepository(createStore([buildSession('X')]));
    const changes = { tags: ['js'] };

    await repository.update('X', changes);
    changes.tags.push('mutada');

    const found = await repository.findById('X');
    assert.deepEqual(found.tags, ['js']);
  });
});
