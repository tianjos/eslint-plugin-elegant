import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-else-after-throw';

const ruleTester = new RuleTester();

ruleTester.run('no-else-after-throw', rule, {
  valid: [
    {
      name: 'a guard with no else at all',
      code: 'function charge(amount: number) {\n  if (amount < 0) {\n    throw new NegativeAmount(amount);\n  }\n  process(amount);\n}',
    },
    {
      name: 'a then branch that does not throw',
      code: 'function charge(amount: number) {\n  if (amount < 0) {\n    log(amount);\n  } else {\n    process(amount);\n  }\n}',
    },
    {
      name: 'a throw buried in a nested if does not make the branch throw',
      code: 'function charge(amount: number) {\n  if (amount < 0) {\n    if (strict) {\n      throw new NegativeAmount(amount);\n    }\n  } else {\n    process(amount);\n  }\n}',
    },
    {
      name: 'a throw that is not the last statement',
      code: 'function charge(amount: number) {\n  if (amount < 0) {\n    throw new NegativeAmount(amount);\n    log(amount);\n  } else {\n    process(amount);\n  }\n}',
    },
    {
      name: 'a then branch that returns, which belongs to no-else-return',
      code: 'function charge(amount: number) {\n  if (amount < 0) {\n    return 0;\n  } else {\n    return process(amount);\n  }\n}',
    },
  ],
  invalid: [
    {
      name: 'a block then branch ending with throw',
      code: 'function charge(amount: number) {\n  if (amount < 0) {\n    throw new NegativeAmount(amount);\n  } else {\n    process(amount);\n  }\n}',
      errors: [{ messageId: 'elseAfterThrow', line: 4, column: 5 }],
    },
    {
      name: 'a bare throw as the then branch',
      code: 'function charge(amount: number) {\n  if (amount < 0) throw new NegativeAmount(amount);\n  else process(amount);\n}',
      errors: [{ messageId: 'elseAfterThrow' }],
    },
    {
      name: 'an else if after a throw',
      code: 'function charge(amount: number) {\n  if (amount < 0) {\n    throw new NegativeAmount(amount);\n  } else if (amount > limit) {\n    escalate(amount);\n  }\n}',
      errors: [{ messageId: 'elseAfterThrow' }],
    },
    {
      name: 'a busy then branch that still ends with throw',
      code: 'function charge(amount: number) {\n  if (amount < 0) {\n    log(amount);\n    track(amount);\n    throw new NegativeAmount(amount);\n  } else {\n    process(amount);\n  }\n}',
      errors: [{ messageId: 'elseAfterThrow' }],
    },
  ],
});
