/**
 * Reglas compartidas de las temáticas: normalización de nombres y orden alfabético.
 *
 * La comparación no distingue mayúsculas, minúsculas ni tildes, pero conserva la
 * `ñ`: «año» y «ano» son temáticas distintas. El nombre visible nunca se normaliza;
 * solo se normaliza para comparar.
 */

const DIACRITICS = /[áéíóúü]/g;

const DIACRITIC_REPLACEMENTS = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ü: 'u',
};

const baseCollator = new Intl.Collator('es', { sensitivity: 'base' });

/**
 * Normaliza un nombre para compararlo: recorta extremos, pasa a minúsculas en
 * español y quita tildes de vocales y diéresis. Conserva la `ñ`.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeThemeName(value) {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .toLocaleLowerCase('es')
    .replace(DIACRITICS, (character) => DIACRITIC_REPLACEMENTS[character]);
}

/**
 * Indica si dos nombres corresponden a la misma temática.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function isSameThemeName(a, b) {
  return normalizeThemeName(a) === normalizeThemeName(b);
}

/**
 * Ordena nombres alfabéticamente en español. Si dos nombres empatan sin
 * distinguir mayúsculas ni tildes, desempata por el texto original.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareThemeNames(a, b) {
  const base = baseCollator.compare(a, b);
  if (base !== 0) return base;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
