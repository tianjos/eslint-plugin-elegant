import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-anemic-type';

const ruleTester = new RuleTester();

ruleTester.run('no-anemic-type', rule, {
  valid: [
    {
      name: 'a type with a single function around it',
      code: 'type Totals = { refunded: number }; const progressOf = (totals: Totals) => totals.refunded;',
    },
    {
      name: 'functions taking the type in a later position are collaborators of something else',
      code: 'type Totals = { refunded: number }; const a = (event: Event, totals: Totals) => 1; const b = (event: Event, totals: Totals) => 2;',
    },
    {
      name: 'an interface with methods is a contract, not data',
      code: 'interface Clock { now(): Date; zone: string } const a = (clock: Clock) => 1; const b = (clock: Clock) => 2;',
    },
    {
      name: 'a type imported from elsewhere is not this file\'s to fix',
      code: "import type { Totals } from './totals'; const a = (totals: Totals) => 1; const b = (totals: Totals) => 2;",
    },
    {
      name: 'methods of a class already live with their data',
      code: 'type Props = { amount: number }; class Refund { a(props: Props) {} b(props: Props) {} }',
    },
    {
      name: 'a union is not a shape to put behaviour on',
      code: "type Kind = 'a' | 'b'; const a = (kind: Kind) => 1; const b = (kind: Kind) => 2;",
    },
    {
      name: 'the threshold is configurable',
      code: 'type Totals = { refunded: number }; const a = (totals: Totals) => 1; const b = (totals: Totals) => 2;',
      options: [{ minFunctions: 3 }],
    },
  ],
  invalid: [
    {
      name: 'a data type folded by free functions',
      code: [
        'type ReportTotals = { refunded: number; failed: number };',
        'const foldRefunded = (totals: ReportTotals, result: Result): ReportTotals => totals;',
        'function foldFailed(totals: ReportTotals, event: Event): ReportTotals { return totals; }',
        'export const progressOf = (totals: Readonly<ReportTotals>) => totals.failed;',
      ].join('\n'),
      errors: [
        {
          messageId: 'anemicType',
          data: {
            name: 'ReportTotals',
            count: 3,
            functions: 'foldRefunded, foldFailed, progressOf',
          },
          line: 1,
          column: 6,
        },
      ],
    },
    {
      name: 'an exported interface of data',
      code: 'export interface Window { from: Competence; to: Competence } export function lengthOf(window: Window) {} export function includes(window: Window, at: Competence) {}',
      errors: [
        {
          messageId: 'anemicType',
          data: { name: 'Window', count: 2, functions: 'lengthOf, includes' },
        },
      ],
    },
    {
      name: 'an intersection with a shape is still data',
      code: 'type Input = Base & { rows: Row[] }; const a = (input: Input) => 1; const b = (input: Input) => 2;',
      errors: [{ messageId: 'anemicType', data: { name: 'Input', count: 2, functions: 'a, b' } }],
    },
  ],
});
