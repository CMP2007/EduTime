import { useState } from 'react';
import { useSessions } from './useSessions.js';
import SessionFilters from './SessionFilters.jsx';
import SessionList from './SessionList.jsx';

/** Pestaña Historial: listado con filtros y acciones de editar/eliminar. */
function HistoryView({ onEdit, onDelete }) {
  const [filters, setFilters] = useState({ from: '', to: '', q: '' });
  const { sessions, loading, error } = useSessions(filters);


  return (
    <div className="history">
      <SessionFilters value={filters} onChange={setFilters} />
      <SessionList sessions={sessions} loading={loading} error={error} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export default HistoryView;
