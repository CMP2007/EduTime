import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';

import { sessionsRepository } from '../src/sessions/sessions.repository.js';
import { themesRepository } from '../src/themes/themes.repository.js';
import { themesService } from '../src/themes/themes.service.js';

afterEach(() => {
  mock.restoreAll();
});

function buildTheme(id, name) {
  return { id, name };
}

function mockReads({ themes = [], sessions = [] } = {}) {
  mock.method(themesRepository, 'findAll', async () => structuredClone(themes));
  mock.method(sessionsRepository, 'findAll', async () => structuredClone(sessions));
}

describe('themesService.list · catálogo ordenado', () => {
  it('ordena alfabéticamente en español y cuenta las clases de cada temática', async () => {
    mockReads({
      themes: [
        buildTheme('t1', 'Matemáticas'),
        buildTheme('t2', 'álgebra'),
        buildTheme('t3', 'Física'),
      ],
      sessions: [
        { id: 's1', themeId: 't1' },
        { id: 's2', themeId: 't1' },
        { id: 's3', themeId: 't3' },
      ],
    });

    assert.deepEqual(await themesService.list(), [
      { id: 't2', name: 'álgebra', sessionCount: 0 },
      { id: 't3', name: 'Física', sessionCount: 1 },
      { id: 't1', name: 'Matemáticas', sessionCount: 2 },
    ]);
  });

  it('devuelve una lista vacía si no hay temáticas', async () => {
    mockReads();

    assert.deepEqual(await themesService.list(), []);
  });
});

describe('themesService.create · alta', () => {
  it('crea la temática con id, nombre recortado y cero clases', async () => {
    mockReads();
    const insert = mock.method(themesRepository, 'insert', async (theme) => theme);

    const created = await themesService.create({ name: '  Matemáticas  ' });

    assert.equal(created.name, 'Matemáticas');
    assert.equal(created.sessionCount, 0);
    assert.equal(typeof created.id, 'string');
    assert.ok(created.id.length > 0);
    assert.deepEqual(insert.mock.calls[0].arguments[0], {
      id: created.id,
      name: 'Matemáticas',
    });
  });

  it('rechaza un duplicado por nombre normalizado sin insertar', async () => {
    mockReads({ themes: [buildTheme('t1', 'Matemáticas')] });
    const insert = mock.method(themesRepository, 'insert', async (theme) => theme);

    await assert.rejects(() => themesService.create({ name: '  matematicas ' }), {
      name: 'ValidationError',
      message: 'Ya existe una temática con ese nombre.',
    });

    assert.equal(insert.mock.callCount(), 0);
  });

  it('rechaza nombres vacíos o demasiado largos sin insertar', async () => {
    mockReads();
    const insert = mock.method(themesRepository, 'insert', async (theme) => theme);

    await assert.rejects(() => themesService.create({ name: '   ' }), {
      message: 'El nombre de la temática es obligatorio.',
    });
    await assert.rejects(() => themesService.create({ name: 'x'.repeat(81) }), {
      message: 'El nombre de la temática no puede superar 80 caracteres.',
    });

    assert.equal(insert.mock.callCount(), 0);
  });
});

describe('themesService.rename · renombrado', () => {
  it('devuelve null si la temática no existe', async () => {
    mockReads();
    const update = mock.method(themesRepository, 'update', async (id, changes) => ({ id, ...changes }));

    assert.equal(await themesService.rename('no-existe', { name: 'Otra' }), null);
    assert.equal(update.mock.callCount(), 0);
  });

  it('acepta el mismo nombre exacto sin escribir y devuelve el conteo', async () => {
    mockReads({ themes: [buildTheme('t1', 'Matemáticas')], sessions: [{ id: 's1', themeId: 't1' }] });
    mock.method(sessionsRepository, 'countByThemeId', async () => 1);
    const update = mock.method(themesRepository, 'update', async (id, changes) => ({ id, ...changes }));

    assert.deepEqual(await themesService.rename('t1', { name: 'Matemáticas' }), {
      id: 't1',
      name: 'Matemáticas',
      sessionCount: 1,
    });
    assert.equal(update.mock.callCount(), 0);
  });

  it('actualiza el nombre visible si solo cambian mayúsculas o tildes', async () => {
    mockReads({ themes: [buildTheme('t1', 'matematicas')] });
    mock.method(sessionsRepository, 'countByThemeId', async () => 0);
    const update = mock.method(themesRepository, 'update', async (id, changes) => ({
      id,
      ...changes,
    }));

    assert.deepEqual(await themesService.rename('t1', { name: 'Matemáticas' }), {
      id: 't1',
      name: 'Matemáticas',
      sessionCount: 0,
    });
    assert.deepEqual(update.mock.calls[0].arguments, ['t1', { name: 'Matemáticas' }]);
  });

  it('rechaza un nombre que coincide con otra temática y conserva el anterior', async () => {
    mockReads({
      themes: [buildTheme('t1', 'Matemáticas'), buildTheme('t2', 'Física')],
    });
    mock.method(sessionsRepository, 'countByThemeId', async () => 0);
    const update = mock.method(themesRepository, 'update', async (id, changes) => ({
      id,
      ...changes,
    }));

    await assert.rejects(() => themesService.rename('t2', { name: 'MATEMATICAS' }), {
      name: 'ValidationError',
      message: 'Ya existe una temática con ese nombre.',
    });

    assert.equal(update.mock.callCount(), 0);
  });

  it('rechaza nombres inválidos sin escribir', async () => {
    mockReads({ themes: [buildTheme('t1', 'Matemáticas')] });
    const update = mock.method(themesRepository, 'update', async (id, changes) => ({
      id,
      ...changes,
    }));

    await assert.rejects(() => themesService.rename('t1', { name: '  ' }), {
      message: 'El nombre de la temática es obligatorio.',
    });
    await assert.rejects(() => themesService.rename('t1', { name: 'x'.repeat(81) }), {
      message: 'El nombre de la temática no puede superar 80 caracteres.',
    });

    assert.equal(update.mock.callCount(), 0);
  });
});

