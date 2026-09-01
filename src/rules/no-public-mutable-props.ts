import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

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
 * A constructor parameter property the outside world can write to. Only
 * constructor parameter properties carry an accessibility modifier, so reading
 * one is enough to know the field is public.
 */
const isPublicMutable = (node: TSESTree.TSParameterProperty): boolean =>
  node.accessibility === 'public' && !node.readonly;

export default createRule<[], MessageIds>({
  name: 'no-public-mutable-props',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow public mutable class properties. Public state should be readonly to protect invariants and preserve encapsulation.',
    },
    messages: {
      mutableProp:
        "Public property '{{name}}' is mutable. Make it readonly or expose it through a method that protects the invariant.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
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
        if (!isPublicMutable(node)) {
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
