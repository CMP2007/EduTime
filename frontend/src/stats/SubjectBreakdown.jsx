import { formatMinutes } from '../utils/time.js';

function SubjectBreakdown({ subjects }) {
  if (!subjects?.length) return <p className="muted">Sin datos en este periodo.</p>;

  const max = Math.max(...subjects.map((subject) => subject.minutes));

  return (
    <ul className="subjects">
      {subjects.map((subject) => (
        <li key={subject.title} className="subject">
          <div className="subject__top">
            <span className="subject__name">{subject.title}</span>
            <span className="subject__value">{formatMinutes(subject.minutes)}</span>
          </div>
          <div className="subject__track">
            <div
              className="subject__bar"
              style={{ width: `${Math.round((subject.minutes / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default SubjectBreakdown;
