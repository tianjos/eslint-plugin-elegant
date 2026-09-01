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

The `recommended` config enables every custom rule plus two native ones,
[`max-params`](https://eslint.org/docs/latest/rules/max-params) and
[`no-else-return`](https://eslint.org/docs/latest/rules/no-else-return).

| Rule                                   | Source | What it catches                                                                 | `recommended` |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------- | ------------- |
| `elegant/no-boolean-param`             | custom | Boolean parameters (flag arguments) on functions, methods, and constructors     | `error`       |
| `elegant/max-class-methods`            | custom | Classes with more methods than the configured `max` (constructors excluded)     | `warn` (max 10) |
| `elegant/max-class-dependencies`       | custom | Classes depending on more distinct collaborators than `max` (constructor injections plus `new`) | `warn` (max 4) |
| `elegant/max-class-fields`             | custom | Classes holding more instance fields than `max` (declared fields plus parameter properties) | `warn` (max 5) |
| `elegant/no-type-assertion`            | custom | `value as T` and `<T>value` assertions (`as const` is allowed)                  | `error`       |
| `elegant/no-null-return`               | custom | `return null` statements                                                        | `error`       |
| `elegant/no-public-mutable-props`      | custom | Public, non-`readonly` class properties and public constructor parameter props  | `error`       |
| `elegant/no-logic-in-constructor`      | custom | Any constructor code beyond `this.field = value` stores and a `super(...)` call  | `error`       |
| `elegant/no-getters-setters`           | custom | `get`/`set` accessors (and `getX`/`setX` methods with `{ methods: true }`)        | `error`       |
| `elegant/no-instanceof`                | custom | Use of the `instanceof` operator                                                | `error`       |
| `elegant/no-static-members`            | custom | Static methods, properties, accessors, and blocks (secondary constructors and Nest module factories excepted) | `error` |
| `elegant/no-null`                      | custom | The `null` literal as a value (type annotations and direct `return null` excepted) | `error`     |
| `elegant/no-comments-in-function-body` | custom | Comments inside function bodies (directives and empty blocks excepted)          | `error`       |
| `elegant/no-else-after-throw`          | custom | An `else` branch when the `then` branch always throws                           | `error`       |
| `elegant/no-interpolated-log-message`  | custom | Log messages built by interpolation or concatenation                            | `error`       |
| `elegant/max-returns`                  | custom | Functions returning from more places than `max`                                 | `warn` (max 3) |
| `elegant/no-property-alias`            | custom | Locals that only rename a property of an object already in hand                 | `error`       |
| `elegant/no-property-destructuring`    | custom | Destructuring an object already in hand into locals                             | `error`       |
| `elegant/no-anonymous-param-type`      | custom | Parameters typed as an anonymous shape of `minMembers` or more properties        | `error` (minMembers 2) |
| `max-params`                           | native | Functions declaring more than `max` parameters                                  | `warn` (max 3) |
| `no-else-return`                       | native | An `else` branch when the `then` branch always returns (`allowElseIf: false`)   | `error`       |

### Rule details

#### `no-boolean-param`

A boolean argument almost always means the callee does two things. Prefer two
intention-revealing functions or an options object. Flags both annotated
(`flag: boolean`) and boolean-defaulted (`flag = false`) parameters.

#### `max-class-methods`

A proxy for the Single Responsibility Principle. Constructors are not counted;
getters and setters are. Configurable via `{ max: number }` (default `10`).

#### `max-class-dependencies`

The coupling counterpart to `max-class-methods`: a class that needs six
collaborators to do its job is coordinating, not modelling. Counts the distinct
types annotated on constructor parameters plus every type instantiated with
`new` inside the class body — so a dependency hidden behind `new HttpClient()`
weighs the same as an injected one.

De-duplication keeps type arguments, so `Repository<Order>` and
`Repository<Customer>` count as two collaborators while the same `Clock`
injected twice counts as one. Nested classes are budgeted independently of their
host.

Three things never count: primitives and inline types (they are not type
references), a default list of ambient built-ins (`Date`, `Map`, `Set`,
`Promise`, `Error`, `Array`, `RegExp`, `URL`, `WeakMap`, `WeakSet`), and
exceptions raised with `throw new ...`. That last exclusion is what makes the
rule usable in NestJS, where `throw new NotFoundException()` is routine and says
nothing about a class's design.

Configurable via `{ max: number, ignore: string[] }` (default `max: 4`).
`ignore` adds to the built-in list — reach for it when an ambient concern such
as `Logger` or `ConfigService` is in every constructor and you would rather not
budget for it:

```js
'elegant/max-class-dependencies': ['warn', { max: 4, ignore: ['Logger'] }],
```

#### `max-class-fields`

The third axis of class size, after methods and collaborators: a class carrying
a dozen fields is a record with a namespace, not a model. Counts instance fields
declared in the body — plain, `abstract`, or `accessor` — plus every constructor
parameter property. Methods and accessors belong to `max-class-methods`, and
`static` members to `no-static-members`, so neither is counted here.

Decorated properties are skipped by default. `@Column`, `@IsString` and
`@ApiProperty` map a field to a table or a payload, so a DTO or an ORM entity
declares one field per column by design and has no business inside a budget:

```ts
class CreateOrderDto {
  @IsString() customerId: string; // not counted
  @IsInt() quantity: number; // not counted
}
```

**The exemption stops at the constructor.** A decorator on a parameter is
injection, not mapping, so `@Inject(TOKEN) private readonly repo: Repo` stays
inside the budget — otherwise a service wired entirely through tokens would
count zero fields, which is exactly the class the rule exists to catch. Set
`{ ignoreDecorated: false }` to budget mapped properties too.

Configurable via `{ max: number, ignoreDecorated: boolean }` (default `max: 5`,
`ignoreDecorated: true`). The default leaves room for the four collaborators
`max-class-dependencies` allows plus one field of genuine state; past that the
two rules deliberately overlap, because a class over both budgets is over-sized
on both axes.

#### `no-type-assertion`

Assertions silence the type checker. Reach for a type guard, a generic, or a
correctly typed value instead. `as const` is permitted because it narrows rather
than widens.

#### `no-null-return`

Keeps absence out of return values; model it with an explicit domain type or
throw.

#### `no-public-mutable-props`

Public state should be `readonly` so callers cannot break an aggregate's
invariants. `private`/`protected` members and `readonly` members are allowed.

#### `no-logic-in-constructor`

A constructor should only wire arguments to fields. Validation, transformation,
and I/O belong in a static factory or a method, keeping object construction
predictable. Parameter properties (`constructor(private readonly x: T)`) and a
leading `super(...)` are allowed; computed right-hand sides (`this.x = x * 2`,
`this.items = items.slice()`) and any non-assignment statement are flagged.

#### `no-getters-setters`

Getters and setters turn objects into data bags; prefer methods that expose
behavior. Native `get`/`set` accessors (and `accessor` fields) are always
flagged. The opt-in `{ methods: true }` option also flags conventional
`getX`/`setX` methods — useful for strict Elegant Objects style, but noisy
around repositories and framework hooks, so it stays off in `recommended`.

#### `no-instanceof`

`instanceof` is type discrimination that belongs inside a polymorphic method on
the object. Pairs with `no-type-assertion` to keep type-based branching out of
the codebase.

#### `no-static-members`

Static state and behavior cannot be injected, substituted, or mocked. Prefer
instances (with dependency injection) and a module-level `const` for shared
values. The `{ allowReadonly: true }` option permits `static readonly`
constants.

Two kinds of static are allowed by default, because neither is behaviour that
anyone would want to substitute.

**A secondary constructor** — a static whose declared return type is the class
itself. TypeScript cannot overload a constructor, so `static of(...): DueDate`
inside `DueDate` is the only way to write one, and calling it is
indistinguishable from calling `new`. That is what separates a named
constructor from a procedure that moved into a class:

```ts
class DueDate {
  static of(props: DueDateProps): DueDate {}     // allowed
  static parse(raw: unknown): DueDate {}         // allowed
}

class DocumentFormatter {
  static formatCNPJ(document: string): string {} // reported — a module function
}
```

`this`, `Promise<Self>` and `Self | undefined` all count: a polymorphic, an
asynchronous and a failing constructor are still constructors. `Self | null`
does not, because `no-null-return` already owns that shape. The return type has
to be **written down** — the rule carries no type information, so an
unannotated `static create() { … }` stays reported. On a factory the annotation
is one word, and it is what makes the intent legible. Off via
`{ allowSelfReturning: false }`.

**A Nest module factory** — a static returning `DynamicModule` from a class
decorated with `@Module`. `forRoot`, `forRootAsync`, `register` and
`registerAsync` are mandated by the framework, not chosen by the design. Both
halves are required, so naming `DynamicModule` in a return type is not a way
out of the rule, and a module class gets no blanket exemption for its other
statics. Off via `{ allowModuleFactories: false }`.

Everything else still reports: static accessors (reading one is reaching for
static state, whatever it returns), `private static` helpers, and static
classes used as a namespace for functions.

#### `no-null`

Completes `no-null-return` by banning the `null` literal as a value everywhere
(`const x = null`, `x === null`, `fn(null)`), pushing absence into explicit types
or `undefined`. `null` in type positions (`string | null`) and a direct
`return null` (owned by `no-null-return`) are left alone. This is strict and will
flag idioms like `JSON.stringify(x, null, 2)` — relax it in the files where you
interoperate with null-based APIs.

#### `no-comments-in-function-body`

A comment inside a body is usually a name that never got written: it labels a
run of statements that wanted to be its own function. Move the explanation to a
docblock above the function, or extract what it describes and let the call read
as the sentence the comment was trying to be.

Applies to every function with a block body — methods, constructors, function
declarations, and arrow functions. Comments outside a body are untouched, so
docblocks, module-level notes, and comments between class members are fine. Each
comment is attributed to the innermost function containing it, so one in a
nested arrow is reported once, against that arrow.

Two things are never reported:

- **Directives**, which the toolchain reads rather than a human:
  `eslint-disable*`, `@ts-expect-error`, `@ts-ignore`, `prettier-ignore`,
  `istanbul ignore`, `c8 ignore`, `v8 ignore`, `webpackChunkName`,
  `@vite-ignore`. Extend the list with `{ allow: string[] }` for project
  conventions such as `@codegen`.
- **Comments alone in an empty block**, where there is no code to name and the
  comment is the only thing explaining the silence. The check looks at the
  innermost block, not the function, so an empty `catch` keeps its note even
  inside a busy function:

```ts
function run(): void {
  try {
    go();
  } catch {
    // the failure is expected here
  }
}
```

#### `no-else-after-throw`

When the `then` branch throws, control never reaches what follows, so `else`
carries no information and only deepens nesting. Drop it and let the alternative
sit at the outer level, where it reads as the normal path rather than one of two
symmetric cases:

```ts
// before
if (amount < 0) {
  throw new NegativeAmount(amount);
} else {
  process(amount);
}

// after
if (amount < 0) {
  throw new NegativeAmount(amount);
}
process(amount);
```

A branch counts as always throwing when it is a bare `throw` or a block whose
**last** statement is one. The check does not recurse, which is deliberate: a
block ending in a nested `if` may or may not throw, and there `else` still says
something.

`else if` is flagged too, since the same rewrite applies. The rule has no
options and no autofix — dedenting a block reliably is the formatter's job, not
a linter's.

Its sibling for `return` is the native
[`no-else-return`](https://eslint.org/docs/latest/rules/no-else-return), which
`recommended` enables with `allowElseIf: false` to match. Prefer the native
rule's defaults? Override it in one line:

```js
'no-else-return': 'error',
```

#### `no-interpolated-log-message`

A log message should be a constant, with everything that varies passed as
structured data. This is not a style preference: `` `order ${id} confirmed` ``
produces one distinct message per order, which no aggregator can group, and it
buries `id` inside prose instead of leaving it as a field you can filter on.

```ts
// before — N messages, and the id is not queryable
this.logger.log(`order ${id} confirmed for ${customer}`);

// after — one message, two fields
this.logger.log('order confirmed', { orderId: id, customer });
```

The rule looks only at the **message argument**, which it takes to be the first
argument that is not an object literal. That lands on the message under either
convention — `info(message, data)` as in NestJS and winston, `info(data,
message)` as in pino — so the rule never dictates where your data goes. An
interpolated *later* argument is left alone, since that position is context
rather than the message.

Flagged: template literals with expressions, and `+` concatenation. A plain
identifier passes, so `logger.info(message)` is fine — chasing that would need
type information, which no rule in this plugin requires.

A call counts as logging when the method is a level (`log`, `info`, `warn`,
`error`, `debug`, `verbose`, `trace`, `fatal`) and the receiver is named `logger`
or `log`, whether local or a field (`this.logger.info`). Both lists are widened
with `{ objects: string[], methods: string[] }`:

```js
'elegant/no-interpolated-log-message': ['error', { objects: ['audit'] }],
```

**Known limitation.** When the first argument is an identifier, it is taken for
the message, so pino's error form slips through:

```ts
logger.error(err, `order ${id} failed`); // not reported
```

Telling that apart from `logger.info(message)` needs type information. The case
is pinned by a test so the behaviour is deliberate rather than accidental.

#### `max-returns`

A port of Checkstyle's `ReturnCount`, but not of its threshold. qulice sets it
to `1` — a single exit — which reads well in Java and badly here, because it
outlaws the guard clause that `no-else-after-throw` in this very preset pushes
you towards. Two rules in one config should not disagree.

At `max: 3` the rule stops arguing about single exit and measures sprawl
instead. Two or three guards followed by a final `return` pass; a function
leaving from six different places is the one worth splitting.

```ts
// passes — idiomatic guards
function charge(amount: number): number {
  if (amount < 0) return 0;
  if (amount > limit) return limit;
  return amount;
}
```

Every function gets its own budget, so a callback's exits are never charged to
the function hosting it. Bare `return;` counts — leaving early is leaving,
value or not. An arrow with an expression body has no `return` statement at all
and never trips the rule.

Functions are reported by the name that binds them — a declaration's own, a
method's key, or the `const` or class field holding an arrow — falling back to
`(anonymous)` for an inline callback. Configurable via `{ max: number }`
(default `3`).

#### `no-property-alias`

A local whose whole job is to hold `obj.status` is a second name for state the
object already exposes under a name of its own. It buys nothing and it costs a
reader the hop of proving the two are the same value. Ask the object where you
need the answer.

```ts
// reported
const objStatus = obj.status;
const authHeader = request.headers.authorization;
const region = this.cognitoRegion;

// passes
obj.status;
request.headers.authorization;
this.cognitoRegion;
```

Only variable declarations are reported. `this.total = other.total` transfers
state rather than aliasing it, and a property in an object literal
(`{ id: dto.id }`) is how mappers are written; neither trips the rule.

Four shapes are never reported, because in each of them the local is doing real
work:

- **A reassigned local.** `let status = obj.status` followed by
  `status = 'EXPIRED'` holds mutable state that no member access stands in for.
- **A local read inside a nested function.** TypeScript drops a narrowing of
  `obj.prop` at the callback boundary but keeps it on a local, so inlining such
  a declaration stops compiling:

  ```ts
  const status = obj.status;
  if (status === undefined) return [];
  return obj.items.map((n) => n + status.length); // needs the local
  ```

- **A chain that is not a plain run of `.prop` accesses.** A computed link
  (`repo.save.mock.calls[1][0].metadata`) or a call in the middle
  (`resolveDates(query).startDate`) is not a property of an object in hand, and
  repeating it reads worse than naming it.
- **An environment read.** `const topicArn = process.env.SNS_ERROR_TOPIC`
  followed by a guard is fail-fast, and inlining it would read the environment
  twice. Set `{ allowEnv: false }` to hold these to the same standard.

Its sibling `no-property-destructuring` covers the same reach-in written as a
pattern; together they say one thing, which is to ask the object.

This rule is the mirror image of ESLint's native
[`prefer-destructuring`](https://eslint.org/docs/latest/rules/prefer-destructuring),
which reports `const status = obj.status` and asks you to write
`const { status } = obj` instead. The two cannot both be on. `prefer-destructuring`
is off by default, so there is nothing to undo unless you enabled it — and note
that it only fires when the local and the property share a name, leaving the
renaming majority (`const objStatus = obj.status`) unreported either way.

#### `no-property-destructuring`

`const { status, enabled } = obj` is `no-property-alias` written as a pattern:
the object already names its own state, and the locals are a second set of
names for it. This rule covers the pattern form, and only when the thing being
destructured is an object you already hold — a name, `this`, or a run of plain
`.prop` accesses rooted at one of those.

```ts
// reported
const { status, enabled } = obj;
const { access_token, expires_in } = response.data;
const { region, poolId } = this.config;

// passes — none of these was an object in hand
function create({ id, name }) {}
for (const { id, total } of rows) {}
const { csvContent } = await service.exportCsv(query);
const { startDate } = resolveDates(query);
const [rows, total] = await repo.findAndCount();
```

Parameter patterns, loop bindings, and `catch` bindings are how you receive a
value rather than reach into one, so they never come up. Neither does
`ArrayPattern`: `const [rows, total] = ...` names the halves of a tuple that
carries no names of its own.

Four shapes are never reported, because in each of them the pattern is doing
work no member access does:

- **A rest element.** `const { authorization: _auth, ...safe } = headers`
  constructs a new object by omission. There is nothing to inline it into.
- **A default value.** `const { max = 3 } = options` inlines to
  `options.max ?? 3`, repeating the fallback at every use site.
- **A local read inside a nested function**, for the narrowing reason spelled
  out under `no-property-alias`.
- **A local reassigned later.** `let { status } = obj` followed by
  `status = 'EXPIRED'` holds mutable state of its own.

Renaming on the way out (`const { ingestion: failure } = row`) is still
copying, and so is a single property. Width makes no difference: a pattern
pulling four fields off an `input` is usually the sign that the method wanted
the object, not the fields.

#### `no-anonymous-param-type`

`max-params` and `no-boolean-param` both push you towards an options object —
and an options object typed inline is a bag that got away with it. The
parameter count went down, the coupling did not, and the shape has nowhere to
grow behaviour. Give it a name and it can become a value object; leave it
anonymous and it stays a struct.

```ts
// reported
private toResponse(group: { id: string; name: string; members: number }) {}
async createFundingProducts(data: { originCode: string; productId: string }) {}
chart(rows: Array<{ day: string; count: string }>) {}
constructor(private readonly config: { host: string; port: number }) {}

// passes
async register(input: RegisterProposal) {}
function charge(amount: number, currency: string) {}
ingest(raw: Record<string, unknown>) {}
```

A shape counts wherever it hides in the annotation — on its own, in a union
with `null`, intersected onto a named type, in an array, or inside a generic
argument such as `Array<{ … }>`. A parameter is reported once however many
shapes it holds, and each offending parameter is reported separately.
Destructuring in the signature (`function create({ id }: { id: string })`)
does not hide the bag, and neither does a default value.

**Inline callbacks are never reported.** `res.body.items.map((i: { ccbNumber: string; total: number }) => i.total)`
annotates whatever the callee yields; when that value has no type to borrow, an
inline shape is the only way to type it at all.

Configurable via `{ minMembers: number }` (default `2`). At the default, a
one-property parameter like `opts?: { required?: boolean }` passes — naming a
single field is usually ceremony rather than design. Set `minMembers: 1` to
hold those to the same standard.

Unlike its neighbours, this rule does not have a mechanical fix: it asks you to
introduce a named type and decide where it lives. That is a design change, so
expect adoption to cost more than a find-and-replace.

## Configuration

### Overriding thresholds

`max-class-methods`, `max-class-dependencies`, `max-class-fields`, and the
native `max-params` all take a `max` option:

```js
rules: {
  ...elegant.configs.recommended.rules,
  'elegant/max-class-methods': ['warn', { max: 15 }],
  'elegant/max-class-dependencies': ['warn', { max: 6 }],
  'elegant/max-class-fields': ['warn', { max: 8 }],
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
    'elegant/max-class-dependencies': 'off',
    'elegant/max-class-fields': 'off',
    'elegant/no-comments-in-function-body': 'off',
    'max-params': 'off',
  },
}
```

## Compatibility

The package ships a single CommonJS build that is consumable as both
`require('@tianjos/eslint-plugin-elegant')` and an ESM
`import elegant from '@tianjos/eslint-plugin-elegant'`. The exported object
exposes `{ meta, rules, configs }`.

## Prior art

This plugin is a TypeScript adaptation of [Elegant Objects](https://www.elegantobjects.org/)
(Yegor Bugayenko) and [qulice](https://github.com/yegor256/qulice) — the Java
quality enforcer that codifies those principles on top of Checkstyle and PMD.
Rules such as `no-logic-in-constructor` (qulice's `ConstructorsCodeFreeCheck`),
`max-class-dependencies` (Checkstyle's `ClassDataAbstractionCoupling`),
`max-class-fields` (PMD's `TooManyFields`),
`no-comments-in-function-body` (`MethodBodyCommentsCheck`), `no-null`,
`no-getters-setters`, and `no-static-members` are ports of that
philosophy. The concepts are reimplemented from scratch against the TypeScript
AST; no qulice code is used.

## License

[MIT](./LICENSE) © Thiago
