import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));
const styles = readFileSync(join(dirname(testDir), 'src', 'styles.css'), 'utf8');

const ROOT_BLOCK = /:root\s*\{([\s\S]*?)\}/;
const rootMatch = styles.match(ROOT_BLOCK);
const outsideRoot = styles.replace(ROOT_BLOCK, '');

// Literales de color que deben vivir solo en los tokens de :root. Se excluyen
// las palabras que solo contienen "white"/"black" (white-space) y los valores
// transparent/currentColor, que no forman parte de la paleta.
const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\bwhite\b(?![\w-])|\bblack\b(?![\w-])/g;

function collect(pattern, text) {
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

describe('styles.css', () => {
  it('declara los tokens en un bloque :root', () => {
    expect(rootMatch).not.toBeNull();
  });

  it('no usa literales de color fuera de :root', () => {
    expect(outsideRoot.match(COLOR_LITERAL) ?? []).toEqual([]);
  });

  it('define todos los tokens que usa', () => {
    const defined = new Set(collect(/(--[\w-]+)\s*:/g, styles));
    const used = collect(/var\((--[\w-]+)\)/g, styles);

    expect(used.filter((token) => !defined.has(token))).toEqual([]);
  });
});
