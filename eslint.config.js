import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';

// Estilo del proyecto tal y como lo define AGENTS.md: 2 espacios, comillas
// simples y punto y coma. No usamos el preset completo de @stylistic para no
// imponer opiniones (paréntesis en flechas, saltos de línea en JSX…) que el
// proyecto no ha adoptado.
const stylisticRules = {
  '@stylistic/indent': ['error', 2],
  '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
  '@stylistic/semi': ['error', 'always'],
};

export default defineConfig([
  globalIgnores(['**/node_modules/**', 'frontend/dist/**', 'backend/data/**']),

  // Reglas recomendadas de JavaScript (variables sin usar, código inalcanzable…).
  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@stylistic': stylistic },
    rules: {
      ...stylisticRules,
      // Comparaciones estrictas (se permite `== null` como atajo de "null o undefined").
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',
      // Los parámetros/argumentos con guion bajo inicial se consideran intencionadamente sin usar.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Backend y tests: entorno Node.
  {
    files: ['backend/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Frontend: entorno navegador + reglas de hooks de React.
  {
    files: ['frontend/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);
