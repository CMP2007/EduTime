import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(currentDir, '..', '..', 'data');
const dataFile = join(dataDir, 'sessions.json');

/**
 * Lee el archivo de datos.
 * Devuelve `null` si el archivo aún no existe (primer arranque).
 * Devuelve un arreglo vacío si el archivo está corrupto.
 */
export async function readData() {
  try {
    const raw = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    if (error instanceof SyntaxError) return [];
    throw error;
  }
}

/** Escribe el archivo de datos de forma atómica (tmp + rename). */
export async function writeData(data) {
  await mkdir(dataDir, { recursive: true });
  const temporaryFile = `${dataFile}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(data, null, 2), 'utf8');
  await rename(temporaryFile, dataFile);
}
