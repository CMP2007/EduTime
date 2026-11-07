import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it, mock, afterEach } from 'node:test';

import { createRequestLogger } from '../src/middleware/requestLogger.js';

function createResponse() {
  const response = new EventEmitter();
  response.statusCode = 200;
  return response;
}

describe('requestLogger · registro de peticiones (B2-4)', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('registra método, ruta, estado y duración al terminar la respuesta', () => {
    const lines = [];
    const middleware = createRequestLogger({ log: (line) => lines.push(line) });
    const request = { method: 'GET', path: '/api/sessions' };
    const response = createResponse();
    let nextCalled = false;

    middleware(request, response, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.deepEqual(lines, []);

    response.statusCode = 404;
    response.emit('finish');

    assert.equal(lines.length, 1);
    assert.match(lines[0], /^\[http\] GET \/api\/sessions 404 \d+ms$/);
  });

  it('no registra el cuerpo de la petición', () => {
    const lines = [];
    const middleware = createRequestLogger({ log: (line) => lines.push(line) });
    const request = {
      method: 'POST',
      path: '/api/sessions',
      body: { title: 'Dato privado', notes: 'No debe aparecer' },
    };
    const response = createResponse();

    middleware(request, response, () => {});
    response.emit('finish');

    assert.equal(lines.length, 1);
    assert.doesNotMatch(lines[0], /Dato privado|No debe aparecer/);
  });

  it('usa console.info por defecto', () => {
    const infoLog = mock.method(console, 'info', () => {});
    const middleware = createRequestLogger();
    const response = createResponse();

    middleware({ method: 'GET', path: '/api/health' }, response, () => {});
    response.emit('finish');

    assert.equal(infoLog.mock.callCount(), 1);
    assert.match(infoLog.mock.calls[0].arguments[0], /^\[http\] GET \/api\/health 200 \d+ms$/);
  });
});
