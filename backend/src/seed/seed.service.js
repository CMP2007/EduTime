import { isSameThemeName } from 'domain-themes';
import { ConflictError } from '../errors.js';
import { sessionsRepository } from '../sessions/sessions.repository.js';
import { themesRepository } from '../themes/themes.repository.js';
import { buildSeed } from './seed.js';

/**
 * Aplica los datos de ejemplo solo si no hay ninguna clase.
 *
 * Reutiliza las temáticas existentes por nombre normalizado y crea únicamente
 * las que faltan. Escribe primero las temáticas y después las clases, una sola
 * escritura por repositorio: si falla la segunda, no quedan clases a medias y
 * el reintento reutiliza las temáticas ya escritas.
 */
export const seedService = {
  async apply() {
    const [existingSessions, existingThemes] = await Promise.all([
      sessionsRepository.findAll(),
      themesRepository.findAll(),
    ]);

    if (existingSessions.length > 0) {
      throw new ConflictError('Ya hay clases registradas; no se cargan datos de ejemplo.');
    }

    const seed = buildSeed();
    const newThemes = [];
    const themeIdBySeedId = new Map();

    for (const seedTheme of seed.themes) {
      const existing = existingThemes.find((theme) => isSameThemeName(theme.name, seedTheme.name));

      if (existing) {
        themeIdBySeedId.set(seedTheme.id, existing.id);
        continue;
      }

      newThemes.push(seedTheme);
      themeIdBySeedId.set(seedTheme.id, seedTheme.id);
    }

    const sessions = seed.sessions.map((session) => ({
      ...session,
      themeId: themeIdBySeedId.get(session.themeId),
    }));

    if (newThemes.length > 0) {
      await themesRepository.insertMany(newThemes);
    }
    await sessionsRepository.insertMany(sessions);

    return { themes: newThemes, sessions };
  },
};
