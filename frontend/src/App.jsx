import { useEffect, useState } from 'react';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import StatusNotice from './components/StatusNotice.jsx';
import Tabs from './components/Tabs.jsx';
import { TABS } from './navigation/tabs.js';
import { useTabRoute } from './navigation/useTabRoute.js';
import SeedPrompt from './seed/SeedPrompt.jsx';
import HistoryView from './sessions/HistoryView.jsx';
import SessionForm from './sessions/SessionForm.jsx';
import { buildDeleteMessage } from './sessions/deleteMessage.js';
import { useSessionMutations } from './sessions/useSessionMutations.js';
import StatsDashboard from './stats/StatsDashboard.jsx';
import StatsPanel from './stats/StatsPanel.jsx';
import ThemesDialog from './themes/ThemesDialog.jsx';

function App() {
  const { tab, selectTab } = useTabRoute();
  const {
    createSession,
    updateSession,
    removeSession,
    saving,
    deleting,
    error: mutationError,
    clearError,
  } = useSessionMutations();
  const [formState, setFormState] = useState({ open: false, session: null });
  const [toDelete, setToDelete] = useState(null);
  const [themesOpen, setThemesOpen] = useState(false);

  // Cambiar de pestaña (incluido Atrás/Adelante) cierra los diálogos abiertos.
  useEffect(() => {
    setFormState({ open: false, session: null });
    setToDelete(null);
    setThemesOpen(false);
    clearError();
  }, [tab, clearError]);

  function openCreate() {
    clearError();
    setFormState({ open: true, session: null });
  }

  function openEdit(session) {
    clearError();
    setFormState({ open: true, session });
  }

  function closeForm() {
    setFormState({ open: false, session: null });
    clearError();
  }

  async function handleSubmit(payload) {
    if (formState.session) {
      await updateSession(formState.session.id, payload);
    } else {
      await createSession(payload);
    }
    closeForm();
  }

  function requestDelete(session) {
    clearError();
    setToDelete(session);
  }

  function closeDeleteDialog() {
    setToDelete(null);
    clearError();
  }

  async function handleConfirmDelete() {
    if (!toDelete) return;
    if (await removeSession(toDelete.id)) closeDeleteDialog();
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">StudyTrack</h1>
          <p className="app__subtitle">Control de tus horas de estudio</p>
        </div>
        <div className="app__actions">
          <button type="button" className="button button--ghost" onClick={() => setThemesOpen(true)}>
            Temáticas
          </button>
          <button type="button" className="button button--primary" onClick={openCreate}>
            + Nueva clase
          </button>
        </div>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={selectTab} />

      <main className="app__content" tabIndex={-1}>
        {/* Si una escritura falla tras cerrarse su diálogo por navegación, el
            error se anuncia aquí; con un diálogo abierto no se duplica. */}
        {mutationError && !formState.open && !toDelete && !themesOpen && (
          <StatusNotice>{mutationError}</StatusNotice>
        )}
        {/* key={tab} reinicia el límite de error al cambiar de pestaña */}
        <ErrorBoundary key={tab}>
          {tab === 'home' && <StatsDashboard />}
          {tab === 'history' && <HistoryView onEdit={openEdit} onDelete={requestDelete} />}
          {tab === 'stats' && <StatsPanel onEdit={openEdit} onDelete={requestDelete} />}
        </ErrorBoundary>
      </main>

      <SessionForm
        open={formState.open}
        session={formState.session}
        onClose={closeForm}
        onSubmit={handleSubmit}
        saving={saving}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar clase"
        message={buildDeleteMessage(toDelete)}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
        error={mutationError}
        busy={deleting}
      />

      <SeedPrompt />

      {themesOpen && <ThemesDialog onClose={() => setThemesOpen(false)} />}
    </div>
  );
}

export default App;
