import Card from '../components/Card.jsx';

function ActivityDaysCard({ global }) {
  return (
    <Card title="Días con meta cumplida" description="Días que llegaron a 3 horas o más">
      <div className="metric">
        <span className="metric__value">{global?.goalDays ?? 0}</span>
        <span className="metric__unit">días</span>
      </div>
      <p className="metric__hint">Histórico completo</p>
    </Card>
  );
}

export default ActivityDaysCard;
