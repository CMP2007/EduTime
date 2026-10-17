import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from '../../src/components/ConfirmDialog.jsx';

describe('ConfirmDialog', () => {
  it('muestra el mensaje de error sin cerrarse y deja reintentar', () => {
    render(
      <ConfirmDialog
        open
        title="Eliminar clase"
        message="¿Seguro que quieres eliminar la clase?"
        error="No se pudo eliminar la clase."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('No se pudo eliminar la clase.')).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Eliminar' }).disabled).toBe(false);
    expect(within(dialog).getByRole('button', { name: 'Cancelar' }).disabled).toBe(false);
  });

  it('no muestra ninguna región de error cuando todo va bien', () => {
    render(
      <ConfirmDialog open message="¿Seguro?" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByText(/no se pudo/i)).toBeNull();
  });
});
