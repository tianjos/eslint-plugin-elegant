import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type MessageIds = 'noNullReturn';

export default createRule<[], MessageIds>({
  name: 'no-null-return',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow returning null. Throw when the value must exist, return an object that answers for the absent case, or — when the return type is already a collection — an empty one.',
    },
    messages: {
      noNullReturn:
        'Returning null leaks absence into callers. Throw if the value must exist, or return an object that answers for the absent case. An empty collection models absence only where the return type was already a collection — a zero-or-one array is a null in a box.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ReturnStatement(node): void {
        if (
          node.argument?.type === AST_NODE_TYPES.Literal &&
          node.argument.value === null &&
          node.argument.raw === 'null'
        ) {
          context.report({ node, messageId: 'noNullReturn' });
        }
      },
    };
  },
});
