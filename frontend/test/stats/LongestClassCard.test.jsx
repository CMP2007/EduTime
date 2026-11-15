import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LongestClassCard from '../../src/stats/LongestClassCard.jsx';

describe('LongestClassCard · nombre actual (RF-33)', () => {
  it('muestra el nombre de la temática del contrato, no el campo antiguo', () => {
    render(
      <LongestClassCard
        longest={{
          id: 'session-1',
          themeId: 'theme-2',
          name: 'Física',
          date: '2026-10-15',
          durationMinutes: 120,
        }}
      />,
    );

    expect(screen.getByText('Física')).toBeTruthy();
    expect(screen.getByText(/15 oct 2026/)).toBeTruthy();
  });

  it('avisa cuando no hay clases en el periodo', () => {
    render(<LongestClassCard longest={null} />);

    expect(screen.getByText('Sin clases en este periodo.')).toBeTruthy();
  });
});
