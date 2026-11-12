import { createFileStore, themesFile } from '../storage/fileStore.js';

const defaultStore = createFileStore(themesFile);

/**
 * Crea un repositorio de temáticas con su propia caché, su lectura única
 * (single-flight) y su cola de escrituras. `store` es el punto de inyección:
 * los tests simulan el almacenamiento sin tocar el disco. No siembra: un
 * catálogo vacío es un estado válido.
 */
export function createThemesRepository(store = defaultStore) {
  let cache = null;
  let loadPromise = null;
  let writeChain = Promise.resolve();

  // Single-flight: todas las llamadas comparten la misma lectura mientras está en vuelo.
  const load = () => {
    if (cache) return Promise.resolve(cache);
    if (!loadPromise) {
      loadPromise = store.readData()
        .then((stored) => {
          cache = stored ?? [];
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
  const clone = (theme) => structuredClone(theme);

  return {
    async findAll() {
      const list = await load();
      return list.map(clone);
    },

    async findById(id) {
      const list = await load();
      const found = list.find((theme) => theme.id === id);
      return found ? clone(found) : null;
    },

    async insert(theme) {
      const list = await load();
      const stored = clone(theme);
      list.push(stored);
      await persist();
      return clone(stored);
    },

    async update(id, changes) {
      const list = await load();
      const index = list.findIndex((theme) => theme.id === id);
      if (index === -1) return null;

      const current = list[index];
      const stored = clone({
        ...current,
        ...changes,
        id: current.id,
      });
      list[index] = stored;
      await persist();
      return clone(stored);
    },

    async remove(id) {
      const list = await load();
      const index = list.findIndex((theme) => theme.id === id);
      if (index === -1) return false;

      list.splice(index, 1);
      await persist();
      return true;
    },
  };
}

export const themesRepository = createThemesRepository();
