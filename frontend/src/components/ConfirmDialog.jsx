import Modal from './Modal.jsx';

function ConfirmDialog({
  open,
  title = 'Confirmar',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) return null;

  return (
    <Modal title={title} onClose={onCancel} labelledBy="confirm-dialog-title" size="sm">
      <p className="confirm__message">{message}</p>
      <div className="modal__actions">
        <button type="button" className="button button--ghost" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button type="button" className="button button--danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Eliminando…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
