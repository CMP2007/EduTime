function SessionFilters({ value, onChange }) {
  function update(field, next) {
    onChange({ ...value, [field]: next });
  }

  return (
    <div className="filters">
      <label className="field">
        <span className="field__label">Desde</span>
        <input type="date" value={value.from} onChange={(event) => update('from', event.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Hasta</span>
        <input type="date" value={value.to} onChange={(event) => update('to', event.target.value)} />
      </label>
      <label className="field field--grow">
        <span className="field__label">Buscar por temática</span>
        <input
          type="search"
          placeholder="Ej. Matemáticas"
          value={value.q}
          onChange={(event) => update('q', event.target.value)}
        />
      </label>
      <button
        type="button"
        className="button button--ghost"
        onClick={() => onChange({ from: '', to: '', q: '' })}
      >
        Limpiar
      </button>
    </div>
  );
}

export default SessionFilters;
