import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  enumerateDays,
  fromDateString,
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

describe('fromDateString', () => {
  it('acepta una fecha válida como 2024-02-29', () => {
    assert.doesNotThrow(() => fromDateString('2024-02-29'));
  });

  it('lanza RangeError con fecha inválida (2026-02-31)', () => {
    assert.throws(() => fromDateString('2026-02-31'), RangeError, 'La fecha 2026-02-31 no es válida');
  });

  it('lanza RangeError con fecha inválida (2026-13-01)', () => {
    assert.throws(() => fromDateString('2026-13-01'), RangeError, 'La fecha 2026-13-01 no es válida');
  });

  it('lanza RangeError con fecha inválida (2026-1-1)', () => {
    assert.throws(() => fromDateString('2026-1-1'), RangeError, 'La fecha 2026-1-1 no es válida');
  });

  it('lanza RangeError con fecha inválida ( 2026-10-15 )', () => {
    assert.throws(() => fromDateString(' 2026-10-15 '), RangeError, 'La fecha  2026-10-15  no es válida');
  });

  it('lanza RangeError con fecha inválida (1989-12-31)', () => {
    assert.throws(() => fromDateString('1989-12-31'), RangeError, 'La fecha 1989-12-31 no es válida');
  });

  it('acepta una fecha válida (2026-10-15)', () => {
    assert.doesNotThrow(() => fromDateString('2026-10-15'));
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

  it('devuelve 4000 días para un rango que los produce exactamente', () => {
    const dias = enumerateDays('1990-01-01', '2000-12-13');
    assert.equal(dias.length, 4000);
  });

  it('lanza RangeError si el rango produce 4001 días', () => {
    assert.throws(() => enumerateDays('1990-01-01', '2000-12-14'), RangeError, 'El rango excede el máximo de 4000 días permitidos');
  });

  it('devuelve un array vacío para un rango invertido', () => {
    const dias = enumerateDays('2000-12-14', '1990-01-01');
    assert.deepEqual(dias, []);
  });

  it('lanza RangeError si un extremo no es una fecha real', () => {
    assert.throws(() => enumerateDays('2026-02-31', '2026-03-31'), RangeError);
    assert.throws(() => enumerateDays('2026-03-01', '2026-13-01'), RangeError);
  });
});

describe('enumerateDays · rangos que cruzan el cambio de hora', () => {
  it('enumera marzo completo y termina en el último día', () => {
    const days = enumerateDays('2026-03-01', '2026-03-31');
    assert.equal(days.length, 31);
    assert.equal(days[0], '2026-03-01');
    assert.equal(days.at(-1), '2026-03-31');
  });

  it('enumera tres meses sin perder el último día', () => {
    const days = enumerateDays('2026-03-16', '2026-06-14');
    assert.equal(days.length, 91);
    assert.equal(days.at(-1), '2026-06-14');
  });

  it('devuelve días consecutivos sin huecos', () => {
    const days = enumerateDays('2026-10-24', '2026-10-27');
    assert.deepEqual(days, ['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27']);
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
