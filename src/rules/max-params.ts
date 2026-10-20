import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ max: number }];
type MessageIds = 'tooManyParams';

const DEFAULT_MAX = 3;

type FunctionNode =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

/**
 * A constructor's parameters are the class's collaborators and state, which
 * `max-class-dependencies` and `max-class-fields` already budget with messages
 * that name what to extract. Counting them here as well would report one
 * constructor three times over, with three different pieces of advice.
 */
const isConstructor = (node: FunctionNode): boolean =>
  node.parent.type === AST_NODE_TYPES.MethodDefinition &&
  node.parent.kind === 'constructor';

/** TypeScript's `this:` pseudo-parameter types the receiver; nobody passes it. */
const isThisParameter = (param: TSESTree.Parameter): boolean =>
  param.type === AST_NODE_TYPES.Identifier && param.name === 'this';

/** The name a method, property, or variable gives the function it holds. */
const holderName = (holder: TSESTree.Node): TSESTree.Identifier | undefined => {
  if (
    (holder.type === AST_NODE_TYPES.MethodDefinition ||
      holder.type === AST_NODE_TYPES.Property) &&
    holder.key.type === AST_NODE_TYPES.Identifier
  ) {
    return holder.key;
  }

  return holder.type === AST_NODE_TYPES.VariableDeclarator &&
    holder.id.type === AST_NODE_TYPES.Identifier
    ? holder.id
    : undefined;
};

/** The identifier a reader knows the function by, if it has one. */
const nameOf = (node: FunctionNode): TSESTree.Identifier | undefined =>
  node.id ?? holderName(node.parent);

export default createRule<Options, MessageIds>({
  name: 'max-params',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a maximum number of parameters per function. Constructors are left to the class-size rules, which already budget what they receive.',
    },
    messages: {
      tooManyParams:
        "'{{name}}' declares {{count}} parameters (max {{max}}). Name the ones that travel together as a value object.",
    },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ max: DEFAULT_MAX }],
  create(context, [{ max }]) {
    const measure = (node: FunctionNode): void => {
      if (isConstructor(node)) {
        return;
      }

      const count = node.params.filter(
        (param) => !isThisParameter(param),
      ).length;

      if (count <= max) {
        return;
      }

      const name = nameOf(node);

      context.report({
        node: name ?? node,
        messageId: 'tooManyParams',
        data: { name: name?.name ?? '(anonymous)', count, max },
      });
    };

    return {
      ArrowFunctionExpression: measure,
      FunctionDeclaration: measure,
      FunctionExpression: measure,
    };
  },
});
