import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataRefreshProvider } from '../../src/context/DataRefreshContext.jsx';
import SessionForm from '../../src/sessions/SessionForm.jsx';
import { buildTheme } from '../fixtures/contracts.js';

const { themesApiMock } = vi.hoisted(() => ({
  themesApiMock: { list: vi.fn(), create: vi.fn(), rename: vi.fn(), remove: vi.fn() },
}));

vi.mock('../../src/themes/themes.api.js', () => ({ themesApi: themesApiMock }));

const THEMES = [
  buildTheme({ id: 'theme-1', name: 'Matemáticas' }),
  buildTheme({ id: 'theme-2', name: 'Física' }),
];

let catalogue;

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function renderForm(props = {}) {
  const onClose = props.onClose ?? vi.fn();
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined);

  render(
    <DataRefreshProvider>
      <SessionForm open session={null} onClose={onClose} onSubmit={onSubmit} {...props} />
    </DataRefreshProvider>,
  );

  return { onClose, onSubmit };
}

function openCreateField() {
  fireEvent.click(screen.getByRole('button', { name: 'Crear temática' }));
  return screen.getByLabelText('Nombre de la nueva temática');
}

async function createThemeInForm(name) {
  const input = openCreateField();
  fireEvent.change(input, { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
  await waitFor(
    () => expect(screen.getByRole('combobox').value).not.toBe(''),
    { timeout: 3000 },
  );
  // El alta cierra el campo después de resolver la promesa; esperar a que
  // desaparezca evita que un Escape posterior caiga en el campo inline.
  await waitFor(
    () => expect(screen.queryByLabelText('Nombre de la nueva temática')).toBeNull(),
    { timeout: 3000 },
  );
}

beforeEach(() => {
  themesApiMock.list.mockReset();
  themesApiMock.create.mockReset();

  catalogue = THEMES;
  themesApiMock.list.mockImplementation(async () => catalogue.map((theme) => ({ ...theme })));
  themesApiMock.create.mockImplementation(async (name) => {
    const created = buildTheme({ id: `theme-${catalogue.length + 1}`, name });
    catalogue = [...catalogue, created];
    return created;
  });
});

describe('SessionForm · catálogo de temáticas (T17)', () => {
  it('con el catálogo vacío desactiva Guardar y ofrece crear', async () => {
    themesApiMock.list.mockResolvedValue([]);

    renderForm();

    expect(await screen.findByText('No hay temáticas. Crea una con el botón «+».')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Crear temática' })).toBeTruthy();
  });

  it('muestra la carga y desactiva Guardar hasta tener el catálogo', async () => {
    const pending = deferred();
    themesApiMock.list.mockReturnValue(pending.promise);

    renderForm();

    expect(screen.getByText('Cargando temáticas…')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Guardar' }).disabled).toBe(true);
    expect(document.activeElement).toBe(screen.getByLabelText('Fecha'));

    await act(async () => {
      pending.resolve(THEMES);
    });

    expect(await screen.findByLabelText('Temática')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Fecha'));
    expect(screen.getByRole('button', { name: 'Guardar' }).disabled).toBe(false);
  });

  it('al abrirse no pierde el foco mientras carga el catálogo', async () => {
    const pending = deferred();
    themesApiMock.list.mockReturnValue(pending.promise);
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    function form(open) {
      return (
        <DataRefreshProvider>
          <SessionForm open={open} session={null} onClose={onClose} onSubmit={onSubmit} />
        </DataRefreshProvider>
      );
    }

    const { rerender } = render(form(false));
    rerender(form(true));

    expect(screen.getByText('Cargando temáticas…')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'Nueva clase' }).contains(document.activeElement))
      .toBe(true);
    expect(document.activeElement).toBe(screen.getByLabelText('Fecha'));

    await act(async () => {
      pending.resolve(THEMES);
    });

    expect(await screen.findByLabelText('Temática')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Fecha'));
  });

  it('muestra el error de carga y permite reintentar', async () => {
    themesApiMock.list
      .mockRejectedValueOnce(new Error('Backend caído'))
      .mockResolvedValue(THEMES);

    renderForm();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Backend caído');
    expect(screen.getByRole('button', { name: 'Guardar' }).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByLabelText('Temática')).toBeTruthy();
    expect(themesApiMock.list).toHaveBeenCalledTimes(2);
  });

  it('exige elegir una temática antes de guardar', async () => {
    const { onSubmit } = renderForm();
    await screen.findByLabelText('Temática');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByText('La temática es obligatoria.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('preselecciona la temática de la clase al editar y la envía', async () => {
    const session = {
      id: 'session-1',
      themeId: 'theme-2',
      date: '2026-10-15',
      durationMinutes: 90,
      notes: '',
    };
    const { onSubmit } = renderForm({ session });

    const select = await screen.findByLabelText('Temática');
    expect(select.value).toBe('theme-2');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        themeId: 'theme-2',
        date: '2026-10-15',
        hours: 1,
        minutes: 30,
        notes: '',
      }),
    );
  });

  it('avisa si la temática de la clase ya no existe y exige elegir otra', async () => {
    const session = {
      id: 'session-1',
      themeId: 'theme-deleted',
      date: '2026-10-15',
      durationMinutes: 60,
      notes: '',
    };
    const { onSubmit } = renderForm({ session });

    const select = await screen.findByLabelText('Temática');
    expect(
      screen.getByText('La temática de esta clase ya no existe. Elige otra.'),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(
      screen.getByText('La temática seleccionada ya no existe. Elige otra.'),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(select, { target: { value: 'theme-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ themeId: 'theme-1' })),
    );
  });
});

describe('SessionForm · alta inline (T18)', () => {
  it('crea una temática, la selecciona y la deja disponible', async () => {
    renderForm();
    await screen.findByLabelText('Temática');

    await createThemeInForm('Álgebra');

    expect(themesApiMock.create).toHaveBeenCalledWith('Álgebra');
    expect(screen.getByRole('option', { name: 'Álgebra' })).toBeTruthy();
    expect(screen.getByLabelText('Temática').value).toBe('theme-3');
  });

  it('si el alta falla mantiene el campo abierto con el error', async () => {
    themesApiMock.create.mockRejectedValue(new Error('Ya existe una temática con ese nombre.'));

    renderForm();
    await screen.findByLabelText('Temática');

    const input = openCreateField();
    fireEvent.change(input, { target: { value: 'Matemáticas' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Ya existe una temática con ese nombre.')).toBeTruthy();
    expect(screen.getByLabelText('Nombre de la nueva temática').value).toBe('Matemáticas');
  });

  it('Escape en el campo inline cierra solo el campo, no el formulario', async () => {
    renderForm();
    await screen.findByLabelText('Temática');

    const input = openCreateField();
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByLabelText('Nombre de la nueva temática')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Crear temática' }));
    expect(screen.getByRole('dialog', { name: 'Nueva clase' })).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'Temáticas creadas' })).toBeNull();
  });

  it('al cancelar con temáticas creadas muestra el aviso y cierra el formulario', async () => {
    const { onClose } = renderForm();
    await screen.findByLabelText('Temática');
    await createThemeInForm('Álgebra');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    const notice = screen.getByRole('dialog', { name: 'Temáticas creadas' });
    expect(within(notice).getByText('Álgebra')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('al cerrar con «×» muestra el aviso', async () => {
    renderForm();
    await screen.findByLabelText('Temática');
    await createThemeInForm('Álgebra');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(screen.getByRole('dialog', { name: 'Temáticas creadas' })).toBeTruthy();
  });

  it('al cerrar con Escape muestra el aviso', async () => {
    renderForm();
    await screen.findByLabelText('Temática');
    await createThemeInForm('Álgebra');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.getByRole('dialog', { name: 'Temáticas creadas' })).toBeTruthy();
  });

  it('permite guardar mientras se recarga el catálogo tras crear una temática', async () => {
    const pending = deferred();
    themesApiMock.list
      .mockResolvedValueOnce(THEMES)
      .mockReturnValueOnce(pending.promise);

    const { onSubmit } = renderForm();
    await screen.findByLabelText('Temática');
    await createThemeInForm('Álgebra');

    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(
      () => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ themeId: 'theme-3' })),
      { timeout: 3000 },
    );

    await act(async () => {
      pending.resolve(THEMES);
    });
  });

  it('guardar no muestra el aviso de temáticas creadas', async () => {
    const { onSubmit } = renderForm();
    await screen.findByLabelText('Temática');
    await createThemeInForm('Álgebra');

    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(
      () => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ themeId: 'theme-3' })),
      { timeout: 3000 },
    );
    expect(screen.queryByRole('dialog', { name: 'Temáticas creadas' })).toBeNull();
  });
});
