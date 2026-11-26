import { useEffect, useId, useRef, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { NOTES_MAX } from 'domain-constants';
import { parseDurationInput } from './durationInput.js';
import { splitDuration } from '../utils/time.js';
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
function SessionForm({ open, session, onClose, onSubmit, saving = false }) {
  const { themes, loading, loaded, error: themesError, reload, createTheme } = useThemes({ enabled: open });
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [createdThemes, setCreatedThemes] = useState([]);
  const [showNotice, setShowNotice] = useState(false);
  const notesRef = useRef(null);
  const errorId = useId();
  const themeNoticeId = useId();

  useEffect(() => {
    if (open) {
      setForm(toForm(session));
      setError(null);
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
  const durationFields = error?.kind === 'duration' ? error.fields : [];
  const themeInvalid = error?.kind === 'theme' || (themeMissing && !error);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (error?.kind === 'duration' && (field === 'hours' || field === 'minutes')) {
      setError(null);
    }
    if (error?.kind === 'theme' && field === 'themeId') {
      setError(null);
    }
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

    if (!form.themeId) {
      setError({ kind: 'theme', message: 'La temática es obligatoria.', fields: ['themeId'] });
      return;
    }
    if (themeMissing) {
      setError({
        kind: 'theme',
        message: 'La temática seleccionada ya no existe. Elige otra.',
        fields: ['themeId'],
      });
      return;
    }

    const duration = parseDurationInput(form.hours, form.minutes);
    if (!duration.valid) {
      setError({ kind: 'duration', ...duration.error });
      return;
    }

    setError(null);
    try {
      await onSubmit({
        themeId: form.themeId,
        date: form.date,
        hours: duration.hours,
        minutes: duration.minutes,
        notes: form.notes.trim(),
      });
    } catch (submitError) {
      // El padre limpia `saving` al terminar la escritura; aquí solo se
      // conserva el mensaje para corregir y reintentar.
      setError({ kind: 'server', message: submitError.message, fields: [] });
    }
  }

  return (
    <>
      <Modal
        title={session ? 'Editar clase' : 'Nueva clase'}
        onClose={requestClose}
        labelledBy="session-form-title"
      >
        <form className="form-grid" onSubmit={handleSubmit} noValidate>
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
                  describedBy={
                    error?.kind === 'theme'
                      ? errorId
                      : themeMissing && !error
                        ? themeNoticeId
                        : undefined
                  }
                  invalid={themeInvalid}
                />
                {themes.length === 0 && (
                  <p className="muted">No hay temáticas. Crea una con el botón «+».</p>
                )}
              </>
            )}

            {themeMissing && !error && (
              <p className="error" role="alert" id={themeNoticeId}>
                La temática de esta clase ya no existe. Elige otra.
              </p>
            )}
          </div>

          <label className="field">
            <span className="field__label">Fecha</span>
            <input className="control" type="date" value={form.date} onChange={(event) => update('date', event.target.value)} />
          </label>

          <fieldset
            className="field duration"
            aria-describedby={error?.kind === 'duration' ? errorId : undefined}
          >
            <legend className="field__label">Duración</legend>
            <div className="duration__inputs">
              <label className="duration__item">
                <input
                  className="control"
                  type="number"
                  min="0"
                  max="23"
                  value={form.hours}
                  onChange={(event) => update('hours', event.target.value)}
                  aria-invalid={durationFields.includes('hours') ? 'true' : undefined}
                />
                <span>horas</span>
              </label>
              <label className="duration__item">
                <input
                  className="control"
                  type="number"
                  min="0"
                  max="59"
                  value={form.minutes}
                  onChange={(event) => update('minutes', event.target.value)}
                  aria-invalid={durationFields.includes('minutes') ? 'true' : undefined}
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
              className="control control--textarea"
              ref={notesRef}
              rows={2}
              maxLength={NOTES_MAX}
              value={form.notes}
              placeholder="Notas de la clase…"
              onChange={(event) => update('notes', event.target.value)}
            />
          </label>

          {error && <p className="error" role="alert" id={errorId}>{error.message}</p>}

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
