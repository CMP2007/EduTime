import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SessionFilters from '../../src/sessions/SessionFilters.jsx';
import { buildTheme } from '../fixtures/contracts.js';

const THEMES = [
  buildTheme({ id: 'theme-1', name: 'Matemáticas' }),
  buildTheme({ id: 'theme-2', name: 'Física' }),
];

const EMPTY = { from: '', to: '', q: '', themeId: '' };

function renderFilters(value = EMPTY) {
  const onChange = vi.fn();
  render(<SessionFilters value={value} onChange={onChange} themes={THEMES} />);
  return { onChange };
}

describe('SessionFilters · temática', () => {
  it('muestra «Todas» y las temáticas del catálogo', () => {
    renderFilters();

    const select = screen.getByLabelText('Temática');
    const options = within(select).getAllByRole('option').map((option) => option.textContent);

    expect(options).toEqual(['Todas', 'Matemáticas', 'Física']);
    expect(select.value).toBe('');
  });

  it('avisa del cambio de temática conservando el resto de filtros', () => {
    const { onChange } = renderFilters({ ...EMPTY, from: '2026-01-01', q: 'repaso' });

    fireEvent.change(screen.getByLabelText('Temática'), { target: { value: 'theme-2' } });

    expect(onChange).toHaveBeenCalledWith({
      from: '2026-01-01',
      to: '',
      q: 'repaso',
      themeId: 'theme-2',
    });
  });
});

describe('SessionFilters · búsqueda', () => {
  it('etiqueta la búsqueda como «Buscar en observaciones»', () => {
    renderFilters();

    expect(screen.getByLabelText('Buscar en observaciones')).toBeTruthy();
    expect(screen.queryByText('Buscar por temática')).toBeNull();
  });

  it('avisa del texto escrito', () => {
    const { onChange } = renderFilters();

    fireEvent.change(screen.getByLabelText('Buscar en observaciones'), {
      target: { value: 'integrales' },
    });

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, q: 'integrales' });
  });
});

describe('SessionFilters · limpiar', () => {
  it('reinicia fechas, búsqueda y temática', () => {
    const { onChange } = renderFilters({
      from: '2026-01-01',
      to: '2026-02-01',
      q: 'integrales',
      themeId: 'theme-1',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));

    expect(onChange).toHaveBeenCalledWith({ from: '', to: '', q: '', themeId: '' });
  });
});
