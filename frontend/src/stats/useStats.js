import { useCallback, useEffect, useState } from 'react';
import { statsApi } from './stats.api.js';

/** Carga las métricas calculadas por el backend. */
export function useStats({ period, date, heatmap, heatmapDate }, version = 0) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await statsApi.get({ period, date, heatmap, heatmapDate });
      setStats(data);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [period, date, heatmap, heatmapDate, version]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { stats, loading, error, reload };
}
