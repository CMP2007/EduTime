import { useCallback, useEffect, useRef, useState } from 'react';
import { compareThemeNames } from 'domain-themes';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { themesApi } from './themes.api.js';

/** Ordena una copia de la lista con la colación española del dominio. */
function sortThemes(themes) {
  return [...themes].sort((a, b) => compareThemeNames(a.name, b.name));
}

/**
 * Carga el catálogo de temáticas y permite crear una nueva.
 *
 * `enabled` evita pedir la lista mientras el consumidor está cerrado (por
 * ejemplo, el gestor de temáticas). Crear una temática la inserta en la lista
 * local ordenada y avisa al resto de la aplicación con `refreshThemes`.
 */
export function useThemes({ enabled = true } = {}) {
  const { versions, refreshThemes } = useDataRefresh();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    if (!enabled) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await themesApi.list();
      if (requestId !== requestIdRef.current) return;
      setThemes(sortThemes(data));
      setLoaded(true);
      setError('');
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      setError(requestError.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    reload();
  }, [reload, enabled, versions.themes]);

  const createTheme = useCallback(
    async (name) => {
      const created = await themesApi.create(name);
      setThemes((current) => sortThemes([...current, created]));
      refreshThemes();
      return created;
    },
    [refreshThemes],
  );

  return { themes, loading, loaded, error, reload, createTheme };
}
