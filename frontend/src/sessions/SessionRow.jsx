import { formatDateLong } from '../utils/date.js';
import { formatMinutes } from '../utils/time.js';

function SessionRow({ session, onEdit, onDelete }) {
  return (
    <li className="session">
      <div className="session__main">
        <div className="session__top">
          <span className="session__title">{session.themeName}</span>
          <span className="session__duration">{formatMinutes(session.durationMinutes)}</span>
        </div>
        <time className="session__date" dateTime={session.date}>
          {formatDateLong(session.date)}
        </time>
        {session.notes && <p className="session__notes">{session.notes}</p>}
      </div>
      <div className="session__actions">
        <button type="button" className="button button--ghost" onClick={() => onEdit(session)}>
          Editar
        </button>
        <button type="button" className="button button--danger-ghost" onClick={() => onDelete(session)}>
          Eliminar
        </button>
      </div>
    </li>
  );
}

export default SessionRow;
