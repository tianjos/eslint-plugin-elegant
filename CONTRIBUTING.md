# Contributing

## Development

Run `nvm use` first. The repo pins Node through `.nvmrc`, and the CI workflows
read the same file, so local and CI never drift.

**Node 24 segfaults this test suite**, 24.14 through 24.21, in roughly a third
of runs. It is a V8 bug, not ours: Sparkplug's `BaselineOutOfLinePrologue`
pushes a register V8 never fills in Node's build, and a mark-compact GC
arriving at that moment reads the junk as a heap pointer
(`ClearStaleLeftTrimmedPointerVisitor::VisitRootPointers`). Upstream is
[nodejs/node#62393](https://github.com/nodejs/node/issues/62393); the V8 fix is
backported in [#65753](https://github.com/nodejs/node/pull/65753), merged but
not yet in a 24.x release. Node 22 and Node 26 are unaffected.

It is worth recognising because 24.21 kills only the jest workers, so it
surfaces as `Test suite failed to run … signal=SIGSEGV` and exit 1 — it reads
like a broken test. If you must stay on Node 24, `node --no-sparkplug
node_modules/jest/bin/jest.js` is clean (the flag is rejected in
`NODE_OPTIONS`). Otherwise just `nvm use`.

```bash
npm ci          # install
npm run build   # compile dist/ with tsc
npm test        # build, then run the rule tests (jest + @typescript-eslint/rule-tester)
npm run typecheck
npm run lint    # the plugin held to its own recommended config
```

`npm run lint` and `npm test` both build first: `eslint.config.mjs` reads the
plugin from `dist/`, and `tests/dist.test.ts` runs real Node against the built
output to check that the package still loads through `require`,
`require(...).default` and an ESM `import` — an interop shape that exists only
after compilation and would otherwise break on a consumer's machine rather
than here. Use `npx jest` directly for a fast inner loop. CI runs it between build and test and fails on errors only: the `max-*`
rules ship as warnings because a threshold is a judgement, and a judgement
should not block a merge.

Rules live in `src/rules/`, each created through the shared `createRule`
factory in `src/utils/createRule.ts`. Every rule must ship with a matching
test file in `tests/rules/`.

## Releasing

Releases are driven by [`commit-and-tag-version`](https://github.com/absolute-version/commit-and-tag-version),
which updates `CHANGELOG.md`, bumps `package.json`, and creates an annotated git
tag in one command:

```bash
npm run release          # a release that adds or changes rules
npm run release:patch    # a release that only fixes existing rules
git push --follow-tags origin main
```

Pushing a `v*` tag triggers the publish workflow
(`.github/workflows/publish.yml`), which builds, tests, and runs
`npm publish --provenance` through OIDC trusted publishing. No token is
involved, and there is nothing to rotate.

**Both scripts state the bump explicitly, and that is deliberate.** While the
version is below `1.0.0`, commit-and-tag-version demotes every recommendation
by one level — a `feat:` commit yields a patch, not a minor. The line
responsible is `lib/lifecycles/bump.js`:

```js
if (semver.lt(currentVersion, '1.0.0')) presetOptions.preMajor = true
```

It runs after the preset is loaded, so a `.versionrc` or a
`commit-and-tag-version` key in `package.json` cannot switch it off. Letting
the tool choose would silently ship new rules as a patch. Releasing `1.0.0` is
what removes the demotion for good; until then, name the bump.

### Commit message conventions

Conventional Commits still drive the CHANGELOG sections, which is what they are
used for here — not the version, which the scripts above pin.

| Prefix             | CHANGELOG section |
| ------------------ | ----------------- |
| `fix:`             | Bug Fixes         |
| `feat:`            | Features          |
| `build:` / `ci:` / `chore:` | omitted  |

The package is published under the `@tianjos` scope with public access
(`publishConfig.access = "public"`).
