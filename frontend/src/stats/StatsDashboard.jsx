import { useState } from 'react';
import Card from '../components/Card.jsx';
import { formatDateLong, todayString } from '../utils/date.js';
import { useStats } from './useStats.js';
import ActivityDaysCard from './ActivityDaysCard.jsx';
import ActivityHeatmap from './ActivityHeatmap.jsx';
import GoalTodayCard from './GoalTodayCard.jsx';
import { PERIOD_OPTIONS } from './PeriodFilter.jsx';
import StreakCard from './StreakCard.jsx';
import WeeklyHoursCard from './WeeklyHoursCard.jsx';

const HEATMAP_OPTIONS = PERIOD_OPTIONS.filter((option) => option.key !== 'day');

/** Pestaña Inicio: resumen y calendario. Al elegir un día, las tarjetas se enfocan en él. */
function StatsDashboard({ version }) {
  const [heatmapRange, setHeatmapRange] = useState('week');
  const [selectedDate, setSelectedDate] = useState(null);

  const referenceDate = selectedDate || todayString();
  const { stats, loading, error } = useStats(
    {
      period: 'week',
      date: referenceDate,
      heatmap: heatmapRange,
      heatmapDate: todayString(),
    },
    version,
  );

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p className="muted">{loading ? 'Cargando resumen…' : 'Sin datos.'}</p>;

  return (
    <div className="dashboard">
      {selectedDate && (
        <div className="selection-banner">
          <span>
            Mostrando datos del <strong>{formatDateLong(selectedDate)}</strong>
          </span>
          <button type="button" className="button button--ghost" onClick={() => setSelectedDate(null)}>
            Deshacer
          </button>
        </div>
      )}

      <div className="cards">
        <GoalTodayCard today={stats.today} selected={Boolean(selectedDate)} />
        <WeeklyHoursCard
          minutes={stats.summary.totalMinutes}
          dayMinutes={stats.today.minutes}
          selected={Boolean(selectedDate)}
        />
        <StreakCard streak={stats.global.streak} />
        <ActivityDaysCard activeDays={stats.global.activeDays} goalDays={stats.global.goalDays} />
      </div>

      <Card>
        <div className="heatmap-layout">
          <div className="heatmap-panel heatmap-panel--controls">
            <header className="card__header">
              <h3 className="card__title">Calendario de actividad</h3>
              <p className="card__description">Pulsa un día para enfocar las tarjetas en esa fecha</p>
            </header>
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
          <div className="heatmap-panel heatmap-panel--grid">
            <ActivityHeatmap
              days={stats.heatmap.days}
              rangeKey={stats.heatmap.range}
              from={stats.heatmap.from}
              to={stats.heatmap.to}
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate((current) => (current === date ? null : date))}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default StatsDashboard;
