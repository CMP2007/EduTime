import { formatDateLong, weekdayIndex } from '../utils/date.js';
import { formatMinutes, GOAL_MINUTES } from '../utils/time.js';

function level(minutes) {
  if (!minutes) return 0;
  if (minutes >= GOAL_MINUTES) return 4;
  if (minutes >= 120) return 3;
  if (minutes >= 60) return 2;
  return 1;
}

/** Agrupa los días en columnas de 7, empezando en lunes. */
function groupIntoWeeks(days) {
  const weeks = [];
  let current = [];

  days.forEach((day, index) => {
    if (index === 0) {
      const offset = weekdayIndex(day.date);
      for (let blank = 0; blank < offset; blank += 1) current.push(null);
    }
    current.push(day);
    if (current.length === 7) {
      weeks.push(current);
      current = [];
    }
  });

  if (current.length) weeks.push(current);
  return weeks;
}

function ActivityHeatmap({ days = [] }) {
  const weeks = groupIntoWeeks(days);

  if (!days.length) return <p className="muted">Sin datos para este rango.</p>;

  return (
    <div className="heatmap">
      <div className="heatmap__grid">
        {weeks.map((week, weekIndex) => (
          <div className="heatmap__week" key={`week-${weekIndex}`}>
            {week.map((day, dayIndex) =>
              day ? (
                <span
                  key={day.date}
                  className={`heatmap__cell heatmap__cell--l${level(day.minutes)} ${
                    day.goalMet ? 'heatmap__cell--goal' : ''
                  }`}
                  title={`${formatDateLong(day.date)}: ${formatMinutes(day.minutes)}`}
                />
              ) : (
                <span key={`empty-${weekIndex}-${dayIndex}`} className="heatmap__cell heatmap__cell--empty" />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="heatmap__legend">
        <span className="muted">Menos</span>
        {[0, 1, 2, 3, 4].map((value) => (
          <span key={value} className={`heatmap__cell heatmap__cell--l${value}`} />
        ))}
        <span className="muted">Más</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
