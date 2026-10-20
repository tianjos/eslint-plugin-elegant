import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/max-class-fields';

const ruleTester = new RuleTester();

ruleTester.run('max-class-fields', rule, {
  valid: [
    {
      name: 'a class within the limit',
      code: 'class Order { private readonly id: OrderId; private status: Status; }',
      options: [{ max: 2 }],
    },
    {
      name: 'methods and accessors are not state',
      code: 'class Order { confirm() {} get total() { return 1; } set total(value) {} }',
      options: [{ max: 1 }],
    },
    {
      name: 'static members are not instance state',
      code: "class Order { static TABLE = 'orders'; static readonly MAX = 10; private id: Id; }",
      options: [{ max: 1 }],
    },
    {
      name: 'a DTO of mapped properties carries no state of its own',
      code: 'class CreateOrderDto { @IsString() customerId: string; @IsInt() quantity: number; @IsDate() dueAt: Date; }',
      options: [{ max: 1 }],
    },
    {
      name: 'an injected collaborator is budgeted by max-class-dependencies, not here',
      code: 'class Handler { private status: Status; constructor(private readonly ledger: LedgerRepository, private readonly contracts: ContractRepository) {} }',
      options: [{ max: 1 }],
    },
    {
      name: 'a collaborator the class instantiates is budgeted by max-class-dependencies, not here',
      code: 'class OrderService { private readonly logger = new Logger(OrderService.name); private status: Status; }',
      options: [{ max: 1 }],
    },
    {
      name: 'a readonly enum tag is the same for every instance, so it is not state',
      code: 'class CurrentCommissionOrigin { readonly commissionType = CommissionType.CURRENT; readonly id: string; }',
      options: [{ max: 1 }],
    },
    {
      name: 'a readonly literal tag is not state',
      code: "class Settled { readonly kind = 'settled'; readonly at: Date; }",
      options: [{ max: 1 }],
    },
    {
      name: 'a readonly literal tag narrowed with as const is not state',
      code: "class Settled { readonly kind = 'settled' as const; readonly at: Date; }",
      options: [{ max: 1 }],
    },
    {
      name: 'a readonly negative constant is not state',
      code: 'class Unbounded { readonly limit = -1; readonly id: string; }',
      options: [{ max: 1 }],
    },
  ],
  invalid: [
    {
      name: 'parameter properties of a primitive type count towards the budget',
      code: 'class Order { private readonly id: Id; private status: Status; constructor(private readonly retries: number) {} }',
      options: [{ max: 2 }],
      errors: [{ messageId: 'tooManyFields' }],
    },
    {
      name: 'injected primitive parameter properties count despite their decorator',
      code: 'class OrderService { constructor(@Inject(REGION) private readonly region: string, @Inject(RETRIES) private readonly retries: number) {} }',
      options: [{ max: 1 }],
      errors: [{ messageId: 'tooManyFields' }],
    },
    {
      name: 'a built-in parameter property is a value, not a collaborator',
      code: 'class Invoice { constructor(private readonly issuedAt: Date, private readonly id: string) {} }',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyFields',
          data: { name: 'Invoice', count: 2, max: 1, names: 'issuedAt, id' },
        },
      ],
    },
    {
      name: 'a field holding a built-in it instantiates is state',
      code: 'class Cache { private readonly entries = new Map<string, Entry>(); private status: Status; }',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyFields',
          data: { name: 'Cache', count: 2, max: 1, names: 'entries, status' },
        },
      ],
    },
    {
      name: 'only the collaborators leave the budget, the state beside them stays',
      code: 'class Handler { private readonly logger = new Logger(); private status: Status; constructor(private readonly ledger: LedgerRepository, private readonly region: string) {} }',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyFields',
          data: { name: 'Handler', count: 2, max: 1, names: 'status, region' },
        },
      ],
    },
    {
      name: 'a constant a field merely starts from is state, because it can change',
      code: "class Order { status = 'PENDING'; readonly id: string; }",
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyFields',
          data: { name: 'Order', count: 2, max: 1, names: 'status, id' },
        },
      ],
    },
    {
      name: 'a readonly field computed per instance is state',
      code: 'class Order { readonly id = randomUUID(); readonly placedAt = Date.now(); }',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyFields',
          data: { name: 'Order', count: 2, max: 1, names: 'id, placedAt' },
        },
      ],
    },
    {
      name: 'a readonly field read off the instance is state',
      code: 'class Client { readonly region = this.config.region; readonly id: string; }',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyFields',
          data: { name: 'Client', count: 2, max: 1, names: 'region, id' },
        },
      ],
    },
    {
      name: 'a readonly regular expression is state, because it carries lastIndex',
      code: 'class Scanner { readonly token = /\\w+/g; readonly id: string; }',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyFields',
          data: { name: 'Scanner', count: 2, max: 1, names: 'token, id' },
        },
      ],
    },
    {
      name: 'a readonly collection literal is state, because its contents change',
      code: 'class Basket { readonly items = []; readonly id: string; }',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyFields',
          data: { name: 'Basket', count: 2, max: 1, names: 'items, id' },
        },
      ],
    },
    {
      name: 'mapped properties count again when ignoreDecorated is off',
      code: 'class Order { @Column() left: string; @Column() right: string; }',
      options: [{ max: 1, ignoreDecorated: false }],
      errors: [{ messageId: 'tooManyFields' }],
    },
    {
      name: 'accessor fields are state',
      code: 'class Order { accessor total = 0; accessor discount = 0; }',
      options: [{ max: 1 }],
      errors: [{ messageId: 'tooManyFields' }],
    },
    {
      name: 'abstract properties are state a subclass must carry',
      code: 'abstract class Order { abstract id: Id; abstract status: Status; }',
      options: [{ max: 1 }],
      errors: [{ messageId: 'tooManyFields' }],
    },
    {
      name: 'an anonymous class expression is reported too',
      code: 'const Model = class { left: A; right: B; };',
      options: [{ max: 1 }],
      errors: [
        {
          messageId: 'tooManyFields',
          data: {
            name: '(anonymous)',
            count: 2,
            max: 1,
            names: 'left, right',
          },
        },
      ],
    },
  ],
});
