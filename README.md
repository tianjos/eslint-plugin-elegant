# @tianjos/eslint-plugin-elegant

[![npm version](https://img.shields.io/npm/v/@tianjos/eslint-plugin-elegant.svg)](https://www.npmjs.com/package/@tianjos/eslint-plugin-elegant)
[![license](https://img.shields.io/npm/l/@tianjos/eslint-plugin-elegant.svg)](./LICENSE)
[![CI](https://github.com/tianjos/eslint-plugin-elegant/actions/workflows/ci.yml/badge.svg)](https://github.com/tianjos/eslint-plugin-elegant/actions/workflows/ci.yml)

Opinionated ESLint rules for **elegant, behavior-rich TypeScript**. The plugin
pushes code toward intention-revealing functions, honest types, and
encapsulated domain models — the kind of constraints that pay off in NestJS
services and DDD-style codebases.

## Install

```bash
npm install --save-dev @tianjos/eslint-plugin-elegant
```

```bash
pnpm add -D @tianjos/eslint-plugin-elegant
```

```bash
yarn add -D @tianjos/eslint-plugin-elegant
```

### Peer dependencies

This plugin does not bundle ESLint or the TypeScript toolchain. Install them
alongside it:

| Peer                          | Required version |
| ----------------------------- | ---------------- |
| `eslint`                      | `>=9`            |
| `typescript`                  | `>=5`            |
| `@typescript-eslint/parser`   | `>=8`            |

```bash
npm install --save-dev eslint typescript @typescript-eslint/parser
```

## Usage

This plugin targets **flat config** (`eslint.config.mjs`). The fastest way to
adopt it is to spread the `recommended` ruleset:

```js
// eslint.config.mjs
import parser from '@typescript-eslint/parser';
import elegant from '@tianjos/eslint-plugin-elegant';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { elegant },
    rules: {
      ...elegant.configs.recommended.rules,
    },
  },
];
```

A complete, copy-pasteable example (including test-file overrides) lives in
[`eslint.config.example.mjs`](./eslint.config.example.mjs).

## Rules

The `recommended` config enables every custom rule plus the native
[`max-params`](https://eslint.org/docs/latest/rules/max-params) rule.

| Rule                                   | Source | What it catches                                                                 | `recommended` |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------- | ------------- |
| `elegant/no-boolean-param`             | custom | Boolean parameters (flag arguments) on functions, methods, and constructors     | `error`       |
| `elegant/max-class-methods`            | custom | Classes with more methods than the configured `max` (constructors excluded)     | `warn` (max 10) |
| `elegant/no-type-assertion`            | custom | `value as T` and `<T>value` assertions (`as const` is allowed)                  | `error`       |
| `elegant/no-null-return`               | custom | `return null` statements                                                        | `error`       |
| `elegant/no-public-mutable-props`      | custom | Public, non-`readonly` class properties and public constructor parameter props  | `error`       |
| `elegant/no-logic-in-constructor`      | custom | Any constructor code beyond `this.field = value` stores and a `super(...)` call  | `error`       |
| `elegant/no-getters-setters`           | custom | `get`/`set` accessors (and `getX`/`setX` methods with `{ methods: true }`)        | `error`       |
| `elegant/no-instanceof`                | custom | Use of the `instanceof` operator                                                | `error`       |
| `elegant/no-static-members`            | custom | Static methods, properties, accessors, and blocks (`allowReadonly` to permit constants) | `error` |
| `elegant/no-null`                      | custom | The `null` literal as a value (type annotations and direct `return null` excepted) | `error`     |
| `max-params`                           | native | Functions declaring more than `max` parameters                                  | `warn` (max 3) |

### Rule details

- **`no-boolean-param`** — a boolean argument almost always means the callee
  does two things. Prefer two intention-revealing functions or an options
  object. Flags both annotated (`flag: boolean`) and boolean-defaulted
  (`flag = false`) parameters.
- **`max-class-methods`** — a proxy for the Single Responsibility Principle.
  Constructors are not counted; getters and setters are.
- **`no-type-assertion`** — assertions silence the type checker. Reach for a
  type guard, a generic, or a correctly typed value instead. `as const` is
  permitted because it narrows rather than widens.
- **`no-null-return`** — keeps absence out of return values; model it with an
  explicit domain type or throw.
- **`no-public-mutable-props`** — public state should be `readonly` so callers
  cannot break an aggregate's invariants. `private`/`protected` members and
  `readonly` members are allowed.
- **`no-logic-in-constructor`** — a constructor should only wire arguments to
  fields. Validation, transformation, and I/O belong in a static factory or a
  method, keeping object construction predictable. Parameter properties
  (`constructor(private readonly x: T)`) and a leading `super(...)` are allowed;
  computed right-hand sides (`this.x = x * 2`, `this.items = items.slice()`) and
  any non-assignment statement are flagged.
- **`no-getters-setters`** — getters and setters turn objects into data bags;
  prefer methods that expose behavior. Native `get`/`set` accessors (and
  `accessor` fields) are always flagged. The opt-in `{ methods: true }` option
  also flags conventional `getX`/`setX` methods — useful for strict Elegant
  Objects style, but noisy around repositories and framework hooks, so it stays
  off in `recommended`.
- **`no-instanceof`** — `instanceof` is type discrimination that belongs inside a
  polymorphic method on the object. Pairs with `no-type-assertion` to keep
  type-based branching out of the codebase.
- **`no-static-members`** — static state and behavior cannot be injected,
  substituted, or mocked. Prefer instances (with dependency injection) and a
  module-level `const` for shared values. The `{ allowReadonly: true }` option
  permits `static readonly` constants. Note this also flags `static` factory
  methods (`static create()`), which are common; relax per-file if your design
  relies on them.
- **`no-null`** — completes `no-null-return` by banning the `null` literal as a
  value everywhere (`const x = null`, `x === null`, `fn(null)`), pushing absence
  into explicit types or `undefined`. `null` in type positions (`string | null`)
  and a direct `return null` (owned by `no-null-return`) are left alone. This is
  strict and will flag idioms like `JSON.stringify(x, null, 2)` — relax it in the
  files where you interoperate with null-based APIs.

## Configuration

### Overriding thresholds

`max-class-methods` and the native `max-params` both take a `max` option:

```js
rules: {
  ...elegant.configs.recommended.rules,
  'elegant/max-class-methods': ['warn', { max: 15 }],
  'max-params': ['warn', { max: 4 }],
}
```

### Relaxing rules in test files

Tests routinely use flag arguments and larger fixtures. Add a second config
block scoped to your spec globs:

```js
{
  files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
  rules: {
    'elegant/no-boolean-param': 'off',
    'elegant/max-class-methods': 'off',
    'max-params': 'off',
  },
}
```

## Compatibility

The package ships a single CommonJS build that is consumable as both
`require('@tianjos/eslint-plugin-elegant')` and an ESM
`import elegant from '@tianjos/eslint-plugin-elegant'`. The exported object
exposes `{ meta, rules, configs }`.

## License

[MIT](./LICENSE) © Thiago
