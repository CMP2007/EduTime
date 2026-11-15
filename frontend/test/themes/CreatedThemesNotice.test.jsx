import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CreatedThemesNotice from '../../src/themes/CreatedThemesNotice.jsx';

describe('CreatedThemesNotice', () => {
  it('muestra una temática creada en singular', () => {
    render(<CreatedThemesNotice names={['Álgebra']} onClose={vi.fn()} />);

    expect(screen.getByText(/Se creó esta temática/)).toBeTruthy();
    expect(screen.getByText(/La temática se conserva/)).toBeTruthy();
    expect(screen.getByText(/editarla desde «Temáticas»/)).toBeTruthy();
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Álgebra',
    ]);
  });

  it('muestra varias temáticas creadas en plural', () => {
    render(<CreatedThemesNotice names={['Álgebra', 'Física']} onClose={vi.fn()} />);

    expect(screen.getByText(/Se crearon estas temáticas/)).toBeTruthy();
    expect(screen.getByText(/Las temáticas se conservan/)).toBeTruthy();
    expect(screen.getByText(/editarlas desde «Temáticas»/)).toBeTruthy();
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Álgebra',
      'Física',
    ]);
  });

  it('cierra con el botón «Entendido»', () => {
    const onClose = vi.fn();
    render(<CreatedThemesNotice names={['Álgebra']} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra con Escape', () => {
    const onClose = vi.fn();
    render(<CreatedThemesNotice names={['Álgebra']} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
