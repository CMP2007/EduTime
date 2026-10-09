import { useMemo, useState } from 'react';
import Card from '../components/Card.jsx';
import { useSessions } from '../sessions/useSessions.js';
import { todayString } from '../utils/date.js';
import { useStats } from './useStats.js';
import ActivityDaysCard from './ActivityDaysCard.jsx';
import ActivityHeatmap from './ActivityHeatmap.jsx';
import GoalTodayCard from './GoalTodayCard.jsx';
import { PERIOD_OPTIONS } from './PeriodFilter.jsx';
import StreakCard from './StreakCard.jsx';
import WeeklyHoursCard from './WeeklyHoursCard.jsx';

const HEATMAP_OPTIONS = PERIOD_OPTIONS.filter((option) => option.key !== 'day');

/** Pestaña Inicio: resumen del día, la racha y el calendario de actividad. */
function StatsDashboard({ version }) {
  const [heatmapRange, setHeatmapRange] = useState('week');
  const { stats, loading, error } = useStats(
    { period: 'week', date: todayString(), heatmap: heatmapRange },
    version,
  );
  const { sessions } = useSessions({}, version);

  const sessionsByDate = useMemo(() => {
    const map = {};
    for (const session of sessions) {
      (map[session.date] ??= []).push(session);
    }
    return map;
  }, [sessions]);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">{loading ? 'Cargando resumen…' : 'Sin datos.'}</p>;

  return (
    <div className="dashboard">
      <div className="cards">
        <GoalTodayCard today={stats.today} />
        <StreakCard streak={stats.global.streak} />
        <WeeklyHoursCard minutes={stats.summary.totalMinutes} />
        <ActivityDaysCard global={stats.global} />
      </div>

      <Card title="Calendario de actividad" description="Pulsa un día para ver su detalle">
        <div className="heatmap__toolbar">
          <label className="field">
            <span className="field__label">Rango</span>
            <select value={heatmapRange} onChange={(event) => setHeatmapRange(event.target.value)}>
              {HEATMAP_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ActivityHeatmap
          days={stats.heatmap.days}
          rangeKey={stats.heatmap.range}
          from={stats.heatmap.from}
          to={stats.heatmap.to}
          sessionsByDate={sessionsByDate}
        />
      </Card>
    </div>
  );
}

export default StatsDashboard;
