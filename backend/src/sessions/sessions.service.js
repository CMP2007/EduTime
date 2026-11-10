import { ValidationError } from '../errors.js';
import { createId } from '../utils/date.js';
import { sessionsRepository } from './sessions.repository.js';
import { DURATION_MAX, DURATION_MIN } from 'domain-constants';
import { isValidDateString, compareDateStrings } from 'domain-dates';
import { isDurationPartAbsent, validateSessionInput } from './sessions.validation.js';

/** Ajusta una duración guardada al límite válido más cercano. */
function clampDuration(value) {
  if (value < DURATION_MIN) return DURATION_MIN;
  if (value > DURATION_MAX) return DURATION_MAX;
  return value;
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
    const data = validateSessionInput(payload);
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

    const data = validateSessionInput(input);
    return sessionsRepository.update(id, data);
  },

  async remove(id) {
    return sessionsRepository.remove(id);
  },
};
