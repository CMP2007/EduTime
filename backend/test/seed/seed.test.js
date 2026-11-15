import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DURATION_MAX, DURATION_MIN, NOTES_MAX, THEME_NAME_MAX } from 'domain-constants';
import { isValidDateString } from 'domain-dates';
import { normalizeThemeName } from 'domain-themes';

import { buildSeed } from '../../src/seed/seed.js';

describe('buildSeed · validez de la semilla (B4-5)', () => {
  it('genera temáticas y clases que cumplen las reglas de dominio', () => {
    const { themes, sessions } = buildSeed();

    assert.ok(themes.length > 0);
    assert.ok(sessions.length > 0);

    for (const theme of themes) {
      assert.equal(typeof theme.id, 'string');
      assert.ok(theme.name.length > 0);
      assert.ok(theme.name.length <= THEME_NAME_MAX);
    }

    for (const session of sessions) {
      assert.equal(typeof session.id, 'string');
      assert.equal(typeof session.themeId, 'string');
      assert.ok(themes.some((theme) => theme.id === session.themeId));
      assert.equal('title' in session, false);
      assert.ok(isValidDateString(session.date));
      assert.ok(session.notes.length <= NOTES_MAX);
      assert.ok(session.durationMinutes >= DURATION_MIN);
      assert.ok(session.durationMinutes <= DURATION_MAX);
    }
  });

  it('crea una sola temática por nombre normalizado', () => {
    const { themes, sessions } = buildSeed([
      { daysAgo: 0, theme: 'Matemáticas', hours: 1, minutes: 0, notes: '' },
      { daysAgo: 1, theme: '  matematicas  ', hours: 2, minutes: 0, notes: '' },
    ]);

    assert.equal(themes.length, 1);
    assert.equal(themes[0].name, 'Matemáticas');
    assert.equal(sessions.length, 2);
    assert.ok(sessions.every((session) => session.themeId === themes[0].id));
  });

  it('conserva temáticas distintas al cambiar la ñ por la n', () => {
    const { themes } = buildSeed([
      { daysAgo: 0, theme: 'Año', hours: 1, minutes: 0, notes: '' },
      { daysAgo: 1, theme: 'Ano', hours: 1, minutes: 0, notes: '' },
    ]);

    assert.equal(themes.length, 2);
    assert.deepEqual(themes.map((theme) => normalizeThemeName(theme.name)).sort(), ['ano', 'año']);
  });

  it('rechaza una entrada con la temática vacía antes de persistirla', () => {
    assert.throws(
      () => buildSeed([{ daysAgo: 0, theme: '   ', hours: 1, minutes: 0, notes: '' }]),
      { name: 'ValidationError', message: 'El nombre de la temática es obligatorio.' },
    );
  });

  it('rechaza una entrada con duración menor que el mínimo', () => {
    assert.throws(
      () => buildSeed([{ daysAgo: 0, theme: 'JavaScript', hours: 0, minutes: 5, notes: '' }]),
      { name: 'ValidationError', message: 'La clase debe durar al menos 15 minutos.' },
    );
  });
});
