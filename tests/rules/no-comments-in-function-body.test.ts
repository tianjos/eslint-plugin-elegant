import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-comments-in-function-body';

const ruleTester = new RuleTester();

ruleTester.run('no-comments-in-function-body', rule, {
  valid: [
    {
      name: 'a function that explains itself',
      code: 'function total(order: Order) { return order.total(); }',
    },
    {
      name: 'a docblock above the function',
      code: '/** Totals an order. */\nfunction total(order: Order) { return order.total(); }',
    },
    {
      name: 'a comment outside any function',
      code: '// wiring\nconst container = build();',
    },
    {
      name: 'a body left intentionally empty',
      code: 'function noop() {\n  // nothing to initialise\n}',
    },
    {
      name: 'an empty catch inside a busy function',
      code: 'function run() {\n  try {\n    go();\n  } catch {\n    // the failure is expected here\n  }\n}',
    },
    {
      name: 'a typescript directive',
      code: 'function total(legacy: Legacy) {\n  // @ts-expect-error the legacy payload is untyped\n  return legacy.total();\n}',
    },
    {
      name: 'a formatter directive',
      code: 'function matrix() {\n  // prettier-ignore\n  return [1, 0, 0, 1];\n}',
    },
    {
      name: 'a coverage directive',
      code: 'function guard(value: Value) {\n  /* istanbul ignore next */\n  return value.check();\n}',
    },
    {
      name: 'a project directive listed in allow',
      code: 'function total(order: Order) {\n  // @codegen keep in sync with the proto\n  return order.total();\n}',
      options: [{ allow: ['@codegen'] }],
    },
  ],
  invalid: [
    {
      name: 'a line comment inside a function body',
      code: 'function total(order: Order) {\n  // apply the seasonal discount\n  return order.total() * 0.9;\n}',
      errors: [{ messageId: 'commentInBody' }],
    },
    {
      name: 'a block comment inside a method body',
      code: 'class Order {\n  confirm() {\n    /* charge the customer */\n    return this.charge();\n  }\n}',
      errors: [{ messageId: 'commentInBody' }],
    },
    {
      name: 'a comment in a nested function is reported once, not twice',
      code: 'function outer() {\n  const inner = () => {\n    // recompute the running total\n    return 1;\n  };\n  return inner();\n}',
      errors: [{ messageId: 'commentInBody' }],
    },
    {
      name: 'a comment inside a callback',
      code: 'items.map((item) => {\n  // skip the cancelled ones\n  return item.active;\n});',
      errors: [{ messageId: 'commentInBody' }],
    },
    {
      name: 'every comment in a body is reported',
      code: 'function total(order: Order) {\n  // first, the items\n  const items = order.items();\n  // then the discount\n  return items.length * 0.9;\n}',
      errors: [
        { messageId: 'commentInBody' },
        { messageId: 'commentInBody' },
      ],
    },
  ],
});
