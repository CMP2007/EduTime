import Card from '../components/Card.jsx';

/** Resumen global de actividad: días con clases, cuántos cumplieron la meta y el porcentaje. */
function ActivityDaysCard({ activeDays = 0, goalDays = 0 }) {
  const notMet = Math.max(0, activeDays - goalDays);
  const percent = activeDays > 0 ? Math.round((goalDays / activeDays) * 100) : 0;

  return (
    <Card title="Días con actividad" description="Histórico completo">
      <div className="metric">
        <span className="metric__value">{activeDays}</span>
        <span className="metric__unit">{activeDays === 1 ? 'día con clases' : 'días con clases'}</span>
      </div>

      <ul className="goal-breakdown">
        <li>
          <span className="goal-breakdown__label">Meta cumplida</span>
          <span className="goal-breakdown__value">{goalDays}</span>
        </li>
        <li>
          <span className="goal-breakdown__label">Sin meta</span>
          <span className="goal-breakdown__value">{notMet}</span>
        </li>
      </ul>

      <p className="metric__hint">{percent}% de cumplimiento de la meta</p>
    </Card>
  );
}

export default ActivityDaysCard;
