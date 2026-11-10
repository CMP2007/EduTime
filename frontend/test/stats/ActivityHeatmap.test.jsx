import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ActivityHeatmap from '../../src/stats/ActivityHeatmap.jsx';

function heatCell(container, index) {
  const cells = container.querySelectorAll('.heatmap__week')[0].children;
  return cells[index];
}

describe('ActivityHeatmap', () => {
  it('omite un día con fecha inválida y no lo coloca en la columna del lunes', () => {
    const { container } = render(
      <ActivityHeatmap
        days={[
          { date: 'fecha-rota', minutes: 60, goalMet: false },
          { date: '2026-10-14', minutes: 90, goalMet: false },
        ]}
        rangeKey="week"
        from="2026-10-14"
        to="2026-10-14"
      />,
    );

    // El miércoles válido conserva sus dos huecos previos (lunes y martes):
    // el día inválido no se ha colado como primer día de la semana.
    expect(heatCell(container, 0).className).toContain('heatmap__cell--empty');
    expect(heatCell(container, 1).className).toContain('heatmap__cell--empty');
    expect(heatCell(container, 2).getAttribute('title')).toContain('14 oct 2026');
    expect(container.querySelectorAll('.heatmap__week')[0].children).toHaveLength(3);
    expect(container.innerHTML).not.toContain('fecha-rota');
  });

  it('muestra "Sin datos" si todos los días tienen fecha inválida', () => {
    const { getByText } = render(
      <ActivityHeatmap days={[{ date: 'fecha-rota', minutes: 60, goalMet: false }]} />,
    );

    expect(getByText('Sin datos para este rango.')).toBeTruthy();
  });
});
