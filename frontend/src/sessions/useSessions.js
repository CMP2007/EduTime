import { useCallback, useEffect, useRef, useState } from 'react';
import { compareDateStrings, isValidDateString } from 'domain-dates';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { sessionsApi } from './sessions.api.js';

/** Carga las clases (con filtros opcionales) y las mantiene actualizadas. */
export function useSessions(filters = {}) {
  const { versions } = useDataRefresh();
  const { from = '', to = '', q = '' } = filters;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);

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

    if (hasInvertedRange) {
      // Invalida cualquier petición en vuelo y conserva listado y error.
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await sessionsApi.list({ from, to, q });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setSessions(data);
      setError('');
    } catch (requestError) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(requestError.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [from, to, q, hasInvertedRange]);

  useEffect(() => {
    reload();
  }, [reload, versions.sessions]);

  return { sessions, loading, error, reload, hasInvertedRange };
}

