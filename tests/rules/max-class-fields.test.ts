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
  ],
  invalid: [
    {
      name: 'parameter properties count towards the budget',
      code: 'class Order { private readonly id: Id; private status: Status; constructor(private readonly repo: Repo) {} }',
      options: [{ max: 2 }],
      errors: [{ messageId: 'tooManyFields' }],
    },
    {
      name: 'injected parameter properties count despite their decorator',
      code: 'class OrderService { constructor(@Inject(A) private readonly a: A, @Inject(B) private readonly b: B) {} }',
      options: [{ max: 1 }],
      errors: [{ messageId: 'tooManyFields' }],
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
