import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loadEnvMock } = vi.hoisted(() => ({ loadEnvMock: vi.fn() }));

vi.mock('vite', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, loadEnv: loadEnvMock };
});

vi.mock('@vitejs/plugin-react', () => ({
  default: () => ({ name: 'test-react-plugin' }),
}));

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendDir = dirname(testDir);
const rootDir = dirname(frontendDir);
const frontendPackage = JSON.parse(
  readFileSync(join(frontendDir, 'package.json'), 'utf8'),
);

async function loadConfig(mode = 'development') {
  const { default: createConfig } = await import('../vite.config.js');
  return createConfig({ mode });
}

beforeEach(() => {
  vi.stubEnv('VITE_PROXY_TARGET', '');
  loadEnvMock.mockReset();
  loadEnvMock.mockReturnValue({});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('vite.config.js', () => {
  it('lee el .env de la raíz del repositorio, no del cwd del workspace', async () => {
    await loadConfig('development');

    expect(loadEnvMock).toHaveBeenCalledWith('development', rootDir, 'VITE_');
  });

  it('usa http://localhost:3001 como destino por defecto', async () => {
    const config = await loadConfig();

    expect(config.server.proxy['/api']).toBe('http://localhost:3001');
  });

  it('usa VITE_PROXY_TARGET cuando está definido en el .env', async () => {
    loadEnvMock.mockReturnValue({ VITE_PROXY_TARGET: 'http://localhost:3999' });

    const config = await loadConfig();

    expect(config.server.proxy['/api']).toBe('http://localhost:3999');
  });

  it('prioriza el entorno del proceso sobre el .env', async () => {
    loadEnvMock.mockReturnValue({ VITE_PROXY_TARGET: 'http://localhost:3999' });
    vi.stubEnv('VITE_PROXY_TARGET', 'http://localhost:5000');

    const config = await loadConfig();

    expect(config.server.proxy['/api']).toBe('http://localhost:5000');
  });

  it('usa el destino por defecto cuando el valor está vacío', async () => {
    loadEnvMock.mockReturnValue({ VITE_PROXY_TARGET: '   ' });

    const config = await loadConfig();

    expect(config.server.proxy['/api']).toBe('http://localhost:3001');
  });

  it('escucha solo en la interfaz local', async () => {
    const config = await loadConfig();

    expect(config.server.host).toBe('localhost');
    expect(config.server.host).not.toBe('0.0.0.0');
  });

  it('los scripts de desarrollo y previsualización no fuerzan 0.0.0.0', () => {
    expect(frontendPackage.scripts.dev).not.toContain('0.0.0.0');
    expect(frontendPackage.scripts.preview).not.toContain('0.0.0.0');
  });
});
