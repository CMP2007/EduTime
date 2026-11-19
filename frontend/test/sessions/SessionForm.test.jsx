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

async function renderReadyForm(props = {}) {
  const result = renderForm(props);
  await screen.findByLabelText('Temática');
  return result;
}

function chooseTheme(value = 'theme-1') {
  fireEvent.change(screen.getByLabelText('Temática'), { target: { value } });
}

function setDuration(hours, minutes) {
  const [hoursInput, minutesInput] = screen.getAllByRole('spinbutton');
  fireEvent.change(hoursInput, { target: { value: hours } });
  fireEvent.change(minutesInput, { target: { value: minutes } });
  return [hoursInput, minutesInput];
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
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

describe('SessionForm · validación de la duración (T2)', () => {
  it('con duración inválida no envía y conserva los valores escritos', async () => {
    const { onSubmit } = await renderReadyForm();

    chooseTheme();
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-11-18' } });
    setDuration('1.5', '30');
    fireEvent.change(screen.getByLabelText(/Observaciones/), { target: { value: 'Repasar' } });
    submit();

    expect(
      screen.getByText('Las horas deben ser un número entero mayor o igual que 0.'),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Temática').value).toBe('theme-1');
    expect(screen.getByLabelText('Fecha').value).toBe('2026-11-18');
    const [hoursInput, minutesInput] = screen.getAllByRole('spinbutton');
    expect(hoursInput.value).toBe('1.5');
    expect(minutesInput.value).toBe('30');
    expect(screen.getByLabelText(/Observaciones/).value).toBe('Repasar');
    expect(screen.getByRole('button', { name: 'Guardar' }).disabled).toBe(false);
  });

  it('24 h muestra el máximo de 23:59', async () => {
    const { onSubmit } = await renderReadyForm();

    chooseTheme();
    setDuration('24', '0');
    submit();

    expect(screen.getByText('La clase no puede superar las 23:59.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('1e2 h se interpreta como 100 y muestra el máximo', async () => {
    const { onSubmit } = await renderReadyForm();

    chooseTheme();
    setDuration('1e2', '0');
    submit();

    expect(screen.getByText('La clase no puede superar las 23:59.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('0 h 10 min muestra el mínimo de 15 minutos', async () => {
    const { onSubmit } = await renderReadyForm();

    chooseTheme();
    setDuration('0', '10');
    submit();

    expect(screen.getByText('La clase debe durar al menos 15 minutos.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('0 h 60 min muestra el mensaje de los minutos', async () => {
    const { onSubmit } = await renderReadyForm();

    chooseTheme();
    setDuration('0', '60');
    submit();

    expect(screen.getByText('Los minutos deben ser un número entero entre 0 y 59.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('con duración válida envía los enteros interpretados', async () => {
    const { onSubmit } = await renderReadyForm();

    chooseTheme();
    setDuration('1', '');
    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ hours: 1, minutes: 0 }),
      ),
    );
  });
});

describe('SessionForm · anuncio y asociación del error de duración (T3)', () => {
  it('anuncia el error como alerta sin mover el foco', async () => {
    await renderReadyForm();

    chooseTheme();
    setDuration('0', '10');
    const submitButton = screen.getByRole('button', { name: 'Guardar' });
    submitButton.focus();
    submit();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('La clase debe durar al menos 15 minutos.');
    expect(document.activeElement).toBe(submitButton);
  });

  it('asocia el mensaje al grupo de horas y minutos', async () => {
    await renderReadyForm();

    chooseTheme();
    setDuration('0', '10');
    submit();

    const alert = screen.getByRole('alert');
    expect(alert.id).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Duración' }).getAttribute('aria-describedby'))
      .toBe(alert.id);
  });

  it('marca solo horas cuando el error es de horas', async () => {
    await renderReadyForm();

    chooseTheme();
    setDuration('1.5', '30');
    submit();

    expect(screen.getByLabelText('horas').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('minutos').getAttribute('aria-invalid')).toBeNull();
  });

  it('marca ambos controles en el error de mínimo', async () => {
    await renderReadyForm();

    chooseTheme();
    setDuration('0', '10');
    submit();

    expect(screen.getByLabelText('horas').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('minutos').getAttribute('aria-invalid')).toBe('true');
  });

  it('marca ambos controles en el error de máximo', async () => {
    await renderReadyForm();

    chooseTheme();
    setDuration('24', '0');
    submit();

    expect(screen.getByLabelText('horas').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('minutos').getAttribute('aria-invalid')).toBe('true');
  });

  it('deja de marcar los controles cuando el error desaparece', async () => {
    await renderReadyForm();

    chooseTheme();
    setDuration('0', '10');
    submit();
    expect(screen.getByLabelText('horas').getAttribute('aria-invalid')).toBe('true');

    fireEvent.change(screen.getByLabelText('minutos'), { target: { value: '30' } });

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('horas').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByLabelText('minutos').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByRole('group', { name: 'Duración' }).getAttribute('aria-describedby'))
      .toBeNull();
  });
});

describe('SessionForm · error de temática y aviso preventivo (T4)', () => {
  it('asocia el error de temática al selector y lo marca', async () => {
    await renderReadyForm();

    setDuration('1', '0');
    submit();

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('La temática es obligatoria.');
    expect(screen.getByLabelText('Temática').getAttribute('aria-describedby')).toBe(alert.id);
    expect(screen.getByLabelText('Temática').getAttribute('aria-invalid')).toBe('true');
  });

  it('asocia y anuncia el aviso preventivo de una temática inexistente', async () => {
    await renderReadyForm({
      session: {
        id: 'session-1',
        themeId: 'theme-deleted',
        date: '2026-10-15',
        durationMinutes: 60,
        notes: '',
      },
    });

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('La temática de esta clase ya no existe. Elige otra.');
    expect(alert.id).toBeTruthy();
    expect(screen.getByLabelText('Temática').getAttribute('aria-describedby')).toBe(alert.id);
    expect(screen.getByLabelText('Temática').getAttribute('aria-invalid')).toBe('true');
  });

  it('al enviar con el aviso visible solo queda el mensaje del envío', async () => {
    const { onSubmit } = await renderReadyForm({
      session: {
        id: 'session-1',
        themeId: 'theme-deleted',
        date: '2026-10-15',
        durationMinutes: 60,
        notes: '',
      },
    });

    submit();

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].textContent).toBe('La temática seleccionada ya no existe. Elige otra.');
    expect(screen.getByLabelText('Temática').getAttribute('aria-describedby'))
      .toBe(alerts[0].id);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('al elegir una temática desaparece el aviso y deja de marcar el selector', async () => {
    await renderReadyForm({
      session: {
        id: 'session-1',
        themeId: 'theme-deleted',
        date: '2026-10-15',
        durationMinutes: 60,
        notes: '',
      },
    });

    chooseTheme();

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Temática').getAttribute('aria-describedby')).toBeNull();
    expect(screen.getByLabelText('Temática').getAttribute('aria-invalid')).toBeNull();
  });

  it('al cambiar la temática se oculta el error de temática del envío', async () => {
    await renderReadyForm();

    submit();
    expect(screen.getByRole('alert').textContent).toBe('La temática es obligatoria.');

    chooseTheme();

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Temática').getAttribute('aria-invalid')).toBeNull();
  });

  it('el error de temática manda sobre un error de duración', async () => {
    await renderReadyForm();

    setDuration('0', '10');
    submit();

    expect(screen.getByRole('alert').textContent).toBe('La temática es obligatoria.');
    expect(screen.getByRole('group', { name: 'Duración' }).getAttribute('aria-describedby'))
      .toBeNull();
    expect(screen.getByLabelText('horas').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByLabelText('minutos').getAttribute('aria-invalid')).toBeNull();
  });
});

describe('SessionForm · error del servidor (T5)', () => {
  it('lo anuncia sin asociarlo a ningún campo ni marcarlo como no válido', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('No se pudo guardar la clase.'));
    await renderReadyForm({ onSubmit });

    chooseTheme();
    setDuration('1', '0');
    submit();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('No se pudo guardar la clase.');
    expect(screen.getByLabelText('Temática').getAttribute('aria-describedby')).toBeNull();
    expect(screen.getByLabelText('Temática').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByRole('group', { name: 'Duración' }).getAttribute('aria-describedby'))
      .toBeNull();
    expect(screen.getByLabelText('horas').getAttribute('aria-invalid')).toBeNull();
    expect(screen.getByLabelText('minutos').getAttribute('aria-invalid')).toBeNull();
  });

  it('permanece al editar la duración y desaparece en el siguiente envío', async () => {
    const onSubmit = vi.fn()
      .mockRejectedValueOnce(new Error('No se pudo guardar la clase.'))
      .mockResolvedValue(undefined);
    await renderReadyForm({ onSubmit });

    chooseTheme();
    setDuration('1', '0');
    submit();
    expect((await screen.findByRole('alert')).textContent)
      .toBe('No se pudo guardar la clase.');

    fireEvent.change(screen.getByLabelText('minutos'), { target: { value: '30' } });
    expect(screen.getByRole('alert').textContent).toBe('No se pudo guardar la clase.');

    submit();

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});

describe('SessionForm · estado de guardado', () => {
  it('con la escritura en curso muestra «Guardando…» y bloquea los controles', async () => {
    renderForm({ saving: true });
    await screen.findByLabelText('Temática');

    expect(screen.getByRole('button', { name: 'Guardando…' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancelar' }).disabled).toBe(true);
  });

  it('sin escritura en curso muestra «Guardar» y permite cancelar', async () => {
    renderForm();
    await screen.findByLabelText('Temática');

    expect(screen.getByRole('button', { name: 'Guardar' }).disabled).toBe(false);
    expect(screen.getByRole('button', { name: 'Cancelar' }).disabled).toBe(false);
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
