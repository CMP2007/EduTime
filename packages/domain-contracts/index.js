/**
 * Contrato de datos de las respuestas de la API.
 *
 * Una sola definición para backend y frontend: los typedefs documentan la forma y los
 * validadores la comprueban en runtime. No valida reglas de negocio ni formatos de fecha.
 *
 * @typedef {Object} Theme
 * @property {string} id
 * @property {string} name
 * @property {number} sessionCount
 *
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} themeId
 * @property {string} themeName
 * @property {string} date
 * @property {number} durationMinutes
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} PeriodRange
 * @property {string} key
 * @property {string} label
 * @property {string} from
 * @property {string} to
 *
 * @typedef {Object} Subject
 * @property {string} themeId
 * @property {string} name
 * @property {number} minutes
 * @property {number} sessions
 *
 * @typedef {Object} LongestClass
 * @property {string} id
 * @property {string} themeId
 * @property {string} name
 * @property {string} date
 * @property {number} durationMinutes
 *
 * @typedef {Object} Summary
 * @property {number} totalMinutes
 * @property {number} totalSessions
 * @property {number} activeDays
 * @property {number} goalDays
 * @property {LongestClass|null} longestClass
 * @property {Subject[]} subjects
 *
 * @typedef {Object} Streak
 * @property {number} current
 * @property {number} best
 *
 * @typedef {Object} Global
 * @property {number} totalMinutes
 * @property {number} totalSessions
 * @property {number} activeDays
 * @property {number} goalDays
 * @property {Streak} streak
 *
 * @typedef {Object} Today
 * @property {string} date
 * @property {number} minutes
 * @property {number} goalMinutes
 * @property {boolean} goalMet
 *
 * @typedef {Object} HeatmapDay
 * @property {string} date
 * @property {number} minutes
 * @property {boolean} goalMet
 *
 * @typedef {Object} Heatmap
 * @property {string} range
 * @property {string} label
 * @property {string} from
 * @property {string} to
 * @property {number} goalMinutes
 * @property {HeatmapDay[]} days
 *
 * @typedef {Object} Stats
 * @property {PeriodRange} period
 * @property {Summary} summary
 * @property {Global} global
 * @property {Today} today
 * @property {Heatmap} heatmap
 * @property {string|null} notice
 */

/** Error de contrato: la respuesta no tiene la forma prometida por la API. */
export class ContractError extends Error {
  /**
   * @param {string} resource
   * @param {string} issue
   */
  constructor(resource, issue) {
    super(`La respuesta de ${resource} no cumple el contrato: ${issue}`);
    this.name = 'ContractError';
    this.resource = resource;
    this.issue = issue;
  }
}

/** @typedef {{ validate: (value: unknown, path: string, issues: string[]) => void }} Descriptor */

/** @param {unknown} value */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @param {unknown} value */
function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/** @param {unknown} value */
function describeValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'una lista';
  if (typeof value === 'string') {
    return value.length > 40 ? `"${value.slice(0, 40)}…"` : `"${value}"`;
  }
  return String(value);
}

/** @param {string} path */
function describePath(path) {
  return path || 'la respuesta';
}

/**
 * @param {string} path
 * @param {string} key
 */
function joinPath(path, key) {
  return path ? `${path}.${key}` : key;
}

/** @type {Descriptor} */
const STRING = {
  validate(value, path, issues) {
    if (typeof value !== 'string') {
      issues.push(`${describePath(path)} debe ser un texto (recibido: ${describeValue(value)})`);
    }
  },
};

/** @type {Descriptor} */
const NUMBER = {
  validate(value, path, issues) {
    if (!isFiniteNumber(value)) {
      issues.push(
        `${describePath(path)} debe ser un número finito (recibido: ${describeValue(value)})`,
      );
    }
  },
};

/** @type {Descriptor} */
const BOOLEAN = {
  validate(value, path, issues) {
    if (typeof value !== 'boolean') {
      issues.push(`${describePath(path)} debe ser un booleano (recibido: ${describeValue(value)})`);
    }
  },
};

/**
 * El campo debe estar presente; si admite «sin valor», debe ser `null`.
 *
 * @param {Descriptor} descriptor
 * @returns {Descriptor}
 */
function nullable(descriptor) {
  return {
    validate(value, path, issues) {
      if (value !== null) descriptor.validate(value, path, issues);
    },
  };
}

/**
 * @param {Record<string, Descriptor>} shape
 * @returns {Descriptor}
 */
function object(shape) {
  return {
    validate(value, path, issues) {
      if (!isObject(value)) {
        issues.push(`${describePath(path)} debe ser un objeto (recibido: ${describeValue(value)})`);
        return;
      }
      for (const [key, descriptor] of Object.entries(shape)) {
        descriptor.validate(value[key], joinPath(path, key), issues);
      }
    },
  };
}

/**
 * @param {Descriptor} descriptor
 * @returns {Descriptor}
 */
