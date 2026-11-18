// @ts-check

/** Pestañas principales y su dirección. Fuente única para la URL y la interfaz. */
export const TABS = [
  { id: 'home', label: 'Inicio', path: '#/inicio' },
  { id: 'history', label: 'Historial', path: '#/historial' },
  { id: 'stats', label: 'Estadísticas', path: '#/estadisticas' },
];

export const DEFAULT_TAB = 'home';

/** Devuelve el identificador de la pestaña cuya dirección coincide exactamente. */
export function tabFromHash(hash) {
  const tab = TABS.find((candidate) => candidate.path === hash);
  return tab ? tab.id : DEFAULT_TAB;
}

/** Devuelve la dirección de una pestaña; un id desconocido cae en Inicio. */
export function pathForTab(id) {
  const tab = TABS.find((candidate) => candidate.id === id);
  return tab ? tab.path : TABS.find((candidate) => candidate.id === DEFAULT_TAB).path;
}
