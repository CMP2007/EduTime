/** Constantes de dominio compartidas entre backend y frontend. */

export const GOAL_MINUTES = 180;

export const TITLE_MAX = 80;
export const THEME_NAME_MAX = 80;
export const NOTES_MAX = 500;
export const DURATION_MIN = 15;
export const HOURS_MAX = 23;
export const MINUTES_MAX = 59;
export const DURATION_MAX = HOURS_MAX * 60 + MINUTES_MAX;

export const PERIODS = ['day', 'week', 'month', '3m', '6m', '12m', 'year'];

export const PERIOD_OPTIONS = [
  { key: 'day', label: 'Día' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
  { key: '3m', label: '3 meses' },
  { key: '6m', label: '6 meses' },
  { key: '12m', label: '12 meses' },
  { key: 'year', label: 'Año' },
];
