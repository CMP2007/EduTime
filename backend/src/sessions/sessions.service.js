import { ValidationError } from '../errors.js';
import { createId } from '../utils/date.js';
import { sessionsRepository } from './sessions.repository.js';
import { DURATION_MAX, DURATION_MIN, HOURS_MAX, MINUTES_MAX, NOTES_MAX, TITLE_MAX } from 'domain-constants';
import { isValidDateString, compareDateStrings } from 'domain-dates';

/** Valida y convierte los campos hours/minutes en minutos totales. */
function parseDuration(payload) {
  const hours = Number(payload.hours);
  const minutes = Number(payload.minutes);

  if (!Number.isInteger(hours) || hours < 0 || hours > HOURS_MAX) {
    throw new ValidationError('Las horas deben ser un número entre 0 y 23.');
  }
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > MINUTES_MAX) {
    throw new ValidationError('Los minutos deben ser un número entre 0 y 59.');
  }

  const durationMinutes = hours * 60 + minutes;
  if (durationMinutes < DURATION_MIN) {
    throw new ValidationError(`La clase debe durar al menos ${DURATION_MIN} minutos.`);
  }
  if (durationMinutes > DURATION_MAX) {
    throw new ValidationError('La clase no puede superar las 23 horas.');
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

    const input = {
      title: payload.title ?? existing.title,
      date: payload.date !== undefined ? payload.date : existing.date,
      notes: payload.notes ?? existing.notes,
      hours: payload.hours,
      minutes: payload.minutes,
    };

    if (input.hours === undefined && input.minutes === undefined) {
      input.hours = Math.floor(existing.durationMinutes / 60);
      input.minutes = existing.durationMinutes % 60;
    }

    const data = validate(input);
    return sessionsRepository.update(id, data);
  },

  async remove(id) {
    return sessionsRepository.remove(id);
  },
};
