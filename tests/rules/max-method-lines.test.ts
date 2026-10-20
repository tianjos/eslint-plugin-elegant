import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/max-method-lines';

const ruleTester = new RuleTester();

const body = (lines: number): string =>
  Array.from({ length: lines }, (_, i) => `  step${i}();`).join('\n');

ruleTester.run('max-method-lines', rule, {
  valid: [
    {
      name: 'an inline callback is measured through the function hosting it',
      code: `class Report { build(): void { rows.map((row) => {\n${body(6)}\n}); } }`,
      options: [{ max: 20 }],
    },
    {
      name: 'decorators annotate a method; they are not part of its body',
      code: `class ReportController {\n  @Get(':id')\n  @UseGuards(AuthGuard)\n  build(): void {\n${body(3)}\n  }\n}`,
      options: [{ max: 5 }],
    },
    {
      name: 'a method within the budget',
      code: `class Report { build(): void {\n${body(3)}\n} }`,
      options: [{ max: 10 }],
    },
  ],
  invalid: [
    {
      name: 'a standalone function is a named unit like any other',
      code: `function seed(): void {\n${body(6)}\n}`,
      options: [{ max: 5 }],
      errors: [{ messageId: 'tooManyLines' }],
    },
    {
      name: 'an arrow bound to a name is a named unit too',
      code: `const seed = (): void => {\n${body(6)}\n};`,
      options: [{ max: 5 }],
      errors: [{ messageId: 'tooManyLines' }],
    },
    {
      name: 'a method longer than the budget',
      code: `class Report { build(): void {\n${body(6)}\n} }`,
      options: [{ max: 5 }],
      errors: [
        { messageId: 'tooManyLines', data: { name: 'build', count: 8, max: 5 } },
      ],
    },
    {
      name: 'an arrow held in a class field is a method in all but syntax',
      code: `class Report { build = (): void => {\n${body(6)}\n}; }`,
      options: [{ max: 5 }],
      errors: [
        { messageId: 'tooManyLines', data: { name: 'build', count: 8, max: 5 } },
      ],
    },
    {
      name: 'a method in an object literal is a named unit',
      code: `const handlers = { build(): void {\n${body(6)}\n} };`,
      options: [{ max: 5 }],
      errors: [
        { messageId: 'tooManyLines', data: { name: 'build', count: 8, max: 5 } },
      ],
    },
    {
      name: 'an arrow held in an object property is a named unit',
      code: `const handlers = { build: (): void => {\n${body(6)}\n} };`,
      options: [{ max: 5 }],
      errors: [
        { messageId: 'tooManyLines', data: { name: 'build', count: 8, max: 5 } },
      ],
    },
  ],
});
