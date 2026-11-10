import { useState } from 'react';
import StatusNotice from '../components/StatusNotice.jsx';
import { useSessions } from './useSessions.js';
import SessionFilters from './SessionFilters.jsx';
import SessionList from './SessionList.jsx';

/** Pestaña Historial: listado con filtros y acciones de editar/eliminar. */
function HistoryView({ onEdit, onDelete }) {
  const [filters, setFilters] = useState({ from: '', to: '', q: '' });
  const { sessions, loading, error, hasInvertedRange } = useSessions(filters);

  return (
    <div className="history">
      <SessionFilters value={filters} onChange={setFilters} />
      {hasInvertedRange && (
        <StatusNotice>
          El rango de fechas está invertido: «desde» es posterior a «hasta».
        </StatusNotice>
      )}
      <SessionList
        sessions={sessions}
        loading={loading}
        error={hasInvertedRange ? '' : error}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

export default HistoryView;
