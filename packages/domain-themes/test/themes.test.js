import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { compareThemeNames, isSameThemeName, normalizeThemeName } from '../index.js';

describe('domain-themes · normalización', () => {
  it('recorta espacios, pasa a minúsculas y quita tildes', () => {
    assert.equal(normalizeThemeName('  Matemáticas  '), 'matematicas');
    assert.equal(normalizeThemeName('INGLÉS'), 'ingles');
    assert.equal(normalizeThemeName('Física'), 'fisica');
    assert.equal(normalizeThemeName('Programación'), 'programacion');
    assert.equal(normalizeThemeName('Lingüística'), 'linguistica');
  });

  it('conserva la ñ: año y ano son temáticas distintas', () => {
    assert.equal(normalizeThemeName('Año'), 'año');
    assert.equal(normalizeThemeName('AÑO'), 'año');
    assert.notEqual(normalizeThemeName('año'), normalizeThemeName('ano'));
  });

  it('trata vacío, solo espacios y valores no textuales como cadena vacía', () => {
    assert.equal(normalizeThemeName(''), '');
    assert.equal(normalizeThemeName('   '), '');
    assert.equal(normalizeThemeName(null), '');
    assert.equal(normalizeThemeName(42), '');
  });
});

describe('domain-themes · comparación de duplicados', () => {
  it('considera iguales los nombres que solo cambian en mayúsculas, tildes o espacios', () => {
    assert.equal(isSameThemeName('Matemáticas', 'matematicas'), true);
    assert.equal(isSameThemeName('  INGLÉS ', 'Ingles'), true);
    assert.equal(isSameThemeName('Física', 'FISICA'), true);
  });

  it('distingue la ñ de la n', () => {
    assert.equal(isSameThemeName('año', 'ano'), false);
  });

  it('distingue nombres diferentes', () => {
    assert.equal(isSameThemeName('Matemáticas', 'Física'), false);
  });
});

describe('domain-themes · orden alfabético', () => {
  it('ordena en español', () => {
    const names = ['Zanahoria', 'Álgebra', 'Inglés', 'Matemáticas'];

    assert.deepEqual([...names].sort(compareThemeNames), [
      'Álgebra',
      'Inglés',
      'Matemáticas',
      'Zanahoria',
    ]);
  });

  it('coloca la ñ entre la n y la o', () => {
    const names = ['Oso', 'Ñu', 'Nube'];

    assert.deepEqual([...names].sort(compareThemeNames), ['Nube', 'Ñu', 'Oso']);
  });

  it('desempata por el texto original cuando solo cambian mayúsculas o tildes', () => {
    assert.ok(compareThemeNames('algebra', 'Álgebra') < 0);
    assert.ok(compareThemeNames('Álgebra', 'algebra') > 0);
    assert.equal(compareThemeNames('Álgebra', 'Álgebra'), 0);
  });
});
