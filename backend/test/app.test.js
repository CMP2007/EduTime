import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it, mock, beforeEach } from 'node:test';

import app from '../src/app.js';
import { statsService } from '../src/stats/stats.service.js';
import { sessionsRepository } from '../src/sessions/sessions.repository.js';
import { themesRepository } from '../src/themes/themes.repository.js';
import { assertSession, assertSessionList, assertStats, assertTheme, assertThemeList } from 'domain-contracts';

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

const THEMES = [
  { id: 'theme-1', name: 'JavaScript' },
  { id: 'theme-2', name: 'Matemáticas' },
];

/** Simula el catálogo con las mismas temáticas para listar y buscar por id. */
function mockThemes(themes = THEMES) {
  mock.method(themesRepository, 'findAll', async () => themes.map((theme) => ({ ...theme })));
  mock.method(themesRepository, 'findById', async (id) => {
    const found = themes.find((theme) => theme.id === id);
    return found ? { ...found } : null;
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
    const response = await post(JSON.stringify({ themeId: '', date: '2026-10-15', hours: 1, minutes: 0 }));
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
        JSON.stringify({ themeId: 'theme-1', date, notes: '', hours: 1, minutes: 0 }),
      );
      assert.equal(response.status, 400, `POST falló para: ${caso}`);
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('PUT /api/sessions con fecha inválida responde 400', async () => {
    const existing = {
      id: 'session-1',
      themeId: 'theme-1',
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

describe('app · datos de ejemplo (RF-36, RF-39)', () => {
  it('POST /api/seed responde 204 y carga la semilla si no hay clases', async () => {
    mock.method(sessionsRepository, 'findAll', async () => []);
    mock.method(themesRepository, 'findAll', async () => []);
    mock.method(themesRepository, 'insertMany', async (themes) => themes);
    mock.method(sessionsRepository, 'insertMany', async (sessions) => sessions);

    const response = await fetch(`${baseUrl}/api/seed`, { method: 'POST' });

    assert.equal(response.status, 204);
  });

  it('POST /api/seed responde 409 si ya hay al menos una clase', async () => {
    mock.method(sessionsRepository, 'findAll', async () => [
      { id: 'session-1', themeId: 'theme-1' },
    ]);
    mock.method(themesRepository, 'findAll', async () => [
      { id: 'theme-1', name: 'Matemáticas' },
    ]);

    const response = await fetch(`${baseUrl}/api/seed`, { method: 'POST' });

    assert.equal(response.status, 409);
    const body = await response.json();
    assert.match(body.error, /Ya hay clases registradas/);
  });
});

describe('app · temáticas (RF-2 a RF-13, RF-26 a RF-28)', () => {
  function themesRequest(method, body, id = '') {
    return fetch(`${baseUrl}/api/themes${id ? `/${id}` : ''}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  it('GET /api/themes devuelve la lista ordenada con sessionCount y cumple el contrato', async () => {
    mock.method(themesRepository, 'findAll', async () => [
      { id: 't2', name: 'Física' },
      { id: 't1', name: 'álgebra' },
    ]);
    mock.method(sessionsRepository, 'findAll', async () => [{ id: 's1', themeId: 't1' }]);

    const response = await fetch(`${baseUrl}/api/themes`);

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.doesNotThrow(() => assertThemeList(body));
    assert.deepEqual(body.map((theme) => theme.name), ['álgebra', 'Física']);
    assert.equal(body[0].sessionCount, 1);
    assert.equal(body[1].sessionCount, 0);
  });

  it('POST /api/themes responde 201 con la temática creada y cumple el contrato', async () => {
    mock.method(themesRepository, 'findAll', async () => []);
    mock.method(themesRepository, 'insert', async (theme) => theme);

    const response = await themesRequest('POST', { name: '  Matemáticas  ' });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.doesNotThrow(() => assertTheme(body));
    assert.equal(body.name, 'Matemáticas');
    assert.equal(body.sessionCount, 0);
    assert.equal(typeof body.id, 'string');
  });

  it('POST /api/themes rechaza un duplicado con 400 y mensaje claro', async () => {
    mock.method(themesRepository, 'findAll', async () => [
      { id: 't1', name: 'Matemáticas' },
    ]);
    const insert = mock.method(themesRepository, 'insert', async (theme) => theme);

    const response = await themesRequest('POST', { name: 'matematicas' });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /Ya existe una temática con ese nombre/);
    assert.equal(insert.mock.callCount(), 0);
  });

  it('POST /api/themes rechaza un nombre vacío con 400', async () => {
    const response = await themesRequest('POST', { name: '   ' });

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /obligatorio/);
  });

  it('PUT /api/themes/:id renombra y responde 200', async () => {
    mock.method(themesRepository, 'findAll', async () => [
      { id: 't1', name: 'Matemáticas' },
    ]);
    mock.method(sessionsRepository, 'countByThemeId', async () => 0);
    mock.method(themesRepository, 'update', async (id, changes) => ({ id, ...changes }));

    const response = await themesRequest('PUT', { name: 'Álgebra' }, 't1');

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.doesNotThrow(() => assertTheme(body));
    assert.deepEqual(body, { id: 't1', name: 'Álgebra', sessionCount: 0 });
  });

  it('PUT /api/themes/:id responde 404 si la temática no existe', async () => {
    mock.method(themesRepository, 'findAll', async () => []);

    const response = await themesRequest('PUT', { name: 'Álgebra' }, 'no-existe');

    assert.equal(response.status, 404);
  });

  it('DELETE /api/themes/:id sin clases responde 204', async () => {
    mock.method(themesRepository, 'findAll', async () => [
      { id: 't1', name: 'Matemáticas' },
    ]);
    mock.method(sessionsRepository, 'countByThemeId', async () => 0);
    const remove = mock.method(themesRepository, 'remove', async () => true);

    const response = await themesRequest('DELETE', undefined, 't1');

    assert.equal(response.status, 204);
    assert.equal(remove.mock.callCount(), 1);
  });

  it('DELETE /api/themes/:id responde 404 si la temática no existe', async () => {
    mock.method(themesRepository, 'findAll', async () => []);

    const response = await themesRequest('DELETE', undefined, 'no-existe');

    assert.equal(response.status, 404);
  });
});

describe('app · sesiones con temática (RF-20 a RF-24, RF-29 a RF-31)', () => {
  beforeEach(() => {
    mockThemes();
  });

  function session(overrides = {}) {
    return {
      id: 'session-1',
      themeId: 'theme-1',
      date: '2026-10-15',
      durationMinutes: 60,
      notes: '',
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-15T10:00:00.000Z',
      ...overrides,
    };
  }

  it('GET /api/sessions resuelve themeName y cumple el contrato', async () => {
    mock.method(sessionsRepository, 'findAll', async () => [
      session(),
      session({ id: 'session-2', themeId: 'theme-2', date: '2026-10-16' }),
    ]);

    const response = await fetch(`${baseUrl}/api/sessions`);

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.doesNotThrow(() => assertSessionList(body));
    assert.deepEqual(
      body.map((item) => item.themeName).sort(),
      ['JavaScript', 'Matemáticas'],
    );
  });

  it('GET /api/sessions filtra por themeId y busca q solo en observaciones', async () => {
    mock.method(sessionsRepository, 'findAll', async () => [
      session({ id: 's1' }),
      session({ id: 's2', themeId: 'theme-2', notes: 'Repaso de física cuántica' }),
    ]);

    const byTheme = await fetch(`${baseUrl}/api/sessions?themeId=theme-2`);
    assert.deepEqual((await byTheme.json()).map((item) => item.id), ['s2']);

    const byThemeName = await fetch(`${baseUrl}/api/sessions?q=javascript`);
    assert.deepEqual(await byThemeName.json(), []);

    const byNotes = await fetch(`${baseUrl}/api/sessions?q=f%C3%ADsica`);
    assert.deepEqual((await byNotes.json()).map((item) => item.id), ['s2']);
  });

  it('GET /api/sessions con themeId repetido responde 400', async () => {
    const response = await fetch(
      `${baseUrl}/api/sessions?themeId=theme-1&themeId=theme-2`,
    );

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /temática/);
  });

  it('POST /api/sessions con una temática inexistente responde 400', async () => {
    const insert = mock.method(sessionsRepository, 'insert', async (item) => ({ ...item }));

    const response = await post(
      JSON.stringify({ themeId: 'no-existe', date: '2026-10-15', hours: 1, minutes: 0 }),
    );

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /no existe/);
    assert.equal(insert.mock.callCount(), 0);
  });

  it('PUT /api/sessions cambia la temática y devuelve el nombre nuevo', async () => {
    const current = session();
    mock.method(sessionsRepository, 'findById', async () => ({ ...current }));
    mock.method(sessionsRepository, 'update', async (id, data) => ({ ...current, ...data, id }));

    const response = await fetch(`${baseUrl}/api/sessions/${current.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId: 'theme-2', hours: 1, minutes: 0 }),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.themeId, 'theme-2');
    assert.equal(body.themeName, 'Matemáticas');
    assert.doesNotThrow(() => assertSession(body));
  });
});

describe('app · duración parcial en /api/sessions (RF-1 a RF-13)', () => {
  beforeEach(() => {
    mockThemes();
  });

  function postSession(duration) {
    return post(
      JSON.stringify({ themeId: 'theme-1', date: '2026-10-15', notes: '', ...duration }),
    );
  }

  function putSession(id, body) {
    return fetch(`${baseUrl}/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function makeSession(overrides = {}) {
    return {
      id: 'session-1',
      themeId: 'theme-1',
      date: '2026-10-15',
      durationMinutes: 120,
      notes: '',
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-15T10:00:00.000Z',
      ...overrides,
    };
  }

  function mockExisting(initial = makeSession()) {
    let current = initial;
    mock.method(sessionsRepository, 'findById', async () => ({ ...current }));
    const update = mock.method(sessionsRepository, 'update', async (id, data) => ({
      ...current,
      ...data,
      id,
    }));
    return {
      update,
      setCurrent(next) {
        current = next;
      },
    };
  }

  it('POST con ambos, solo horas y solo minutos responde 201 con la duración', async () => {
    mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));
    const cases = [
      [{ hours: 1, minutes: 30 }, 90],
      [{ hours: 2 }, 120],
      [{ minutes: 45 }, 45],
      [{ minutes: 15 }, 15],
      [{ hours: 23, minutes: 59 }, 1439],
    ];

    for (const [duration, expected] of cases) {
      const response = await postSession(duration);
      assert.equal(response.status, 201);
      const body = await response.json();
      assert.equal(body.durationMinutes, expected);
      assert.doesNotThrow(() => assertSession(body));
    }
  });

  it('POST sin duración, con null/vacío o con durationMinutes directo responde 400 de mínimo', async () => {
    const insert = mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));
    const payloads = [
      {},
      { hours: null, minutes: null },
      { hours: '', minutes: '' },
      { durationMinutes: 60 },
      { hours: 0, minutes: 0 },
    ];

    for (const duration of payloads) {
      const response = await postSession(duration);
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.match(body.error, /al menos 15 minutos/);
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('POST con total superior a 1439 responde 400 con el máximo 23:59', async () => {
    const insert = mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));

    for (const duration of [{ hours: 24 }, { hours: 23, minutes: 60 }, { hours: 24, minutes: 60 }]) {
      const response = await postSession(duration);
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.match(body.error, /23:59/);
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('POST con horas o minutos inválidos responde 400 sobre el campo correspondiente', async () => {
    const insert = mock.method(sessionsRepository, 'insert', async (session) => ({ ...session }));
    const cases = [
      [{ hours: -1, minutes: 0 }, /Las horas/],
      [{ hours: 1.5, minutes: 0 }, /Las horas/],
      [{ hours: 'abc', minutes: 0 }, /Las horas/],
      [{ hours: 'abc', minutes: 'abc' }, /Las horas/],
      [{ hours: 0, minutes: -1 }, /Los minutos/],
      [{ hours: 0, minutes: 1.5 }, /Los minutos/],
      [{ hours: 0, minutes: 'abc' }, /Los minutos/],
      [{ hours: 0, minutes: 60 }, /entre 0 y 59/],
    ];

    for (const [duration, expected] of cases) {
      const response = await postSession(duration);
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.match(body.error, expected);
    }

    assert.equal(insert.mock.callCount(), 0);
  });

  it('PUT con ambos, solo horas y solo minutos actualiza la duración', async () => {
    mockExisting();
    const cases = [
      [{ hours: 1, minutes: 30 }, 90],
      [{ hours: 1 }, 60],
      [{ minutes: 45 }, 45],
    ];

    for (const [duration, expected] of cases) {
      const response = await putSession('session-1', duration);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.durationMinutes, expected);
      assert.doesNotThrow(() => assertSession(body));
    }
  });

  it('PUT sin duración conserva y ajusta la duración existente', async () => {
    const { setCurrent } = mockExisting();
    const cases = [
      [120, 120],
      [15, 15],
      [1439, 1439],
      [10, 15],
      [0, 15],
      [1440, 1439],
      [2000, 1439],
    ];

    for (const [duration, expected] of cases) {
      setCurrent(makeSession({ durationMinutes: duration }));
      const response = await putSession('session-1', {});
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.durationMinutes, expected);
      assert.doesNotThrow(() => assertSession(body));
    }
  });

  it('PUT con total superior a 1439 responde 400 con el máximo 23:59', async () => {
    const { update } = mockExisting();

    for (const duration of [{ hours: 24 }, { hours: 23, minutes: 60 }]) {
      const response = await putSession('session-1', duration);
      assert.equal(response.status, 400);
      const body = await response.json();
      assert.match(body.error, /23:59/);
    }

    assert.equal(update.mock.callCount(), 0);
  });

  it('PUT trata null y cadena vacía como partes ausentes', async () => {
    const { setCurrent } = mockExisting();
    const cases = [
      [{ hours: null, minutes: '' }, 120],
      [{ hours: null, minutes: 30 }, 30],
      [{ hours: 2, minutes: '' }, 120],
    ];

    for (const [duration, expected] of cases) {
      setCurrent(makeSession());
      const response = await putSession('session-1', duration);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.durationMinutes, expected);
    }
  });
});
