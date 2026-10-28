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

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await statsApi.get({ period, date, heatmap, heatmapDate });
      if (requestId !== requestIdRef.current) {
        return;
      }
      setStats(data);
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
  }, [period, date, heatmap, heatmapDate]);

  useEffect(() => {
    reload();
  }, [reload, versions.stats]);

  return { stats, loading, error, reload };
}

