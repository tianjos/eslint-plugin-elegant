import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-instanceof';

const ruleTester = new RuleTester();

ruleTester.run('no-instanceof', rule, {
  valid: [
    {
      name: 'value equality has to guard its own type before comparing',
      code: 'class Money { equals(other?: unknown): boolean { return other instanceof Money && this.amount === other.amount; } }',
    },
    {
      name: 'TypeScript types a caught value as unknown, and instanceof is the only tool',
      code: 'try { charge(); } catch (error) { if (error instanceof HttpException) { log(error.getStatus()); } }',
    },
    {
      name: 'the same narrowing one closure deeper',
      code: 'try { charge(); } catch (error) { retry(() => (error instanceof Error ? error.message : String(error))); }',
    },
    { code: 'if (shape.isRound()) { draw(); }' },
    { code: 'const kind = typeof value;' },
  ],
  invalid: [
    {
      name: 'guarding against a type that is not the enclosing class is discrimination',
      code: 'class Money { equals(other?: unknown): boolean { return other instanceof Currency; } }',
      errors: [{ messageId: 'noInstanceof' }],
    },
    {
      name: 'an error that arrives as a plain parameter is not a caught binding',
      code: 'function handle(error: HttpException): number { return error instanceof HttpException ? error.getStatus() : 500; }',
      errors: [{ messageId: 'noInstanceof' }],
    },
    {
      name: 'allowSelfGuard: false holds value equality to the same standard',
      code: 'class Money { equals(other?: unknown): boolean { return other instanceof Money; } }',
      options: [{ allowSelfGuard: false }],
      errors: [{ messageId: 'noInstanceof' }],
    },
    {
      name: 'allowCaughtValues: false holds catch narrowing to the same standard',
      code: 'try { charge(); } catch (error) { if (error instanceof Error) { log(error); } }',
      options: [{ allowCaughtValues: false }],
      errors: [{ messageId: 'noInstanceof' }],
    },
    {
      code: 'if (shape instanceof Circle) { draw(); }',
      errors: [{ messageId: 'noInstanceof' }],
    },
    {
      code: 'const isError = value instanceof Error;',
      errors: [{ messageId: 'noInstanceof' }],
    },
  ],
});
