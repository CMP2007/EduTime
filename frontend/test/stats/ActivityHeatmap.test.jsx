import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ActivityHeatmap from '../../src/stats/ActivityHeatmap.jsx';
import { HEATMAP_LEVEL_COUNT, HEATMAP_LEVEL_MAX } from '../../src/stats/heatmapLevel.js';

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

  it('aplica el nivel de la escala a cada celda según sus minutos', () => {
    const { container } = render(
      <ActivityHeatmap
        days={[
          { date: '2026-10-12', minutes: 30, goalMet: false },
          { date: '2026-10-13', minutes: 90, goalMet: false },
          { date: '2026-10-14', minutes: 150, goalMet: false },
          { date: '2026-10-15', minutes: 200, goalMet: true },
          { date: '2026-10-16', minutes: 0, goalMet: false },
        ]}
        rangeKey="week"
        from="2026-10-12"
        to="2026-10-16"
      />,
    );

    expect(heatCell(container, 0).className).toContain('heatmap__cell--l1');
    expect(heatCell(container, 1).className).toContain('heatmap__cell--l2');
    expect(heatCell(container, 2).className).toContain('heatmap__cell--l3');
    expect(heatCell(container, 3).className).toContain('heatmap__cell--l4');
    expect(heatCell(container, 4).className).toContain('heatmap__cell--l0');
  });

  it('pinta una celda de leyenda por nivel de la escala', () => {
    const { container } = render(
      <ActivityHeatmap
        days={[{ date: '2026-10-14', minutes: 90, goalMet: false }]}
        rangeKey="week"
        from="2026-10-14"
        to="2026-10-14"
      />,
    );

    const legend = container.querySelectorAll('.heatmap__legend .heatmap__cell');
    expect(legend).toHaveLength(HEATMAP_LEVEL_COUNT);
    expect(legend[0].className).toContain('heatmap__cell--l0');
    expect(legend[legend.length - 1].className).toContain(`heatmap__cell--l${HEATMAP_LEVEL_MAX}`);
  });
});
