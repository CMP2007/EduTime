import { ApiError } from './ApiError.js';

const API_URL = '/api';

/** Petición JSON genérica contra la API. Lanza ApiError con mensaje y status HTTP. */
export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servicio. Comprueba tu conexión e inténtalo de nuevo.',
      0,
    );
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || 'No se pudo completar la petición', response.status);
  }
  return data;
}
