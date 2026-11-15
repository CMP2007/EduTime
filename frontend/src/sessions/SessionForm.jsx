import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { DURATION_MIN as MIN_DURATION, NOTES_MAX } from 'domain-constants';
import { combineDuration, splitDuration } from '../utils/time.js';
import { todayString } from '../utils/date.js';
import CreatedThemesNotice from '../themes/CreatedThemesNotice.jsx';
import ThemeSelect from '../themes/ThemeSelect.jsx';
import { useThemes } from '../themes/useThemes.js';

function emptyForm() {
  return { themeId: '', date: todayString(), hours: 0, minutes: 0, notes: '' };
}

function toForm(session) {
  if (!session) return emptyForm();
  const { hours, minutes } = splitDuration(session.durationMinutes);
  return {
    themeId: session.themeId,
    date: session.date,
    hours,
    minutes,
    notes: session.notes ?? '',
  };
}

function autoGrow(element) {
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
}

/** Formulario emergente para crear y editar una clase. */
function SessionForm({ open, session, onClose, onSubmit }) {
  const { themes, loading, loaded, error: themesError, reload, createTheme } = useThemes({ enabled: open });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdThemes, setCreatedThemes] = useState([]);
  const [showNotice, setShowNotice] = useState(false);
  const notesRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(session));
      setError('');
      setSaving(false);
      setCreatedThemes([]);
      setShowNotice(false);
    }
  }, [open, session]);

  useEffect(() => {
    if (open) autoGrow(notesRef.current);
  }, [open, form.notes]);

  if (!open) return null;

  // Hasta la primera carga no se monta el selector: así el modal no enfoca un
  // control que va a desaparecer en cuanto arranca la petición.
  const waitingForThemes = !loaded && !themesError;
  const themeMissing =
    Boolean(form.themeId) &&
    !loading &&
    !themesError &&
    !themes.some((theme) => theme.id === form.themeId);
  // Una recarga en segundo plano (por ejemplo, tras crear una temática inline)
  // no debe bloquear el guardado si el catálogo ya está disponible.
  const saveDisabled = saving || Boolean(themesError) || themes.length === 0;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreateTheme(name) {
    const created = await createTheme(name);
    setCreatedThemes((current) => [...current, created.name]);
    return created;
  }

  function requestClose() {
    if (saving) return;
    if (createdThemes.length > 0) {
      setShowNotice(true);
      return;
    }
    onClose();
  }

  function closeNoticeAndForm() {
    setShowNotice(false);
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const durationMinutes = combineDuration(form.hours, form.minutes);

    if (!form.themeId) {
      setError('La temática es obligatoria.');
      return;
    }
    if (themeMissing) {
      setError('La temática seleccionada ya no existe. Elige otra.');
      return;
    }
    if (durationMinutes < MIN_DURATION) {
      setError(`La clase debe durar al menos ${MIN_DURATION} minutos.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit({
        themeId: form.themeId,
        date: form.date,
        hours: Number(form.hours) || 0,
        minutes: Number(form.minutes) || 0,
        notes: form.notes.trim(),
      });
    } catch (submitError) {
      setError(submitError.message);
      setSaving(false);
    }
  }

  return (
    <>
      <Modal
        title={session ? 'Editar clase' : 'Nueva clase'}
        onClose={requestClose}
        labelledBy="session-form-title"
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="session-theme">Temática</label>

            {waitingForThemes && <p className="muted">Cargando temáticas…</p>}

            {!waitingForThemes && themesError && (
              <div className="session-form__themes-error">
                <p className="error" role="alert">{themesError}</p>
                <button type="button" className="button button--ghost" onClick={reload}>
                  Reintentar
                </button>
              </div>
            )}

            {!waitingForThemes && !themesError && (
              <>
                <ThemeSelect
                  id="session-theme"
                  themes={themes}
                  value={form.themeId}
                  onChange={(themeId) => update('themeId', themeId)}
                  allowCreate
                  onCreate={handleCreateTheme}
                />
                {themes.length === 0 && (
                  <p className="muted">No hay temáticas. Crea una con el botón «+».</p>
                )}
              </>
            )}

            {themeMissing && (
              <p className="error" role="status">
                La temática de esta clase ya no existe. Elige otra.
              </p>
            )}
          </div>

          <label className="field">
            <span className="field__label">Fecha</span>
            <input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} />
          </label>

          <fieldset className="field duration">
            <legend className="field__label">Duración</legend>
            <div className="duration__inputs">
              <label className="duration__item">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={form.hours}
                  onChange={(event) => update('hours', event.target.value)}
                />
                <span>horas</span>
              </label>
              <label className="duration__item">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={form.minutes}
                  onChange={(event) => update('minutes', event.target.value)}
                />
                <span>minutos</span>
              </label>
            </div>
          </fieldset>

          <label className="field">
            <span className="field__label">
              Observaciones <span className="muted">(opcional, {NOTES_MAX} máx.)</span>
            </span>
            <textarea
              ref={notesRef}
              rows={2}
              maxLength={NOTES_MAX}
              value={form.notes}
              placeholder="Notas de la clase…"
              onChange={(event) => update('notes', event.target.value)}
            />
          </label>

          {error && <p className="error" role="alert">{error}</p>}

          <div className="modal__actions">
            <button type="button" className="button button--ghost" onClick={requestClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="button button--primary" disabled={saveDisabled}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {showNotice && (
        <CreatedThemesNotice names={createdThemes} onClose={closeNoticeAndForm} />
      )}
    </>
  );
}

export default SessionForm;
