import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DeleteThemeDialog from '../../src/themes/DeleteThemeDialog.jsx';
import { buildTheme } from '../fixtures/contracts.js';

const { themesApiMock } = vi.hoisted(() => ({
  themesApiMock: { list: vi.fn(), create: vi.fn(), rename: vi.fn(), remove: vi.fn() },
}));

vi.mock('../../src/themes/themes.api.js', () => ({ themesApi: themesApiMock }));

const theme = buildTheme({ id: 'theme-1', name: 'Matemáticas', sessionCount: 0 });
const withSessions = buildTheme({ id: 'theme-1', name: 'Matemáticas', sessionCount: 3 });
const others = [
  buildTheme({ id: 'theme-2', name: 'Física', sessionCount: 0 }),
  buildTheme({ id: 'theme-3', name: 'álgebra', sessionCount: 0 }),
];

function renderDialog(props = {}) {
  return render(
    <DeleteThemeDialog
      theme={theme}
      themes={[theme]}
      onClose={vi.fn()}
      onDeleted={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  themesApiMock.remove.mockReset();
});

describe('DeleteThemeDialog · sin clases', () => {
  it('confirma el borrado simple y avisa al gestor', async () => {
    const onDeleted = vi.fn();
    themesApiMock.remove.mockResolvedValue(null);
    renderDialog({ onDeleted });

    expect(screen.getByText(/No tiene clases asociadas/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(themesApiMock.remove).toHaveBeenCalledWith('theme-1');
  });

  it('cancelar no borra nada', () => {
    const onClose = vi.fn();
    renderDialog({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(themesApiMock.remove).not.toHaveBeenCalled();
  });

  it('muestra el error de la API sin cerrar el diálogo', async () => {
    const onDeleted = vi.fn();
    themesApiMock.remove.mockRejectedValue(new Error('No se pudo eliminar la temática.'));
    renderDialog({ onDeleted });

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('No se pudo eliminar la temática.');
    expect(screen.getByRole('dialog', { name: 'Eliminar temática' })).toBeTruthy();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});

describe('DeleteThemeDialog · con clases', () => {
  it('muestra el número y reasigna a la temática de destino ordenada', async () => {
    const onDeleted = vi.fn();
    themesApiMock.remove.mockResolvedValue(null);
    renderDialog({ theme: withSessions, themes: [withSessions, ...others], onDeleted });

    expect(screen.getByText(/tiene 3 clases/)).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: /Reasignar/ }));

    const select = screen.getByLabelText('Temática de destino');
    const options = within(select).getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(['Selecciona una temática', 'álgebra', 'Física']);

    fireEvent.change(select, { target: { value: 'theme-3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(themesApiMock.remove).toHaveBeenCalledWith('theme-1', {
      strategy: 'reassign',
      targetThemeId: 'theme-3',
    });
  });

  it('elimina la temática y todas sus clases', async () => {
    const onDeleted = vi.fn();
    themesApiMock.remove.mockResolvedValue(null);
    renderDialog({ theme: withSessions, themes: [withSessions, ...others], onDeleted });

    fireEvent.click(screen.getByRole('radio', { name: /Eliminar la temática y sus clases/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(themesApiMock.remove).toHaveBeenCalledWith('theme-1', { strategy: 'delete' });
  });

  it('desactiva la confirmación mientras no haya estrategia ni destino', () => {
    renderDialog({ theme: withSessions, themes: [withSessions, ...others] });

    const confirm = screen.getByRole('button', { name: 'Eliminar' });
    expect(confirm.disabled).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: /Reasignar/ }));
    expect(confirm.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Temática de destino'), {
      target: { value: 'theme-2' },
    });
    expect(confirm.disabled).toBe(false);
  });

  it('sin otra temática desactiva la reasignación y lo explica', () => {
    renderDialog({ theme: withSessions, themes: [withSessions] });

    expect(screen.getByRole('radio', { name: /Reasignar/ }).disabled).toBe(true);
    expect(screen.getByText(/No hay otra temática/)).toBeTruthy();

    const confirm = screen.getByRole('button', { name: 'Eliminar' });
    expect(confirm.disabled).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: /Eliminar la temática y sus clases/ }));
    expect(confirm.disabled).toBe(false);
  });
});
