import { randomUUID } from 'node:crypto';
import { PERIODS } from 'domain-constants';

export { PERIODS };

/** Utilidades de fecha compartidas por el resto del backend. */

export function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateString(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function todayString() {
  return toDateString(new Date());
}

export function addDays(value, amount) {
  const date = fromDateString(value);
  date.setDate(date.getDate() + amount);
  return toDateString(date);
}

export function addMonths(value, amount) {
  const date = fromDateString(value);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + amount);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toDateString(date);
}

export function startOfWeek(value) {
  const date = fromDateString(value);
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return toDateString(date);
}

export function endOfWeek(value) {
  return addDays(startOfWeek(value), 6);
}

export function startOfMonth(value) {
  const date = fromDateString(value);
  date.setDate(1);
  return toDateString(date);
}

export function endOfMonth(value) {
  const date = fromDateString(value);
  date.setMonth(date.getMonth() + 1, 0);
  return toDateString(date);
}

export function enumerateDays(from, to) {
  const days = [];
  let cursor = from;
  let guard = 0;
  while (cursor <= to && guard < 4000) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return days;
}

export function isValidPeriod(period) {
  return PERIODS.includes(period);
}

/** Devuelve el rango { from, to, label } de un periodo respecto a una fecha. */
export function getRange(period = 'week', reference) {
  const date = reference || todayString();

  switch (period) {
    case 'day':
      return { key: 'day', label: 'Día', from: date, to: date };
    case 'month':
      return { key: 'month', label: 'Mes', from: startOfMonth(date), to: endOfMonth(date) };
    case '3m':
      return { key: '3m', label: 'Últimos 3 meses', from: addMonths(date, -3), to: date };
    case '6m':
      return { key: '6m', label: 'Últimos 6 meses', from: addMonths(date, -6), to: date };
    case '12m':
      return { key: '12m', label: 'Últimos 12 meses', from: addMonths(date, -12), to: date };
    case 'year': {
      const year = fromDateString(date).getFullYear();
      return { key: 'year', label: `Año ${year}`, from: `${year}-01-01`, to: `${year}-12-31` };
    }
    case 'week':
      return { key: 'week', label: 'Semana', from: startOfWeek(date), to: endOfWeek(date) };
    default:
      throw new RangeError(`Periodo no válido: ${period}`);
  }
}

/** Genera el id de una nueva sesión/clase. */
export function createId() {
  return randomUUID();
}
