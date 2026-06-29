import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ methods: boolean }];
type MessageIds = 'accessor' | 'namedAccessor';

const NAMED_ACCESSOR = /^(get|set)[A-Z]/;

export default createRule<Options, MessageIds>({
  name: 'no-getters-setters',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow getters and setters, which expose objects as data bags instead of behavior-rich abstractions.',
    },
    messages: {
      accessor:
        'Avoid `get`/`set` accessors. Expose behavior through intention-revealing methods, not property access.',
      namedAccessor:
        "Method '{{name}}' reads like a getter/setter. Expose behavior, not state.",
    },
    schema: [
      {
        type: 'object',
        properties: { methods: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ methods: false }],
  create(context, [{ methods }]) {
    const reportKey = (key: TSESTree.Node): void => {
      context.report({ node: key, messageId: 'accessor' });
    };

    return {
      'MethodDefinition[kind="get"], MethodDefinition[kind="set"]'(
        node: TSESTree.MethodDefinition,
      ): void {
        reportKey(node.key);
      },
      'TSAbstractMethodDefinition[kind="get"], TSAbstractMethodDefinition[kind="set"]'(
        node: TSESTree.TSAbstractMethodDefinition,
      ): void {
        reportKey(node.key);
      },
      AccessorProperty(node: TSESTree.AccessorProperty): void {
        reportKey(node.key);
      },
      TSAbstractAccessorProperty(
        node: TSESTree.TSAbstractAccessorProperty,
      ): void {
        reportKey(node.key);
      },
      'MethodDefinition[kind="method"]'(
        node: TSESTree.MethodDefinition,
      ): void {
        if (
          methods &&
          node.key.type === AST_NODE_TYPES.Identifier &&
          NAMED_ACCESSOR.test(node.key.name)
        ) {
          context.report({
            node: node.key,
            messageId: 'namedAccessor',
            data: { name: node.key.name },
          });
        }
      },
    };
  },
});
