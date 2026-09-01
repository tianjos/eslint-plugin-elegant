import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type MessageIds = 'genericError';

/**
 * The error types the language ships. Each says only "something went wrong",
 * so every caller that wants to distinguish failures ends up matching on the
 * message — a string the thrower is free to reword.
 */
const BUILT_IN_ERRORS = new Set([
  'Error',
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
  'AggregateError',
]);

export default createRule<[], MessageIds>({
  name: 'no-generic-error',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow throwing the built-in error types. A named exception carries the failure in its type, where a caller can catch exactly it.',
    },
    messages: {
      genericError:
        "Throwing '{{name}}' leaves the failure describable only by its message. Throw a named exception the caller can catch by type.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node): void {
        if (
          node.argument.type !== AST_NODE_TYPES.NewExpression ||
          node.argument.callee.type !== AST_NODE_TYPES.Identifier ||
          !BUILT_IN_ERRORS.has(node.argument.callee.name)
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'genericError',
          data: { name: node.argument.callee.name },
        });
      },
    };
  },
});