describe('themesService.remove · eliminación', () => {
  it('elimina una temática sin clases y no toca las clases', async () => {
    mockReads({ themes: [buildTheme('t1', 'Matemáticas')] });
    const count = mock.method(sessionsRepository, 'countByThemeId', async () => 0);
    const removeTheme = mock.method(themesRepository, 'remove', async () => true);
    const reassign = mock.method(sessionsRepository, 'reassignTheme', async () => {});
    const removeSessions = mock.method(sessionsRepository, 'removeByThemeId', async () => {});

    assert.equal(await themesService.remove('t1'), true);

    assert.equal(count.mock.callCount(), 1);
    assert.deepEqual(removeTheme.mock.calls[0].arguments, ['t1']);
    assert.equal(reassign.mock.callCount(), 0);
    assert.equal(removeSessions.mock.callCount(), 0);
  });

  it('reasigna las clases antes de eliminar la temática', async () => {
    const calls = [];
    mockReads({
      themes: [buildTheme('t1', 'Matemáticas'), buildTheme('t2', 'Física')],
    });
    mock.method(sessionsRepository, 'countByThemeId', async () => 2);
    mock.method(sessionsRepository, 'reassignTheme', async (from, to) => {
      calls.push(['reassign', from, to]);
    });
    mock.method(themesRepository, 'remove', async (id) => {
      calls.push(['remove', id]);
      return true;
    });

    assert.equal(await themesService.remove('t1', { strategy: 'reassign', targetThemeId: 't2' }), true);

    assert.deepEqual(calls, [
      ['reassign', 't1', 't2'],
      ['remove', 't1'],
    ]);
  });

  it('exige una temática destino distinta y existente sin modificar nada', async () => {
    mockReads({
      themes: [buildTheme('t1', 'Matemáticas'), buildTheme('t2', 'Física')],
    });
    mock.method(sessionsRepository, 'countByThemeId', async () => 1);
    const reassign = mock.method(sessionsRepository, 'reassignTheme', async () => {});
    const removeTheme = mock.method(themesRepository, 'remove', async () => true);

    await assert.rejects(() => themesService.remove('t1', { strategy: 'reassign' }), {
      message: 'Elige una temática de destino para reasignar las clases.',
    });
    await assert.rejects(
      () => themesService.remove('t1', { strategy: 'reassign', targetThemeId: 't1' }),
      { message: 'La temática de destino debe ser distinta de la que se elimina.' },
    );
    await assert.rejects(
      () => themesService.remove('t1', { strategy: 'reassign', targetThemeId: 'no-existe' }),
      { message: 'La temática de destino no existe.' },
    );

    assert.equal(reassign.mock.callCount(), 0);
    assert.equal(removeTheme.mock.callCount(), 0);
  });

  it('elimina las clases antes de eliminar la temática con strategy delete', async () => {
    const calls = [];
    mockReads({ themes: [buildTheme('t1', 'Matemáticas')] });
    mock.method(sessionsRepository, 'countByThemeId', async () => 3);
    mock.method(sessionsRepository, 'removeByThemeId', async (id) => {
      calls.push(['removeSessions', id]);
    });
    mock.method(themesRepository, 'remove', async (id) => {
      calls.push(['remove', id]);
      return true;
    });

    assert.equal(await themesService.remove('t1', { strategy: 'delete' }), true);

    assert.deepEqual(calls, [
      ['removeSessions', 't1'],
      ['remove', 't1'],
    ]);
  });

  it('rechaza una estrategia ausente o desconocida si hay clases', async () => {
    mockReads({ themes: [buildTheme('t1', 'Matemáticas')] });
    mock.method(sessionsRepository, 'countByThemeId', async () => 1);
    const reassign = mock.method(sessionsRepository, 'reassignTheme', async () => {});
    const removeSessions = mock.method(sessionsRepository, 'removeByThemeId', async () => {});
    const removeTheme = mock.method(themesRepository, 'remove', async () => true);

    await assert.rejects(() => themesService.remove('t1', {}), {
      message:
        'Elige qué hacer con las clases: reasignarlas a otra temática o eliminarlas junto con la temática.',
    });
    await assert.rejects(() => themesService.remove('t1', { strategy: 'otra' }), {
      name: 'ValidationError',
    });

    assert.equal(reassign.mock.callCount(), 0);
    assert.equal(removeSessions.mock.callCount(), 0);
    assert.equal(removeTheme.mock.callCount(), 0);
  });

  it('devuelve false si la temática no existe', async () => {
    mockReads();
    const count = mock.method(sessionsRepository, 'countByThemeId', async () => 0);
    const removeTheme = mock.method(themesRepository, 'remove', async () => true);

    assert.equal(await themesService.remove('no-existe'), false);
    assert.equal(count.mock.callCount(), 0);
    assert.equal(removeTheme.mock.callCount(), 0);
  });
});
