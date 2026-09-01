// Self-lint: the plugin held to its own recommended config.
//
// Reads the built plugin from dist/, so `npm run build` has to run first.
// That is the order CI uses, and `npm run lint` builds on its own.
import parser from '@typescript-eslint/parser';
import elegant from './dist/index.js';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { elegant },
    rules: {
      ...elegant.configs.recommended.rules,
    },
  },
  {
    // A rule that walks an AST cannot avoid `null`: ESTree types `node.id`,
    // `node.init` and `node.alternate` as `T | null`, and comparing against
    // that is the only way to read them. This is the interoperation escape
    // the no-null documentation prescribes, applied to the one codebase that
    // provably needs it.
    files: ['src/**/*.ts'],
    rules: {
      'elegant/no-null': 'off',
    },
  },
];
