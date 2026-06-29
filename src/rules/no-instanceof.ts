import { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type MessageIds = 'noInstanceof';

export default createRule<[], MessageIds>({
  name: 'no-instanceof',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow the `instanceof` operator. Type discrimination breaks polymorphism; let the object decide via a method instead.',
    },
    messages: {
      noInstanceof:
        'Avoid `instanceof`. Replace type discrimination with a polymorphic method on the object.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      'BinaryExpression[operator="instanceof"]'(
        node: TSESTree.BinaryExpression,
      ): void {
        context.report({ node, messageId: 'noInstanceof' });
      },
    };
  },
});
