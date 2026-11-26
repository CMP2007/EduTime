/** Filtros del historial: rango de fechas, temática y búsqueda en observaciones. */
function SessionFilters({ value, onChange, themes = [] }) {
  function update(field, next) {
    onChange({ ...value, [field]: next });
  }

  return (
    <div className="filters">
      <label className="field">
        <span className="field__label">Desde</span>
        <input className="control" type="date" value={value.from} onChange={(event) => update('from', event.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Hasta</span>
        <input className="control" type="date" value={value.to} onChange={(event) => update('to', event.target.value)} />
      </label>
      <label className="field">
        <span className="field__label">Temática</span>
        <select className="control" value={value.themeId} onChange={(event) => update('themeId', event.target.value)}>
          <option value="">Todas</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>{theme.name}</option>
          ))}
        </select>
      </label>
      <label className="field field--grow">
        <span className="field__label">Buscar en observaciones</span>
        <input
          className="control"
          type="search"
          placeholder="Ej. repaso de integrales"
          value={value.q}
          onChange={(event) => update('q', event.target.value)}
        />
      </label>
      <button
        type="button"
        className="button button--ghost"
        onClick={() => onChange({ from: '', to: '', q: '', themeId: '' })}
      >
        Limpiar
      </button>
    </div>
  );
}

export default SessionFilters;
