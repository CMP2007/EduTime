import { useEffect, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { useSessions } from '../sessions/useSessions.js';
import { seedApi } from './seed.api.js';

/**
 * Pregunta una sola vez por carga si se quieren cargar datos de ejemplo.
 *
 * Solo aparece cuando la aplicación ha terminado de cargar y no hay ninguna
 * clase. Si el usuario rechaza o cierra, no se vuelve a preguntar en la misma
 * carga; si acepta y la API falla, el diálogo sigue abierto para reintentar.
 */
function SeedPrompt() {
  const { refreshAll } = useDataRefresh();
  const { sessions, loading, error: loadError } = useSessions();
  const [asked, setAsked] = useState(false);
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (asked || loading || loadError) return;

    setAsked(true);
    if (sessions.length === 0) {
      setOpen(true);
    }
  }, [asked, loading, loadError, sessions.length]);

  if (!open) return null;

  function dismiss() {
    if (applying) return;
    setOpen(false);
  }

  async function handleApply() {
    setApplying(true);
    setError('');
    try {
      await seedApi.apply();
      setOpen(false);
      refreshAll();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <Modal title="Datos de ejemplo" onClose={dismiss} labelledBy="seed-prompt-title" size="sm">
      <p className="confirm__message">
        No hay clases registradas. ¿Quieres cargar datos de ejemplo para ver la aplicación en marcha?
        También puedes empezar sin datos y crear tus propias clases.
      </p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="modal__actions">
        <button type="button" className="button button--ghost" onClick={dismiss} disabled={applying}>
          Empezar sin datos
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={handleApply}
          disabled={applying}
        >
          {applying ? 'Cargando…' : 'Cargar datos de ejemplo'}
        </button>
      </div>
    </Modal>
  );
}

export default SeedPrompt;
