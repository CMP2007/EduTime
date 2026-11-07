const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '127.0.0.1';

/** Configuración de arranque del backend, con override explícito por entorno. */
export function getServerConfig(env = process.env) {
  const port = Number(env.PORT) || DEFAULT_PORT;
  const host = env.HOST?.trim() || DEFAULT_HOST;

  return { port, host };
}
