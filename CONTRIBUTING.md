# Contributing

## Development

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

Releases are driven by [`standard-version`](https://github.com/conventional-changelog/standard-version),
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
version is below `1.0.0`, standard-version demotes every recommendation by one
level — a `feat:` commit yields a patch, not a minor. The line responsible is
`lib/lifecycles/bump.js`:

```js
if (semver.lt(currentVersion, '1.0.0')) presetOptions.preMajor = true
```

It runs after the preset is loaded, so a `.versionrc` or a `standard-version`
key in `package.json` cannot switch it off. Letting the tool choose would
silently ship new rules as a patch. Releasing `1.0.0` is what removes the
demotion for good; until then, name the bump.

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
