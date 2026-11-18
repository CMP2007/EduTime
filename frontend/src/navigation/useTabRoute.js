import { useCallback, useEffect, useState } from 'react';
import { pathForTab, tabFromHash } from './tabs.js';

/**
 * Mantiene la pestaña activa sincronizada con la dirección.
 *
 * La lectura inicial del hash permite abrir un enlace profundo sin pasar por
 * Inicio. Las direcciones vacías o desconocidas se normalizan con
 * `replaceState` para no dejar una entrada inútil en el historial.
 */
export function useTabRoute() {
  const [tab, setTab] = useState(() => tabFromHash(window.location.hash));

  useEffect(() => {
    const initial = tabFromHash(window.location.hash);
    const initialPath = pathForTab(initial);
    if (window.location.hash !== initialPath) {
      window.history.replaceState(null, '', initialPath);
    }
    setTab(initial);

    function handleHashChange() {
      const next = tabFromHash(window.location.hash);
      const nextPath = pathForTab(next);
      if (window.location.hash !== nextPath) {
        window.history.replaceState(null, '', nextPath);
      }
      setTab(next);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const selectTab = useCallback((id) => {
    const path = pathForTab(id);
    // Asignar el hash que ya está activo es inocuo para el navegador (no crea
    // entrada ni dispara `hashchange`), así que reelegir no recarga la vista.
    window.location.hash = path;
    // La URL y la pestaña visible cambian en el mismo instante; el
    // `hashchange` posterior vuelve a fijar el mismo valor.
    setTab(id);
  }, []);

  return { tab, selectTab };
}
