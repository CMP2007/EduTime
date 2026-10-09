import { useEffect } from 'react';

function Modal({ title, onClose, children, labelledBy = 'modal-title', size = 'md' }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={handleBackdrop}>
      <div className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
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
