import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ThemeSelect from '../../src/themes/ThemeSelect.jsx';
import { buildTheme } from '../fixtures/contracts.js';

const THEMES = [
  buildTheme({ id: 'theme-1', name: 'Matemáticas' }),
  buildTheme({ id: 'theme-2', name: 'Física' }),
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ThemeSelect · selector', () => {
  it('muestra la opción vacía y todas las temáticas', () => {
    render(
      <ThemeSelect id="theme" themes={THEMES} value="" onChange={() => {}} />,
    );

    const select = screen.getByRole('combobox');
    expect(select.value).toBe('');
    expect(screen.getByRole('option', { name: 'Selecciona una temática' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Matemáticas' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Física' })).toBeTruthy();
  });

  it('avisa del cambio de temática seleccionada', () => {
    const onChange = vi.fn();
    render(<ThemeSelect id="theme" themes={THEMES} value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'theme-2' } });

    expect(onChange).toHaveBeenCalledWith('theme-2');
  });

  it('no muestra el botón de alta si no se permite crear', () => {
    render(<ThemeSelect id="theme" themes={THEMES} value="" onChange={() => {}} />);

    expect(screen.queryByRole('button', { name: 'Crear temática' })).toBeNull();
  });
});

describe('ThemeSelect · alta inline', () => {
  it('abre el campo con el foco al pulsar «+»', () => {
    render(
      <ThemeSelect
        id="theme"
        themes={THEMES}
        value=""
        onChange={() => {}}
        allowCreate
        onCreate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear temática' }));

    expect(document.activeElement).toBe(screen.getByLabelText('Nombre de la nueva temática'));
  });

  it('crea la temática, la selecciona y cierra el campo', async () => {
    const onChange = vi.fn();
    const created = buildTheme({ id: 'theme-3', name: 'Álgebra' });
    const onCreate = vi.fn().mockResolvedValue(created);

    render(
      <ThemeSelect
        id="theme"
        themes={THEMES}
        value=""
        onChange={onChange}
        allowCreate
        onCreate={onCreate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear temática' }));
    fireEvent.change(screen.getByLabelText('Nombre de la nueva temática'), {
      target: { value: 'Álgebra' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Álgebra'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('theme-3'));

    expect(screen.queryByLabelText('Nombre de la nueva temática')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
  });

  it('mantiene el campo y muestra el error si el alta falla', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('Ya existe una temática con ese nombre.'));

    render(
      <ThemeSelect
        id="theme"
        themes={THEMES}
        value=""
        onChange={() => {}}
        allowCreate
        onCreate={onCreate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear temática' }));
    fireEvent.change(screen.getByLabelText('Nombre de la nueva temática'), {
      target: { value: 'Matemáticas' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Ya existe una temática con ese nombre.');
    expect(screen.getByLabelText('Nombre de la nueva temática').value).toBe('Matemáticas');
    expect(screen.getByRole('button', { name: 'Crear' })).toBeTruthy();
  });

  it('cancela el alta sin crear nada', () => {
    const onCreate = vi.fn();
    render(
      <ThemeSelect
        id="theme"
        themes={THEMES}
        value=""
        onChange={() => {}}
        allowCreate
        onCreate={onCreate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear temática' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Nombre de la nueva temática')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Crear temática' }));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('Escape cierra solo el campo y no propaga el evento al documento', () => {
    const documentKeyDown = vi.fn();
    document.addEventListener('keydown', documentKeyDown);

    render(
      <ThemeSelect
        id="theme"
        themes={THEMES}
        value=""
        onChange={() => {}}
        allowCreate
        onCreate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear temática' }));
    fireEvent.keyDown(screen.getByLabelText('Nombre de la nueva temática'), { key: 'Escape' });

    expect(screen.queryByLabelText('Nombre de la nueva temática')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Crear temática' }));
    expect(documentKeyDown).not.toHaveBeenCalled();

    document.removeEventListener('keydown', documentKeyDown);
  });

  it('Enter crea la temática sin enviar el formulario', async () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    const onCreate = vi.fn().mockResolvedValue(buildTheme({ id: 'theme-3', name: 'Álgebra' }));

    render(
      <form onSubmit={onSubmit}>
        <ThemeSelect
          id="theme"
          themes={THEMES}
          value=""
          onChange={() => {}}
          allowCreate
          onCreate={onCreate}
        />
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear temática' }));
    fireEvent.change(screen.getByLabelText('Nombre de la nueva temática'), {
      target: { value: 'Álgebra' },
    });
    fireEvent.keyDown(screen.getByLabelText('Nombre de la nueva temática'), { key: 'Enter' });

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Álgebra'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
