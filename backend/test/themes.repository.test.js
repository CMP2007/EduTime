import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { createThemesRepository } from '../src/themes/themes.repository.js';

const wait = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

/** Construye una temática con la forma persistida. */
function buildTheme(id, name = 'Matemáticas') {
  return { id, name };
}

/** Almacenamiento simulado: lento a propósito para abrir la ventana de carrera. */
function createStore(initial) {
  return {
    readData: async () => {
      await wait();
      if (initial === null) return null;
      return initial.map((theme) => ({ ...theme }));
    },
    writeData: async () => {
      await wait();
    },
  };
}

afterEach(() => {
  mock.restoreAll();
});

describe('themesRepository · lectura', () => {
  it('comparte una única lectura entre llamadas concurrentes (single-flight)', async () => {
    const store = createStore([]);
    mock.method(store, 'readData', async () => {
      await wait(20);
      return [];
    });
    const repository = createThemesRepository(store);

    const [first, second] = await Promise.all([repository.findAll(), repository.findAll()]);

    assert.deepEqual(first, []);
    assert.deepEqual(second, []);
    assert.equal(store.readData.mock.callCount(), 1);
  });

  it('un catálogo inexistente se lee como vacío y no siembra', async () => {
    const store = createStore(null);
    const writeData = mock.method(store, 'writeData', async () => {});
    const repository = createThemesRepository(store);

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
    const repository = createThemesRepository(store);

    await assert.rejects(() => repository.findAll(), /corrupto/);
    failing = false;

    assert.deepEqual(await repository.findAll(), []);
  });
});

describe('themesRepository · CRUD', () => {
  it('findAll devuelve el catálogo y findById la temática concreta', async () => {
    const repository = createThemesRepository(
      createStore([buildTheme('A'), buildTheme('B', 'Física')]),
    );

    const all = await repository.findAll();
    assert.deepEqual(all.map((theme) => theme.id), ['A', 'B']);

    assert.deepEqual(await repository.findById('B'), { id: 'B', name: 'Física' });
    assert.equal(await repository.findById('no-existe'), null);
  });

  it('insert persiste la temática y la devuelve', async () => {
    const store = createStore([]);
    const writeData = mock.method(store, 'writeData', async () => {});
    const repository = createThemesRepository(store);

    const inserted = await repository.insert(buildTheme('A'));

    assert.deepEqual(inserted, { id: 'A', name: 'Matemáticas' });
    assert.deepEqual(await repository.findAll(), [{ id: 'A', name: 'Matemáticas' }]);
    assert.equal(writeData.mock.callCount(), 1);
  });

  it('update cambia el nombre, conserva el id y devuelve null si no existe', async () => {
    const repository = createThemesRepository(createStore([buildTheme('A')]));

    const updated = await repository.update('A', { name: 'Álgebra' });

    assert.deepEqual(updated, { id: 'A', name: 'Álgebra' });
    assert.deepEqual(await repository.findById('A'), { id: 'A', name: 'Álgebra' });
    assert.equal(await repository.update('no-existe', { name: 'Otra' }), null);
  });

  it('remove elimina la temática y devuelve true o false', async () => {
    const repository = createThemesRepository(createStore([buildTheme('A')]));

    assert.equal(await repository.remove('A'), true);
    assert.equal(await repository.remove('A'), false);
    assert.deepEqual(await repository.findAll(), []);
  });
});

describe('themesRepository · concurrencia', () => {
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
    const repository = createThemesRepository(store);

    await Promise.all([
      repository.insert(buildTheme('A')),
      repository.insert(buildTheme('B', 'Física')),
    ]);

    assert.equal(maxActive, 1);
    assert.deepEqual(
      writes.at(-1).map((theme) => theme.id).sort(),
      ['A', 'B'],
    );
  });
});

describe('themesRepository · aislamiento de referencias', () => {
  it('devuelve copias profundas: mutar una estructura anidada no altera el estado interno', async () => {
    const repository = createThemesRepository(
      createStore([{ ...buildTheme('A'), aliases: ['mates'] }]),
    );

    const [returned] = await repository.findAll();
    returned.aliases.push('mutada');

    const found = await repository.findById('A');
    found.aliases.push('mutada');

    assert.deepEqual((await repository.findById('A')).aliases, ['mates']);
  });

  it('insert aísla la entrada: mutar el objeto original no altera el estado interno', async () => {
    const repository = createThemesRepository(createStore([]));
    const theme = { ...buildTheme('A'), aliases: ['mates'] };

    await repository.insert(theme);
    theme.aliases.push('mutada');

    const [stored] = await repository.findAll();
    assert.deepEqual(stored.aliases, ['mates']);
  });

  it('update aísla los cambios: mutarlos después no altera el estado interno', async () => {
    const repository = createThemesRepository(createStore([buildTheme('A')]));
    const changes = { aliases: ['mates'] };

    await repository.update('A', changes);
    changes.aliases.push('mutada');

    const found = await repository.findById('A');
    assert.deepEqual(found.aliases, ['mates']);
  });
});
