import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataRefreshProvider, useDataRefresh } from '../../src/context/DataRefreshContext.jsx';
import { useSessionMutations } from '../../src/sessions/useSessionMutations.js';

const { sessionsApiMock } = vi.hoisted(() => ({
  sessionsApiMock: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

vi.mock('../../src/sessions/sessions.api.js', () => ({ sessionsApi: sessionsApiMock }));

let versions = null;

function Probe() {
  versions = useDataRefresh().versions;
  return null;
}

function wrapper({ children }) {
  return (
    <DataRefreshProvider>
      <Probe />
      {children}
    </DataRefreshProvider>
  );
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('useSessionMutations · escrituras de clases', () => {
  beforeEach(() => {
    sessionsApiMock.create.mockReset();
    sessionsApiMock.update.mockReset();
    sessionsApiMock.remove.mockReset();
    versions = null;
  });

  it('crea una clase, refresca las vistas y limpia el error', async () => {
    sessionsApiMock.create.mockResolvedValue({ id: 'session-1' });
    const { result } = renderHook(() => useSessionMutations(), { wrapper });

    let created;
    await act(async () => {
      created = await result.current.createSession({ themeId: 'theme-1' });
    });

    expect(created).toEqual({ id: 'session-1' });
    expect(sessionsApiMock.create).toHaveBeenCalledWith({ themeId: 'theme-1' });
    expect(result.current.saving).toBe(false);
    expect(result.current.error).toBe('');
    expect(versions).toEqual({ sessions: 1, stats: 1, themes: 0 });
  });

  it('marca la operación en curso mientras la petición está pendiente', async () => {
    const pending = deferred();
    sessionsApiMock.create.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useSessionMutations(), { wrapper });

    let promise;
    act(() => {
      promise = result.current.createSession({ themeId: 'theme-1' });
    });
    expect(result.current.saving).toBe(true);

    await act(async () => {
      pending.resolve({ id: 'session-1' });
      await promise;
    });

    expect(result.current.saving).toBe(false);
  });

  it('guarda y relanza el error de creación sin refrescar', async () => {
    sessionsApiMock.create.mockRejectedValue(new Error('No se pudo guardar.'));
    const { result } = renderHook(() => useSessionMutations(), { wrapper });

    let captured;
    await act(async () => {
      try {
        await result.current.createSession({ themeId: 'theme-1' });
      } catch (requestError) {
        captured = requestError;
      }
    });

    expect(captured.message).toBe('No se pudo guardar.');
    expect(result.current.error).toBe('No se pudo guardar.');
    expect(result.current.saving).toBe(false);
    expect(versions).toEqual({ sessions: 0, stats: 0, themes: 0 });
  });

  it('actualiza una clase y refresca las vistas', async () => {
    sessionsApiMock.update.mockResolvedValue({ id: 'session-1' });
    const { result } = renderHook(() => useSessionMutations(), { wrapper });

    await act(async () => {
      await result.current.updateSession('session-1', { notes: 'Repaso' });
    });

    expect(sessionsApiMock.update).toHaveBeenCalledWith('session-1', { notes: 'Repaso' });
    expect(result.current.saving).toBe(false);
    expect(versions.sessions).toBe(1);
  });

  it('elimina una clase, refresca y devuelve true', async () => {
    sessionsApiMock.remove.mockResolvedValue(null);
    const { result } = renderHook(() => useSessionMutations(), { wrapper });

    let removed;
    await act(async () => {
      removed = await result.current.removeSession('session-1');
    });

    expect(removed).toBe(true);
    expect(sessionsApiMock.remove).toHaveBeenCalledWith('session-1');
    expect(result.current.deleting).toBe(false);
    expect(versions.sessions).toBe(1);
  });

  it('guarda el error de borrado y devuelve false', async () => {
    sessionsApiMock.remove.mockRejectedValue(new Error('No se pudo eliminar.'));
    const { result } = renderHook(() => useSessionMutations(), { wrapper });

    let removed;
    await act(async () => {
      removed = await result.current.removeSession('session-1');
    });

    expect(removed).toBe(false);
    expect(result.current.error).toBe('No se pudo eliminar.');
    expect(result.current.deleting).toBe(false);
    expect(versions).toEqual({ sessions: 0, stats: 0, themes: 0 });
  });

  it('marca el borrado en curso y permite limpiar el error', async () => {
    const pending = deferred();
    sessionsApiMock.remove.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useSessionMutations(), { wrapper });

    let promise;
    act(() => {
      promise = result.current.removeSession('session-1');
    });
    expect(result.current.deleting).toBe(true);

    await act(async () => {
      pending.resolve(null);
      await promise;
    });

    expect(result.current.deleting).toBe(false);

    sessionsApiMock.remove.mockRejectedValue(new Error('Fallo posterior.'));
    await act(async () => {
      await result.current.removeSession('session-2');
    });
    expect(result.current.error).toBe('Fallo posterior.');

    act(() => result.current.clearError());
    expect(result.current.error).toBe('');
  });
});
