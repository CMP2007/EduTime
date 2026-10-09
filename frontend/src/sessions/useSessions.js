import { useCallback, useEffect, useState } from 'react';
import { sessionsApi } from './sessions.api.js';

/**
 * Carga las clases (con filtros opcionales) y las mantiene actualizadas.
 * `version` permite recargar cuando otra parte de la app cambia datos.
 */
export function useSessions(filters = {}, version = 0) {
  const { from = '', to = '', q = '' } = filters;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sessionsApi.list({ from, to, q });
      setSessions(data);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [from, to, q, version]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { sessions, loading, error, reload };
}
