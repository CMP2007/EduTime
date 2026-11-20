import { useEffect, useState } from 'react';
import StatusNotice from '../components/StatusNotice.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useThemes } from '../themes/useThemes.js';
import { useSessions } from './useSessions.js';
import SessionFilters from './SessionFilters.jsx';
import SessionList from './SessionList.jsx';

const EMPTY_FILTERS = { from: '', to: '', q: '', themeId: '' };
const SEARCH_DEBOUNCE_MS = 300;

/** Pestaña Historial: listado con filtros y acciones de editar/eliminar. */
function HistoryView({ onEdit, onDelete }) {
  const { themes, loading: themesLoading, error: themesError } = useThemes();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // El texto se estabiliza para no pedir el listado en cada pulsación; el
  // campo sigue mostrando `filters.q` al instante.
  const debouncedQuery = useDebouncedValue(filters.q, SEARCH_DEBOUNCE_MS);
  const { sessions, loading, error, hasInvertedRange } = useSessions({
    ...filters,
    q: debouncedQuery,
  });

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
