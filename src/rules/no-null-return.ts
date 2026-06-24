import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type MessageIds = 'noNullReturn';

export default createRule<[], MessageIds>({
  name: 'no-null-return',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow returning null. Model absence with an explicit type, an Optional/Maybe, or by throwing.',
    },
    messages: {
      noNullReturn:
        'Returning null leaks absence into callers. Return an explicit empty value, a domain type, or throw.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ReturnStatement(node): void {
        const { argument } = node;
        if (
          argument?.type === AST_NODE_TYPES.Literal &&
          argument.value === null &&
          argument.raw === 'null'
        ) {
          context.report({ node, messageId: 'noNullReturn' });
        }
      },
    };
  },
});
