import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-trivial-constant';

const ruleTester = new RuleTester();

ruleTester.run('no-trivial-constant', rule, {
  valid: [
    {
      name: 'a literal naming a business rule',
      code: 'const MONTHS_PER_YEAR = 12;',
    },
    {
      name: 'a string naming a convention',
      code: "export const REVERSAL_PREFIX = 'revert:';",
    },
    {
      name: 'a collection with contents',
      code: "const LINES = ['cancellation', 'early-settlement'];",
    },
    {
      name: 'a value object built from something other than literals',
      code: 'const LIMIT = Money.create(process.env.LIMIT);',
    },
    {
      name: 'the value object naming its own constant, in its own file',
      code: 'const ZERO = Money.create(0); export class Money { static zero() { return ZERO; } }',
    },
    {
      name: 'a platform call is not a value object',
      code: "const STARTED_AT = Date.parse('2026-01-01');",
    },
    {
      name: 'a local inside a function is not a module constant',
      code: 'function sum() { const totals = []; return totals; }',
    },
    {
      name: 'a module cache filled later is state, not an empty value',
      code: 'const clients = new Map<string, Client>(); export const clientFor = (region: string) => clients.get(region) ?? clients.set(region, new Client(region)).get(region);',
    },
    {
      name: 'a registry pushed into later',
      code: 'const handlers: Handler[] = []; export const register = (handler: Handler) => { handlers.push(handler); };',
    },
    {
      name: 'a map built with entries',
      code: "const BY_CODE = new Map([['a', 1]]);",
    },
  ],
  invalid: [
    {
      name: 'a value object built from a literal',
      code: 'const ZERO = Money.create(0);',
      errors: [
        {
          messageId: 'literalValueObject',
          data: { name: 'ZERO', type: 'Money', factory: 'create' },
          column: 7,
        },
      ],
    },
    {
      name: 'an exported value object built from literals',
      code: "export const FIRST_COMPETENCE = Competence.of(2026, -1, 'x');",
      errors: [{ messageId: 'literalValueObject', data: { name: 'FIRST_COMPETENCE', type: 'Competence', factory: 'of' } }],
    },
    {
      name: 'an empty array with a type',
      code: 'const NOTHING_TO_PROJECT: ForecastShare[] = [];',
      errors: [{ messageId: 'emptyConstant', data: { name: 'NOTHING_TO_PROJECT', empty: '[]' } }],
    },
    {
      name: 'an empty object',
      code: 'const NO_LINES = {};',
      errors: [{ messageId: 'emptyConstant', data: { name: 'NO_LINES', empty: '{}' } }],
    },
    {
      name: 'an empty map',
      code: 'const NO_FORECASTS: ReadonlyMap<string, OriginForecast> = new Map();',
      errors: [{ messageId: 'emptyConstant', data: { name: 'NO_FORECASTS', empty: 'new Map()' } }],
    },
    {
      name: 'an empty set behind an assertion',
      code: 'export const NO_IDS = new Set<string>() as ReadonlySet<string>;',
      errors: [{ messageId: 'emptyConstant', data: { name: 'NO_IDS', empty: 'new Set()' } }],
    },
    {
      name: 'an empty frozen array',
      code: 'const NO_EVENTS = Object.freeze([]);',
      errors: [{ messageId: 'emptyConstant', data: { name: 'NO_EVENTS', empty: '[]' } }],
    },
  ],
});
