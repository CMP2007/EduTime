import { describe, expect, it } from 'vitest';
import { buildDeleteMessage } from '../../src/sessions/deleteMessage.js';

describe('buildDeleteMessage · fecha legible', () => {
  it('incluye la fecha en formato largo, no técnico', () => {
    const message = buildDeleteMessage({
      themeName: 'Matemáticas',
      date: '2026-10-15',
    });

    expect(message).toBe(
      '¿Seguro que quieres eliminar la clase de "Matemáticas" del jue 15 oct 2026? Esta acción no se puede deshacer.',
    );
    expect(message).not.toContain('2026-10-15');
  });

  it('omite la fecha si no se puede interpretar', () => {
    const message = buildDeleteMessage({
      themeName: 'Matemáticas',
      date: '2026-13-45',
    });

    expect(message).toBe(
      '¿Seguro que quieres eliminar la clase de "Matemáticas"? Esta acción no se puede deshacer.',
    );
    expect(message).not.toContain('2026-13-45');
  });

  it('devuelve una cadena vacía sin clase', () => {
    expect(buildDeleteMessage(null)).toBe('');
  });
});
