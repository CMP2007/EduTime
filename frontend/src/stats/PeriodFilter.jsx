import { PERIOD_OPTIONS } from 'domain-constants';

export { PERIOD_OPTIONS };

function PeriodFilter({ period, date, onChange }) {
  return (
    <div className="period-filter">
      <div className="segmented" role="group" aria-label="Periodo">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`segmented__button ${period === option.key ? 'segmented__button--active' : ''}`}
            aria-pressed={period === option.key}
            onClick={() => onChange({ period: option.key, date })}
          >
            {option.label}
          </button>
        ))}
      </div>
      <label className="field">
        <span className="field__label">Fecha de referencia</span>
        <input
          className="control"
          type="date"
          value={date}
          onChange={(event) => onChange({ period, date: event.target.value })}
        />
      </label>
    </div>
  );
}

export default PeriodFilter;
