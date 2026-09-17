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
      // Adopting on a codebase that already exists? Swap `recommended` for
      // `starter`: same rules, with the four heaviest demoted so the first run
      // gives you a list you can work through.
      ...elegant.configs.recommended.rules,
      // Override a threshold when a class legitimately needs more surface:
      // 'elegant/max-class-methods': ['warn', { max: 15 }],
      // 'elegant/max-class-dependencies': ['warn', { max: 6, ignore: ['Logger'] }],
      // 'elegant/max-class-fields': ['warn', { max: 8 }],
      // 'max-params': ['warn', { max: 4 }],
      //
      // Some classes are nominal and offer no discriminant — a framework
      // exception, an Error subclass. `no-instanceof` already lets a declared
      // `value is X` guard through; turn that off to hold guards to the same
      // standard as everything else:
      // 'elegant/no-instanceof': ['error', { allowTypeGuards: false }],
    },
  },

  // Specs legitimately trip eight of these rules — a mock asserts a type over a
  // partial object, a fixture mirrors a nullable column, a spec narrates. The
  // list is measured, not guessed; see the README.
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    rules: { ...elegant.configs.tests.rules },
  },

  // Files nobody writes by hand: migrations a CLI scaffolds, build scripts that
  // talk to an operator through `console`. Judging them by rules meant for
  // domain code produces churn in files nobody should reopen.
  {
    files: ['src/database/migrations/**/*.ts', 'utils/**/*.ts'],
    rules: {
      ...elegant.configs.off.rules,
      'no-console': 'off',
    },
  },
];
