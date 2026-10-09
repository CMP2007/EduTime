const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/** Petición JSON genérica contra la API. Lanza Error con el mensaje del backend. */
export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'No se pudo completar la petición');
  }
  return data;
}
