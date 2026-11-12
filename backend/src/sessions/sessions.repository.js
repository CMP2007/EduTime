import { createFileStore, sessionsFile } from '../storage/fileStore.js';
import { buildSeed } from './seed.js';

const defaultStore = createFileStore(sessionsFile);

/**
 * Crea un repositorio con su propia caché, su lectura única (single-flight)
 * y su cola de escrituras. `store` es el punto de inyección: los tests
 * simulan el almacenamiento sin tocar el disco.
 */
export function createSessionsRepository(store = defaultStore) {
  let cache = null;
  let loadPromise = null;
  let writeChain = Promise.resolve();

  // Single-flight: todas las llamadas comparten la misma lectura mientras está en vuelo.
  const load = () => {
    if (cache) return Promise.resolve(cache);
    if (!loadPromise) {
      loadPromise = store.readData()
        .then(async (stored) => {
          if (stored === null) {
            const seeded = buildSeed();
            await store.writeData(seeded);
            cache = seeded;
          } else {
            cache = stored;
          }
          return cache;
        })
        .catch((error) => {
          loadPromise = null; // no envenenar: el siguiente intento reintentará la lectura
          throw error;
        });
    }
    return loadPromise;
  };

  // Cola de escrituras: nunca dos escrituras solapadas en disco.
  const persist = () => {
    writeChain = writeChain.then(
      () => store.writeData(cache),
      () => store.writeData(cache), // si la anterior falló, esta se lanza igualmente
    );
    return writeChain;
  };

  /** Devuelve una copia profunda para no compartir estructuras con el estado interno. */
  const clone = (session) => structuredClone(session);

  return {
    async findAll() {
      const list = await load();
      return list.map(clone);
    },

    async findById(id) {
      const list = await load();
      const found = list.find((session) => session.id === id);
      return found ? clone(found) : null;
    },

    async insert(session) {
      const list = await load();
      const stored = clone(session);
      list.push(stored);
      await persist();
      return clone(stored);
    },

    async update(id, changes) {
      const list = await load();
      const index = list.findIndex((session) => session.id === id);
      if (index === -1) return null;

      const current = list[index];
      const stored = clone({
        ...current,
        ...changes,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      });
      list[index] = stored;
      await persist();
      return clone(stored);
    },

    async remove(id) {
      const list = await load();
      const index = list.findIndex((session) => session.id === id);
      if (index === -1) return false;

      list.splice(index, 1);
      await persist();
      return true;
    },
  };
}

export const sessionsRepository = createSessionsRepository();
