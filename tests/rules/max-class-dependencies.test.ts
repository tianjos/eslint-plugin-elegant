import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/max-class-dependencies';

const ruleTester = new RuleTester();

ruleTester.run('max-class-dependencies', rule, {
  valid: [
    {
      name: 'a class within the limit',
      code: 'class OrderService { constructor(private readonly repo: OrderRepo, private readonly mailer: Mailer) {} }',
      options: [{ max: 2 }],
    },
    {
      name: 'a class with no constructor',
      code: 'class OrderId { toString() { return this.raw; } }',
      options: [{ max: 1 }],
    },
    {
      name: 'primitive parameters are not dependencies',
      code: 'class Money { constructor(private readonly amount: number, private readonly currency: string, private readonly rounded: boolean) {} }',
      options: [{ max: 1 }],
    },
    {
      name: 'the same collaborator instantiated twice counts once',
      code: 'class Reporter { run() { new Query(); new Query(); } }',
      options: [{ max: 1 }],
    },
    {
      name: 'thrown exceptions are not collaborators',
      code: 'class OrderService { constructor(private readonly repo: OrderRepo) {} find() { throw new NotFoundException(); } cancel() { throw new ConflictException(); } }',
      options: [{ max: 1 }],
    },
    {
      name: 'built-in types are not collaborators',
      code: 'class Clock { now() { return new Date(); } index() { return new Map<string, Order>(); } }',
      options: [{ max: 1 }],
    },
    {
      name: 'types listed in ignore do not count',
      code: 'class OrderService { constructor(private readonly repo: OrderRepo, private readonly logger: Logger) {} }',
      options: [{ max: 1, ignore: ['Logger'] }],
    },
    {
      name: 'the same collaborator injected twice counts once',
      code: 'class Orders { constructor(private readonly left: Clock, private readonly right: Clock) {} }',
      options: [{ max: 1 }],
    },
  ],
  invalid: [
    {
      name: 'more injected collaborators than the limit',
      code: 'class OrderService { constructor(private readonly repo: OrderRepo, private readonly mailer: Mailer, private readonly clock: Clock) {} }',
      options: [{ max: 2 }],
      errors: [{ messageId: 'tooManyDependencies' }],
    },
    {
      name: 'collaborators hidden behind new count as dependencies',
      code: 'class OrderService { constructor(private readonly repo: OrderRepo) {} notify() { const client = new HttpClient(); const pdf = new PdfRenderer(); } }',
      options: [{ max: 2 }],
      errors: [{ messageId: 'tooManyDependencies' }],
    },
    {
      name: 'a nested class is budgeted on its own, not against its host',
      code: 'class Outer { constructor(private readonly repo: Repo) {} make() { return class Inner { run() { new A(); new B(); } }; } }',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyDependencies',
          data: { name: 'Inner', count: 2, max: 1, names: 'A, B' },
        },
      ],
    },
    {
      name: 'the same generic over different aggregates counts separately',
      code: 'class Orders { constructor(private readonly orders: Repository<Order>, private readonly customers: Repository<Customer>) {} }',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyDependencies',
          data: {
            name: 'Orders',
            count: 2,
            max: 1,
            names: 'Repository<Order>, Repository<Customer>',
          },
        },
      ],
    },
    {
      name: 'an anonymous class expression is reported too',
      code: 'const Service = class { constructor(left: A, right: B) {} };',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyDependencies',
          data: { name: '(anonymous)', count: 2, max: 1, names: 'A, B' },
        },
      ],
    },
  ],
});
