// Example flat config for a NestJS / TypeScript project.
// Copy into your project as `eslint.config.mjs` and adjust paths.
import parser from '@typescript-eslint/parser';
import elegant from '@tianjos/eslint-plugin-elegant';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Enable for type-aware native rules if you add any:
        // project: ['./tsconfig.json'],
      },
    },
    plugins: { elegant },
    rules: {
      ...elegant.configs.recommended.rules,
      // Override a threshold when a class legitimately needs more surface:
      // 'elegant/max-class-methods': ['warn', { max: 15 }],
      // 'max-params': ['warn', { max: 4 }],
    },
  },

  // Relax the stricter rules in test files, where flag arguments and
  // larger fixtures are common and harmless.
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    rules: {
      'elegant/no-boolean-param': 'off',
      'elegant/max-class-methods': 'off',
      'max-params': 'off',
    },
  },
];
