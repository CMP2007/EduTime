/** Middleware que registra método, ruta, estado y duración de cada petición. */
export function createRequestLogger({ log = (...args) => console.info(...args) } = {}) {
  return (request, response, next) => {
    const startedAt = Date.now();

    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      log(`[http] ${request.method} ${request.path} ${response.statusCode} ${duration}ms`);
    });

    next();
  };
}
