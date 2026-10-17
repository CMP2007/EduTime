import { ApiError } from './ApiError.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Petición JSON genérica contra la API. Lanza ApiError con mensaje y status HTTP. */
export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || 'No se pudo completar la petición', response.status);
  }
  return data;
}
