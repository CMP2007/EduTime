import Card from '../components/Card.jsx';
import { formatMinutes, GOAL_MINUTES, goalProgress } from '../utils/time.js';

function GoalTodayCard({ today, selected }) {
  const minutes = today?.minutes ?? 0;
  const goalMinutes = today?.goalMinutes ?? GOAL_MINUTES;
  const met = Boolean(today?.goalMet);
  const progress = goalProgress(minutes);

  return (
    <Card
      className="card--center"
      title={selected ? 'Meta del día' : 'Meta de hoy'}
      description={`Objetivo: ${formatMinutes(goalMinutes)}`}
    >
      <div className="metric">
        <span className="metric__value">{formatMinutes(minutes)}</span>
        {!met && <span className="metric__unit">de {formatMinutes(goalMinutes)}</span>}
      </div>

      {met && (
        <p className="goal-status">
          <span className="check-round" aria-hidden="true">
            ✓
          </span>
          ¡Meta cumplida!
        </p>
      )}

      <div
        className="progress"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress__bar ${met ? 'progress__bar--done' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="metric__hint">{progress}% de la meta</p>
    </Card>
  );
}

export default GoalTodayCard;
