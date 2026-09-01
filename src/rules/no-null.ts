import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type MessageIds = 'noNull';

/**
 * A `null` sitting directly in a `return`. That shape is the domain of
 * `no-null-return`, which reports it with its own message; reporting it here
 * too would double up on one line of code.
 */
const isDirectReturn = (node: TSESTree.Literal): boolean =>
  node.parent.type === AST_NODE_TYPES.ReturnStatement &&
  node.parent.argument === node;

export default createRule<[], MessageIds>({
  name: 'no-null',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow the `null` literal as a value. Model absence with an explicit domain type, an Optional/Maybe, or by throwing. Null inside type annotations is allowed; direct `return null` is owned by `no-null-return`.',
    },
    messages: {
      noNull:
        'Avoid the null literal. Model absence explicitly instead of leaking null into the code.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Literal(node): void {
        if (node.value !== null || node.raw !== 'null') {
          return;
        }

        if (isDirectReturn(node)) {
          return;
        }

        context.report({ node, messageId: 'noNull' });
      },
    };
  },
});
