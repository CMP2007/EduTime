import Card from '../components/Card.jsx';
import { formatDateLong } from '../utils/date.js';
import { formatMinutes } from '../utils/time.js';

function LongestClassCard({ longest }) {
  return (
    <Card title="Clase más larga" description="Del periodo seleccionado">
      {longest ? (
        <div>
          <p className="longest__title">{longest.name}</p>
          <p className="longest__meta">
            {formatDateLong(longest.date)} · {formatMinutes(longest.durationMinutes)}
          </p>
        </div>
      ) : (
        <p className="muted">Sin clases en este periodo.</p>
      )}
    </Card>
  );
}

export default LongestClassCard;
