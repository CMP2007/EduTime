import Card from '../components/Card.jsx';
import { formatMinutes } from '../utils/time.js';

/** Horas de la semana o del día seleccionado. */
function WeeklyHoursCard({ minutes, dayMinutes = 0, selected }) {
  const value = selected ? dayMinutes : minutes;

  return (
    <Card
      className="card--center"
      title={selected ? 'Horas del día' : 'Esta semana'}
      description={selected ? 'Horas estudiadas en el día seleccionado' : 'Horas estudiadas de lunes a domingo'}
    >
      <div className="metric">
        <span className="metric__value">{formatMinutes(value)}</span>
      </div>
    </Card>
  );
}

export default WeeklyHoursCard;
