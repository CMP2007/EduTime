import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  enumerateDays,
  getRange,
  isValidPeriod,
  startOfMonth,
  startOfWeek,
  toDateString,
} from '../src/utils/date.js';

describe('toDateString', () => {
  it('formatea una fecha local como YYYY-MM-DD rellenando con ceros', () => {
    assert.equal(toDateString(new Date(2026, 9, 5)), '2026-10-05');
  });
});

describe('addDays', () => {
  it('suma un día dentro del mismo mes', () => {
    assert.equal(addDays('2026-10-15', 1), '2026-10-16');
  });

  it('cruza el fin de mes', () => {
    assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  });

  it('cruza el fin de año', () => {
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  });

  it('respeta los años bisiestos', () => {
    assert.equal(addDays('2024-02-28', 1), '2024-02-29');
    assert.equal(addDays('2024-02-29', 1), '2024-03-01');
    assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  });

  it('resta días con cantidades negativas', () => {
    assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  });
});

describe('addMonths', () => {
  it('mantiene el mismo día del mes', () => {
    assert.equal(addMonths('2026-05-15', 1), '2026-06-15');
  });

  it('recorta al último día cuando el mes destino es más corto', () => {
    assert.equal(addMonths('2024-03-31', -1), '2024-02-29');
    assert.equal(addMonths('2026-01-31', -1), '2025-12-31');
  });
});

describe('semanas (lunes a domingo)', () => {
  it('startOfWeek devuelve el lunes de la semana de referencia', () => {
    assert.equal(startOfWeek('2026-10-17'), '2026-10-12'); // sábado -> lunes
    assert.equal(startOfWeek('2026-10-12'), '2026-10-12'); // lunes -> mismo día
  });

  it('endOfWeek devuelve el domingo de la semana de referencia', () => {
    assert.equal(endOfWeek('2026-10-17'), '2026-10-18');
  });
});

describe('meses', () => {
  it('startOfMonth devuelve el día 1', () => {
    assert.equal(startOfMonth('2026-10-17'), '2026-10-01');
  });

  it('endOfMonth devuelve el último día del mes', () => {
    assert.equal(endOfMonth('2026-10-17'), '2026-10-31');
    assert.equal(endOfMonth('2024-02-10'), '2024-02-29');
  });
});

describe('enumerateDays', () => {
  it('incluye ambos extremos y no se repite', () => {
    const dias = enumerateDays('2026-10-12', '2026-10-18');
    assert.equal(dias.length, 7);
    assert.equal(dias[0], '2026-10-12');
    assert.equal(dias[6], '2026-10-18');
  });

  it('devuelve un solo día cuando from y to coinciden', () => {
    assert.deepEqual(enumerateDays('2026-10-17', '2026-10-17'), ['2026-10-17']);
  });
});

describe('isValidPeriod', () => {
  it('acepta los periodos soportados y rechaza el resto', () => {
    for (const periodo of ['day', 'week', 'month', '3m', '6m', '12m', 'year']) {
      assert.equal(isValidPeriod(periodo), true, `${periodo} debería ser válido`);
    }
    assert.equal(isValidPeriod('foo'), false);
    assert.equal(isValidPeriod(undefined), false);
  });
});

describe('getRange', () => {
  const referencia = '2026-10-17';

  it('day: un único día', () => {
    assert.deepEqual(getRange('day', referencia), {
      key: 'day',
      label: 'Día',
      from: '2026-10-17',
      to: '2026-10-17',
    });
  });

  it('week: de lunes a domingo', () => {
    const rango = getRange('week', referencia);
    assert.equal(rango.from, '2026-10-12');
    assert.equal(rango.to, '2026-10-18');
  });

  it('month: el mes natural completo', () => {
    const rango = getRange('month', referencia);
    assert.equal(rango.from, '2026-10-01');
    assert.equal(rango.to, '2026-10-31');
  });

  it('3m/6m/12m: desde la fecha hasta el mes correspondiente atrás', () => {
    assert.equal(getRange('3m', referencia).from, '2026-07-17');
    assert.equal(getRange('6m', referencia).from, '2026-04-17');
    assert.equal(getRange('12m', referencia).from, '2025-10-17');
  });

  it('year: el año natural completo', () => {
    const rango = getRange('year', referencia);
    assert.equal(rango.label, 'Año 2026');
    assert.equal(rango.from, '2026-01-01');
    assert.equal(rango.to, '2026-12-31');
  });

  it('sin periodo usa la semana como valor por defecto', () => {
    assert.equal(getRange(undefined, referencia).key, 'week');
  });

  it('lanza error con un periodo desconocido', () => {
    assert.throws(() => getRange('foo', referencia), /Periodo no válido/);
  });
});
