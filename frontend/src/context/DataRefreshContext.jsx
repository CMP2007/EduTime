import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const DataRefreshContext = createContext(null);

export function DataRefreshProvider({ children }) {
  const [versions, setVersions] = useState({
    sessions: 0,
    stats: 0
  });

  const bump = useCallback((key) => {
    setVersions((current) => ({
      ...current,
      [key]: (current[key] || 0) + 1
    }));
  }, []);

  const refreshSessions = useCallback(() => {
    bump('sessions');
  }, [bump]);

  const refreshStats = useCallback(() => {
    bump('stats');
  }, [bump]);

  const refreshAll = useCallback(() => {
    bump('sessions');
    bump('stats');
  }, [bump]);

  const value = useMemo(
    () => ({
      versions,
      bump,
      refreshSessions,
      refreshStats,
      refreshAll
    }),
    [versions, bump, refreshSessions, refreshStats, refreshAll]
  );

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh debe usarse dentro de DataRefreshProvider');
  }
  return context;
}
