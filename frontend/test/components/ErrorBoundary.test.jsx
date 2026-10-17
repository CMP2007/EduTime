import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../../src/components/ErrorBoundary.jsx';

function Bomb() {
  throw new Error('Explosión durante el render');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('muestra el fallback en vez de dejar la pantalla en blanco', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    const message = screen.getByRole('alert');
    expect(message).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeTruthy();
  });

  it('pinta a los hijos cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <p>Todo correcto</p>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Todo correcto')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
