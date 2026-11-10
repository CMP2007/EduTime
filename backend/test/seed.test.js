import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { assertSessionList } from 'domain-contracts';
import { DURATION_MAX, DURATION_MIN, NOTES_MAX, TITLE_MAX } from 'domain-constants';
import { isValidDateString } from 'domain-dates';

import { buildSeed } from '../src/sessions/seed.js';

describe('buildSeed · validez de la semilla (B4-5)', () => {
  it('genera entradas que cumplen el contrato y las reglas de dominio', () => {
    const sessions = buildSeed();

    assert.ok(sessions.length > 0);
    assertSessionList(sessions);
    for (const session of sessions) {
      assert.ok(isValidDateString(session.date));
      assert.ok(session.title.length <= TITLE_MAX);
      assert.ok(session.notes.length <= NOTES_MAX);
      assert.ok(session.durationMinutes >= DURATION_MIN);
      assert.ok(session.durationMinutes <= DURATION_MAX);
    }
  });

  it('rechaza una entrada con la temática vacía antes de persistirla', () => {
    assert.throws(
      () => buildSeed([{ daysAgo: 0, title: '   ', hours: 1, minutes: 0, notes: '' }]),
      { name: 'ValidationError', message: 'La temática es obligatoria.' },
    );
  });

  it('rechaza una entrada con duración menor que el mínimo', () => {
    assert.throws(
      () => buildSeed([{ daysAgo: 0, title: 'JavaScript', hours: 0, minutes: 5, notes: '' }]),
      { name: 'ValidationError', message: 'La clase debe durar al menos 15 minutos.' },
    );
  });
});
