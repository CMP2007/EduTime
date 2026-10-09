import Card from '../components/Card.jsx';

function ActivityDaysCard({ weekDays, global, selected }) {
  return (
    <Card
      title="Días con meta cumplida"
      description={selected ? 'Días con 3 h o más en esa semana' : 'Días con 3 h o más esta semana'}
    >
      <div className="metric">
        <span className="metric__value">{weekDays ?? 0}</span>
        <span className="metric__unit">días</span>
      </div>
      <p className="metric__hint">Total histórico: {global?.goalDays ?? 0} días</p>
    </Card>
  );
}

export default ActivityDaysCard;
