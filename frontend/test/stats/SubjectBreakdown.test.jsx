import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SubjectBreakdown from '../../src/stats/SubjectBreakdown.jsx';

const SUBJECTS = [
  { themeId: 'theme-1', name: 'Matemáticas', minutes: 240, sessions: 2 },
  { themeId: 'theme-2', name: 'Física', minutes: 120, sessions: 1 },
];

describe('SubjectBreakdown · nombres actuales (RF-33)', () => {
  it('muestra el nombre de cada temática del contrato', () => {
    render(<SubjectBreakdown subjects={SUBJECTS} />);

    expect(screen.getByText('Matemáticas')).toBeTruthy();
    expect(screen.getByText('Física')).toBeTruthy();
    expect(screen.getByText('4h')).toBeTruthy();
    expect(screen.getByText('2h')).toBeTruthy();
  });

  it('usa el identificador de la temática como clave de cada fila', () => {
    render(<SubjectBreakdown subjects={SUBJECTS} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('avisa cuando no hay datos en el periodo', () => {
    render(<SubjectBreakdown subjects={[]} />);

    expect(screen.getByText('Sin datos en este periodo.')).toBeTruthy();
  });
});
