import { Component } from 'react';

/**
 * Evita la pantalla en blanco: si un hijo lanza un error durante el render,
 * pinta un fallback con opción de recargar. React exige una clase para los
 * límites de error (los hooks no cubren `componentDidCatch`): es la excepción
 * documentada a la regla "sin clases" de AGENTS.md.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error de render capturado por ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <p className="error">Algo salió mal al mostrar esta sección.</p>
          <p className="muted">{this.state.error.message}</p>
          <button type="button" className="button button--primary" onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
