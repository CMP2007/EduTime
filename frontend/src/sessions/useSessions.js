import { useCallback, useEffect, useRef, useState } from 'react';
import { compareDateStrings, isValidDateString } from 'domain-dates';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { sessionsApi } from './sessions.api.js';

/**
 * Carga las clases (con filtros opcionales) y las mantiene actualizadas.
 * `enabled` permite esperar a conocer los filtros antes de pedir el listado.
 */
export function useSessions(filters = {}, { enabled = true } = {}) {
  const { versions } = useDataRefresh();
  const { from = '', to = '', q = '', themeId = '' } = filters;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  // Solo se considera invertido si ambos extremos son fechas válidas: un filtro
  // mal formado debe llegar a la API para que el backend lo rechace.
  const hasInvertedRange =
    Boolean(from) &&
    Boolean(to) &&
    isValidDateString(from) &&
    isValidDateString(to) &&
    compareDateStrings(from, to) > 0;

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    // Cualquier petición anterior deja de interesar: se cancela.
    controllerRef.current?.abort();

    if (!enabled) {
      // Sin filtros que consultar todavía: no se pide nada.
      setLoading(false);
      return;
    }

    if (hasInvertedRange) {
      // Invalida cualquier petición en vuelo y conserva listado y error.
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const data = await sessionsApi.list({ from, to, q, themeId, signal: controller.signal });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setSessions(data);
      setError('');
    } catch (requestError) {
      if (requestError?.name === 'AbortError' || requestId !== requestIdRef.current) {
        return;
      }
      setError(requestError.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [from, to, q, themeId, hasInvertedRange, enabled]);

  useEffect(() => {
    reload();
    return () => controllerRef.current?.abort();
  }, [reload, versions.sessions]);

  return { sessions, loading, error, reload, hasInvertedRange };
}

