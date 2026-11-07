import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getServerConfig } from '../src/serverConfig.js';

describe('getServerConfig', () => {
  it('escucha en 127.0.0.1:3001 por defecto', () => {
    assert.deepEqual(getServerConfig({}), { port: 3001, host: '127.0.0.1' });
  });

  it('respeta PORT y HOST explícitos', () => {
    assert.deepEqual(getServerConfig({ PORT: '4000', HOST: '0.0.0.0' }), {
      port: 4000,
      host: '0.0.0.0',
    });
  });

  it('usa los valores por defecto cuando PORT o HOST están vacíos', () => {
    assert.deepEqual(getServerConfig({ PORT: '', HOST: '   ' }), {
      port: 3001,
      host: '127.0.0.1',
    });
  });

  it('usa el puerto por defecto si PORT no es numérico', () => {
    assert.deepEqual(getServerConfig({ PORT: 'no-es-un-puerto' }), {
      port: 3001,
      host: '127.0.0.1',
    });
  });
});
