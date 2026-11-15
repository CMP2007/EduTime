import { THEME_NAME_MAX } from 'domain-constants';
import { isSameThemeName } from 'domain-themes';
import { ValidationError } from '../errors.js';

/**
 * Valida y normaliza el nombre de una temática: obligatorio, recortado y de
 * 1 a `THEME_NAME_MAX` caracteres. Devuelve el nombre tal como lo escribió el
 * usuario (sin cambiar mayúsculas ni tildes).
 *
 * @param {unknown} value
 * @returns {string}
 */
export function validateThemeName(value) {
  const name = typeof value === 'string' ? value.trim() : '';

  if (!name) {
    throw new ValidationError('El nombre de la temática es obligatorio.');
  }
  if (name.length > THEME_NAME_MAX) {
    throw new ValidationError(
      `El nombre de la temática no puede superar ${THEME_NAME_MAX} caracteres.`,
    );
  }

  return name;
}

/**
 * Comprueba que ninguna otra temática use ya ese nombre (sin distinguir
 * mayúsculas ni tildes). `excludeId` permite renombrar una temática sin que
 * choque consigo misma.
 *
 * @param {string} name
 * @param {{ id: string, name: string }[]} themes
 * @param {{ excludeId?: string }} [options]
 * @returns {void}
 */
export function assertThemeNameAvailable(name, themes, { excludeId } = {}) {
  const duplicated = themes.some(
    (theme) => theme.id !== excludeId && isSameThemeName(theme.name, name),
  );

  if (duplicated) {
    throw new ValidationError('Ya existe una temática con ese nombre.');
  }
}
