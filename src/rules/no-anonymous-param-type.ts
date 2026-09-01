import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ minMembers: number }];
type MessageIds = 'anonymousParamType';

const DEFAULT_MIN_MEMBERS = 2;

type Signature =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.TSDeclareFunction
  | TSESTree.TSEmptyBodyFunctionExpression
  | TSESTree.TSFunctionType
  | TSESTree.TSMethodSignature;

/**
 * The binding a parameter introduces, looking through a default value and
 * through the modifiers of a constructor parameter property.
 */
type Binding =
  | TSESTree.ArrayPattern
  | TSESTree.Identifier
  | TSESTree.ObjectPattern
  | TSESTree.RestElement;

const bindingOf = (param: TSESTree.Parameter): Binding | undefined => {
  if (param.type === AST_NODE_TYPES.TSParameterProperty) {
    return bindingOf(param.parameter);
  }

  const target =
    param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;

  switch (target.type) {
    case AST_NODE_TYPES.ArrayPattern:
    case AST_NODE_TYPES.Identifier:
    case AST_NODE_TYPES.ObjectPattern:
    case AST_NODE_TYPES.RestElement:
      return target;
    default:
      return undefined;
  }
};

const nameOf = (binding: Binding): string =>
  binding.type === AST_NODE_TYPES.Identifier ? binding.name : '(destructured)';

/** The type nodes a shape can hide inside, one level down. */
const reachableFrom = (node: TSESTree.TypeNode): TSESTree.TypeNode[] => {
  switch (node.type) {
    case AST_NODE_TYPES.TSTypeReference:
      return node.typeArguments?.params ?? [];
    case AST_NODE_TYPES.TSUnionType:
    case AST_NODE_TYPES.TSIntersectionType:
      return node.types;
    case AST_NODE_TYPES.TSArrayType:
      return [node.elementType];
    default:
      return [];
  }
};

/**
 * The first anonymous shape of at least `minMembers` properties reachable from
 * a type annotation. Shapes hide behind generic arguments as readily as they
 * sit in the open — `Array<{ day; count }>` is as unnamed as `{ day; count }`.
 */
const shapeIn = (
  node: TSESTree.TypeNode,
  minMembers: number,
): TSESTree.TSTypeLiteral | undefined => {
  if (node.type === AST_NODE_TYPES.TSTypeLiteral) {
    return node.members.length >= minMembers ? node : undefined;
  }

  for (const inner of reachableFrom(node)) {
    const shape = shapeIn(inner, minMembers);

    if (shape !== undefined) {
      return shape;
    }
  }

  return undefined;
};

/**
 * Whether the signature is a function handed straight to a call. Such a
 * parameter annotates whatever the callee yields — often an untyped response
 * body — so an inline shape is the only way to type it at all.
 */
const isInlineCallback = (node: Signature): boolean =>
  (node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionExpression) &&
  node.parent.type === AST_NODE_TYPES.CallExpression;

export default createRule<Options, MessageIds>({
  name: 'no-anonymous-param-type',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow parameters typed as an anonymous shape. Name the shape so it can carry behaviour instead of being a bag.',
    },
    messages: {
      anonymousParamType:
        "Parameter '{{name}}' is typed as an anonymous shape of {{count}} properties. Name the shape so it can carry behaviour instead of being a bag.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          minMembers: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ minMembers: DEFAULT_MIN_MEMBERS }],
  create(context, [{ minMembers }]) {
    const check = (node: Signature): void => {
      if (isInlineCallback(node)) {
        return;
      }

      for (const param of node.params) {
        const binding = bindingOf(param);

        if (binding === undefined) {
          continue;
        }

        const annotation = binding.typeAnnotation?.typeAnnotation;

        if (annotation === undefined) {
          continue;
        }

        const shape = shapeIn(annotation, minMembers);

        if (shape === undefined) {
          continue;
        }

        context.report({
          node: param,
          messageId: 'anonymousParamType',
          data: {
            name: nameOf(binding),
            count: shape.members.length,
          },
        });
      }
    };

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
      TSDeclareFunction: check,
      TSEmptyBodyFunctionExpression: check,
      TSFunctionType: check,
      TSMethodSignature: check,
    };
  },
});
