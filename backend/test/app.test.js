import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it, mock } from 'node:test';

import app from '../src/app.js';
import { statsService } from '../src/stats/stats.service.js';

// La app real en un puerto efímero: cubre el flujo completo petición →
// middlewares → rutas → manejador de errores. Ningún caso escribe en disco:
// los bodies inválidos fallan antes de llegar al repositorio.
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

afterEach(() => {
  mock.restoreAll();
});

function post(body, contentType = 'application/json') {
  return fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });
}

describe('app · respuestas básicas', () => {
  it('GET /api/health responde 200', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', app: 'StudyTrack' });
  });

  it('una ruta desconocida responde 404', async () => {
    const response = await fetch(`${baseUrl}/api/nope`);
    assert.equal(response.status, 404);
  });
});

describe('app · manejo de errores (B2-1)', () => {
  it('un body con JSON malformado responde 400, no 500', async () => {
    const response = await post('{bad json');
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /JSON inválido/);
  });

  it('el JSON malformado no ensucia el log con un stacktrace', async () => {
    const errorLog = mock.method(console, 'error', () => {});

    const response = await post('{bad json');

    assert.equal(response.status, 400);
    assert.equal(errorLog.mock.callCount(), 0);
  });

  it('un payload inválido sigue respondiendo 400 (ValidationError)', async () => {
    const response = await post(JSON.stringify({ title: '', date: '2026-10-15', hours: 1, minutes: 0 }));
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /temática/);
  });

  it('un fallo real del servidor responde 500 y sí se registra', async () => {
    const errorLog = mock.method(console, 'error', () => {});
    mock.method(statsService, 'getStats', async () => {
      throw new Error('fallo interno simulado');
    });

    const response = await fetch(`${baseUrl}/api/stats?period=week`);

    assert.equal(response.status, 500);
    const body = await response.json();
    assert.equal(body.error, 'Error interno del servidor');
    assert.equal(errorLog.mock.callCount(), 1);
  });
});
