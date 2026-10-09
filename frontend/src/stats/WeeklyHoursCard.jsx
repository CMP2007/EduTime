import Card from '../components/Card.jsx';
import { formatMinutes } from '../utils/time.js';

function WeeklyHoursCard({ minutes }) {
  return (
    <Card title="Esta semana" description="Horas estudiadas de lunes a domingo">
      <div className="metric">
        <span className="metric__value">{formatMinutes(minutes)}</span>
      </div>
    </Card>
  );
}

export default WeeklyHoursCard;
