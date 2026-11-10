export const DATE_YEAR_MIN = 1990;
export const DATE_YEAR_MAX = 9999;
export const DATE_MIN = '1990-01-01';
export const DATE_MAX = '9999-12-31';
export const MAX_RANGE_DAYS = 4000;
export const RANGE_CLAMP_NOTICE =
  'El rango solicitado se ha recortado a los límites admitidos (1990-01-01 – 9999-12-31).';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Valida que una cadena sea una fecha real en formato YYYY-MM-DD con año
 * entre DATE_YEAR_MIN y DATE_YEAR_MAX.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidDateString = (value) => {
  if (typeof value !== 'string') return false;

  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < DATE_YEAR_MIN || year > DATE_YEAR_MAX) return false;
  if (month < 1 || month > 12) return false;

  // Date.UTC normaliza fechas imposibles (2026-02-31 → 2026-03-03); si al
  // reconstruir la fecha cambia algún componente, el día no existe.
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const toDateTuple = (dateString) => dateString.split('-').map(Number);

/**
 * Compara dos fechas por tupla numérica (año, mes, día).
 * Acepta años de 4 y 5 cifras porque los rangos derivados pueden producir
 * valores como `10000-01-02` o `1989-12-31`.
 *
 * @param {string} dateA
 * @param {string} dateB
 * @returns {number} negativo si A < B, 0 si son iguales, positivo si A > B
 */
export const compareDateStrings = (dateA, dateB) => {
  const [yearA, monthA, dayA] = toDateTuple(dateA);
  const [yearB, monthB, dayB] = toDateTuple(dateB);

  if (yearA !== yearB) return yearA - yearB;
  if (monthA !== monthB) return monthA - monthB;
  return dayA - dayB;
};

/**
 * Recorta un rango derivado a los límites admitidos.
 * No valida entradas de usuario: solo se usa con rangos ya calculados.
 *
 * @param {string} from
 * @param {string} to
 * @returns {{ from: string, to: string, clamped: boolean }}
 */
export const clampDateRange = (from, to) => {
  const nextFrom = compareDateStrings(from, DATE_MIN) < 0 ? DATE_MIN : from;
  const nextTo = compareDateStrings(to, DATE_MAX) > 0 ? DATE_MAX : to;

  return {
    from: nextFrom,
    to: nextTo,
    clamped: nextFrom !== from || nextTo !== to,
  };
};
