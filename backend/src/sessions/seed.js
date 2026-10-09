import { addDays, createId, todayString } from '../utils/date.js';

/**
 * Datos de ejemplo que se crean solo la primera vez (si no existe el archivo).
 * Sirven para ver la app funcionando: racha, meta diaria y heatmap.
 */
const SEED_ENTRIES = [
  { daysAgo: 0, title: 'JavaScript', hours: 2, minutes: 0, notes: 'Repaso de closures y promesas.' },
  { daysAgo: 0, title: 'CSS', hours: 0, minutes: 45, notes: '' },
  { daysAgo: 1, title: 'Matemáticas', hours: 3, minutes: 30, notes: 'Ejercicios de derivadas.' },
  { daysAgo: 2, title: 'Inglés', hours: 2, minutes: 0, notes: '' },
  { daysAgo: 2, title: 'Historia', hours: 1, minutes: 0, notes: 'Resumen del tema 4.' },
  { daysAgo: 3, title: 'Física', hours: 1, minutes: 30, notes: '' },
  { daysAgo: 4, title: 'Química', hours: 3, minutes: 0, notes: 'Formulación orgánica.' },
  { daysAgo: 6, title: 'Programación', hours: 4, minutes: 0, notes: 'Proyecto de práctica.' },
  { daysAgo: 7, title: 'Redes', hours: 2, minutes: 0, notes: '' },
  { daysAgo: 9, title: 'Álgebra', hours: 3, minutes: 15, notes: 'Matrices y determinantes.' },
  { daysAgo: 12, title: 'Cálculo', hours: 2, minutes: 30, notes: '' },
];

export function buildSeed() {
  const now = new Date().toISOString();

  return SEED_ENTRIES.map((entry) => ({
    id: createId(),
    title: entry.title,
    date: addDays(todayString(), -entry.daysAgo),
    durationMinutes: entry.hours * 60 + entry.minutes,
    notes: entry.notes,
    createdAt: now,
    updatedAt: now,
  }));
}
