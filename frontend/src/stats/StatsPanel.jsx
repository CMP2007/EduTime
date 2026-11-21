import { useState } from 'react';
import Card from '../components/Card.jsx';
import StatusNotice from '../components/StatusNotice.jsx';
import SessionList from '../sessions/SessionList.jsx';
import { useSessions } from '../sessions/useSessions.js';
import { todayString } from '../utils/date.js';
import { formatMinutes } from '../utils/time.js';
import LongestClassCard from './LongestClassCard.jsx';
import PeriodFilter from './PeriodFilter.jsx';
import SubjectBreakdown from './SubjectBreakdown.jsx';
import { useStats } from './useStats.js';

/** Pestaña Estadísticas: métricas por periodo y registros anteriores. */
function StatsPanel({ onEdit, onDelete }) {
  const [filter, setFilter] = useState({ period: 'week', date: todayString() });
  const { stats, loading, error } = useStats({
    period: filter.period,
    date: filter.date,
    heatmap: 'week',
  });
  // Las clases se piden con el rango que ya calculó el backend; él es la
  // autoridad del periodo y no se vuelve a filtrar en el cliente (B10-1).
  const {
    sessions: periodSessions,
    loading: sessionsLoading,
    error: sessionsError,
  } = useSessions(
    { from: stats?.period.from ?? '', to: stats?.period.to ?? '' },
    { enabled: Boolean(stats) },
  );

  return (
    <div className="panel">
      <PeriodFilter period={filter.period} date={filter.date} onChange={setFilter} />

      {error && <p className="error">{error}</p>}
      {!error && !stats && (
        <p className="muted">{loading ? 'Cargando estadísticas…' : 'Sin datos.'}</p>
      )}

      {!error && stats && (
        <>
          {stats.notice && <StatusNotice>{stats.notice}</StatusNotice>}

          <div className="cards">
            <Card title="Horas del periodo" description={stats.period.label}>
              <div className="metric">
                <span className="metric__value">{formatMinutes(stats.summary.totalMinutes)}</span>
              </div>
              <p className="metric__hint">
                {stats.summary.totalSessions} {stats.summary.totalSessions === 1 ? 'clase' : 'clases'}
              </p>
            </Card>

            <Card title="Días meta del periodo" description="Días con 3h o más">
              <div className="metric">
                <span className="metric__value">{stats.summary.goalDays}</span>
                <span className="metric__unit">días</span>
              </div>
            </Card>

            <LongestClassCard longest={stats.summary.longestClass} />

            <Card title="Global" description="Histórico completo">
              <div className="metric">
                <span className="metric__value">{formatMinutes(stats.global.totalMinutes)}</span>
              </div>
              <p className="metric__hint">
                {stats.global.goalDays} días con meta · mejor racha {stats.global.streak.best}
              </p>
            </Card>
          </div>

          <Card title="Horas por temática" description={stats.period.label}>
            <SubjectBreakdown subjects={stats.summary.subjects} />
          </Card>

          <Card title="Registros del periodo" description="Puedes editar o eliminar">
            <SessionList
              sessions={periodSessions}
              loading={loading || sessionsLoading}
              error={error || sessionsError}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Card>
        </>
      )}
    </div>
  );
}

export default StatsPanel;
