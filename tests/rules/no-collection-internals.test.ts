import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-collection-internals';

const ruleTester = new RuleTester();

ruleTester.run('no-collection-internals', rule, {
  valid: [
    {
      name: 'a collection filtering its own array',
      code: 'class Totals { of(origin: Origin) { return new Totals(this.totals.filter((total) => total.belongsTo(origin))); } }',
    },
    {
      name: 'own state reached through props',
      code: 'class Window { first() { return this.props.competences[0]; } }',
    },
    {
      name: 'a pipeline chained on own state',
      code: 'class Totals { sum() { return this.totals.filter(isOpen).map(amountOf).reduce(add, ZERO); } }',
    },
    {
      name: 'a local derived from own state',
      code: 'class Totals { sum() { const open = this.totals.filter(isOpen); return open.reduce(add, ZERO); } }',
    },
    {
      name: 'the entries of own state',
      code: 'class Lines { names() { return Object.entries(this.props.lines).map(([name]) => name); } }',
    },
    {
      name: 'a static factory builds the collection from its input',
      code: 'class Totals { static fromRows(rows: Row[]) { return new Totals(rows.map(Total.fromRow)); } }',
    },
    {
      name: 'a callback nested in a static factory',
      code: 'class Plan { static of(rows: Row[]) { return new Plan(rows.map((row) => row.items.filter(isOpen))); } }',
    },
    {
      name: 'an array built in place belongs to whoever built it',
      code: "const noteOf = (entry: Entry) => [ADJUSTMENT_NOTE, entry.note()].filter(Boolean).join(' · ');",
    },
    {
      name: 'a copy of own state, sorted',
      code: 'class Schedule { latest() { return [...this.input.settlements].sort(byDay)[0]; } }',
    },
    {
      name: 'splitting a string is not a collection',
      code: "const prefixOf = (key: string) => key.split(':')[0];",
    },
    {
      name: 'a regex match is not a collection',
      code: 'const yearOf = (raw: string) => PATTERN.exec(raw)?.[1];',
    },
    {
      name: 'an index that is not positional',
      code: 'const lineOf = (lines: Lines, key: string) => lines[key];',
    },
    {
      name: 'a method that is not a pipeline',
      code: 'const has = (ids: Ids, id: string) => ids.has(id);',
    },
  ],
  invalid: [
    {
      name: 'reading a foreign collection by position',
      code: 'const range = CompetenceRange.create(window[0], window[window.length - 1]);',
      errors: [
        { messageId: 'positionalAccess', data: { collection: 'window' }, column: 38 },
        { messageId: 'positionalAccess', data: { collection: 'window' } },
      ],
    },
    {
      name: 'at() is positional too',
      code: 'const last = (ids: Ids) => ids.at(-1);',
      errors: [{ messageId: 'positionalAccess', data: { collection: 'ids' } }],
    },
    {
      name: 'filtering a collection passed in',
      code: 'const totalsOf = (origin: Origin, totals: Totals) => totals.filter((total) => total.commissionOriginId === origin.id);',
      errors: [
        {
          messageId: 'foreignPipeline',
          data: { method: 'filter', collection: 'totals' },
        },
      ],
    },
    {
      name: 'projecting another object\'s collection',
      code: 'class Query { idsOf(snapshot: Snapshot) { return snapshot.origins.map((origin) => origin.id); } }',
      errors: [
        {
          messageId: 'foreignPipeline',
          data: { method: 'map', collection: 'snapshot.origins' },
        },
      ],
    },
    {
      name: 'a chain is reported once, at the first link',
      code: 'const net = (entries: Entries) => entries.filter(isOpen).map(amountOf).reduce(add, ZERO);',
      errors: [{ messageId: 'foreignPipeline', data: { method: 'filter', collection: 'entries' } }],
    },
    {
      name: 'a repository result',
      code: 'class Service { async run() { const contracts = await this.repository.findOpen(); return contracts.some(isLate); } }',
      errors: [{ messageId: 'foreignPipeline', data: { method: 'some', collection: 'contracts' } }],
    },
    {
      name: 'reaching through a collaborator is not own state',
      code: 'class Service { run() { return this.repository.all().map(toDto); } }',
      errors: [{ messageId: 'foreignPipeline', data: { method: 'map', collection: 'this.repository.all()' } }],
    },
    {
      name: 'an element of own state asked about its internals',
      code: 'class Groups { open() { return this.groups.map((group) => group.items.filter(isOpen)); } }',
      errors: [{ messageId: 'foreignPipeline', data: { method: 'filter', collection: 'group.items' } }],
    },
    {
      name: 'spreading a foreign collection into a literal does not make it owned',
      code: 'const earliestOf = (days: Days) => [...days].sort(byDay)[0];',
      errors: [{ messageId: 'positionalAccess', data: { collection: '[...days].sort(byDay)' } }],
    },
    {
      name: 'a free function over a parameter',
      code: 'function sumOf(amounts: Amounts) { return amounts.reduce((total, amount) => total.add(amount), ZERO); }',
      errors: [{ messageId: 'foreignPipeline' }],
    },
  ],
});
