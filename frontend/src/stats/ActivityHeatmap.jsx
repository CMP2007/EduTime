import { isValidDateString } from 'domain-dates';
import { formatDateLong, formatDateRange, monthNameFromKey, weekdayIndex } from '../utils/date.js';
import { formatMinutes, GOAL_MINUTES } from '../utils/time.js';

function level(minutes) {
  if (!minutes) return 0;
  if (minutes >= GOAL_MINUTES) return 4;
  if (minutes >= 120) return 3;
  if (minutes >= 60) return 2;
  return 1;
}

/** Convierte la lista de días en columnas semanales (7 celdas, empezando en lunes). */
function buildColumns(days) {
  const columns = [];
  let current = [];

  days.forEach((day, index) => {
    if (index === 0) {
      for (let blank = 0; blank < weekdayIndex(day.date); blank += 1) current.push(null);
    }
    current.push(day);
    if (current.length === 7) {
      columns.push(current);
      current = [];
    }
  });

  if (current.length) columns.push(current);

  return columns.map((cells) => {
    const realDays = cells.filter(Boolean);
    const monthCounts = new Map();
    realDays.forEach((day) => {
      const key = day.date.slice(0, 7);
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    });
    const monthKey = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

    return {
      cells,
      firstDate: realDays[0].date,
      lastDate: realDays[realDays.length - 1].date,
      monthKey,
    };
  });
}

/** Agrupa las columnas por semana o por mes, con la etiqueta de cabecera. */
function groupColumns(columns, mode, multiYear) {
  if (mode === 'weeks') {
    return columns.map((column) => ({
      key: column.firstDate,
      label: formatDateRange(column.firstDate, column.lastDate),
      columns: [column],
    }));
  }

  const groups = [];
  columns.forEach((column) => {
    const label = multiYear
      ? `${monthNameFromKey(column.monthKey)} ${column.monthKey.slice(0, 4)}`
      : monthNameFromKey(column.monthKey);
    const previous = groups[groups.length - 1];

    if (previous && previous.key === column.monthKey) {
      previous.columns.push(column);
    } else {
      groups.push({ key: column.monthKey, label, columns: [column] });
    }
  });
  return groups;
}

function HeatCell({ day, selected, onSelect }) {
  if (!day) return <span className="heatmap__cell heatmap__cell--empty" aria-hidden="true" />;

  const description = day.minutes ? formatMinutes(day.minutes) : 'sin clases';

  return (
    <button
      type="button"
      className={`heatmap__cell heatmap__cell--l${level(day.minutes)} ${
        day.goalMet ? 'heatmap__cell--goal' : ''
      } ${selected ? 'heatmap__cell--selected' : ''}`}
      title={`${formatDateLong(day.date)}: ${description}`}
      aria-label={`${formatDateLong(day.date)}: ${description}`}
      aria-pressed={selected}
      onClick={() => onSelect(day.date)}
    />
  );
}

function ActivityHeatmap({
  days = [],
  rangeKey = 'week',
  from = '',
  to = '',
  selectedDate = null,
  onSelectDate,
}) {
  if (!days.length) return <p className="muted">Sin datos para este rango.</p>;

  const validDays = days.filter((day) => isValidDateString(day.date));
  if (!validDays.length) return <p className="muted">Sin datos para este rango.</p>;

  const columns = buildColumns(validDays);
  const mode = rangeKey === 'week' ? 'weeks' : 'months';
  const fromYear = from.slice(0, 4);
  const toYear = to.slice(0, 4);
  const multiYear = fromYear !== toYear;
  const groups = groupColumns(columns, mode, multiYear);
  const yearLabel = multiYear ? `${fromYear}–${toYear}` : fromYear;

  return (
    <div className="heatmap">
      <div className="heatmap__top">
        <span className="heatmap__year">{yearLabel}</span>
      </div>

      <div className="heatmap__body">
        <div className="heatmap__groups">
          {groups.map((group) => (
            <div className="heatmap__group" key={group.key}>
              <span className="heatmap__group-label">{group.label}</span>
              <div className="heatmap__weeks">
                {group.columns.map((column, columnIndex) => (
                  <div className="heatmap__week" key={`${group.key}-${columnIndex}`}>
                    {column.cells.map((day, dayIndex) => (
                      <HeatCell
                        key={day ? day.date : `empty-${group.key}-${columnIndex}-${dayIndex}`}
                        day={day}
                        selected={Boolean(day) && day.date === selectedDate}
                        onSelect={onSelectDate}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
