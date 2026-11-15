import { compareThemeNames } from 'domain-themes';
import { ValidationError } from '../errors.js';
import { createId } from '../utils/date.js';
import { sessionsRepository } from '../sessions/sessions.repository.js';
import { themesRepository } from './themes.repository.js';
import { assertThemeNameAvailable, validateThemeName } from './themes.validation.js';

const REASSIGN_ERROR = 'Elige una temática de destino para reasignar las clases.';
const SAME_TARGET_ERROR = 'La temática de destino debe ser distinta de la que se elimina.';
const MISSING_TARGET_ERROR = 'La temática de destino no existe.';
const STRATEGY_ERROR =
  'Elige qué hacer con las clases: reasignarlas a otra temática o eliminarlas junto con la temática.';

/** Convierte una temática guardada en la vista pública con su número de clases. */
function toView(theme, sessionCount) {
  return { id: theme.id, name: theme.name, sessionCount };
}

/** Cuenta las clases por temática en una sola pasada. */
function countByTheme(sessions) {
  const counts = new Map();

  for (const session of sessions) {
    counts.set(session.themeId, (counts.get(session.themeId) ?? 0) + 1);
  }

  return counts;
}

export const themesService = {
  async list() {
    const [themes, sessions] = await Promise.all([
      themesRepository.findAll(),
      sessionsRepository.findAll(),
    ]);
    const counts = countByTheme(sessions);

    return themes
      .map((theme) => toView(theme, counts.get(theme.id) ?? 0))
      .sort((a, b) => compareThemeNames(a.name, b.name));
  },

  async create({ name } = {}) {
    const cleanName = validateThemeName(name);
    const themes = await themesRepository.findAll();
    assertThemeNameAvailable(cleanName, themes);

    const created = await themesRepository.insert({ id: createId(), name: cleanName });
    return toView(created, 0);
  },

  async rename(id, { name } = {}) {
    const themes = await themesRepository.findAll();
    const current = themes.find((theme) => theme.id === id);
    if (!current) return null;

    const cleanName = validateThemeName(name);
    const sessionCount = await sessionsRepository.countByThemeId(id);

    // Mismo texto exacto: se acepta sin escribir.
    if (cleanName === current.name) {
      return toView(current, sessionCount);
    }

    assertThemeNameAvailable(cleanName, themes, { excludeId: id });

    const updated = await themesRepository.update(id, { name: cleanName });
    return toView(updated, sessionCount);
  },

  async remove(id, { strategy, targetThemeId } = {}) {
    const themes = await themesRepository.findAll();
    const current = themes.find((theme) => theme.id === id);
    if (!current) return false;

    const sessionCount = await sessionsRepository.countByThemeId(id);

    if (sessionCount === 0) {
      await themesRepository.remove(id);
      return true;
    }

    if (strategy === 'reassign') {
      if (!targetThemeId) throw new ValidationError(REASSIGN_ERROR);
      if (targetThemeId === id) throw new ValidationError(SAME_TARGET_ERROR);
      if (!themes.some((theme) => theme.id === targetThemeId)) {
        throw new ValidationError(MISSING_TARGET_ERROR);
      }

      await sessionsRepository.reassignTheme(id, targetThemeId);
      await themesRepository.remove(id);
      return true;
    }

    if (strategy === 'delete') {
      await sessionsRepository.removeByThemeId(id);
      await themesRepository.remove(id);
      return true;
    }

    throw new ValidationError(STRATEGY_ERROR);
  },
};
