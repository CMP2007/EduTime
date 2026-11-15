import { createFileStore, sessionsFile, themesFile } from '../storage/fileStore.js';
import { validateThemeName } from '../themes/themes.validation.js';

const OLD_FORMAT_HINT =
  'Los datos actuales son de muestra: borra backend/data/ y vuelve a arrancar.';

/**
 * Comprueba la integridad de los datos almacenados antes de abrir el puerto.
 *
 * No escribe nada y no migra: si encuentra una clase con el campo antiguo
 * `title`, una clase sin `themeId` o una referencia a una temática inexistente,
 * falla con un mensaje explícito. La recuperación es manual (borrar los datos
 * de muestra). Un arranque sin archivos es válido y deja la aplicación vacía.
 *
 * @param {{
 *   sessionsStore?: { readData: () => Promise<unknown> },
 *   themesStore?: { readData: () => Promise<unknown> },
 * }} [stores]
 * @returns {Promise<void>}
 */
export async function validateStoredData({
  sessionsStore = createFileStore(sessionsFile),
  themesStore = createFileStore(themesFile),
} = {}) {
  const [storedSessions, storedThemes] = await Promise.all([
    sessionsStore.readData(),
    themesStore.readData(),
  ]);

  const sessions = storedSessions ?? [];
  const themes = storedThemes ?? [];
  const themeIds = new Set();

  for (const theme of themes) {
    if (!theme || typeof theme !== 'object' || !theme.id || themeIds.has(theme.id)) {
      throw new Error(
        `El catálogo contiene una temática sin identificador o repetida (${theme?.id}).`,
      );
    }

    try {
      validateThemeName(theme.name);
    } catch (error) {
      throw new Error(
        `La temática ${theme.id} no tiene un nombre válido: ${error.message}`,
        { cause: error },
      );
    }

    themeIds.add(theme.id);
  }

  for (const session of sessions) {
    if (session && typeof session === 'object' && 'title' in session) {
      throw new Error(
        `La clase ${session.id} usa el formato antiguo de temática. ${OLD_FORMAT_HINT}`,
      );
    }
    if (!session || typeof session !== 'object' || !session.themeId || !themeIds.has(session.themeId)) {
      throw new Error(
        `La clase ${session?.id} no tiene una temática válida. ${OLD_FORMAT_HINT}`,
      );
    }
  }
}
