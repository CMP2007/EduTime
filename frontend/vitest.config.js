import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Configuración de los tests de frontend (Vitest + jsdom). Los tests importan
// describe/it/expect/vitest de 'vitest' explícitamente: no se usa `globals`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
  },
});
