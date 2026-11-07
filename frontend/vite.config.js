import { dirname } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// El cwd del workspace es `frontend`, pero el `.env` vive en la raíz del repo.
const rootDir = dirname(import.meta.dirname);
const DEFAULT_PROXY_TARGET = 'http://localhost:3001';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, 'VITE_');
  const proxyTarget =
    process.env.VITE_PROXY_TARGET?.trim() ||
    env.VITE_PROXY_TARGET?.trim() ||
    DEFAULT_PROXY_TARGET;

  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      port: 5173,
      proxy: {
        '/api': proxyTarget,
      },
    },
  };
});
