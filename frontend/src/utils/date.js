const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

export function fromDateString(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateLong(value) {
  if (!value) return '';
  const date = fromDateString(value);
  const weekday = WEEKDAYS[(date.getDay() + 6) % 7];
  return `${weekday} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateShort(value) {
  if (!value) return '';
  const date = fromDateString(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Rango de fechas legible: "5–11 oct" o "29 sep – 4 oct". */
export function formatDateRange(fromValue, toValue) {
  if (!fromValue || !toValue) return '';
  const from = fromDateString(fromValue);
  const to = fromDateString(toValue);
  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();

  if (sameMonth) {
    return `${from.getDate()}–${to.getDate()} ${MONTHS[from.getMonth()]}`;
  }
  if (sameYear) {
    return `${from.getDate()} ${MONTHS[from.getMonth()]} – ${to.getDate()} ${MONTHS[to.getMonth()]}`;
  }
  return `${from.getDate()} ${MONTHS[from.getMonth()]} ${from.getFullYear()} – ${to.getDate()} ${
    MONTHS[to.getMonth()]
  } ${to.getFullYear()}`;
}

/** Nombre del mes a partir de una clave "YYYY-MM". */
export function monthNameFromKey(key) {
  if (!key) return '';
  return MONTHS_LONG[Number(key.slice(5, 7)) - 1] ?? '';
}

/** Índice del día de la semana con lunes = 0. */
export function weekdayIndex(value) {
  return (fromDateString(value).getDay() + 6) % 7;
}
