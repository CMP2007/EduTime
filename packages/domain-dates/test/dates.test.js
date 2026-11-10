import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DATE_MAX,
  DATE_MIN,
  DATE_YEAR_MAX,
  DATE_YEAR_MIN,
  MAX_RANGE_DAYS,
  RANGE_CLAMP_NOTICE,
  clampDateRange,
  compareDateStrings,
  isValidDateString,
} from '../index.js';

describe('constantes de dominio', () => {
  it('expone los límites y el aviso exacto', () => {
    assert.equal(DATE_YEAR_MIN, 1990);
    assert.equal(DATE_YEAR_MAX, 9999);
    assert.equal(DATE_MIN, '1990-01-01');
    assert.equal(DATE_MAX, '9999-12-31');
    assert.equal(MAX_RANGE_DAYS, 4000);
    assert.equal(
      RANGE_CLAMP_NOTICE,
      'El rango solicitado se ha recortado a los límites admitidos (1990-01-01 – 9999-12-31).',
    );
  });
});

describe('isValidDateString', () => {
  it('acepta fechas reales dentro del rango', () => {
    assert.equal(isValidDateString('2026-10-15'), true);
    assert.equal(isValidDateString('2024-02-29'), true);
    assert.equal(isValidDateString('1990-01-01'), true);
    assert.equal(isValidDateString('9999-12-31'), true);
  });

  it('rechaza fechas imposibles', () => {
    assert.equal(isValidDateString('2026-02-31'), false);
    assert.equal(isValidDateString('2025-02-29'), false);
    assert.equal(isValidDateString('2026-13-01'), false);
    assert.equal(isValidDateString('2026-10-32'), false);
    assert.equal(isValidDateString('2026-00-10'), false);
  });

  it('rechaza formatos incorrectos', () => {
    assert.equal(isValidDateString('2026-1-1'), false);
    assert.equal(isValidDateString(' 2026-10-15 '), false);
    assert.equal(isValidDateString('2026/10/15'), false);
    assert.equal(isValidDateString(''), false);
  });

  it('rechaza años fuera de los límites', () => {
    assert.equal(isValidDateString('1989-12-31'), false);
    assert.equal(isValidDateString('10000-01-01'), false);
  });

  it('rechaza valores que no son texto', () => {
    assert.equal(isValidDateString(null), false);
    assert.equal(isValidDateString(undefined), false);
    assert.equal(isValidDateString(20261015), false);
    assert.equal(isValidDateString({ date: '2026-10-15' }), false);
    assert.equal(isValidDateString(['2026-10-15']), false);
  });
});

describe('compareDateStrings', () => {
  it('compara por tupla numérica', () => {
    assert.ok(compareDateStrings('2026-10-15', '2026-10-16') < 0);
    assert.ok(compareDateStrings('2026-10-16', '2026-10-15') > 0);
    assert.equal(compareDateStrings('2026-10-15', '2026-10-15'), 0);
    assert.ok(compareDateStrings('2025-12-31', '2026-01-01') < 0);
    assert.ok(compareDateStrings('1990-01-01', '1989-12-31') > 0);
  });

  it('soporta años de cinco cifras', () => {
    assert.ok(compareDateStrings('10000-01-02', '9999-12-31') > 0);
    assert.ok(compareDateStrings('9999-12-31', '10000-01-02') < 0);
  });
});

describe('clampDateRange', () => {
  it('no recorta rangos interiores', () => {
    assert.deepEqual(clampDateRange('2000-01-01', '2020-01-01'), {
      from: '2000-01-01',
      to: '2020-01-01',
      clamped: false,
    });
  });

  it('recorta solo el inicio', () => {
    assert.deepEqual(clampDateRange('1989-01-01', '2020-01-01'), {
      from: '1990-01-01',
      to: '2020-01-01',
      clamped: true,
    });
  });

  it('recorta solo el fin', () => {
    assert.deepEqual(clampDateRange('2000-01-01', '10000-01-02'), {
      from: '2000-01-01',
      to: '9999-12-31',
      clamped: true,
    });
  });

  it('recorta ambos extremos', () => {
    assert.deepEqual(clampDateRange('1989-01-01', '10000-01-02'), {
      from: '1990-01-01',
      to: '9999-12-31',
      clamped: true,
    });
  });
});
