import { ValidationError } from '../errors.js';
import { DURATION_MAX, DURATION_MIN, MINUTES_MAX, NOTES_MAX, TITLE_MAX } from 'domain-constants';
import { isValidDateString } from 'domain-dates';

const HOURS_ERROR = 'Las horas deben ser un número entero mayor o igual que 0.';
const MINUTES_ERROR = 'Los minutos deben ser un número entero mayor o igual que 0.';
const MINUTES_RANGE_ERROR = 'Los minutos deben ser un número entero entre 0 y 59.';
const DURATION_MAX_ERROR = 'La clase no puede superar las 23:59.';

/** Indica si una parte de la duración no viene en la petición. */
export function isDurationPartAbsent(value) {
  return value == null || value === '';
}

/** Lee una parte de la duración: ausente → 0; el resto conserva la coerción numérica. */
function readDurationPart(value) {
  return isDurationPartAbsent(value) ? 0 : Number(value);
}

/** Valida y convierte los campos hours/minutes en minutos totales. */
function parseDuration(payload) {
  const hours = readDurationPart(payload.hours);
  const minutes = readDurationPart(payload.minutes);

  if (!Number.isInteger(hours) || hours < 0) {
    throw new ValidationError(HOURS_ERROR);
  }
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw new ValidationError(MINUTES_ERROR);
  }

  const durationMinutes = hours * 60 + minutes;
  if (durationMinutes > DURATION_MAX) {
    throw new ValidationError(DURATION_MAX_ERROR);
  }
  if (minutes > MINUTES_MAX) {
    throw new ValidationError(MINUTES_RANGE_ERROR);
  }
  if (durationMinutes < DURATION_MIN) {
    throw new ValidationError(`La clase debe durar al menos ${DURATION_MIN} minutos.`);
  }
  return durationMinutes;
}

/**
 * Valida y normaliza los campos de una sesión.
 * Es la única fuente de verdad para las reglas de alta y edición, y también
 * se usa al construir la semilla para que toda sesión persistida las cumpla.
 */
export function validateSessionInput(payload) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  if (!title) throw new ValidationError('La temática es obligatoria.');
  if (title.length > TITLE_MAX) {
    throw new ValidationError(`La temática no puede superar ${TITLE_MAX} caracteres.`);
  }

  const date = typeof payload.date === 'string' ? payload.date : '';
  if (!isValidDateString(date)) {
    throw new ValidationError('La fecha no es válida.');
  }

  const durationMinutes = parseDuration(payload);

  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : '';
  if (notes.length > NOTES_MAX) {
    throw new ValidationError(`Las observaciones no pueden superar ${NOTES_MAX} caracteres.`);
  }

  return { title, date, durationMinutes, notes };
}
