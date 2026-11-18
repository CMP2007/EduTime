import { useCallback, useState } from 'react';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { sessionsApi } from './sessions.api.js';

/**
 * Centraliza las escrituras de clases y su estado.
 *
 * `createSession` y `updateSession` relanzan el error para que el formulario
 * pueda mostrar su mensaje inline; `removeSession` devuelve `true`/`false`
 * para que el diálogo solo se cierre cuando el borrado funciona.
 */
export function useSessionMutations() {
  const { refreshAll } = useDataRefresh();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const clearError = useCallback(() => setError(''), []);

  const createSession = useCallback(
    async (payload) => {
      setSaving(true);
      setError('');
      try {
        const created = await sessionsApi.create(payload);
        refreshAll();
        return created;
      } catch (requestError) {
        setError(requestError.message);
        throw requestError;
      } finally {
        setSaving(false);
      }
    },
    [refreshAll],
  );

  const updateSession = useCallback(
    async (id, payload) => {
      setSaving(true);
      setError('');
      try {
        const updated = await sessionsApi.update(id, payload);
        refreshAll();
        return updated;
      } catch (requestError) {
        setError(requestError.message);
        throw requestError;
      } finally {
        setSaving(false);
      }
    },
    [refreshAll],
  );

  const removeSession = useCallback(
    async (id) => {
      setDeleting(true);
      setError('');
      try {
        await sessionsApi.remove(id);
        refreshAll();
        return true;
      } catch (requestError) {
        setError(requestError.message);
        return false;
      } finally {
        setDeleting(false);
      }
    },
    [refreshAll],
  );

  return {
    createSession,
    updateSession,
    removeSession,
    saving,
    deleting,
    error,
    clearError,
  };
}
