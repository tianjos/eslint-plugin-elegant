import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type MessageIds = 'booleanParam';

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

const isBooleanAnnotation = (
  annotation: TSESTree.TypeNode | undefined,
): boolean => annotation?.type === AST_NODE_TYPES.TSBooleanKeyword;

const isBooleanLiteral = (node: TSESTree.Expression): boolean =>
  node.type === AST_NODE_TYPES.Literal && typeof node.value === 'boolean';

export default createRule<[], MessageIds>({
  name: 'no-boolean-param',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow boolean parameters, which are flag arguments signalling a function that does more than one thing.',
    },
    messages: {
      booleanParam:
        "Boolean parameter '{{name}}' is a flag argument. Prefer two intention-revealing functions or an options object.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const checkParam = (param: TSESTree.Parameter): void => {
      const target =
        param.type === AST_NODE_TYPES.TSParameterProperty
          ? param.parameter
          : param;

      let name: TSESTree.Identifier | undefined;
      let annotation: TSESTree.TypeNode | undefined;
      let defaultsToBoolean = false;

      if (target.type === AST_NODE_TYPES.Identifier) {
        name = target;
        annotation = target.typeAnnotation?.typeAnnotation;
      } else if (
        target.type === AST_NODE_TYPES.AssignmentPattern &&
        target.left.type === AST_NODE_TYPES.Identifier
      ) {
        name = target.left;
        annotation = target.left.typeAnnotation?.typeAnnotation;
        defaultsToBoolean = isBooleanLiteral(target.right);
      }

      if (!name) {
        return;
      }

      if (isBooleanAnnotation(annotation) || defaultsToBoolean) {
        context.report({
          node: name,
          messageId: 'booleanParam',
          data: { name: name.name },
        });
      }
    };

    const checkFunction = (node: FunctionNode): void => {
      node.params.forEach(checkParam);
    };

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});
