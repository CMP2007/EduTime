/** Error de la API que conserva el código de estado HTTP de la respuesta. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
