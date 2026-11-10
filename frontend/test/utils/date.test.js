import { describe, expect, it } from 'vitest';

import {
  formatDateLong,
  formatDateRange,
  formatDateShort,
  fromDateString,
  weekdayIndex,
} from '../../src/utils/date.js';

const invalidDates = [
  '2026-02-31',
  '2025-02-29',
  '2026-13-01',
  '2026-1-1',
  ' 2026-10-15 ',
  '1989-12-31',
  '10000-01-02',
  '',
  20261015,
  {},
  [],
  null,
  undefined,
];

describe('fromDateString', () => {
  it('convierte una fecha válida en Date', () => {
    const date = fromDateString('2026-10-15');

    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(15);
  });

  it('acepta el 29 de febrero de un año bisiesto', () => {
    expect(fromDateString('2024-02-29')).toBeInstanceOf(Date);
  });

  it.each(invalidDates)('devuelve null con el valor inválido %s', (value) => {
    expect(fromDateString(value)).toBeNull();
  });
});

describe('formatDateLong y formatDateShort', () => {
  it('mantiene el formato actual para fechas válidas', () => {
    expect(formatDateLong('2026-10-15')).toBe('jue 15 oct 2026');
    expect(formatDateShort('2026-10-15')).toBe('15 oct');
  });

  it.each(invalidDates)('devuelven cadena vacía con el valor inválido %s', (value) => {
    expect(formatDateLong(value)).toBe('');
    expect(formatDateShort(value)).toBe('');
  });
});

describe('formatDateRange', () => {
  it('mantiene los formatos actuales para rangos válidos', () => {
    expect(formatDateRange('2026-10-05', '2026-10-11')).toBe('5–11 oct');
    expect(formatDateRange('2026-09-29', '2026-10-04')).toBe('29 sep – 4 oct');
    expect(formatDateRange('2025-12-29', '2026-01-04')).toBe('29 dic 2025 – 4 ene 2026');
  });

  it.each(invalidDates)('devuelve cadena vacía si el extremo inicial es inválido (%s)', (value) => {
    expect(formatDateRange(value, '2026-10-11')).toBe('');
  });

  it.each(invalidDates)('devuelve cadena vacía si el extremo final es inválido (%s)', (value) => {
    expect(formatDateRange('2026-10-05', value)).toBe('');
  });
});

describe('weekdayIndex', () => {
  it('devuelve el índice con lunes = 0 para fechas válidas', () => {
    expect(weekdayIndex('2026-10-12')).toBe(0);
    expect(weekdayIndex('2026-10-14')).toBe(2);
    expect(weekdayIndex('2026-10-15')).toBe(3);
    expect(weekdayIndex('2026-10-18')).toBe(6);
  });

  it.each(invalidDates)('devuelve null con el valor inválido %s', (value) => {
    expect(weekdayIndex(value)).toBeNull();
  });
});
