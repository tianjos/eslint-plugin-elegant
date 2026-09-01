# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.7.0](https://github.com/tianjos/eslint-plugin-elegant/compare/v0.6.0...v0.7.0) (2026-09-01)


### Features

* **rules:** immutability by behaviour, and errors with names ([aa9f70d](https://github.com/tianjos/eslint-plugin-elegant/commit/aa9f70df37aa494c2f777107e0f870fc566991ab))

Three new rules, all `error` in `recommended`, plus one option change:

- `no-self-mutation` — a write to `this.something` after the constructor
  returned. Compound assignment and increment count; a callback the
  constructor schedules is not construction. Nest's five lifecycle hooks are
  allowed by default via `{ allowedMethods: string[] }`.
- `no-generic-error` — `throw new Error(...)` and the seven other built-in
  error types. Rethrows (`throw error`) and subclasses pass.
- `max-method-lines` — Checkstyle's `MethodLength` at `{ max: 50 }`, a `warn`.
  Named units only; an inline callback is measured through its host.
- `no-public-mutable-props` now covers constructor parameter properties at
  every visibility, not only `public`. Set `{ parameterProperties: 'public' }`
  to restore the previous reading.

### Upgrading

Spreading `configs.recommended` will surface new problems on existing code.
Measured across three NestJS codebases (1,251 production files):

| Rule | Reports | Severity |
| --- | ---: | --- |
| `max-method-lines` | 466 | `warn` |
| `no-generic-error` | 163 | `error` |
| `no-self-mutation` | 66 | `error` |
| `no-public-mutable-props` (delta only) | 36 | `error` |

To adopt gradually, override the three new rules to `warn` (or `off`) after
the spread:

```js
rules: {
  ...elegant.configs.recommended.rules,
  'elegant/no-self-mutation': 'warn',
  'elegant/no-generic-error': 'warn',
  'elegant/max-method-lines': 'off',
  'elegant/no-public-mutable-props': ['error', { parameterProperties: 'public' }],
}
```

### Known issue

`no-public-mutable-props` reports every public non-`readonly` declared field,
including NestJS DTO fields carrying `class-validator` decorators
(`@IsString() code: string;`). On the corpus above that is 4,472 reports, and
it predates this release. `max-class-fields` has an `ignoreDecorated` option
for exactly this shape; this rule has no equivalent yet. Until it does, turn
the rule off for your DTO globs.

## [0.6.0](https://github.com/tianjos/eslint-plugin-elegant/compare/v0.5.0...v0.6.0) (2026-09-01)


### Features

* **rules:** let a static be a secondary constructor ([86cf1da](https://github.com/tianjos/eslint-plugin-elegant/commit/86cf1da369b9a94bd5e0728c207cb722f47a1380))

`no-static-members` gains two options, **both on by default**:

- `allowSelfReturning` — a static whose declared return type is the class
  itself is a secondary constructor, which TypeScript has no other way to
  write. `this`, `Promise<Self>` and `Self | undefined` count; `Self | null`
  does not, because `no-null-return` already owns that shape. The return type
  must be written down: the rule carries no type information, so an
  unannotated `static create() { … }` stays reported.
- `allowModuleFactories` — a static returning `DynamicModule` from a class
  decorated with `@Module`. Both halves are required.

This replaces the README's previous advice to relax the whole rule per file,
which also permitted static state and static utilities.

### Upgrading

Nothing to do. Both options default to on, so upgrading only **removes**
reports — measured across three NestJS codebases, 48 of 144 static members
stop being flagged. Static utility classes, `private static` helpers and
mutable static state are still reported. Set either option to `false` to keep
the old behaviour.

## [0.5.0](https://github.com/tianjos/eslint-plugin-elegant/compare/v0.4.0...v0.5.0) (2026-09-01)


### Features

* **rules:** reject reaching into an object for its state ([d73ede7](https://github.com/tianjos/eslint-plugin-elegant/commit/d73ede794cb4f328d4a34add8ff75d0c70d29231))

Three rules, all enabled as `error` in `recommended`:

- `no-property-alias` — a local that only renames a property, `const objStatus = obj.status`
- `no-property-destructuring` — the same reach-in written as a pattern, `const { status } = obj`
- `no-anonymous-param-type` — a parameter typed as an unnamed shape,
  `toResponse(group: { id: string; name: string })`. Configurable via
  `{ minMembers: number }` (default `2`).

### Upgrading

This is a minor, but spreading `configs.recommended` will surface new errors on
existing code: measured across three NestJS codebases (~1,460 files), the three
rules together fire about **0.18 times per file**. Nothing else changed for
consumers — no rule was removed, retargeted, or made stricter.

To adopt gradually, override the three back to `warn` (or `off`) after the
spread and turn them on directory by directory:

```js
rules: {
  ...elegant.configs.recommended.rules,
  'elegant/no-property-alias': 'warn',
  'elegant/no-property-destructuring': 'warn',
  'elegant/no-anonymous-param-type': 'warn',
}
```

`no-property-alias` conflicts with the native `prefer-destructuring`, which is
off by default; if you enabled it, turn it off.

## [0.4.0](https://github.com/tianjos/eslint-plugin-elegant/compare/v0.3.2...v0.4.0) (2026-08-24)


### Features

* add max-class-dependencies rule ([66c898e](https://github.com/tianjos/eslint-plugin-elegant/commit/66c898e3acec9bb5e79a878cbaaa9074ab67b4d2))
* add max-class-fields rule ([f2de130](https://github.com/tianjos/eslint-plugin-elegant/commit/f2de130043c00b79d70970a88724e570e972e739))
* add max-returns rule ([d87bdba](https://github.com/tianjos/eslint-plugin-elegant/commit/d87bdba5b09ccb7aba022d07f57b8d9cc2835b54))
* add no-comments-in-function-body rule ([2adcd7f](https://github.com/tianjos/eslint-plugin-elegant/commit/2adcd7fbec5397430e47158e807e325368aa41d0))
* add no-else-after-throw rule ([1b3c230](https://github.com/tianjos/eslint-plugin-elegant/commit/1b3c230916c0688fd4c561194a5368be72a569d6))
* add no-interpolated-log-message rule ([709fbe2](https://github.com/tianjos/eslint-plugin-elegant/commit/709fbe2678dd86747e66e14af7eaa9fbc7bc5e88))

## [0.3.2] - 2026-06-29

### Fixed

- Each rule's `meta.docs.url` pointed at a non-existent `docs/rules/<name>.md`
  page (a 404 in ESLint output and IDEs). The URLs now resolve to the matching
  rule section in the README, and the "Rule details" entries became per-rule
  headings so the anchors are stable.

## [0.3.1] - 2026-06-29

### Changed

- CI/tooling only (no changes to rules or published runtime): the publish
  workflow now runs `npm publish --ignore-scripts` to avoid repeating the
  build/test already run as explicit steps, and the GitHub Actions
  (`actions/checkout`, `actions/setup-node`) were bumped off the deprecated
  Node 20 runtime.

## [0.3.0] - 2026-06-29

### Added

- **`no-static-members`** — disallows static methods, properties, accessors, and
  static blocks (the `{ allowReadonly: true }` option permits `static readonly`
  constants). Enabled as `error` in the `recommended` config.
- **`no-null`** — disallows the `null` literal as a value anywhere except inside
  type annotations; direct `return null` remains owned by `no-null-return`.
  Enabled as `error` in the `recommended` config.

## [0.2.0] - 2026-06-29

### Added

- **`no-logic-in-constructor`** — disallows logic in constructors, allowing only
  `this.field = value` stores and a `super(...)` call (inspired by qulice's
  `ConstructorsCodeFreeCheck` / the Elegant Objects "code-free constructors"
  principle). Enabled as `error` in the `recommended` config.
- **`no-getters-setters`** — disallows `get`/`set` accessors (and, with
  `{ methods: true }`, `getX`/`setX`-style methods), which expose objects as data
  bags. Enabled as `error` in the `recommended` config (accessors only by default).
- **`no-instanceof`** — disallows the `instanceof` operator; type discrimination
  should be replaced by polymorphism. Enabled as `error` in the `recommended` config.

## [0.1.0] - 2026-06-24

### Added

- Initial release with a `recommended` flat config and five custom TypeScript rules:
  - **`no-boolean-param`** — disallows boolean parameters (flag arguments) on functions, methods, and constructors.
  - **`max-class-methods`** — enforces a configurable maximum number of methods per class (default `10`, constructors excluded).
  - **`no-type-assertion`** — disallows `as` and `<T>` type assertions; `as const` is permitted.
  - **`no-null-return`** — disallows `return null`.
  - **`no-public-mutable-props`** — disallows public mutable class properties, including public constructor parameter properties.
- `recommended` config wiring the five rules plus the native `max-params` rule (max `3`).

[Unreleased]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.3.2...HEAD
[0.3.2]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tianjos/eslint-plugin-elegant/releases/tag/v0.1.0
