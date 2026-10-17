import { describe, expect, it } from 'vitest';
import { combineDuration, formatMinutes, splitDuration } from '../../src/utils/time.js';

describe('formatMinutes', () => {
  it('formatea horas y minutos legibles', () => {
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(formatMinutes(180)).toBe('3h');
    expect(formatMinutes(45)).toBe('45m');
  });
});

describe('splitDuration / combineDuration', () => {
  it('la separación y recomposición son inversas', () => {
    expect(splitDuration(1439)).toEqual({ hours: 23, minutes: 59 });
    expect(combineDuration(23, 59)).toBe(1439);
  });
});
