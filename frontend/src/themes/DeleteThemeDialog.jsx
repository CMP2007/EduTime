import { useState } from 'react';
import { compareThemeNames } from 'domain-themes';
import Modal from '../components/Modal.jsx';
import { themesApi } from './themes.api.js';

/**
 * Confirma el borrado de una temática.
 *
 * Sin clases basta con confirmar. Con clases obliga a elegir: reasignarlas a
 * otra temática o eliminarlas junto con la temática. Si no hay otra temática,
 * la reasignación no está disponible y se explica por qué.
 */
function DeleteThemeDialog({ theme, themes = [], onClose, onDeleted }) {
  const targets = themes
    .filter((candidate) => candidate.id !== theme.id)
    .sort((a, b) => compareThemeNames(a.name, b.name));
  const hasSessions = theme.sessionCount > 0;
  const [strategy, setStrategy] = useState('');
  const [targetThemeId, setTargetThemeId] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canConfirm = !hasSessions
    || strategy === 'delete'
    || (strategy === 'reassign' && Boolean(targetThemeId));

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canConfirm || deleting) return;

    setDeleting(true);
    setError('');
    try {
      if (!hasSessions) {
        await themesApi.remove(theme.id);
      } else if (strategy === 'reassign') {
        await themesApi.remove(theme.id, { strategy, targetThemeId });
      } else {
        await themesApi.remove(theme.id, { strategy: 'delete' });
      }
      onDeleted();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal title="Eliminar temática" onClose={onClose} labelledBy="delete-theme-dialog-title" size="sm">
      <form onSubmit={handleSubmit}>
        {!hasSessions && (
          <p className="confirm__message">
            ¿Eliminar la temática «{theme.name}»? No tiene clases asociadas.
          </p>
        )}

        {hasSessions && (
          <>
            <p className="confirm__message">
              La temática «{theme.name}» tiene {theme.sessionCount}{' '}
              {theme.sessionCount === 1 ? 'clase' : 'clases'}. ¿Qué quieres hacer?
            </p>

            <fieldset className="field delete-theme__options">
              <legend className="field__label">Clases asociadas</legend>

              <label className="delete-theme__option">
                <input
                  type="radio"
                  name="strategy"
                  value="reassign"
                  checked={strategy === 'reassign'}
                  onChange={() => setStrategy('reassign')}
                  disabled={targets.length === 0 || deleting}
                />
                Reasignar las clases a otra temática
              </label>

              {strategy === 'reassign' && targets.length > 0 && (
                <select
                  aria-label="Temática de destino"
                  value={targetThemeId}
                  onChange={(event) => setTargetThemeId(event.target.value)}
                  disabled={deleting}
                >
                  <option value="">Selecciona una temática</option>
                  {targets.map((target) => (
                    <option key={target.id} value={target.id}>{target.name}</option>
                  ))}
                </select>
              )}

              <label className="delete-theme__option">
                <input
                  type="radio"
                  name="strategy"
                  value="delete"
                  checked={strategy === 'delete'}
                  onChange={() => setStrategy('delete')}
                  disabled={deleting}
                />
                Eliminar la temática y sus clases
              </label>
            </fieldset>

            {targets.length === 0 && (
              <p className="muted">
                No hay otra temática a la que reasignar las clases. Solo puedes eliminarlas
                junto con la temática.
              </p>
            )}
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={deleting}>
            Cancelar
          </button>
          <button type="submit" className="button button--danger" disabled={!canConfirm || deleting}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default DeleteThemeDialog;
