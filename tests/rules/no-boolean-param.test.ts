import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-boolean-param';

const ruleTester = new RuleTester();

ruleTester.run('no-boolean-param', rule, {
  valid: [
    { code: 'function send(message: string) {}' },
    { code: 'function configure(options: { verbose: boolean }) {}' },
  ],
  invalid: [
    {
      code: 'function render(animated: boolean) {}',
      errors: [{ messageId: 'booleanParam' }],
    },
    {
      code: 'const toggle = (active = false) => active;',
      errors: [{ messageId: 'booleanParam' }],
    },
  ],
});
