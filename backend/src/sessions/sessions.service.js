import { ValidationError } from '../errors.js';
import { createId } from '../utils/date.js';
import { sessionsRepository } from './sessions.repository.js';

const TITLE_MAX = 80;
const NOTES_MAX = 500;
const HOURS_MAX = 23;
const MINUTES_MAX = 59;
const DURATION_MIN = 15;
const DURATION_MAX = HOURS_MAX * 60 + MINUTES_MAX;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

  const date = typeof payload.date === 'string' ? payload.date.trim() : '';
  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00`))) {
    throw new ValidationError('La fecha no es válida.');
  }

  const durationMinutes = parseDuration(payload);

  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : '';
  if (notes.length > NOTES_MAX) {
    throw new ValidationError(`Las observaciones no pueden superar ${NOTES_MAX} caracteres.`);
  }

  return { title, date, durationMinutes, notes };
}

function matchesFilters(session, { from, to, q }) {
  if (from && session.date < from) return false;
  if (to && session.date > to) return false;
  if (q) {
    const needle = q.toLowerCase();
    const haystack = `${session.title} ${session.notes}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export const sessionsService = {
  async list(filters = {}) {
    const sessions = await sessionsRepository.findAll();
    return sessions
      .filter((session) => matchesFilters(session, filters))
      .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
  },

  async getById(id) {
    return sessionsRepository.findById(id);
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
      date: payload.date ?? existing.date,
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
