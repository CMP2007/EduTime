import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(dirname(testDir), 'src');
const stylesDir = join(srcDir, 'styles');
const indexPath = join(stylesDir, 'index.css');
const mainPath = join(srcDir, 'main.jsx');
const MAX_LINES_PER_FILE = 200;

// Se leen todas las hojas para que las guardas de tokens y controles cubran el
// conjunto y no un único archivo. La división por responsabilidad se comprueba
// con las aserciones estructurales de más abajo.
const cssFiles = readdirSync(srcDir, { recursive: true })
  .filter((file) => file.endsWith('.css'))
  .map((file) => join(srcDir, file));

const styles = cssFiles.map((file) => readFileSync(file, 'utf8')).join('\n');

const ROOT_BLOCK = /:root\s*\{([\s\S]*?)\}/;
const rootMatch = styles.match(ROOT_BLOCK);
const outsideRoot = styles.replace(ROOT_BLOCK, '');

const IMPORT = /@import\s+['"]([^'"]+)['"]\s*;/g;

function importedFiles(source) {
  return [...source.matchAll(IMPORT)].map((match) => match[1].replace(/^\.\//, ''));
}

// Literales de color que deben vivir solo en los tokens de :root. Se excluyen
// las palabras que solo contienen "white"/"black" (white-space) y los valores
// transparent/currentColor, que no forman parte de la paleta.
const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\bwhite\b(?![\w-])|\bblack\b(?![\w-])/g;

function collect(pattern, text) {
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

// Selectores de cada regla, sin las preludios de las at-rules (@media…).
function ruleSelectors(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');

  return [...withoutComments.matchAll(/([^{}]+)\{/g)]
    .map((match) => match[1].trim())
    .filter((prelude) => !prelude.startsWith('@'))
    .flatMap((prelude) => prelude.split(',').map((selector) => selector.trim()));
}

// Un control estilizado por elemento empieza por input/select/textarea; los
// selectores acotados (p. ej. `.duration__item input`) no cuentan como fuga.
const CONTROL_ELEMENT = /^(input|select|textarea)(?![\w-])/;

// Devuelve la etiqueta de apertura completa de cada control. Se avanza con
// control de llaves y comillas porque los atributos pueden contener `>` (por
// ejemplo, en una función flecha) o texto con etiquetas.
const CONTROL_START = /<(input|select|textarea)\b/g;

function controlTags(source) {
  const tags = [];

  for (const match of source.matchAll(CONTROL_START)) {
    let depth = 0;
    let quote = null;

    for (let index = match.index; index < source.length; index += 1) {
      const char = source[index];

      if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'" || char === '`') {
        quote = char;
      } else if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
      } else if (char === '>' && depth === 0) {
        tags.push(source.slice(match.index, index + 1));
        break;
      }
    }
  }

  return tags;
}

describe('hojas de estilo', () => {
  it('declara los tokens en un único bloque :root', () => {
    expect(rootMatch).not.toBeNull();
    expect([...styles.matchAll(/:root\s*\{/g)]).toHaveLength(1);
  });

  it('no usa literales de color fuera de :root', () => {
    expect(outsideRoot.match(COLOR_LITERAL) ?? []).toEqual([]);
  });

  it('define todos los tokens que usa', () => {
    const defined = new Set(collect(/(--[\w-]+)\s*:/g, styles));
    const used = collect(/var\((--[\w-]+)\)/g, styles);

    expect(used.filter((token) => !defined.has(token))).toEqual([]);
  });

  it('no estiliza controles de formulario por selector de elemento', () => {
    const globalControls = ruleSelectors(styles).filter((selector) => CONTROL_ELEMENT.test(selector));

    expect(globalControls).toEqual([]);
  });

  it('aplica la clase control a todos los controles de formulario', () => {
    const missing = readdirSync(srcDir, { recursive: true })
      .filter((file) => file.endsWith('.jsx'))
      .flatMap((file) => {
        const path = join(srcDir, file);
        const source = readFileSync(path, 'utf8');

        return controlTags(source)
          .filter((tag) => !/\bcontrol\b/.test(tag))
          .map((tag) => `${relative(srcDir, path)}: ${tag.split('\n')[0]}`);
      });

    expect(missing).toEqual([]);
  });

  it('carga las hojas desde un manifiesto que solo contiene @import', () => {
    expect(existsSync(indexPath)).toBe(true);

    const indexSource = readFileSync(indexPath, 'utf8');
    const withoutComments = indexSource.replace(/\/\*[\s\S]*?\*\//g, '');

    expect(withoutComments.replace(IMPORT, '').trim()).toBe('');
  });

  it('importa cada hoja una sola vez y no deja hojas huérfanas', () => {
    const imports = importedFiles(readFileSync(indexPath, 'utf8'));
    const partials = cssFiles
      .filter((file) => file !== indexPath)
      .map((file) => relative(stylesDir, file))
      .sort();

    expect(new Set(imports).size).toBe(imports.length);
    expect([...imports].sort()).toEqual(partials);
  });

  it('reparte los estilos en hojas por responsabilidad', () => {
    expect(cssFiles.length).toBeGreaterThan(1);

    const oversized = cssFiles
      .map((file) => ({
        file: relative(srcDir, file),
        lines: readFileSync(file, 'utf8').split('\n').length,
      }))
      .filter(({ lines }) => lines > MAX_LINES_PER_FILE);

    expect(oversized).toEqual([]);
  });

  it('importa el manifiesto desde main.jsx', () => {
    expect(readFileSync(mainPath, 'utf8')).toContain("import './styles/index.css';");
  });
});
