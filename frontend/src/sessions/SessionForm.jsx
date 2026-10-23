import { useEffect, useRef, useState } from 'react';
import Modal from '../components/Modal.jsx';
import { combineDuration, splitDuration } from '../utils/time.js';
import { todayString } from '../utils/date.js';

const TITLE_MAX = 80;
const NOTES_MAX = 500;
const MIN_DURATION = 15;

function emptyForm() {
  return { title: '', date: todayString(), hours: 0, minutes: 0, notes: '' };
}

function toForm(session) {
  if (!session) return emptyForm();
  const { hours, minutes } = splitDuration(session.durationMinutes);
  return { title: session.title, date: session.date, hours, minutes, notes: session.notes ?? '' };
}

function autoGrow(element) {
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
}

/** Formulario emergente para crear y editar una clase. */
function SessionForm({ open, session, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const notesRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(session));
      setError('');
      setSaving(false);
    }
  }, [open, session]);

  useEffect(() => {
    if (open) autoGrow(notesRef.current);
  }, [open, form.notes]);

  if (!open) return null;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const durationMinutes = combineDuration(form.hours, form.minutes);

    if (!form.title.trim()) {
      setError('La temática es obligatoria.');
      return;
    }
    if (durationMinutes < MIN_DURATION) {
      setError(`La clase debe durar al menos ${MIN_DURATION} minutos.`);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        title: form.title.trim(),
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
    <Modal
      title={session ? 'Editar clase' : 'Nueva clase'}
      onClose={onClose}
      labelledBy="session-form-title"
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field__label">Temática</span>
          <input
            type="text"
            value={form.title}
            maxLength={TITLE_MAX}
            placeholder="Ej. Matemáticas"
            onChange={(event) => update('title', event.target.value)}
          />
        </label>

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

        {error && <p className="error">{error}</p>}

        <div className="modal__actions">
          <button type="button" className="button button--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SessionForm;
