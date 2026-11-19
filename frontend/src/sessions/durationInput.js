// @ts-check
import { DURATION_MAX, DURATION_MIN, HOURS_MAX, MINUTES_MAX } from 'domain-constants';

export const HOURS_ERROR = 'Las horas deben ser un número entero mayor o igual que 0.';
export const MINUTES_ERROR = 'Los minutos deben ser un número entero mayor o igual que 0.';
export const MINUTES_RANGE_ERROR = `Los minutos deben ser un número entero entre 0 y ${MINUTES_MAX}.`;
export const DURATION_MAX_ERROR = `La clase no puede superar las ${HOURS_MAX}:${MINUTES_MAX}.`;
export const DURATION_MIN_ERROR = `La clase debe durar al menos ${DURATION_MIN} minutos.`;

const BOTH = ['hours', 'minutes'];

/** Interpreta una parte de la duración: sin contenido o solo espacios → 0. */
function parsePart(value) {
  if (value == null) return 0;
  if (typeof value === 'string' && value.trim() === '') return 0;
  return Number(value);
}

function invalid(message, fields) {
  return { valid: false, error: { message, fields } };
}

/**
 * Valida las horas y los minutos del formulario con las mismas reglas y
 * precedencia que el servidor (RF-1 a RF-6).
 *
 * Devuelve `{ valid: true, hours, minutes, durationMinutes, error: null }` o
 * `{ valid: false, error: { message, fields } }`, donde `fields` nombra los
 * controles afectados por el mensaje.
 */
export function parseDurationInput(hoursInput, minutesInput) {
  const hours = parsePart(hoursInput);
  const minutes = parsePart(minutesInput);

  if (!Number.isInteger(hours) || hours < 0) {
    return invalid(HOURS_ERROR, ['hours']);
  }
  if (!Number.isInteger(minutes) || minutes < 0) {
    return invalid(MINUTES_ERROR, ['minutes']);
  }

  const durationMinutes = hours * 60 + minutes;

  if (durationMinutes > DURATION_MAX) {
    return invalid(DURATION_MAX_ERROR, BOTH);
  }
  if (minutes > MINUTES_MAX) {
    return invalid(MINUTES_RANGE_ERROR, ['minutes']);
  }
  if (durationMinutes < DURATION_MIN) {
    return invalid(DURATION_MIN_ERROR, BOTH);
  }

  return { valid: true, hours, minutes, durationMinutes, error: null };
}
