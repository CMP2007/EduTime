import { GOAL_MINUTES } from 'domain-constants';
import { describe, expect, it } from 'vitest';

import {
  HEATMAP_LEVEL_COUNT,
  HEATMAP_LEVEL_MAX,
  HEATMAP_THRESHOLDS,
  heatmapLevel,
} from '../../src/stats/heatmapLevel.js';

describe('heatmapLevel · escala de intensidad', () => {
  it('devuelve 0 para un día sin clases', () => {
    expect(heatmapLevel(0)).toBe(0);
    expect(heatmapLevel(undefined)).toBe(0);
    expect(heatmapLevel(null)).toBe(0);
  });

  it('sube de nivel al alcanzar cada umbral', () => {
    expect(heatmapLevel(1)).toBe(1);
    expect(heatmapLevel(59)).toBe(1);
    expect(heatmapLevel(60)).toBe(2);
    expect(heatmapLevel(119)).toBe(2);
    expect(heatmapLevel(120)).toBe(3);
    expect(heatmapLevel(179)).toBe(3);
    expect(heatmapLevel(GOAL_MINUTES)).toBe(4);
    expect(heatmapLevel(GOAL_MINUTES * 2)).toBe(4);
  });

  it('mantiene los umbrales ascendentes y con la meta diaria como último corte', () => {
    expect(HEATMAP_THRESHOLDS).toEqual([60, 120, GOAL_MINUTES]);
    expect(HEATMAP_THRESHOLDS).toEqual([...HEATMAP_THRESHOLDS].sort((a, b) => a - b));
  });

  it('cubre todos los niveles de la leyenda, del 0 al máximo', () => {
    expect(HEATMAP_LEVEL_MAX).toBe(HEATMAP_THRESHOLDS.length + 1);
    expect(HEATMAP_LEVEL_COUNT).toBe(HEATMAP_LEVEL_MAX + 1);
    expect(heatmapLevel(Number.MAX_SAFE_INTEGER)).toBe(HEATMAP_LEVEL_MAX);
  });
});
