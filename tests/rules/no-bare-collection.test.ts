import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-bare-collection';

const ruleTester = new RuleTester();

ruleTester.run('no-bare-collection', rule, {
  valid: [
    {
      name: 'a first-class collection in the signature',
      code: 'function totalsOf(origin: Origin): DescriptionChainTotals {}',
    },
    {
      name: 'an array of primitives is a different problem',
      code: 'function idsOf(origin: Origin): string[] {}',
    },
    {
      name: 'an array of a built-in type',
      code: 'function datesOf(origin: Origin): Date[] {}',
    },
    {
      name: 'an array of a type parameter',
      code: 'function firstOf<T>(items: T[]): T {}',
    },
    {
      name: 'a class field is the collection owning its array',
      code: 'class Totals { private readonly totals: readonly Total[] = []; }',
    },
    {
      name: 'a parameter property is the collection owning its array',
      code: 'class Totals { private constructor(private readonly totals: Total[]) {} }',
    },
    {
      name: 'a static factory receives the array it builds the collection from',
      code: 'class Totals { static of(totals: readonly Total[]): Totals { return new Totals(totals); } }',
    },
    {
      name: 'a constructor receives the array it stores',
      code: 'class Totals { constructor(totals: Total[]) { this.totals = totals; } }',
    },
    {
      name: 'the props type a class keeps as its state',
      code: 'type ReportProps = { failed: Failure[] }; class Report { private constructor(private readonly props: ReportProps) {} }',
    },
    {
      name: 'the props type a static factory takes, through an intersection',
      code: 'type CreateReportProps = Omit<ReportProps, "id"> & { failed: Failure[] }; class Report { static create(props: CreateReportProps): Report {} }',
    },
    {
      name: 'an interface kept as state',
      code: 'interface WindowProps { competences: Competence[] } class Window { private constructor(private readonly props: WindowProps) {} }',
    },
    {
      name: 'an inline shape kept as state',
      code: 'class Window { private constructor(private readonly props: { competences: Competence[] }) {} }',
    },
    {
      name: 'a private method works on the internals without exposing them',
      code: 'class Schedule { private payments(): Debit[] {} #entry(): Debit[] {} }',
    },
    {
      name: 'a type from a library namespace is not the domain',
      code: 'function paramsOf(node: Node): TSESTree.Parameter[] {}',
    },
    {
      name: 'a local variable is inferred from the signatures that produce it',
      code: 'const totals: Total[] = [];',
    },
  ],
  invalid: [
    {
      name: 'a function returning a bare collection',
      code: 'const refundEstimateWindow = (current: Competence): Competence[] => [];',
      errors: [
        {
          messageId: 'bareCollection',
          data: { name: 'refundEstimateWindow', element: 'Competence' },
        },
      ],
    },
    {
      name: 'a method returning a readonly collection',
      code: 'class Range { competences(): readonly Competence[] {} }',
      errors: [
        {
          messageId: 'bareCollection',
          data: { name: 'competences', element: 'Competence' },
        },
      ],
    },
    {
      name: 'a repository returning a promised collection',
      code: 'class Repository { async findOpen(): Promise<Array<Contract>> {} }',
      errors: [
        {
          messageId: 'bareCollection',
          data: { name: 'findOpen', element: 'Contract' },
        },
      ],
    },
    {
      name: 'an interface method signature returning a collection',
      code: 'interface Contracts { findOpen(): Promise<ReadonlyArray<Contract>>; }',
      errors: [{ messageId: 'bareCollection', data: { name: 'findOpen', element: 'Contract' } }],
    },
    {
      name: 'a parameter taking a bare collection',
      code: 'const totalsOf = (origin: Origin, totals: readonly DescriptionChainTotal[]) => origin;',
      errors: [
        {
          messageId: 'bareCollection',
          data: { name: 'totals', element: 'DescriptionChainTotal' },
          column: 35,
        },
      ],
    },
    {
      name: 'an optional parameter in a union with absence',
      code: 'function project(shares?: ForecastShare[] | undefined) {}',
      errors: [{ messageId: 'bareCollection', data: { name: 'shares', element: 'ForecastShare' } }],
    },
    {
      name: 'a property of a type nobody keeps as state',
      code: 'type ReportTotals = { refunded: RefundedContract[]; failed: Failure[] };',
      errors: [
        { messageId: 'bareCollection', data: { name: 'refunded', element: 'RefundedContract' } },
        { messageId: 'bareCollection', data: { name: 'failed', element: 'Failure' } },
      ],
    },
    {
      name: 'a protected method is still seen by subclasses',
      code: 'class Commission { protected toDebits(): Debit[] {} }',
      errors: [{ messageId: 'bareCollection', data: { name: 'toDebits', element: 'Debit' } }],
    },
    {
      name: 'a parameter of an instance method',
      code: 'class Totals { merge(others: Total[]): Totals {} }',
      errors: [{ messageId: 'bareCollection', data: { name: 'others', element: 'Total' } }],
    },
    {
      name: 'a type parameter of an outer function does not shadow a real type elsewhere',
      code: 'function wrap<T>(items: T[]): T {} function totalsOf(): Total[] {}',
      errors: [{ messageId: 'bareCollection', data: { name: 'totalsOf', element: 'Total' } }],
    },
  ],
});
