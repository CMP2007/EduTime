/** Aviso informativo accesible (role="status") reutilizable en varias vistas. */
function StatusNotice({ children }) {
  return (
    <p className="notice" role="status">
      {children}
    </p>
  );
}

export default StatusNotice;
