import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SessionRow from '../../src/sessions/SessionRow.jsx';
import { buildSession } from '../fixtures/contracts.js';

describe('SessionRow · temática actual (RF-32)', () => {
  it('muestra el nombre actual de la temática, no el antiguo', () => {
    render(
      <SessionRow
        session={buildSession({ themeId: 'theme-2', themeName: 'Física' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('Física')).toBeTruthy();
    expect(screen.queryByText('Matemáticas')).toBeNull();
  });

  it('distingue dos clases de la misma temática por su identificador', () => {
    render(
      <ul>
        <SessionRow
          session={buildSession({ id: 's1', themeId: 'theme-1', themeName: 'Matemáticas' })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
        <SessionRow
          session={buildSession({ id: 's2', themeId: 'theme-1', themeName: 'Matemáticas' })}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('pasa la clase editada y la eliminada a sus acciones', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const session = buildSession();

    render(<SessionRow session={session} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(onEdit).toHaveBeenCalledWith(session);
    expect(onDelete).toHaveBeenCalledWith(session);
  });
});
