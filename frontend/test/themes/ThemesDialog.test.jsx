import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/api/ApiError.js';
import { DataRefreshProvider } from '../../src/context/DataRefreshContext.jsx';
import ThemesDialog from '../../src/themes/ThemesDialog.jsx';
import { buildTheme } from '../fixtures/contracts.js';

const { themesApiMock } = vi.hoisted(() => ({
  themesApiMock: { list: vi.fn(), create: vi.fn(), rename: vi.fn(), remove: vi.fn() },
}));

vi.mock('../../src/themes/themes.api.js', () => ({ themesApi: themesApiMock }));

let catalogue;

function renderDialog(props = {}) {
  return render(
    <DataRefreshProvider>
      <ThemesDialog onClose={vi.fn()} {...props} />
    </DataRefreshProvider>,
  );
}

function names() {
  return screen
    .getAllByRole('listitem')
    .map((item) => item.querySelector('.themes__name')?.textContent)
    .filter(Boolean);
}

beforeEach(() => {
  themesApiMock.list.mockReset();
  themesApiMock.create.mockReset();
  themesApiMock.rename.mockReset();

  catalogue = [
    buildTheme({ id: 'theme-1', name: 'Matemáticas' }),
    buildTheme({ id: 'theme-2', name: 'Física' }),
  ];
  themesApiMock.list.mockImplementation(async () => catalogue.map((theme) => ({ ...theme })));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ThemesDialog · listado', () => {
  it('muestra las temáticas ordenadas y sin el número de clases', async () => {
    catalogue = [
      buildTheme({ id: 'theme-1', name: 'Matemáticas' }),
      buildTheme({ id: 'theme-2', name: 'álgebra' }),
      buildTheme({ id: 'theme-3', name: 'Física' }),
    ];

    renderDialog();

    await waitFor(() => expect(names()).toEqual(['álgebra', 'Física', 'Matemáticas']));
    expect(screen.queryByText(/clases?/i)).toBeNull();
  });

  it('muestra el error de carga y permite reintentar', async () => {
    themesApiMock.list
      .mockRejectedValueOnce(new Error('Backend caído'))
      .mockImplementation(async () => catalogue.map((theme) => ({ ...theme })));

    renderDialog();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Backend caído');

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(names()).toEqual(['Física', 'Matemáticas']));
    expect(themesApiMock.list).toHaveBeenCalledTimes(2);
  });
});

describe('ThemesDialog · alta', () => {
  it('crea una temática y la deja en la lista', async () => {
    themesApiMock.create.mockImplementation(async (name) => {
      const created = buildTheme({ id: 'theme-3', name });
      catalogue = [...catalogue, created];
      return created;
    });

    renderDialog();
    await waitFor(() => expect(names()).toEqual(['Física', 'Matemáticas']));

    fireEvent.change(screen.getByLabelText('Nombre de la nueva temática'), {
      target: { value: 'Álgebra' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(names()).toEqual(['Álgebra', 'Física', 'Matemáticas']));
    expect(themesApiMock.create).toHaveBeenCalledWith('Álgebra');
    expect(screen.getByLabelText('Nombre de la nueva temática').value).toBe('');
  });

  it('muestra el duplicado sin cerrar el diálogo ni perder el texto', async () => {
    themesApiMock.create.mockRejectedValue(
      new ApiError('Ya existe una temática con ese nombre.', 400),
    );

    renderDialog();
    await waitFor(() => expect(names()).toEqual(['Física', 'Matemáticas']));

    const input = screen.getByLabelText('Nombre de la nueva temática');
    fireEvent.change(input, { target: { value: 'matematicas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Ya existe una temática con ese nombre.');
    expect(screen.getByRole('dialog', { name: 'Temáticas' })).toBeTruthy();
    expect(input.value).toBe('matematicas');
    expect(names()).toEqual(['Física', 'Matemáticas']);
  });
});

describe('ThemesDialog · renombrado', () => {
  it('abre el campo con el nombre actual, guarda y refresca la lista', async () => {
    themesApiMock.rename.mockImplementation(async (id, name) => {
      catalogue = catalogue.map((theme) => (theme.id === id ? { ...theme, name } : theme));
      return catalogue.find((theme) => theme.id === id);
    });

    renderDialog();
    await waitFor(() => expect(names()).toEqual(['Física', 'Matemáticas']));

    fireEvent.click(screen.getAllByRole('button', { name: 'Renombrar' })[1]);

    const input = screen.getByLabelText('Nuevo nombre');
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('Matemáticas');

    fireEvent.change(input, { target: { value: 'Matemáticas avanzadas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(names()).toEqual(['Física', 'Matemáticas avanzadas']),
    );
    expect(themesApiMock.rename).toHaveBeenCalledWith('theme-1', 'Matemáticas avanzadas');
  });

  it('muestra el error de renombrado y conserva el nombre anterior', async () => {
    themesApiMock.rename.mockRejectedValue(
      new ApiError('Ya existe una temática con ese nombre.', 400),
    );

    renderDialog();
    await waitFor(() => expect(names()).toEqual(['Física', 'Matemáticas']));

    fireEvent.click(screen.getAllByRole('button', { name: 'Renombrar' })[1]);
    fireEvent.change(screen.getByLabelText('Nuevo nombre'), {
      target: { value: 'Física' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Ya existe una temática con ese nombre.');
    expect(screen.getByLabelText('Nuevo nombre').value).toBe('Física');

    // Al cancelar la edición, el catálogo conserva los dos nombres anteriores.
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(names()).toEqual(['Física', 'Matemáticas']);
  });

  it('Escape cancela solo la edición sin cerrar el diálogo', async () => {
    const documentKeyDown = vi.fn();
    document.addEventListener('keydown', documentKeyDown);

    renderDialog();
    await waitFor(() => expect(names()).toEqual(['Física', 'Matemáticas']));

    fireEvent.click(screen.getAllByRole('button', { name: 'Renombrar' })[0]);
    fireEvent.keyDown(screen.getByLabelText('Nuevo nombre'), { key: 'Escape' });

    expect(screen.queryByLabelText('Nuevo nombre')).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Temáticas' })).toBeTruthy();
    expect(documentKeyDown).not.toHaveBeenCalled();

    document.removeEventListener('keydown', documentKeyDown);
  });
});

describe('ThemesDialog · borrado', () => {
  it('abre la confirmación de borrado de la temática elegida', async () => {
    renderDialog();
    await waitFor(() => expect(names()).toEqual(['Física', 'Matemáticas']));

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[1]);

    expect(screen.getByRole('dialog', { name: 'Eliminar temática' })).toBeTruthy();
    expect(screen.getByText(/No tiene clases asociadas/)).toBeTruthy();
  });
});
