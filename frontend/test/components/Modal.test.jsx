import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Modal from '../../src/components/Modal.jsx';

/**
 * Arnés común de los tests del Modal: un disparador, un `<main>` que puede recibir
 * foco (fallback de RF-4) y el modal controlado por estado, como en la app real.
 */
function ModalHarness({
  onClose = () => {},
  title = 'Diálogo de prueba',
  children = <p>Contenido</p>,
  removableTrigger = false,
}) {
  const [open, setOpen] = useState(false);
  const [showTrigger, setShowTrigger] = useState(true);

  return (
    <>
      {showTrigger && <button type="button" onClick={() => setOpen(true)}>Abrir</button>}
      {removableTrigger && (
        <button type="button" onClick={() => setShowTrigger(false)}>Quitar disparador</button>
      )}
      <main tabIndex={-1}>Contenido principal</main>
      {open && (
        <Modal
          title={title}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        >
          {children}
        </Modal>
      )}
    </>
  );
}

describe('Modal', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('cierra con Escape y avisa una sola vez (RF-6)', () => {
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('cierra con el botón «Cerrar» de la cabecera (RF-7)', () => {
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('no cierra al pulsar sobre el fondo (RF-8)', () => {
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    const overlay = screen.getByRole('dialog').parentElement;

    fireEvent.mouseDown(overlay);

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('no cierra al pulsar dentro del diálogo (RF-8)', () => {
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    fireEvent.mouseDown(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('al abrir enfoca el primer campo editable (RF-1)', () => {
    render(
      <ModalHarness>
        <button type="button">Cancelar</button>
        <input aria-label="Temática" />
      </ModalHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    // El botón del cuerpo va antes en el DOM: si se enfoca, la prioridad está mal.
    expect(document.activeElement).toBe(screen.getByLabelText('Temática'));
  });

  it('sin campos enfoca el primer botón del cuerpo, no la «×» (RF-1)', () => {
    render(
      <ModalHarness>
        <button type="button">Cancelar</button>
        <button type="button">Eliminar</button>
      </ModalHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }));
  });

  it('sin controles en el cuerpo enfoca el contenedor del diálogo (RF-1)', () => {
    render(<ModalHarness>{null}</ModalHarness>);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });

  it('salta el primer campo si está deshabilitado (caso límite)', () => {
    render(
      <ModalHarness>
        <input aria-label="Deshabilitado" disabled />
        <input aria-label="Habilitado" />
      </ModalHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(document.activeElement).toBe(screen.getByLabelText('Habilitado'));
  });

  it('Tab en el último enfocable vuelve al primero (RF-2)', () => {
    render(
      <ModalHarness>
        <button type="button">Cancelar</button>
      </ModalHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    const cancel = screen.getByRole('button', { name: 'Cancelar' });

    // El foco inicial ya está en el último (Cancelar); Tab debe envolver a la «×».
    expect(document.activeElement).toBe(cancel);
    const notPrevented = fireEvent.keyDown(cancel, { key: 'Tab' });

    expect(notPrevented).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar' }));
  });

  it('Shift+Tab en el primero va al último (RF-2)', () => {
    render(
      <ModalHarness>
        <button type="button">Cancelar</button>
        <button type="button">Guardar</button>
      </ModalHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    screen.getByRole('button', { name: 'Cerrar' }).focus();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Cerrar' }), {
      key: 'Tab',
      shiftKey: true,
    });

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Guardar' }));
  });

  it('no incluye los botones deshabilitados en el ciclo (RF-2)', () => {
    render(
      <ModalHarness>
        <button type="button">Cancelar</button>
        <button type="button" disabled>Eliminar</button>
      </ModalHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    screen.getByRole('button', { name: 'Cerrar' }).focus();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Cerrar' }), {
      key: 'Tab',
      shiftKey: true,
    });

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }));
  });

  it('al cerrar devuelve el foco al disparador (RF-3)', () => {
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);

    const trigger = screen.getByRole('button', { name: 'Abrir' });
    trigger.focus();
    fireEvent.click(trigger);

    // El foco está dentro del diálogo (cuerpo sin controles: el contenedor).
    expect(document.activeElement).toBe(screen.getByRole('dialog'));

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.activeElement).toBe(trigger);
  });

  it('si el disparador desapareció, el foco va al contenido principal (RF-4)', () => {
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} removableTrigger />);

    const trigger = screen.getByRole('button', { name: 'Abrir' });
    trigger.focus();
    fireEvent.click(trigger);

    // Como al borrar la fila que abrió el diálogo: el disparador ya no existe.
    fireEvent.click(screen.getByRole('button', { name: 'Quitar disparador' }));

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.activeElement).toBe(screen.getByRole('main'));
  });

  it('bloquea el scroll del fondo mientras está abierto (RF-5)', () => {
    render(<ModalHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));

    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.body.style.overflow).toBe('');
  });

  it('restaura el overflow previo del body al cerrar (RF-5)', () => {
    document.body.style.overflow = 'scroll';
    render(<ModalHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(document.body.style.overflow).toBe('scroll');
  });

  it('desmontar sin cerrar también restaura el overflow (caso límite)', () => {
    const { unmount } = render(
      <Modal title="Diálogo directo" onClose={() => {}}>
        <p>Contenido</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });
});
