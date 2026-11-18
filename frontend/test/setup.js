import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library solo hace auto-cleanup si hay globals de test; como los tests
// importan todo de 'vitest' explícitamente, registramos la limpieza aquí.
afterEach(() => {
  cleanup();
  // El hash de un test no debe contaminar la pestaña inicial del siguiente.
  window.history.replaceState(null, '', '/');
});
