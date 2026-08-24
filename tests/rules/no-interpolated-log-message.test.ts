import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-interpolated-log-message';

const ruleTester = new RuleTester();

ruleTester.run('no-interpolated-log-message', rule, {
  valid: [
    {
      name: 'a constant message carrying structured data',
      code: "logger.info('order confirmed', { orderId });",
    },
    {
      name: 'a template with nothing interpolated',
      code: 'logger.info(`order confirmed`);',
    },
    {
      name: 'a message held in a variable',
      code: 'logger.info(message, { orderId });',
    },
    {
      name: 'a call on something that is not a logger',
      code: 'this.audit.error(`order ${id} failed`);',
    },
    {
      name: 'a pino call whose message is constant',
      code: "logger.info({ orderId }, 'order confirmed');",
    },
    {
      name: 'a method that is not a log level',
      code: 'logger.child(`scope ${id}`);',
    },
    {
      name: 'interpolation in a later argument is context, not the message',
      code: "logger.info('order confirmed', `trace ${id}`);",
    },
    {
      name: 'known limitation: an identifier first argument is taken for the message',
      code: 'logger.error(err, `order ${id} failed`);',
    },
  ],
  invalid: [
    {
      name: 'an interpolated message',
      code: 'logger.info(`order ${id} confirmed`);',
      errors: [{ messageId: 'interpolatedMessage' }],
    },
    {
      name: 'a concatenated message',
      code: "logger.info('order ' + id + ' confirmed');",
      errors: [{ messageId: 'interpolatedMessage' }],
    },
    {
      name: 'a logger reached through this',
      code: 'this.logger.warn(`order ${id} is late`);',
      errors: [{ messageId: 'interpolatedMessage' }],
    },
    {
      name: 'a pino call with an interpolated message',
      code: 'logger.info({ orderId }, `order ${id} confirmed`);',
      errors: [{ messageId: 'interpolatedMessage' }],
    },
    {
      name: 'a logger named through options',
      code: 'this.audit.error(`order ${id} failed`);',
      options: [{ objects: ['audit'] }],
      errors: [{ messageId: 'interpolatedMessage' }],
    },
  ],
});
