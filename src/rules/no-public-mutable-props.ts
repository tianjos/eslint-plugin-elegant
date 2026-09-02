import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [
  { parameterProperties: 'public' | 'all'; ignoreDecorated: boolean },
];
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

/**
 * A property a decorator maps to a table or a payload. `@Column`, `@IsString`
 * and friends assign it from outside the class, so `readonly` would be a lie
 * and the field is framework shape rather than state the class chose to carry.
 *
 * Deliberately does not reach parameter properties: a decorator on a parameter
 * is injection (`@Inject(TOKEN)`), so the field is a genuine collaborator and
 * still has no business being reassignable. `max-class-fields` draws the same
 * line for the same reason.
 */
const isMapped = (node: TSESTree.PropertyDefinition): boolean =>
  node.decorators.length > 0;

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
          ignoreDecorated: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ parameterProperties: 'all', ignoreDecorated: true }],
  create(context, [{ parameterProperties, ignoreDecorated }]) {
    return {
      PropertyDefinition(node): void {
        if (node.readonly || isHidden(node.accessibility)) {
          return;
        }

        if (ignoreDecorated && isMapped(node)) {
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
