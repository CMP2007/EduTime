import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it, mock, beforeEach } from 'node:test';

import app from '../src/app.js';
import { statsService } from '../src/stats/stats.service.js';
import { sessionsRepository } from '../src/sessions/sessions.repository.js';
import { assertStats } from 'domain-contracts';

// La app real en un puerto efímero: cubre el flujo completo petición →
// middlewares → rutas → manejador de errores. Ningún caso escribe en disco:
// los bodies inválidos fallan antes de llegar al repositorio.
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
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

let infoLog;

beforeEach(() => {
  infoLog = mock.method(console, 'info', () => {});
});

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

describe('app · logging de peticiones (B2-4)', () => {
  it('registra método, ruta, estado y duración', async () => {
    const response = await fetch(`${baseUrl}/api/health?probe=1`);

    assert.equal(response.status, 200);
    assert.equal(infoLog.mock.callCount(), 1);
    const [line] = infoLog.mock.calls[0].arguments;
    assert.match(line, /^\[http\] GET \/api\/health 200 \d+ms$/);
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

describe('app · validación de periodos (B3-4)', () => {
  it('un periodo inválido responde 400', async () => {
    const response = await fetch(`${baseUrl}/api/stats?period=foo`);

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /Periodo inválido/);
  });

  it('un heatmap inválido responde 400', async () => {
    const response = await fetch(`${baseUrl}/api/stats?heatmap=foo`);

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /Periodo del heatmap inválido/);
  });
});

describe('app · sin cabeceras CORS (RF-2)', () => {
  it('no emite Access-Control-Allow-Origin con un Origin externo', async () => {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'http://evil.example' },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  });

  it('no responde a un preflight con cabeceras CORS', async () => {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://evil.example',
        'Access-Control-Request-Method': 'GET',
      },
    });

    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.equal(response.headers.get('access-control-allow-methods'), null);
  });
});

describe('app · saneamiento de logs de error (B2-4)', () => {
  it('el log de un 500 incluye método, ruta y estado, sin el body', async () => {
    const errorLog = mock.method(console, 'error', () => {});
    mock.method(statsService, 'getStats', async () => {
      const error = new Error('fallo interno simulado');
      error.body = { title: 'dato privado' };
      throw error;
    });

    const response = await fetch(`${baseUrl}/api/stats?period=week`);

    assert.equal(response.status, 500);
    assert.equal(errorLog.mock.callCount(), 1);
    const [line, stack] = errorLog.mock.calls[0].arguments;
    assert.match(line, /^\[error\] GET \/api\/stats 500 fallo interno simulado$/);
    assert.doesNotMatch(String(line), /dato privado/);
    assert.equal(typeof stack, 'string');
  });
});

describe('app · validación de fechas y avisos (T5)', () => {
  const invalidDates = [
    ['fecha imposible', '2026-02-31'],
    ['fecha vacía', ''],
    ['fecha no textual', 12345],
    ['fecha nula', null],
    ['formato sin ceros', '2026-1-1'],
    ['año fuera de rango', '1989-12-31'],
    ['espacios alrededor', ' 2026-10-15 '],
  ];

  it('POST /api/sessions con fecha inválida responde 400', async () => {
    const insert = mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));

    for (const [caso, date] of invalidDates) {
      const response = await post(
        JSON.stringify({ title: 'JavaScript', date, notes: '', hours: 1, minutes: 0 }),
      );
      assert.equal(response.status, 400, `POST falló para: ${caso}`);
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('PUT /api/sessions con fecha inválida responde 400', async () => {
    const existing = {
      id: 'session-1',
      title: 'JavaScript',
      date: '2026-10-15',
      durationMinutes: 60,
      notes: '',
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-15T10:00:00.000Z',
    };
    mock.method(sessionsRepository, 'findById', async () => ({ ...existing }));
    const update = mock.method(sessionsRepository, 'update', async () => ({ ...existing }));

    for (const [caso, date] of invalidDates) {
      const response = await fetch(`${baseUrl}/api/sessions/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      assert.equal(response.status, 400, `PUT falló para: ${caso}`);
    }

    assert.equal(update.mock.callCount(), 0);
  });

  it('GET /api/sessions con from/to inválidos responde 400', async () => {
    const queries = [
      ['from imposible', 'from=2026-02-31'],
      ['to imposible', 'to=2026-02-31'],
      ['from no textual', 'from=abc'],
      ['from repetido', 'from=2026-10-15&from=2026-10-16'],
      ['to repetido', 'to=2026-10-15&to=2026-10-16'],
    ];

    for (const [caso, query] of queries) {
      const response = await fetch(`${baseUrl}/api/sessions?${query}`);
      assert.equal(response.status, 400, `GET falló para: ${caso}`);
    }
  });

  it('GET /api/sessions con rango invertido responde 400', async () => {
    const response = await fetch(`${baseUrl}/api/sessions?from=2026-10-15&to=2026-10-14`);
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /invertido/);
  });

  it('GET /api/stats con date/heatmapDate inválidos o repetidos responde 400 y sin NaN', async () => {
    const queries = [
      ['date imposible', 'date=2026-02-31'],
      ['heatmapDate imposible', 'heatmapDate=2026-02-31'],
      ['date no textual', 'date=abc'],
      ['date repetido', 'date=2026-10-15&date=2026-10-16'],
      ['heatmapDate repetido', 'heatmapDate=2026-10-15&heatmapDate=2026-10-16'],
    ];

    for (const [caso, query] of queries) {
      const response = await fetch(`${baseUrl}/api/stats?${query}`);
      assert.equal(response.status, 400, `GET /api/stats falló para: ${caso}`);
      const body = await response.json();
      assert.doesNotMatch(JSON.stringify(body), /NaN/);
    }
  });

  it('GET /api/stats?date=9999-12-31&period=week responde 200, recorta el heatmap y avisa', async () => {
    mock.method(sessionsRepository, 'findAll', async () => []);

    const response = await fetch(`${baseUrl}/api/stats?date=9999-12-31&period=week`);

    assert.equal(response.status, 200);
    const stats = await response.json();
    assert.equal(stats.heatmap.to, '9999-12-31');
    assert.equal(typeof stats.notice, 'string');
    assert.match(stats.notice, /recortado/);
    assert.doesNotThrow(() => assertStats(stats));
  });
});
