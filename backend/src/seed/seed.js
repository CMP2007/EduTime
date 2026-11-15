import { addDays, createId, todayString } from '../utils/date.js';
import { isSameThemeName } from 'domain-themes';
import { validateThemeName } from '../themes/themes.validation.js';
import { validateSessionInput } from '../sessions/sessions.validation.js';

/**
 * Datos de ejemplo que solo se cargan si el usuario los acepta y la aplicación
 * está vacía. Sirven para ver la app funcionando: racha, meta diaria y heatmap.
 */
const SEED_ENTRIES = [
  { daysAgo: 0, theme: 'JavaScript', hours: 2, minutes: 0, notes: 'Repaso de closures y promesas.' },
  { daysAgo: 0, theme: 'CSS', hours: 0, minutes: 45, notes: '' },
  { daysAgo: 1, theme: 'Matemáticas', hours: 3, minutes: 30, notes: 'Ejercicios de derivadas.' },
  { daysAgo: 2, theme: 'Inglés', hours: 2, minutes: 0, notes: '' },
  { daysAgo: 2, theme: 'Historia', hours: 1, minutes: 0, notes: 'Resumen del tema 4.' },
  { daysAgo: 3, theme: 'Física', hours: 1, minutes: 30, notes: '' },
  { daysAgo: 4, theme: 'Química', hours: 3, minutes: 0, notes: 'Formulación orgánica.' },
  { daysAgo: 6, theme: 'Programación', hours: 4, minutes: 0, notes: 'Proyecto de práctica.' },
  { daysAgo: 7, theme: 'Redes', hours: 2, minutes: 0, notes: '' },
  { daysAgo: 9, theme: 'Álgebra', hours: 3, minutes: 15, notes: 'Matrices y determinantes.' },
  { daysAgo: 12, theme: 'Cálculo', hours: 2, minutes: 30, notes: '' },
];

/**
 * Construye la semilla validando cada temática y cada clase con las mismas
 * reglas que la API. Devuelve `{ themes, sessions }`; las clases referencian
 * sus temáticas por `themeId` y comparten una única temática por nombre
 * normalizado.
 *
 * `entries` es un punto de inyección para los tests.
 */
export function buildSeed(entries = SEED_ENTRIES) {
  const now = new Date().toISOString();
  const today = todayString();
  const themes = [];
  const sessions = [];

  for (const entry of entries) {
    const name = validateThemeName(entry.theme);
    let theme = themes.find((candidate) => isSameThemeName(candidate.name, name));

    if (!theme) {
      theme = { id: createId(), name };
      themes.push(theme);
    }

    const data = validateSessionInput({
      themeId: theme.id,
      date: addDays(today, -entry.daysAgo),
      hours: entry.hours,
      minutes: entry.minutes,
      notes: entry.notes,
    });

    sessions.push({
      id: createId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { themes, sessions };
}
