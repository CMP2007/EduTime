// @ts-check
import { GOAL_MINUTES } from 'domain-constants';

/**
 * Escala de intensidad del calendario de actividad (heatmap).
 *
 * Cada valor es el mínimo de minutos que hace subir de nivel:
 * - nivel 0: 0 minutos (día sin clases);
 * - nivel 1: de 1 a 59 minutos;
 * - nivel 2: de 60 a 119 minutos;
 * - nivel 3: de 120 a 179 minutos;
 * - nivel 4: desde la meta diaria (`GOAL_MINUTES`, 180 minutos).
 *
 * Es una escala solo visual: se traduce en las clases `heatmap__cell--l<n>` de
 * `styles/heatmap.css` y no altera los datos ni las estadísticas.
 */
export const HEATMAP_THRESHOLDS = [60, 120, GOAL_MINUTES];

/** Nivel máximo de intensidad: un nivel por umbral, por encima del nivel 0. */
export const HEATMAP_LEVEL_MAX = HEATMAP_THRESHOLDS.length + 1;

/** Número de niveles de intensidad, incluido el 0 (día sin clases). */
export const HEATMAP_LEVEL_COUNT = HEATMAP_LEVEL_MAX + 1;

/** Nivel de intensidad (0 a 4) de un día según sus minutos de estudio. */
export function heatmapLevel(minutes) {
  if (!minutes) return 0;
  return HEATMAP_THRESHOLDS.filter((threshold) => minutes >= threshold).length + 1;
}
