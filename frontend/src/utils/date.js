const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
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

/** Índice del día de la semana con lunes = 0. */
export function weekdayIndex(value) {
  return (fromDateString(value).getDay() + 6) % 7;
}
