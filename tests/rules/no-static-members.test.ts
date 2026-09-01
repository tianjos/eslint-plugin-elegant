import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-static-members';

const ruleTester = new RuleTester();

ruleTester.run('no-static-members', rule, {
  valid: [
    { code: 'class Service { run(): void {} }' },
    {
      code: 'class Config { static readonly MAX = 10; }',
      options: [{ allowReadonly: true }],
    },
    {
      name: 'a Nest module factory is mandated by the framework, not a design choice',
      code: '@Module({}) class SqsConsumerModule { static register(options: SqsConsumerOptions): DynamicModule { return { module: SqsConsumerModule }; } }',
    },
    {
      name: 'an async Nest module factory',
      code: '@Module({}) class SqsConsumerModule { static registerAsync(options: AsyncOptions): Promise<DynamicModule> { return build(options); } }',
    },
    {
      name: 'a polymorphic secondary constructor returns this',
      code: 'class Money { static zero(): this { return new Money(); } }',
    },
    {
      name: 'a secondary constructor may fail to build anything',
      code: 'class Cpf { static tryParse(raw: string): Cpf | undefined { return undefined; } }',
    },
    {
      name: 'an async secondary constructor returns a promise of itself',
      code: 'class Client { static async connect(url: string): Promise<Client> { return new Client(url); } }',
    },
    {
      name: 'a static returning its own type is a secondary constructor',
      code: 'class DueDate { static of(props: DueDateProps): DueDate { return new DueDate(props); } }',
    },
  ],
  invalid: [
    {
      code: 'class Factory { static create() { return new Factory(); } }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      code: 'class Config { static MAX = 10; }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      code: 'class Config { static readonly MAX = 10; }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      code: 'class Bootstrap { static {} }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      name: 'a static returning a foreign type is a procedure that moved into a class',
      code: 'class DocumentFormatter { static formatCNPJ(document: string): string { return document; } }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      name: 'a private static helper is a module function in disguise',
      code: 'class Competence { private static parseDate(date: Date): CompetenceLiteral { return build(date); } }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      name: 'a static accessor reaches state, whatever it returns',
      code: 'class Registry { static get instance(): Registry { return new Registry(); } }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      name: 'a failing constructor returning null is owned by no-null-return',
      code: 'class ReferencePeriod { static tryParse(period: number): ReferencePeriod | null { return null; } }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      name: 'a module class gets no blanket exemption for its other statics',
      code: '@Module({}) class AppModule { static bootstrapped(): boolean { return true; } }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      name: 'allowSelfReturning: false holds secondary constructors to the old standard',
      code: 'class DueDate { static of(props: DueDateProps): DueDate { return new DueDate(props); } }',
      options: [{ allowSelfReturning: false }],
      errors: [{ messageId: 'staticMember' }],
    },
    {
      name: 'allowModuleFactories: false holds Nest modules to the old standard',
      code: '@Module({}) class SqsConsumerModule { static register(options: Options): DynamicModule { return { module: SqsConsumerModule }; } }',
      options: [{ allowModuleFactories: false }],
      errors: [{ messageId: 'staticMember' }],
    },
    {
      name: 'DynamicModule is not an escape hatch outside a module class',
      code: 'class Helpers { static register(options: Options): DynamicModule { return build(options); } }',
      errors: [{ messageId: 'staticMember' }],
    },
  ],
});
