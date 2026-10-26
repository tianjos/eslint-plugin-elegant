import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-primitive-obsession';

const ruleTester = new RuleTester();

ruleTester.run('no-primitive-obsession', rule, {
  valid: [
    {
      name: 'a parameter that already arrives as the value object',
      code: 'class Range { includes(competence: Competence) { return competence.isAfter(this.start); } }',
    },
    {
      name: 'a static factory is where a primitive is meant to be wrapped',
      code: 'class Range { static create(start: string) { return new Range(Competence.create(start)); } }',
    },
    {
      name: 'a primitive that is never wrapped is no evidence',
      code: 'function label(competence: string) { return `competência ${competence}`; }',
    },
    {
      name: 'a built-in namespace is not a value object',
      code: 'function parse(raw: string) { return JSON.parse(raw) + Number.parseInt(raw, 10) + Math.abs(Number(raw)); }',
    },
    {
      name: 'an upper-case constant is not a type',
      code: "function isUuid(value: string) { return UUID_PATTERN.test(value); }",
    },
    {
      name: 'a wrapped argument that is not the bare parameter',
      code: 'function close(raw: string) { return Competence.create(raw.trim()); }',
    },
    {
      name: 'an untyped parameter shows no primitive',
      code: 'const close = (competence) => Competence.create(competence);',
    },
    {
      name: 'state that already holds the value object is read as is',
      code: 'class Refund { amount() { return this.props.amount; } }',
    },
    {
      name: 'the value object building itself from its own state',
      code: 'class Money { private constructor(private readonly amount: number) {} negate() { return Money.create(this.amount); } }',
    },
    {
      name: 'a parameter passed among others is an argument, not the value being wrapped',
      code: 'function findHistory(originCode: string, competence: Competence) { return History.restore(originCode, competence); }',
    },
    {
      name: 'a value object derived from state that is already a value object',
      code: 'type MotiveProps = { occurredOn: IsoDate }; class RefundMotive { constructor(private readonly props: MotiveProps) {} competence() { return Competence.create(this.props.occurredOn); } }',
    },
    {
      name: 'state whose declared type lives in another file is not guessed at',
      code: "import type { DebitProps } from './debit-props'; class Debit { constructor(private readonly props: DebitProps) {} amount() { return Money.create(this.props.amount); } }",
    },
    {
      name: 'a platform API is not a value object',
      code: 'class Reader { private readonly timeoutMs: number = 5000; signal() { return AbortSignal.timeout(this.timeoutMs); } }',
    },
    {
      name: 'a value object kept after it is built',
      code: 'class Refund { static create(props: Props) { return new Refund({ competence: Competence.create(props.competence) }); } }',
    },
  ],
  invalid: [
    {
      name: 'a parameter wrapped into a value object outside a factory',
      code: 'class Range { includes(competence: string) { return Competence.create(competence).toOrdinal() > 0; } }',
      errors: [
        {
          messageId: 'wrappedParameter',
          data: { name: 'competence', primitive: 'string', type: 'Competence' },
          column: 24,
        },
      ],
    },
    {
      name: 'a parameter of a free function, optional and in a union with absence',
      code: 'const charge = (amount?: number | undefined) => Money.of(amount);',
      errors: [
        {
          messageId: 'wrappedParameter',
          data: { name: 'amount', primitive: 'number', type: 'Money' },
        },
      ],
    },
    {
      name: 'a parameter with a default',
      code: "function close(competence: string = '2026-01') { return Competence.create(competence); }",
      errors: [{ messageId: 'wrappedParameter' }],
    },
    {
      name: 'a parameter wrapped twice is reported once',
      code: 'function span(competence: string) { return [Competence.create(competence), Competence.create(competence)]; }',
      errors: [{ messageId: 'wrappedParameter' }],
    },
    {
      name: 'state stored as a primitive and wrapped on every read',
      code: 'type RefundProps = { amount: number }; class Refund { private constructor(private readonly props: RefundProps) {} amount(): Money { return Money.create(this.props.amount); } }',
      errors: [
        {
          messageId: 'wrappedState',
          data: { name: 'amount', primitive: 'number', type: 'Money' },
        },
      ],
    },
    {
      name: 'a field wrapped on read',
      code: 'class Debit { private readonly competence: string; competence() { return Competence.create(this.competence); } }',
      errors: [
        {
          messageId: 'wrappedState',
          data: { name: 'competence', primitive: 'string', type: 'Competence' },
        },
      ],
    },
    {
      name: 'state typed in an interface of the same file',
      code: 'interface CompetenceProps { date: string } class Competence { constructor(private readonly props: CompetenceProps) {} addMonths() { return IsoDate.create(this.props.date); } }',
      errors: [{ messageId: 'wrappedState' }],
    },
    {
      name: 'state typed with an inline shape',
      code: 'class Refund { constructor(private readonly props: { amount: number }) {} amount() { return Money.create(this.props.amount); } }',
      errors: [{ messageId: 'wrappedState' }],
    },
    {
      name: 'a value object built and unwrapped at once, even in a factory',
      code: 'class Refund { static create(props: Props) { return new Refund({ competence: Competence.create(props.competence).toString() }); } }',
      errors: [
        {
          messageId: 'discardedValueObject',
          data: { type: 'Competence', factory: 'create', unwrap: 'toString' },
        },
      ],
    },
    {
      name: 'a value object unwrapped to a number',
      code: 'const cents = (raw: unknown) => Money.from(raw).toNumber();',
      errors: [
        {
          messageId: 'discardedValueObject',
          data: { type: 'Money', factory: 'from', unwrap: 'toNumber' },
        },
      ],
    },
  ],
});
