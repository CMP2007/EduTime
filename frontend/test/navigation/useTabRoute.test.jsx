import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTabRoute } from '../../src/navigation/useTabRoute.js';

function setHash(hash) {
  window.history.replaceState(null, '', `/${hash}`);
}

describe('useTabRoute · pestañas y URL', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('abre la pestaña de un hash válido sin pasar por Inicio', () => {
    setHash('#/estadisticas');

    const { result } = renderHook(() => useTabRoute());

    expect(result.current.tab).toBe('stats');
    expect(window.location.hash).toBe('#/estadisticas');
  });

  it('normaliza un hash vacío a Inicio sin añadir una entrada', async () => {
    const before = window.history.length;

    const { result } = renderHook(() => useTabRoute());

    await waitFor(() => expect(window.location.hash).toBe('#/inicio'));
    expect(result.current.tab).toBe('home');
    expect(window.history.length).toBe(before);
  });

  it('normaliza un hash desconocido a Inicio sin añadir una entrada', async () => {
    setHash('#/Historial');
    const before = window.history.length;

    const { result } = renderHook(() => useTabRoute());

    await waitFor(() => expect(window.location.hash).toBe('#/inicio'));
    expect(result.current.tab).toBe('home');
    expect(window.history.length).toBe(before);
  });

  it('selecciona una pestaña, actualiza la URL y añade una entrada', async () => {
    const { result } = renderHook(() => useTabRoute());
    const before = window.history.length;

    act(() => result.current.selectTab('history'));

    expect(result.current.tab).toBe('history');
    expect(window.location.hash).toBe('#/historial');
    await waitFor(() => expect(window.history.length).toBe(before + 1));
  });

  it('reelegir la pestaña activa no añade entradas ni cambia la URL', () => {
    const { result } = renderHook(() => useTabRoute());
    const before = window.history.length;

    act(() => result.current.selectTab('home'));

    expect(result.current.tab).toBe('home');
    expect(window.location.hash).toBe('#/inicio');
    expect(window.history.length).toBe(before);
  });

  it('responde a un cambio externo de la dirección', async () => {
    const { result } = renderHook(() => useTabRoute());

    act(() => {
      setHash('#/historial');
      window.dispatchEvent(new Event('hashchange'));
    });

    await waitFor(() => expect(result.current.tab).toBe('history'));
    expect(window.location.hash).toBe('#/historial');
  });

  it('normaliza un cambio externo a una dirección desconocida', async () => {
    const { result } = renderHook(() => useTabRoute());

    act(() => {
      setHash('#/otra');
      window.dispatchEvent(new Event('hashchange'));
    });

    await waitFor(() => expect(window.location.hash).toBe('#/inicio'));
    expect(result.current.tab).toBe('home');
  });

  it('responde a Atrás y Adelante del navegador', async () => {
    const { result } = renderHook(() => useTabRoute());

    act(() => result.current.selectTab('history'));
    act(() => result.current.selectTab('stats'));
    await waitFor(() => expect(result.current.tab).toBe('stats'));

    act(() => window.history.back());
    await waitFor(() => expect(result.current.tab).toBe('history'));
    expect(window.location.hash).toBe('#/historial');

    act(() => window.history.forward());
    await waitFor(() => expect(result.current.tab).toBe('stats'));
    expect(window.location.hash).toBe('#/estadisticas');
  });
});
