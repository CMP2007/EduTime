import { describe, expect, it } from 'vitest';
import { DEFAULT_TAB, TABS, pathForTab, tabFromHash } from '../../src/navigation/tabs.js';

describe('Tabs · direcciones', () => {
  it('asigna una dirección única a cada pestaña', () => {
    expect(TABS).toEqual([
      { id: 'home', label: 'Inicio', path: '#/inicio' },
      { id: 'history', label: 'Historial', path: '#/historial' },
      { id: 'stats', label: 'Estadísticas', path: '#/estadisticas' },
    ]);
    expect(new Set(TABS.map((tab) => tab.path)).size).toBe(TABS.length);
  });

  it('resuelve cada dirección válida', () => {
    expect(tabFromHash('#/inicio')).toBe('home');
    expect(tabFromHash('#/historial')).toBe('history');
    expect(tabFromHash('#/estadisticas')).toBe('stats');
  });

  it('cae en Inicio con direcciones vacías', () => {
    for (const hash of ['', '#', '#/']) {
      expect(tabFromHash(hash)).toBe(DEFAULT_TAB);
    }
  });

  it('cae en Inicio con direcciones desconocidas', () => {
    for (const hash of [
      '#/Historial',
      '#/historial/',
      '#/historial/extra',
      '#/otra',
      '#/inicio?x=1',
      undefined,
      null,
    ]) {
      expect(tabFromHash(hash)).toBe(DEFAULT_TAB);
    }
  });

  it('devuelve la dirección de cada pestaña y cae en Inicio con un id desconocido', () => {
    expect(pathForTab('home')).toBe('#/inicio');
    expect(pathForTab('history')).toBe('#/historial');
    expect(pathForTab('stats')).toBe('#/estadisticas');
    expect(pathForTab('otra')).toBe('#/inicio');
  });
});
