import { ValidationError } from '../errors.js';
import { createId } from '../utils/date.js';
import { sessionsRepository } from './sessions.repository.js';
import { themesRepository } from '../themes/themes.repository.js';
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

/** Acepta una única temática no vacía; un array (parámetro repetido) es un 400. */
function normalizeThemeFilter(value) {
  if (value === undefined || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new ValidationError('El filtro «temática» no es válido.');
  }

  const themeId = value.trim();
  if (!themeId) {
    throw new ValidationError('El filtro «temática» no es válido.');
  }
  return themeId;
}

function matchesFilters(session, { from, to, q, themeId }) {
  if (from && compareDateStrings(session.date, from) < 0) return false;
  if (to && compareDateStrings(session.date, to) > 0) return false;
  if (themeId && session.themeId !== themeId) return false;
  if (q) {
    const needle = q.toLowerCase();
    if (!session.notes.toLowerCase().includes(needle)) return false;
  }
  return true;
}

/** Añade `themeName` a cada clase; falla si una referencia una temática inexistente. */
function resolveThemeNames(sessions, themes) {
  const names = new Map(themes.map((theme) => [theme.id, theme.name]));

  return sessions.map((session) => {
    const themeName = names.get(session.themeId);
    if (themeName === undefined) {
      throw new Error(`La clase ${session.id} referencia una temática inexistente.`);
    }
    return { ...session, themeName };
  });
}

/** Comprueba que la temática existe y devuelve su nombre visible. */
async function requireThemeName(themeId) {
  const theme = await themesRepository.findById(themeId);
  if (!theme) {
    throw new ValidationError('La temática seleccionada no existe.');
  }
  return theme.name;
}

export const sessionsService = {
  async list(filters = {}) {
    const { from, to, q } = filters;
    const normalizedFrom = normalizeFilter(from, 'desde');
    const normalizedTo = normalizeFilter(to, 'hasta');
    const themeId = normalizeThemeFilter(filters.themeId);
    if (normalizedFrom && normalizedTo && compareDateStrings(normalizedFrom, normalizedTo) > 0) {
      throw new ValidationError('El rango de fechas está invertido: «desde» es posterior a «hasta».');
    }

    const [sessions, themes] = await Promise.all([
      sessionsRepository.findAll(),
      themesRepository.findAll(),
    ]);

    return resolveThemeNames(sessions, themes)
      .filter((session) =>
        matchesFilters(session, { from: normalizedFrom, to: normalizedTo, q, themeId }),
      )
      .sort((a, b) =>
        a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date),
      );
  },

  async create(payload) {
    const data = validateSessionInput(payload);
    const themeName = await requireThemeName(data.themeId);

    const now = new Date().toISOString();
    const session = {
      id: createId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const created = await sessionsRepository.insert(session);
    return { ...created, themeName };
  },

  async update(id, payload) {
    const existing = await sessionsRepository.findById(id);
    if (!existing) return null;

    const hoursAbsent = isDurationPartAbsent(payload.hours);
    const minutesAbsent = isDurationPartAbsent(payload.minutes);

    const input = {
      themeId: payload.themeId ?? existing.themeId,
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
    const themeName = await requireThemeName(data.themeId);

    const updated = await sessionsRepository.update(id, data);
    return { ...updated, themeName };
  },

  async remove(id) {
    return sessionsRepository.remove(id);
  },
};
