import SessionRow from './SessionRow.jsx';

function SessionList({ sessions, loading, error, onEdit, onDelete }) {
  if (loading) return <p className="muted">Cargando clases…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!sessions.length) return <p className="muted">No hay clases registradas con estos filtros.</p>;

  return (
    <ul className="sessions">
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

export default SessionList;
