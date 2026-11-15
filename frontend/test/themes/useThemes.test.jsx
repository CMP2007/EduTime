import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContractError } from 'domain-contracts';
import { ApiError } from '../../src/api/ApiError.js';
import { DataRefreshProvider, useDataRefresh } from '../../src/context/DataRefreshContext.jsx';
import { useThemes } from '../../src/themes/useThemes.js';
import { buildTheme } from '../fixtures/contracts.js';

const { themesApiMock } = vi.hoisted(() => ({
  themesApiMock: { list: vi.fn(), create: vi.fn(), rename: vi.fn(), remove: vi.fn() },
}));

vi.mock('../../src/themes/themes.api.js', () => ({ themesApi: themesApiMock }));

function wrapper({ children }) {
  return <DataRefreshProvider>{children}</DataRefreshProvider>;
}

/** Promesa controlable para observar estados intermedios. */
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  themesApiMock.list.mockReset();
  themesApiMock.create.mockReset();
});

describe('useThemes · carga del catálogo', () => {
  it('carga y ordena las temáticas con la colación española', async () => {
    themesApiMock.list.mockResolvedValue([
      buildTheme({ id: 't1', name: 'Matemáticas' }),
      buildTheme({ id: 't2', name: 'álgebra' }),
      buildTheme({ id: 't3', name: 'Física' }),
    ]);

    const { result } = renderHook(() => useThemes(), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loaded).toBe(true);

    expect(result.current.themes.map((theme) => theme.name)).toEqual([
      'álgebra',
      'Física',
      'Matemáticas',
    ]);
    expect(result.current.error).toBe('');
  });

  it('expone el error de contrato y deja de cargar', async () => {
    themesApiMock.list.mockRejectedValue(
      new ContractError('/api/themes', '[0].name debe ser un texto'),
    );

    const { result } = renderHook(() => useThemes(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.themes).toEqual([]);
    expect(result.current.error).toBe(
      'La respuesta de /api/themes no cumple el contrato: [0].name debe ser un texto',
    );
  });

  it('no pide la lista mientras está deshabilitado', async () => {
    const { result } = renderHook(() => useThemes({ enabled: false }), { wrapper });

    await act(async () => {});

    expect(result.current.loading).toBe(false);
    expect(result.current.loaded).toBe(false);
    expect(result.current.themes).toEqual([]);
    expect(themesApiMock.list).not.toHaveBeenCalled();
  });

  it('recarga cuando el contexto avisa de un cambio de temáticas', async () => {
    themesApiMock.list.mockResolvedValue([buildTheme()]);

    const { result } = renderHook(
      () => ({ ...useThemes(), ...useDataRefresh() }),
      { wrapper },
    );

    await waitFor(() => expect(themesApiMock.list).toHaveBeenCalledTimes(1));

    act(() => result.current.refreshThemes());

    await waitFor(() => expect(themesApiMock.list).toHaveBeenCalledTimes(2));
  });
});

describe('useThemes · alta de temáticas', () => {
  it('inserta la temática creada ordenada y avisa al contexto', async () => {
    const secondList = deferred();
    themesApiMock.list
      .mockResolvedValueOnce([buildTheme({ id: 't1', name: 'Matemáticas' })])
      .mockReturnValueOnce(secondList.promise);
    themesApiMock.create.mockResolvedValue(buildTheme({ id: 't2', name: 'álgebra' }));

    const { result } = renderHook(() => useThemes(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created;
    await act(async () => {
      created = await result.current.createTheme('álgebra');
    });

    expect(created).toEqual(buildTheme({ id: 't2', name: 'álgebra' }));
    expect(themesApiMock.create).toHaveBeenCalledWith('álgebra');
    expect(result.current.themes.map((theme) => theme.name)).toEqual([
      'álgebra',
      'Matemáticas',
    ]);
    // El aviso al contexto dispara una recarga del catálogo.
    expect(themesApiMock.list).toHaveBeenCalledTimes(2);

    await act(async () => {
      secondList.resolve([
        buildTheme({ id: 't1', name: 'Matemáticas' }),
        buildTheme({ id: 't2', name: 'álgebra' }),
      ]);
    });

    expect(result.current.themes.map((theme) => theme.name)).toEqual([
      'álgebra',
      'Matemáticas',
    ]);
  });

  it('propaga el duplicado sin insertar ni refrescar', async () => {
    themesApiMock.list.mockResolvedValue([buildTheme()]);
    themesApiMock.create.mockRejectedValue(
      new ApiError('Ya existe una temática con ese nombre.', 400),
    );

    const { result } = renderHook(() => useThemes(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let error;
    await act(async () => {
      error = await result.current.createTheme('Matemáticas').catch((caught) => caught);
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(result.current.themes).toEqual([buildTheme()]);
    expect(themesApiMock.list).toHaveBeenCalledTimes(1);
  });
});
