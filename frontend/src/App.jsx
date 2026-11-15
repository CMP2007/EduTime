import { useState } from 'react';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Tabs from './components/Tabs.jsx';
import { useDataRefresh } from './context/DataRefreshContext.jsx';
import SeedPrompt from './seed/SeedPrompt.jsx';
import HistoryView from './sessions/HistoryView.jsx';
import SessionForm from './sessions/SessionForm.jsx';
import { sessionsApi } from './sessions/sessions.api.js';
import StatsDashboard from './stats/StatsDashboard.jsx';
import StatsPanel from './stats/StatsPanel.jsx';
import ThemesDialog from './themes/ThemesDialog.jsx';

const TABS = [
  { id: 'home', label: 'Inicio' },
  { id: 'history', label: 'Historial' },
  { id: 'stats', label: 'Estadísticas' },
];

function App() {
  const [tab, setTab] = useState('home');
  const { refreshAll } = useDataRefresh();
  const [formState, setFormState] = useState({ open: false, session: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [themesOpen, setThemesOpen] = useState(false);

  function refresh() {
    refreshAll();
  }

  function openCreate() {
    setFormState({ open: true, session: null });
  }

  function openEdit(session) {
    setFormState({ open: true, session });
  }

  function closeForm() {
    setFormState({ open: false, session: null });
  }

  async function handleSubmit(payload) {
    if (formState.session) {
      await sessionsApi.update(formState.session.id, payload);
    } else {
      await sessionsApi.create(payload);
    }
    closeForm();
    refresh();
  }

  function closeDeleteDialog() {
    setToDelete(null);
    setDeleteError('');
  }

  async function handleConfirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await sessionsApi.remove(toDelete.id);
      closeDeleteDialog();
      refresh();
    } catch (requestError) {
      setDeleteError(requestError.message);
    } finally {
      setDeleting(false);
    }
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

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <main className="app__content" tabIndex={-1}>
        {/* key={tab} reinicia el límite de error al cambiar de pestaña */}
        <ErrorBoundary key={tab}>
          {tab === 'home' && <StatsDashboard />}
          {tab === 'history' && <HistoryView onEdit={openEdit} onDelete={setToDelete} />}
          {tab === 'stats' && <StatsPanel onEdit={openEdit} onDelete={setToDelete} />}
        </ErrorBoundary>
      </main>

      <SessionForm
        open={formState.open}
        session={formState.session}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar clase"
        message={
          toDelete
            ? `¿Seguro que quieres eliminar la clase de "${toDelete.themeName}" del ${toDelete.date}? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
        error={deleteError}
        busy={deleting}
      />

      <SeedPrompt />

      {themesOpen && <ThemesDialog onClose={() => setThemesOpen(false)} />}
    </div>
  );
}

export default App;
