import { useEffect, useState } from 'react';
import StatusNotice from '../components/StatusNotice.jsx';
import { useThemes } from '../themes/useThemes.js';
import { useSessions } from './useSessions.js';
import SessionFilters from './SessionFilters.jsx';
import SessionList from './SessionList.jsx';

const EMPTY_FILTERS = { from: '', to: '', q: '', themeId: '' };

/** Pestaña Historial: listado con filtros y acciones de editar/eliminar. */
function HistoryView({ onEdit, onDelete }) {
  const { themes, loading: themesLoading, error: themesError } = useThemes();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const { sessions, loading, error, hasInvertedRange } = useSessions(filters);

  const selectedThemeMissing =
    Boolean(filters.themeId) &&
    !themesLoading &&
    !themesError &&
    !themes.some((theme) => theme.id === filters.themeId);

  useEffect(() => {
    if (selectedThemeMissing) {
      // La temática elegida se eliminó: el filtro deja de tener sentido y se
      // limpia junto con el resto para no dejar un listado vacío engañoso.
      setFilters(EMPTY_FILTERS);
    }
  }, [selectedThemeMissing]);

  return (
    <div className="history">
      <SessionFilters value={filters} onChange={setFilters} themes={themes} />
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
