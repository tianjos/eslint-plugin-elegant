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
    {
      name: 'a declared type guard is where a nominal check belongs, so it is legal by construction',
      code: 'export const isHttpException = (value: unknown): value is HttpException => value instanceof HttpException;',
    },
    {
      name: 'the guard may be a function declaration with a body',
      code: 'function isIsoDate(value: unknown): value is IsoDate { return value instanceof IsoDate; }',
    },
    {
      name: 'a guard may refine past the nominal check without losing the exemption',
      code: 'function isServerFault(value: unknown): value is HttpException { return value instanceof HttpException && value.getStatus() >= 500; }',
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
      name: 'a function that merely returns boolean is not a guard — it declares nothing',
      code: 'function isHttpException(value: unknown): boolean { return value instanceof HttpException; }',
      errors: [{ messageId: 'noInstanceof' }],
    },
    {
      name: 'a predicate on one function does not license instanceof in the next one',
      code: 'function isIsoDate(value: unknown): value is IsoDate { return value instanceof IsoDate; } function toDate(value: unknown) { return value instanceof IsoDate ? value.toDate() : value; }',
      errors: [{ messageId: 'noInstanceof' }],
    },
    {
      name: 'allowTypeGuards: false holds declared guards to the same standard',
      code: 'const isHttpException = (value: unknown): value is HttpException => value instanceof HttpException;',
      options: [{ allowTypeGuards: false }],
      errors: [{ messageId: 'noInstanceof' }],
    },
    {
      name: 'the message names the class, so the guard it asks for has a signature',
      code: 'if (shape instanceof Circle) { draw(); }',
      errors: [{ messageId: 'noInstanceof', data: { name: 'Circle' } }],
    },
    {
      code: 'const isError = value instanceof Error;',
      errors: [{ messageId: 'noInstanceof' }],
    },
  ],
});
