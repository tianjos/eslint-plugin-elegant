import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import { escapesIntoFunction, isReassigned } from '../utils/locals';
import { isObjectInHand } from '../utils/memberChain';

type Options = [{ allowEnv: boolean }];
type MessageIds = 'aliasesProperty';

const DEFAULT_ALLOW_ENV = true;

/** Whether the chain reads `process.env.SOMETHING`. */
const isEnvRead = (node: TSESTree.MemberExpression): boolean =>
  node.object.type === AST_NODE_TYPES.MemberExpression &&
  !node.object.computed &&
  node.object.object.type === AST_NODE_TYPES.Identifier &&
  node.object.object.name === 'process' &&
  node.object.property.type === AST_NODE_TYPES.Identifier &&
  node.object.property.name === 'env';

export default createRule<Options, MessageIds>({
  name: 'no-property-alias',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow locals that only rename a property of an object already in hand. Ask the object where the value is needed instead.',
    },
    messages: {
      aliasesProperty:
        "'{{name}}' only renames '{{path}}'. Ask the object where you need the value instead of copying its state into a local.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowEnv: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ allowEnv: DEFAULT_ALLOW_ENV }],
  create(context, [{ allowEnv }]) {
    return {
      VariableDeclarator(node): void {
        if (node.id.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (
          node.init === null ||
          node.init.type !== AST_NODE_TYPES.MemberExpression ||
          !isObjectInHand(node.init)
        ) {
          return;
        }

        if (allowEnv && isEnvRead(node.init)) {
          return;
        }

        const [variable] = context.sourceCode.getDeclaredVariables(node);

        if (
          variable === undefined ||
          isReassigned(variable) ||
          escapesIntoFunction(variable)
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'aliasesProperty',
          data: {
            name: node.id.name,
            path: context.sourceCode.getText(node.init),
          },
        });
      },
    };
  },
});
