import { describe, expect, it } from 'vitest';
import {
  DURATION_MAX_ERROR,
  DURATION_MIN_ERROR,
  HOURS_ERROR,
  MINUTES_ERROR,
  MINUTES_RANGE_ERROR,
  parseDurationInput,
} from '../../src/sessions/durationInput.js';

function expectInvalid(result, message, fields) {
  expect(result.valid).toBe(false);
  expect(result.error.message).toBe(message);
  expect(result.error.fields).toEqual(fields);
}

describe('parseDurationInput · campos vacíos (RF-1)', () => {
  it('interpreta ambos campos vacíos como 0 y avisa del mínimo', () => {
    expectInvalid(parseDurationInput('', ''), DURATION_MIN_ERROR, ['hours', 'minutes']);
  });

  it('interpreta los espacios como campo vacío', () => {
    expectInvalid(parseDurationInput('   ', '  '), DURATION_MIN_ERROR, ['hours', 'minutes']);
    expect(parseDurationInput(' ', '').error.fields).toEqual(['hours', 'minutes']);
  });

  it('trata null y undefined como campo vacío', () => {
    expectInvalid(parseDurationInput(null, undefined), DURATION_MIN_ERROR, ['hours', 'minutes']);
  });

  it('las horas vacías con minutos 90 dan error de minutos', () => {
    expectInvalid(parseDurationInput('', '90'), MINUTES_RANGE_ERROR, ['minutes']);
  });
});

describe('parseDurationInput · entradas inválidas (RF-2)', () => {
  it('rechaza horas decimales señalando solo horas', () => {
    expectInvalid(parseDurationInput('1.5', '30'), HOURS_ERROR, ['hours']);
  });

  it('rechaza minutos negativos señalando solo minutos', () => {
    expectInvalid(parseDurationInput('1', '-1'), MINUTES_ERROR, ['minutes']);
  });

  it('rechaza horas negativas señalando solo horas', () => {
    expectInvalid(parseDurationInput('-2', '30'), HOURS_ERROR, ['hours']);
  });

  it('si horas y minutos son inválidos a la vez manda el error de horas', () => {
    expectInvalid(parseDurationInput('1.5', '-1'), HOURS_ERROR, ['hours']);
  });
});

describe('parseDurationInput · precedencia de errores (RF-3)', () => {
  it('24 h 0 min supera el máximo y afecta a ambos campos', () => {
    expectInvalid(parseDurationInput('24', '0'), DURATION_MAX_ERROR, ['hours', 'minutes']);
  });

  it('23 h 60 min supera el máximo (el máximo manda sobre el rango de minutos)', () => {
    expectInvalid(parseDurationInput('23', '60'), DURATION_MAX_ERROR, ['hours', 'minutes']);
  });

  it('1e2 horas se interpretan como 100 y superan el máximo', () => {
    expectInvalid(parseDurationInput('1e2', '0'), DURATION_MAX_ERROR, ['hours', 'minutes']);
  });
});

describe('parseDurationInput · rango de minutos (RF-6)', () => {
  it('0 h 60 min da error de minutos', () => {
    expectInvalid(parseDurationInput('0', '60'), MINUTES_RANGE_ERROR, ['minutes']);
  });
});

describe('parseDurationInput · mínimo (RF-4)', () => {
  it('0 h 10 min no llega al mínimo y afecta a ambos campos', () => {
    expectInvalid(parseDurationInput('0', '10'), DURATION_MIN_ERROR, ['hours', 'minutes']);
  });
});

describe('parseDurationInput · duración válida (RF-7)', () => {
  it('acepta exactamente 15 minutos', () => {
    expect(parseDurationInput('0', '15')).toEqual({
      valid: true,
      hours: 0,
      minutes: 15,
      durationMinutes: 15,
      error: null,
    });
  });

  it('acepta exactamente 1439 minutos (23:59)', () => {
    expect(parseDurationInput('23', '59')).toEqual({
      valid: true,
      hours: 23,
      minutes: 59,
      durationMinutes: 1439,
      error: null,
    });
  });

  it('interpreta 1.0 como 1 hora y devuelve enteros listos para enviar', () => {
    expect(parseDurationInput('1.0', '')).toEqual({
      valid: true,
      hours: 1,
      minutes: 0,
      durationMinutes: 60,
      error: null,
    });
  });

  it('devuelve enteros aunque la entrada llegue como número', () => {
    expect(parseDurationInput(2, 30)).toEqual({
      valid: true,
      hours: 2,
      minutes: 30,
      durationMinutes: 150,
      error: null,
    });
  });
});
