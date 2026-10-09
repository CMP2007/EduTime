import { useState } from 'react';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Tabs from './components/Tabs.jsx';
import HistoryView from './sessions/HistoryView.jsx';
import SessionForm from './sessions/SessionForm.jsx';
import { sessionsApi } from './sessions/sessions.api.js';
import StatsDashboard from './stats/StatsDashboard.jsx';
import StatsPanel from './stats/StatsPanel.jsx';

const TABS = [
  { id: 'home', label: 'Inicio' },
  { id: 'history', label: 'Historial' },
  { id: 'stats', label: 'Estadísticas' },
];

function App() {
  const [tab, setTab] = useState('home');
  const [version, setVersion] = useState(0);
  const [formState, setFormState] = useState({ open: false, session: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function refresh() {
    setVersion((current) => current + 1);
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

  async function handleConfirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await sessionsApi.remove(toDelete.id);
      setToDelete(null);
      refresh();
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
        <button type="button" className="button button--primary" onClick={openCreate}>
          + Nueva clase
        </button>
      </header>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <main className="app__content">
        {tab === 'home' && <StatsDashboard version={version} />}
        {tab === 'history' && <HistoryView version={version} onEdit={openEdit} onDelete={setToDelete} />}
        {tab === 'stats' && <StatsPanel version={version} onEdit={openEdit} onDelete={setToDelete} />}
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
            ? `¿Seguro que quieres eliminar "${toDelete.title}" del ${toDelete.date}? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setToDelete(null)}
        busy={deleting}
      />
    </div>
  );
}

export default App;
