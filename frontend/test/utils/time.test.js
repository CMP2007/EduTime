import { describe, expect, it } from 'vitest';
import { formatMinutes, goalProgress, splitDuration } from '../../src/utils/time.js';

describe('formatMinutes', () => {
  it('formatea horas y minutos legibles', () => {
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(formatMinutes(180)).toBe('3h');
    expect(formatMinutes(45)).toBe('45m');
  });
});

describe('goalProgress', () => {
  it('calcula el porcentaje de la meta diaria', () => {
    expect(goalProgress(90)).toBe(50);
    expect(goalProgress(180)).toBe(100);
  });

  it('no baja de 0 ni supera 100 con datos fuera de rango', () => {
    expect(goalProgress(-30)).toBe(0);
    expect(goalProgress(0)).toBe(0);
    expect(goalProgress(270)).toBe(100);
  });
});

describe('splitDuration', () => {
  it('separa los minutos totales en horas y minutos', () => {
    expect(splitDuration(1439)).toEqual({ hours: 23, minutes: 59 });
  });
});
