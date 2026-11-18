import { formatDateLong } from '../utils/date.js';

/**
 * Mensaje de confirmación del borrado de una clase.
 *
 * Usa la fecha larga de la interfaz y, si no se puede interpretar, omite la
 * fecha para no mostrar nunca el formato técnico (`AAAA-MM-DD`).
 */
export function buildDeleteMessage(session) {
  if (!session) return '';

  const date = formatDateLong(session.date);
  const datePart = date ? ` del ${date}` : '';

  return `¿Seguro que quieres eliminar la clase de "${session.themeName}"${datePart}? Esta acción no se puede deshacer.`;
}
