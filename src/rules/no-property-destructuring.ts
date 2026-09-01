import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import { escapesIntoFunction, isReassigned } from '../utils/locals';
import { isObjectInHand } from '../utils/memberChain';

type MessageIds = 'destructuresObject';

/**
 * Whether the pattern collects the properties it does not name into a rest
 * object. That is construction by omission, not a copy of state anyone can
 * replace with a member access.
 */
const hasRestElement = (node: TSESTree.ObjectPattern): boolean =>
  node.properties.some(
    (property) => property.type === AST_NODE_TYPES.RestElement,
  );

/**
 * Whether any property carries a default. `options.max ?? 3` repeats the
 * fallback at every use site, so the pattern is holding a decision rather than
 * just a copy.
 */
const hasDefault = (node: TSESTree.ObjectPattern): boolean =>
  node.properties.some(
    (property) =>
      property.type === AST_NODE_TYPES.Property &&
      property.value.type === AST_NODE_TYPES.AssignmentPattern,
  );

export default createRule<[], MessageIds>({
  name: 'no-property-destructuring',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow destructuring an object already in hand. Ask the object where each value is needed instead.',
    },
    messages: {
      destructuresObject:
        "Destructuring '{{name}}' copies its state into {{count}} locals. Ask the object where you need each value instead.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ObjectPattern(node): void {
        const declarator = node.parent;

        if (
          declarator.type !== AST_NODE_TYPES.VariableDeclarator ||
          declarator.init === null ||
          !isObjectInHand(declarator.init)
        ) {
          return;
        }

        if (hasRestElement(node) || hasDefault(node)) {
          return;
        }

        const variables = context.sourceCode.getDeclaredVariables(declarator);

        if (
          variables.some(
            (variable) =>
              isReassigned(variable) || escapesIntoFunction(variable),
          )
        ) {
          return;
        }

        context.report({
          node: declarator,
          messageId: 'destructuresObject',
          data: {
            name: context.sourceCode.getText(declarator.init),
            count: node.properties.length,
          },
        });
      },
    };
  },
});
