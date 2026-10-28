import { useCallback, useEffect, useRef, useState } from 'react';
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

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
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
  }, [from, to, q]);

  useEffect(() => {
    reload();
  }, [reload, versions.sessions]);

  return { sessions, loading, error, reload };
}

