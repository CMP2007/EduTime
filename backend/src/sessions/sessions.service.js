import { ValidationError } from '../errors.js';
import { createId } from '../utils/date.js';
import { sessionsRepository } from './sessions.repository.js';
import { DURATION_MAX, DURATION_MIN, MINUTES_MAX, NOTES_MAX, TITLE_MAX } from 'domain-constants';
import { isValidDateString, compareDateStrings } from 'domain-dates';

const HOURS_ERROR = 'Las horas deben ser un número entero mayor o igual que 0.';
const MINUTES_ERROR = 'Los minutos deben ser un número entero mayor o igual que 0.';
const MINUTES_RANGE_ERROR = 'Los minutos deben ser un número entero entre 0 y 59.';
const DURATION_MAX_ERROR = 'La clase no puede superar las 23:59.';

/** Indica si una parte de la duración no viene en la petición. */
function isDurationPartAbsent(value) {
  return value == null || value === '';
}

/** Lee una parte de la duración: ausente → 0; el resto conserva la coerción numérica. */
function readDurationPart(value) {
  return isDurationPartAbsent(value) ? 0 : Number(value);
}

/** Ajusta una duración guardada al límite válido más cercano. */
function clampDuration(value) {
  if (value < DURATION_MIN) return DURATION_MIN;
  if (value > DURATION_MAX) return DURATION_MAX;
  return value;
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

function validate(payload) {
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

function normalizeFilter(value, fieldName) {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new ValidationError(`El filtro «${fieldName}» no es una fecha válida.`);
  }
  if (!isValidDateString(value)) {
    throw new ValidationError(`El filtro «${fieldName}» no es una fecha válida.`);
  }
  return value;
}

function matchesFilters(session, { from, to, q }) {
  if (from && compareDateStrings(session.date, from) < 0) return false;
  if (to && compareDateStrings(session.date, to) > 0) return false;
  if (q) {
    const needle = q.toLowerCase();
    const haystack = `${session.title} ${session.notes}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export const sessionsService = {
  async list(filters = {}) {
    const { from, to, q } = filters;
    const normalizedFrom = normalizeFilter(from, 'desde');
    const normalizedTo = normalizeFilter(to, 'hasta');
    if (normalizedFrom && normalizedTo && compareDateStrings(normalizedFrom, normalizedTo) > 0) {
      throw new ValidationError('El rango de fechas está invertido: «desde» es posterior a «hasta».');
    }

    const sessions = await sessionsRepository.findAll();
    return sessions
      .filter((session) => matchesFilters(session, { from: normalizedFrom, to: normalizedTo, q }))
      .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
  },

  async create(payload) {
    const data = validate(payload);
    const now = new Date().toISOString();
    const session = {
      id: createId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    return sessionsRepository.insert(session);
  },

  async update(id, payload) {
    const existing = await sessionsRepository.findById(id);
    if (!existing) return null;

    const hoursAbsent = isDurationPartAbsent(payload.hours);
    const minutesAbsent = isDurationPartAbsent(payload.minutes);

    const input = {
      title: payload.title ?? existing.title,
      date: payload.date !== undefined ? payload.date : existing.date,
      notes: payload.notes ?? existing.notes,
      hours: hoursAbsent ? undefined : payload.hours,
      minutes: minutesAbsent ? undefined : payload.minutes,
    };

    if (hoursAbsent && minutesAbsent) {
      const duration = clampDuration(existing.durationMinutes);
      input.hours = Math.floor(duration / 60);
      input.minutes = duration % 60;
    }

    const data = validate(input);
    return sessionsRepository.update(id, data);
  },

  async remove(id) {
    return sessionsRepository.remove(id);
  },
};
