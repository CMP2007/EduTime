import { useEffect, useRef } from 'react';

// Orden de preferencia para el foco inicial (RF-1): campo editable, botón del
// cuerpo y, si no hay nada, el propio diálogo. La «×» de la cabecera queda fuera.
const FIELD_SELECTOR = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
const BUTTON_SELECTOR = 'button:not([disabled])';
const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]';

function getFocusableElements(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.disabled) return false;
    if (element.hidden || element.closest('[hidden]')) return false;
    return element.getAttribute('tabindex') !== '-1';
  });
}

function Modal({ title, onClose, children, labelledBy = 'modal-title', size = 'md' }) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    openerRef.current = document.activeElement;

    const body = dialogRef.current?.querySelector('.modal__body');
    const target = body?.querySelector(FIELD_SELECTOR)
      ?? body?.querySelector(BUTTON_SELECTOR)
      ?? dialogRef.current;
    target?.focus();

    return () => {
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      } else {
        document.querySelector('main')?.focus();
      }
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusables = getFocusableElements(dialogRef.current);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!dialogRef.current.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="modal-overlay" role="presentation">
      <div ref={dialogRef} className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        <header className="modal__header">
          <h2 id={labelledBy} className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
