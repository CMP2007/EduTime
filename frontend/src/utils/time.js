import { GOAL_MINUTES } from 'domain-constants';

export { GOAL_MINUTES };

/** Meta diaria de estudio, en minutos (3 horas). */

/** Convierte minutos a un texto legible: 90 -> "1h 30m". */
export function formatMinutes(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes || 0));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** Separa minutos totales en { hours, minutes }. */
export function splitDuration(totalMinutes) {
  const minutes = Math.max(0, Math.round(totalMinutes || 0));
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

/** Une horas y minutos en minutos totales. */
export function combineDuration(hours, minutes) {
  return (Number(hours) || 0) * 60 + (Number(minutes) || 0);
}

/** Porcentaje de la meta diaria (0-100). */
export function goalProgress(minutes) {
  return Math.min(100, Math.round(((minutes || 0) / GOAL_MINUTES) * 100));
}