function arrayOf(descriptor) {
  return {
    validate(value, path, issues) {
      if (!Array.isArray(value)) {
        issues.push(`${describePath(path)} debe ser una lista (recibido: ${describeValue(value)})`);
        return;
      }
      value.forEach((item, index) => descriptor.validate(item, `${path}[${index}]`, issues));
    },
  };
}

const THEME = object({
  id: STRING,
  name: STRING,
  sessionCount: NUMBER,
});

const SESSION = object({
  id: STRING,
  themeId: STRING,
  themeName: STRING,
  date: STRING,
  durationMinutes: NUMBER,
  notes: STRING,
  createdAt: STRING,
  updatedAt: STRING,
});

const STATS = object({
  period: object({
    key: STRING,
    label: STRING,
    from: STRING,
    to: STRING,
  }),
  summary: object({
    totalMinutes: NUMBER,
    totalSessions: NUMBER,
    activeDays: NUMBER,
    goalDays: NUMBER,
    longestClass: nullable(
      object({
        id: STRING,
        themeId: STRING,
        name: STRING,
        date: STRING,
        durationMinutes: NUMBER,
      }),
    ),
    subjects: arrayOf(
      object({
        themeId: STRING,
        name: STRING,
        minutes: NUMBER,
        sessions: NUMBER,
      }),
    ),
  }),
  global: object({
    totalMinutes: NUMBER,
    totalSessions: NUMBER,
    activeDays: NUMBER,
    goalDays: NUMBER,
    streak: object({
      current: NUMBER,
      best: NUMBER,
    }),
  }),
  today: object({
    date: STRING,
    minutes: NUMBER,
    goalMinutes: NUMBER,
    goalMet: BOOLEAN,
  }),
  heatmap: object({
    range: STRING,
    label: STRING,
    from: STRING,
    to: STRING,
    goalMinutes: NUMBER,
    days: arrayOf(
      object({
        date: STRING,
        minutes: NUMBER,
        goalMet: BOOLEAN,
      }),
    ),
  }),
  notice: nullable(STRING),
});

const SESSION_LIST = arrayOf(SESSION);
const THEME_LIST = arrayOf(THEME);

/**
 * @param {Descriptor} descriptor
 * @param {unknown} value
 * @returns {string[]}
 */
function collectIssues(descriptor, value) {
  const issues = [];
  descriptor.validate(value, '', issues);
  return issues;
}

/**
 * Devuelve los fallos del contrato de métricas; vacío si la respuesta es válida.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function validateStats(value) {
  return collectIssues(STATS, value);
}

/**
 * Devuelve los fallos del contrato de una temática; vacío si la respuesta es válida.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function validateTheme(value) {
  return collectIssues(THEME, value);
}

/**
 * Devuelve los fallos del contrato de un listado de temáticas; vacío si es válido.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function validateThemeList(value) {
  return collectIssues(THEME_LIST, value);
}

/**
 * Devuelve los fallos del contrato de una sesión; vacío si la respuesta es válida.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function validateSession(value) {
  return collectIssues(SESSION, value);
}

/**
 * Devuelve los fallos del contrato de un listado de sesiones; vacío si es válido.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
export function validateSessionList(value) {
  return collectIssues(SESSION_LIST, value);
}

/**
 * @param {string} resource
 * @param {string[]} issues
 */
function assertContract(resource, issues) {
  if (issues.length > 0) {
    throw new ContractError(resource, issues[0]);
  }
}

/**
 * Lanza `ContractError` con el primer fallo si las métricas no cumplen el contrato.
 *
 * @template T
 * @param {T} value
 * @param {string} [resource]
 * @returns {T}
 */
export function assertStats(value, resource = '/api/stats') {
  assertContract(resource, validateStats(value));
  return value;
}

/**
 * Lanza `ContractError` con el primer fallo si la temática no cumple el contrato.
 *
 * @template T
 * @param {T} value
 * @param {string} [resource]
 * @returns {T}
 */
export function assertTheme(value, resource = '/api/themes') {
  assertContract(resource, validateTheme(value));
  return value;
}

/**
 * Lanza `ContractError` con el primer fallo si el listado no cumple el contrato.
 *
 * @template T
 * @param {T} value
 * @param {string} [resource]
 * @returns {T}
 */
export function assertThemeList(value, resource = '/api/themes') {
  assertContract(resource, validateThemeList(value));
  return value;
}

/**
 * Lanza `ContractError` con el primer fallo si la sesión no cumple el contrato.
 *
 * @template T
 * @param {T} value
 * @param {string} [resource]
 * @returns {T}
 */
export function assertSession(value, resource = '/api/sessions') {
  assertContract(resource, validateSession(value));
  return value;
}

/**
 * Lanza `ContractError` con el primer fallo si el listado no cumple el contrato.
 *
 * @template T
 * @param {T} value
 * @param {string} [resource]
 * @returns {T}
 */
export function assertSessionList(value, resource = '/api/sessions') {
  assertContract(resource, validateSessionList(value));
  return value;
}
