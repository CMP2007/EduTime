import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import DeleteThemeDialog from './DeleteThemeDialog.jsx';
import { themesApi } from './themes.api.js';
import { useThemes } from './useThemes.js';

/** Gestor del catálogo: alta, renombrado inline y borrado con confirmación. */
function ThemesDialog({ onClose }) {
  const { themes, loading, error, reload, createTheme } = useThemes();
  const { refreshThemes, refreshSessions, refreshStats } = useDataRefresh();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
    }
  }, [editingId]);

  async function handleCreate(event) {
    event.preventDefault();
    if (creating) return;

    setCreating(true);
    setActionError('');
    try {
      await createTheme(newName);
      setNewName('');
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setCreating(false);
    }
  }

  function startRename(theme) {
    setActionError('');
    setEditingId(theme.id);
    setEditName(theme.name);
  }

  function cancelRename() {
    if (savingEdit) return;
    setEditingId(null);
    setEditName('');
  }

  async function handleRename(event) {
    event.preventDefault();
    if (!editingId || savingEdit) return;

    setSavingEdit(true);
    setActionError('');
    try {
      await themesApi.rename(editingId, editName);
      setEditingId(null);
      setEditName('');
      refreshThemes();
      refreshSessions();
      refreshStats();
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setSavingEdit(false);
    }
  }

  function handleEditKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      cancelRename();
    }
  }

  function handleDeleted() {
    setToDelete(null);
    refreshThemes();
    refreshSessions();
    refreshStats();
  }

  return (
    <>
      <Modal title="Temáticas" onClose={onClose} labelledBy="themes-dialog-title">
        <form className="themes__create" onSubmit={handleCreate}>
          <label className="field field--grow">
            <span className="field__label">Nueva temática</span>
            <input
              type="text"
              value={newName}
              placeholder="Ej. Matemáticas"
              aria-label="Nombre de la nueva temática"
              onChange={(event) => setNewName(event.target.value)}
              disabled={creating}
            />
          </label>
          <button type="submit" className="button button--primary" disabled={creating}>
            {creating ? 'Creando…' : 'Crear'}
          </button>
        </form>

        {actionError && <p className="error" role="alert">{actionError}</p>}

        {loading && <p className="muted">Cargando temáticas…</p>}

        {!loading && error && (
          <div className="themes__load-error">
            <p className="error" role="alert">{error}</p>
            <button type="button" className="button button--ghost" onClick={reload}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && themes.length === 0 && (
          <p className="muted">Todavía no hay temáticas.</p>
        )}

        {!loading && !error && themes.length > 0 && (
          <ul className="themes__list">
            {themes.map((theme) => (
              <li key={theme.id} className="themes__item">
                {editingId === theme.id ? (
                  <form className="themes__edit" onSubmit={handleRename}>
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editName}
                      aria-label="Nuevo nombre"
                      onChange={(event) => setEditName(event.target.value)}
                      onKeyDown={handleEditKeyDown}
                      disabled={savingEdit}
                    />
                    <button type="submit" className="button button--primary" disabled={savingEdit}>
                      {savingEdit ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={cancelRename}
                      disabled={savingEdit}
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="themes__name">{theme.name}</span>
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={() => startRename(theme)}
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      className="button button--danger-ghost"
                      onClick={() => setToDelete(theme)}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {toDelete && (
        <DeleteThemeDialog
          theme={toDelete}
          themes={themes}
          onClose={() => setToDelete(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}

export default ThemesDialog;
