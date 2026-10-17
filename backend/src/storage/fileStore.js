import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(currentDir, '..', '..', 'data');
const dataFile = join(dataDir, 'sessions.json');

/**
 * Lee el archivo de datos.
 * - No existe (`ENOENT`): `null` (primer arranque; el semilla decide).
 * - Contiene un array JSON válido: ese array.
 * - Cualquier otra cosa (vacío, JSON inválido, no-array): lanza error.
 *   Un contenido que no entendemos nunca se sobrescribe.
 */
export async function readData(file = dataFile) {
  let raw;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`El archivo de datos está corrupto (JSON inválido): ${file}. No se sobrescribe para no perder datos.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`El archivo de datos no contiene un array de sesiones: ${file}`);
  }
  return parsed;
}

/** Escribe el archivo de datos de forma atómica (tmp + rename). */
export async function writeData(data, file = dataFile) {
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(temporaryFile, JSON.stringify(data, null, 2), 'utf8');
  try {
    await rename(temporaryFile, file);
  } catch (error) {
    await unlink(temporaryFile).catch(() => {});
    throw error;
  }
}
