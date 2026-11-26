import { useEffect, useRef, useState } from 'react';

/**
 * Selector de temáticas con alta inline opcional.
 *
 * El campo de alta vive dentro del formulario de clase: al pulsar Enter crea la
 * temática (sin enviar el formulario) y al pulsar Escape cierra solo el campo,
 * sin que el `Modal` que lo contiene se cierre.
 */
function ThemeSelect({
  id,
  themes = [],
  value = '',
  onChange,
  allowCreate = false,
  onCreate,
  disabled = false,
  describedBy,
  invalid = false,
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const selectRef = useRef(null);
  const addButtonRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (creating) {
      inputRef.current?.focus();
      return;
    }
    if (returnFocusRef.current === 'add') {
      addButtonRef.current?.focus();
    } else if (returnFocusRef.current === 'select') {
      selectRef.current?.focus();
    }
    returnFocusRef.current = null;
  }, [creating]);

  function openCreate() {
    setError('');
    setName('');
    setCreating(true);
  }

  function cancelCreate() {
    if (saving) return;
    returnFocusRef.current = 'add';
    setCreating(false);
    setName('');
    setError('');
  }

  async function create() {
    if (saving) return;

    setSaving(true);
    setError('');
    try {
      const created = await onCreate(name);
      returnFocusRef.current = 'select';
      setCreating(false);
      setName('');
      if (created?.id) {
        onChange(created.id);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      cancelCreate();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      create();
    }
  }

  return (
    <div className="theme-select">
      <div className="theme-select__row">
        <select
          className="control"
          ref={selectRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={invalid ? 'true' : undefined}
        >
          <option value="">Selecciona una temática</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>{theme.name}</option>
          ))}
        </select>

        {allowCreate && !creating && (
          <button
            ref={addButtonRef}
            type="button"
            className="button button--ghost theme-select__add"
            onClick={openCreate}
            disabled={disabled}
            aria-label="Crear temática"
          >
            +
          </button>
        )}
      </div>

      {creating && (
        <div className="theme-select__create">
          <input
            className="control"
            ref={inputRef}
            type="text"
            value={name}
            placeholder="Nombre de la temática"
            aria-label="Nombre de la nueva temática"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
          />
          <button type="button" className="button button--primary" onClick={create} disabled={saving}>
            {saving ? 'Creando…' : 'Crear'}
          </button>
          <button type="button" className="button button--ghost" onClick={cancelCreate} disabled={saving}>
            Cancelar
          </button>
        </div>
      )}

      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

export default ThemeSelect;
