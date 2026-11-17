import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PERIODS, PERIOD_OPTIONS } from '../index.js';

describe('domain-constants · periodos', () => {
  it('mantiene alineadas las claves de PERIODS y PERIOD_OPTIONS', () => {
    assert.deepEqual(
      PERIOD_OPTIONS.map((option) => option.key),
      PERIODS,
    );
  });

  it('no repite claves y da etiqueta a todas las opciones', () => {
    assert.equal(new Set(PERIODS).size, PERIODS.length);
    assert.equal(new Set(PERIOD_OPTIONS.map((option) => option.key)).size, PERIOD_OPTIONS.length);

    PERIOD_OPTIONS.forEach((option) => {
      assert.equal(typeof option.label, 'string');
      assert.ok(option.label.length > 0);
    });
  });
});
