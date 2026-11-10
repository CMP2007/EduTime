import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { createSessionsRepository } from '../src/sessions/sessions.repository.js';

const wait = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

/** Construye una sesión con la forma del modelo de datos. */
function buildSession(id) {
  return {
    id,
    title: 'JavaScript',
    date: '2026-01-05',
    durationMinutes: 60,
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
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

  it('solo siembra una vez aunque dos llamadas lleguen en frío', async () => {
    const store = createStore(null);
    mock.method(store, 'writeData', async () => {
      await wait();
    });
    const repository = createSessionsRepository(store);

    const [first, second] = await Promise.all([repository.findAll(), repository.findAll()]);

    assert.ok(first.length > 0);
    assert.equal(first.length, second.length);
    assert.equal(store.writeData.mock.callCount(), 1);
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

  it('si falla la escritura de la semilla, no deja la caché a medias', async () => {
    const store = createStore(null);
    let failing = true;
    mock.method(store, 'writeData', async () => {
      await wait();
      if (failing) {
        failing = false;
        throw new Error('disco lleno');
      }
    });
    const repository = createSessionsRepository(store);

    await assert.rejects(() => repository.findAll(), /disco lleno/);

    const list = await repository.findAll();
    assert.ok(list.length > 0);
    assert.equal(store.writeData.mock.callCount(), 2);
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
    returned.title = 'cambiada';

    const [again] = await repository.findAll();
    assert.equal(again.title, 'JavaScript');
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
