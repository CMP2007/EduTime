import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { statsApi } from './stats.api.js';

/** Carga las métricas calculadas por el backend. */
export function useStats({ period, date, heatmap, heatmapDate }) {
  const { versions } = useDataRefresh();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestIdRef = useRef(0);
  const controllerRef = useRef(null);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    // Cualquier petición anterior deja de interesar: se cancela.
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    try {
      const data = await statsApi.get({
        period,
        date,
        heatmap,
        heatmapDate,
        signal: controller.signal,
      });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStats(data);
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
  }, [period, date, heatmap, heatmapDate]);

  useEffect(() => {
    reload();
    return () => controllerRef.current?.abort();
  }, [reload, versions.stats]);

  return { stats, loading, error, reload };
}

