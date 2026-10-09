import Card from '../components/Card.jsx';

/** Racha global: días consecutivos (hasta hoy) en los que se cumplió la meta. */
function StreakCard({ streak }) {
  const current = streak?.current ?? 0;
  const best = streak?.best ?? 0;

  return (
    <Card className="card--center" title="Racha" description="Días seguidos con la meta cumplida">
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
