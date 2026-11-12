import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  createFileStore,
  readData,
  sessionsFile,
  themesFile,
  writeData,
} from '../src/storage/fileStore.js';

let directory;
let dataFile;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'studytrack-filestore-'));
  dataFile = join(directory, 'sessions.json');
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

/** Nombres de temporales que quedan en el directorio. */
async function temporaryFiles() {
  const names = await readdir(directory);
  return names.filter((name) => name.endsWith('.tmp'));
}

describe('fileStore · rutas de datos', () => {
  it('expone un archivo para las clases y otro para las temáticas', () => {
    assert.equal(basename(sessionsFile), 'sessions.json');
    assert.equal(basename(themesFile), 'themes.json');
    assert.notEqual(sessionsFile, themesFile);
  });
});

describe('fileStore.readData', () => {
  it('devuelve null si el archivo no existe (primer arranque)', async () => {
    assert.equal(await readData(dataFile), null);
  });

  it('devuelve el array si el contenido es un array JSON válido', async () => {
    const stored = [{ id: 'a', themeId: 'theme-1' }];
    await writeFile(dataFile, JSON.stringify(stored), 'utf8');

    assert.deepEqual(await readData(dataFile), stored);
  });

  it('lanza error si el JSON está corrupto y deja el archivo intacto', async () => {
    const corrupt = '[{"id": "a", "themeId": "theme';
    await writeFile(dataFile, corrupt, 'utf8');

    await assert.rejects(() => readData(dataFile), /corrupto/);
    assert.equal(await readFile(dataFile, 'utf8'), corrupt);
  });

  it('lanza error si el archivo está vacío (existe, así que no es un primer arranque)', async () => {
    await writeFile(dataFile, '', 'utf8');

    await assert.rejects(() => readData(dataFile), /corrupto/);
  });

  it('lanza error genérico si el contenido no es un array', async () => {
    await writeFile(dataFile, JSON.stringify({ name: 'no soy un array' }), 'utf8');

    await assert.rejects(
      () => readData(dataFile),
      new RegExp(`no contiene un array JSON: ${dataFile}`),
    );
  });

  it('propaga el error EISDIR al intentar leer un directorio', async () => {
    await assert.rejects(
      () => readData(directory),
      (error) => {
        assert.equal(error.code, 'EISDIR');
        assert.equal(error.syscall, 'read');
        assert.doesNotMatch(error.message, /corrupto/);
        return true;
      },
    );
  });
});

describe('fileStore.writeData', () => {
  it('escribe el array y lo deja legible para readData', async () => {
    const sessions = [{ id: 'a', themeId: 'theme-1' }];

    await writeData(sessions, dataFile);

    assert.deepEqual(await readData(dataFile), sessions);
  });

  it('crea los directorios que falten', async () => {
    const nested = join(directory, 'uno', 'dos', 'sessions.json');

    await writeData([], nested);

    assert.deepEqual(await readData(nested), []);
  });

  it('no deja temporales tras escribir', async () => {
    await writeData([], dataFile);

    assert.deepEqual(await temporaryFiles(), []);
  });

  it('limpia el temporal y propaga el error si el rename falla', async () => {
    await mkdir(dataFile, { recursive: true }); // un directorio en la ruta fuerza el fallo del rename

    await assert.rejects(() => writeData([], dataFile));
    assert.deepEqual(await temporaryFiles(), []);
  });
});

describe('fileStore.createFileStore', () => {
  it('lee y escribe en el archivo que recibe', async () => {
    const store = createFileStore(dataFile);

    assert.equal(await store.readData(), null);

    await store.writeData([{ id: 'theme-1', name: 'Matemáticas' }]);

    assert.deepEqual(await store.readData(), [{ id: 'theme-1', name: 'Matemáticas' }]);
  });

  it('cada almacén queda aislado en su propio archivo', async () => {
    const otherFile = join(directory, 'themes.json');
    const sessionsStore = createFileStore(dataFile);
    const themesStore = createFileStore(otherFile);

    await sessionsStore.writeData([{ id: 'session-1' }]);
    await themesStore.writeData([{ id: 'theme-1' }]);

    assert.deepEqual(await sessionsStore.readData(), [{ id: 'session-1' }]);
    assert.deepEqual(await themesStore.readData(), [{ id: 'theme-1' }]);
  });
});
