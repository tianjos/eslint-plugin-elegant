import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/max-params';

const ruleTester = new RuleTester();

ruleTester.run('max-params', rule, {
  valid: [
    {
      name: 'a function within the limit',
      code: 'function charge(amount: number, currency: string, at: Date) {}',
    },
    {
      name: 'a constructor is budgeted by the class rules, not here',
      code: 'class Handler { constructor(a: A, b: B, c: C, d: D, e: E) {} }',
    },
    {
      name: 'a constructor of parameter properties is budgeted by the class rules too',
      code: 'class Handler { constructor(private readonly a: A, private readonly b: B, private readonly c: C, private readonly d: D) {} }',
    },
    {
      name: 'a `this` parameter is not an argument anyone passes',
      code: 'function onClick(this: HTMLElement, a: A, b: B, c: C) {}',
    },
    {
      name: 'the limit is configurable',
      code: 'function sum(a: number, b: number, c: number, d: number) {}',
      options: [{ max: 4 }],
    },
  ],
  invalid: [
    {
      name: 'a function declaration over the limit',
      code: 'function settle(a: A, b: B, c: C, d: D) {}',
      errors: [
        {
          messageId: 'tooManyParams',
          data: { name: 'settle', count: 4, max: 3 },
        },
      ],
    },
    {
      name: 'a method over the limit',
      code: 'class Logger { protected printMessages(a: A, b: B, c: C, d: D) {} }',
      errors: [
        {
          messageId: 'tooManyParams',
          data: { name: 'printMessages', count: 4, max: 3 },
        },
      ],
    },
    {
      name: 'an arrow function bound to a name over the limit',
      code: 'const fold = (a: A, b: B, c: C, d: D) => a;',
      errors: [
        {
          messageId: 'tooManyParams',
          data: { name: 'fold', count: 4, max: 3 },
        },
      ],
    },
    {
      name: 'an anonymous callback over the limit',
      code: 'run((a: A, b: B, c: C, d: D) => a);',
      errors: [
        {
          messageId: 'tooManyParams',
          data: { name: '(anonymous)', count: 4, max: 3 },
        },
      ],
    },
    {
      name: 'a function nested in a constructor is still budgeted',
      code: 'class Handler { constructor() { register(function (a: A, b: B, c: C, d: D) {}); } }',
      errors: [{ messageId: 'tooManyParams' }],
    },
  ],
});
