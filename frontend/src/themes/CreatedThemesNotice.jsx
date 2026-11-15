import Modal from '../components/Modal.jsx';

/**
 * Aviso apilado sobre el formulario de clase cuando se crearon temáticas y la
 * clase no se llegó a guardar. «Entendido» (o Escape) cierra el aviso y el
 * formulario.
 */
function CreatedThemesNotice({ names = [], onClose }) {
  return (
    <Modal
      title="Temáticas creadas"
      onClose={onClose}
      labelledBy="created-themes-notice-title"
      size="sm"
    >
      <p className="confirm__message">
        Se {names.length === 1 ? 'creó esta temática' : 'crearon estas temáticas'} mientras
        rellenabas la clase, pero la clase no se guardó.{' '}
        {names.length === 1
          ? 'La temática se conserva; puedes editarla desde «Temáticas»:'
          : 'Las temáticas se conservan; puedes editarlas desde «Temáticas»:'}
      </p>
      <ul className="created-themes__list">
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <div className="modal__actions">
        <button type="button" className="button button--primary" onClick={onClose}>
          Entendido
        </button>
      </div>
    </Modal>
  );
}

export default CreatedThemesNotice;
