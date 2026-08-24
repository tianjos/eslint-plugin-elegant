import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/max-returns';

const ruleTester = new RuleTester();

ruleTester.run('max-returns', rule, {
  valid: [
    {
      name: 'a single exit',
      code: 'function charge(amount: number) {\n  return amount;\n}',
      options: [{ max: 3 }],
    },
    {
      name: 'guard clauses within the budget',
      code: 'function charge(amount: number) {\n  if (amount < 0) return 0;\n  if (amount > limit) return limit;\n  return amount;\n}',
      options: [{ max: 3 }],
    },
    {
      name: 'a function that never returns',
      code: 'function record(message: string) {\n  store.append(message);\n}',
      options: [{ max: 1 }],
    },
    {
      name: 'a nested function keeps its own budget',
      code: 'function outer() {\n  const inner = () => {\n    if (a) return 1;\n    return 2;\n  };\n  if (b) return inner();\n  return 0;\n}',
      options: [{ max: 2 }],
    },
    {
      name: 'an arrow with an expression body never exits twice',
      code: 'const total = (order: Order) => order.total();',
      options: [{ max: 1 }],
    },
  ],
  invalid: [
    {
      name: 'more exits than the budget',
      code: 'function resolve(state: State) {\n  if (a) return 1;\n  if (b) return 2;\n  if (c) return 3;\n  return 0;\n}',
      options: [{ max: 3 }],
      errors: [{ messageId: 'tooManyReturns' }],
    },
    {
      name: 'a bare return counts as an exit',
      code: 'function guard(value: Value) {\n  if (!value) return;\n  if (value.stale) return;\n  record(value);\n  return;\n}',
      options: [{ max: 2 }],
      errors: [{ messageId: 'tooManyReturns' }],
    },
    {
      name: 'a method is reported by its own name',
      code: 'class Order {\n  resolve(state: State) {\n    if (a) return 1;\n    if (b) return 2;\n    return 0;\n  }\n}',
      options: [{ max: 2 }],
      errors: [
        {
          messageId: 'tooManyReturns',
          data: { name: 'resolve', count: 3, max: 2 },
        },
      ],
    },
    {
      name: 'an arrow bound to a const is reported by that name',
      code: 'const total = (order: Order) => {\n  if (a) return 1;\n  if (b) return 2;\n  return 0;\n};',
      options: [{ max: 2 }],
      errors: [
        {
          messageId: 'tooManyReturns',
          data: { name: 'total', count: 3, max: 2 },
        },
      ],
    },
    {
      name: 'an arrow held in a class field is reported by that field',
      code: 'class Order {\n  resolve = (state: State) => {\n    if (a) return 1;\n    if (b) return 2;\n    return 0;\n  };\n}',
      options: [{ max: 2 }],
      errors: [
        {
          messageId: 'tooManyReturns',
          data: { name: 'resolve', count: 3, max: 2 },
        },
      ],
    },
    {
      name: 'an inline callback has no name to give',
      code: 'items.map((item) => {\n  if (a) return 1;\n  if (b) return 2;\n  return 0;\n});',
      options: [{ max: 2 }],
      errors: [
        {
          messageId: 'tooManyReturns',
          data: { name: '(anonymous)', count: 3, max: 2 },
        },
      ],
    },
  ],
});
