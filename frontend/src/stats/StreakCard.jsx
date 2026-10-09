import Card from '../components/Card.jsx';

function StreakCard({ streak, selected }) {
  const current = streak?.current ?? 0;
  const best = streak?.best ?? 0;

  return (
    <Card
      title="Racha"
      description={selected ? 'Días seguidos hasta la fecha seleccionada' : 'Días seguidos con al menos una clase'}
    >
      <div className="metric">
        <span className="metric__value">{current}</span>
        <span className="metric__unit">{current === 1 ? 'día' : 'días'}</span>
      </div>
      <p className="metric__hint">
        🔥 Mejor racha: {best} {best === 1 ? 'día' : 'días'}
      </p>
    </Card>
  );
}

export default StreakCard;
