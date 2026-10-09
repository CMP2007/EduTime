import { readData, writeData } from '../storage/fileStore.js';
import { buildSeed } from './seed.js';

let cache = null;

async function load() {
  if (cache) return cache;

  const stored = await readData();
  if (stored === null) {
    cache = buildSeed();
    await writeData(cache);
  } else {
    cache = stored;
  }
  return cache;
}

async function persist() {
  await writeData(cache);
}

/** Devuelve una copia para no exponer el estado interno. */
function clone(session) {
  return { ...session };
}

export const sessionsRepository = {
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
    list.push({ ...session });
    await persist();
    return clone(session);
  },

  async update(id, changes) {
    const list = await load();
    const index = list.findIndex((session) => session.id === id);
    if (index === -1) return null;

    const current = list[index];
    const updated = {
      ...current,
      ...changes,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    await persist();
    return clone(updated);
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
