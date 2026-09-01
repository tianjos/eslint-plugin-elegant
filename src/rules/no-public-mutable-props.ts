import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ parameterProperties: 'public' | 'all' }];
type MessageIds = 'mutableProp';

const isHidden = (
  accessibility: TSESTree.Accessibility | undefined,
): boolean => accessibility === 'private' || accessibility === 'protected';

const keyName = (
  key: TSESTree.PropertyDefinition['key'] | TSESTree.Identifier,
): string => {
  if (key.type === AST_NODE_TYPES.Identifier) {
    return key.name;
  }
  if (key.type === AST_NODE_TYPES.Literal) {
    return String(key.value);
  }
  return 'property';
};

/**
 * A constructor parameter property that can be written to. At `'all'` the
 * visibility stops mattering: a `private` collaborator nobody marked readonly
 * can still be swapped from inside, which is the same defect one wall further
 * in. A parameter property with no modifier at all declares no field.
 */
const isMutable = (
  node: TSESTree.TSParameterProperty,
  scope: Options[0]['parameterProperties'],
): boolean =>
  !node.readonly &&
  node.accessibility !== undefined &&
  (scope === 'all' || node.accessibility === 'public');

export default createRule<Options, MessageIds>({
  name: 'no-public-mutable-props',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow public mutable class properties. Public state should be readonly to protect invariants and preserve encapsulation.',
    },
    messages: {
      mutableProp:
        "Property '{{name}}' is mutable. Make it readonly or expose it through a method that protects the invariant.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          parameterProperties: { type: 'string', enum: ['public', 'all'] },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ parameterProperties: 'all' }],
  create(context, [{ parameterProperties }]) {
    return {
      PropertyDefinition(node): void {
        if (node.readonly || isHidden(node.accessibility)) {
          return;
        }
        context.report({
          node: node.key,
          messageId: 'mutableProp',
          data: { name: keyName(node.key) },
        });
      },
      TSParameterProperty(node): void {
        if (!isMutable(node, parameterProperties)) {
          return;
        }
        const target =
          node.parameter.type === AST_NODE_TYPES.AssignmentPattern
            ? node.parameter.left
            : node.parameter;
        if (target.type !== AST_NODE_TYPES.Identifier) {
          return;
        }
        context.report({
          node: target,
          messageId: 'mutableProp',
          data: { name: target.name },
        });
      },
    };
  },
});
