import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { readData, writeData } from '../src/storage/fileStore.js';

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

describe('fileStore.readData', () => {
  it('devuelve null si el archivo no existe (primer arranque)', async () => {
    assert.equal(await readData(dataFile), null);
  });

  it('devuelve el array si el contenido es un array JSON válido', async () => {
    const stored = [{ id: 'a', title: 'JavaScript' }];
    await writeFile(dataFile, JSON.stringify(stored), 'utf8');

    assert.deepEqual(await readData(dataFile), stored);
  });

  it('lanza error si el JSON está corrupto y deja el archivo intacto', async () => {
    const corrupt = '[{"id": "a", "title": "Java';
    await writeFile(dataFile, corrupt, 'utf8');

    await assert.rejects(() => readData(dataFile), /corrupto/);
    assert.equal(await readFile(dataFile, 'utf8'), corrupt);
  });

  it('lanza error si el archivo está vacío (existe, así que no es un primer arranque)', async () => {
    await writeFile(dataFile, '', 'utf8');

    await assert.rejects(() => readData(dataFile), /corrupto/);
  });

  it('lanza error si el contenido no es un array', async () => {
    await writeFile(dataFile, JSON.stringify({ title: 'no soy un array' }), 'utf8');

    await assert.rejects(() => readData(dataFile), /no contiene un array/);
  });

  it('propaga los errores de disco que no sean ENOENT', async () => {
    await assert.rejects(() => readData(directory));
  });
});

describe('fileStore.writeData', () => {
  it('escribe el array y lo deja legible para readData', async () => {
    const sessions = [{ id: 'a', title: 'JavaScript' }];

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
