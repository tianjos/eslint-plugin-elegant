# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.9.0](https://github.com/tianjos/eslint-plugin-elegant/compare/v0.8.0...v0.9.0) (2026-09-05)


### Features

* add a starter config, and test the package actually loads ([8f023f7](https://github.com/tianjos/eslint-plugin-elegant/commit/8f023f7a0a4eecbce3e1adbbfdf0238381e3ce5a))

### `configs.starter`

A second config for adopting the plugin on a codebase that already exists.
`recommended` costs 9.20 reports per file on a mature NestJS codebase, and the
way in used to be a paragraph of README asking you to hand-write four
overrides. It is now one line:

```js
rules: { ...elegant.configs.starter.rules }
```

| | `recommended` | `starter` |
| --- | --- | --- |
| `no-comments-in-function-body` | `error` | `off` |
| `no-interpolated-log-message` | `error` | `warn` |
| `no-null` | `error` | `warn` |
| `no-type-assertion` | `error` | `warn` |
| everything else | unchanged | unchanged |

That leaves the 1.75 reports per file below those four — a list somebody can
work through. Promote them back one at a time as you clear them, and switch to
`recommended` once nothing is left.

**`recommended` is untouched.** It still says exactly what it said; `starter`
is a door in, not a softening of the stance.

### The package is now tested as a consumer sees it

`tests/dist.test.ts` runs real Node against `dist/` and checks the package
loads through `require`, through `require(...).default` as the same object,
and through an ESM default import. That interop rests on `export =` plus a
self-reference, which a change to the module target or the exports map would
break silently, on a consumer's machine rather than in CI. It compares `dist`
against the source plugin, so a stale build fails too.

`npm test` therefore builds first, as `npm run lint` already did.

### Upgrading

Nothing to do. `recommended` is unchanged and no rule behaviour moved.

## [0.8.0](https://github.com/tianjos/eslint-plugin-elegant/compare/v0.7.2...v0.8.0) (2026-09-04)


### Features

* **rules:** let no-instanceof allow self-guards and caught values ([fbb8b01](https://github.com/tianjos/eslint-plugin-elegant/commit/fbb8b016f8fa19c3f733fccf661f5782d07f6676))


### Bug Fixes

* **rules:** stop no-self-mutation crashing on a top-level this write ([e43995c](https://github.com/tianjos/eslint-plugin-elegant/commit/e43995c632aff18bf19f96ae905a93c78716956e))

**Upgrade if you are on 0.7.0 or 0.7.1.** `no-self-mutation` threw a
`TypeError` on `this.something = value` written at module scope, and a rule
that throws takes the whole lint run for that file down with it — silently,
so the file simply stops being analysed. `Program.parent` is `null` rather
than `undefined`, and the ancestor walk only guarded against `undefined`.

Writes are also confined to class bodies now: `this` outside one is
`module.exports`, `undefined`, or an object literal's own receiver, and none
of those has holders to surprise. An old-style
`function Money(amount) { this.amount = amount }` is construction and no
longer reports.

### `no-instanceof` gains two options, both on by default

Over 1,261 production files the rule produced 179 reports and, on reading
every one, none was the defect it describes — there was no
`if (x instanceof Dog) else if (x instanceof Cat)` replacing polymorphism
anywhere. Two categories now pass, because TypeScript leaves no polymorphic
alternative in either:

- `allowSelfGuard` — `other instanceof Money` inside `class Money`. Value
  equality has to guard its own type before comparing fields, and the check
  is already in a method on the object, which is where the rule's advice
  points. Guarding a *different* type still reports.
- `allowCaughtValues` — a name a `catch` clause introduced, resolved through
  the scope chain. TypeScript types it `unknown`, so no method on the value
  can stand in for `instanceof`.

Reports over that corpus go from 179 to 76. The remainder narrows
`Date | string` out of a database driver, or an error that arrived as a
parameter rather than through `catch` (Nest's `ExceptionFilter.catch`, an RxJS
`catchError` callback). Telling those apart from the real defect needs type
information, which no rule here uses.

### Upgrading

Nothing to do. Both changes only remove reports.

### [0.7.2](https://github.com/tianjos/eslint-plugin-elegant/compare/v0.7.1...v0.7.2) (2026-09-03)


### Documentation

Ships the README's new **Adopting on an existing codebase** section to npm. No
rule behaviour changed, and no severity moved.

The preset had never been measured against a real codebase as a whole. Over
1,261 production files across three NestJS services it produces 11,603
reports — 9.20 per file, 10,655 of them errors — and four rules account for
81% of that:

| Rule | Reports | Per file |
| --- | ---: | ---: |
| `no-comments-in-function-body` | 5,559 | 4.41 |
| `no-interpolated-log-message` | 1,941 | 1.54 |
| `no-null` | 1,367 | 1.08 |
| `no-type-assertion` | 524 | 0.42 |
| *the other 20 combined* | 2,212 | 1.75 |

The section carries the full per-rule table and a staged override that leaves
1.75 reports per file, so `recommended` can be adopted on code that already
exists instead of only on code being written from scratch.

### [0.7.1](https://github.com/tianjos/eslint-plugin-elegant/compare/v0.7.0...v0.7.1) (2026-09-02)


### Bug Fixes

* **rules:** stop no-public-mutable-props flagging mapped properties ([4b73dee](https://github.com/tianjos/eslint-plugin-elegant/commit/4b73deeb5364a54744d6d40966ca91557ca15414))

`no-public-mutable-props` reported every public non-`readonly` declared field,
which on a NestJS codebase means every DTO and every entity. Measured over
three of them (1,251 production files), reports drop from **4,508 to 116**.

`@Column`, `@IsString` and friends assign the field from outside the class, so
`readonly` there would be a lie. The new `{ ignoreDecorated: boolean }` option
defaults to `true`, matching `max-class-fields`. Pass `false` to hold mapped
properties to the same standard.

`ignoreDecorated` deliberately does not reach constructor parameter
properties: a decorator on a parameter is injection, which supplies a
collaborator rather than populating a field, so
`@InjectRepository(Proposal) private repo` is still reported.

This supersedes the "Known issue" noted in 0.7.0 — the DTO-glob workaround
described there is no longer needed.

### Upgrading

Nothing to do. This only removes reports.

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
