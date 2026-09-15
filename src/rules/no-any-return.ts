import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type MessageIds = 'anyReturn';

/** Every node that can carry a return type annotation. */
type Returning =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.TSCallSignatureDeclaration
  | TSESTree.TSConstructSignatureDeclaration
  | TSESTree.TSDeclareFunction
  | TSESTree.TSEmptyBodyFunctionExpression
  | TSESTree.TSFunctionType
  | TSESTree.TSMethodSignature;

const isNamed = (node: TSESTree.TypeNode, name: string): boolean =>
  node.type === AST_NODE_TYPES.TSTypeReference &&
  node.typeName.type === AST_NODE_TYPES.Identifier &&
  node.typeName.name === name;

/**
 * What a `Promise<T>` resolves to, or the node itself. `Promise<any>` is the
 * same promise to the caller as `any` — awaiting it is not a narrowing step.
 */
const awaited = (node: TSESTree.TypeNode): TSESTree.TypeNode =>
  isNamed(node, 'Promise') && node.type === AST_NODE_TYPES.TSTypeReference
    ? (node.typeArguments?.params[0] ?? node)
    : node;

export default createRule<[], MessageIds>({
  name: 'no-any-return',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow `any` as a return type. A function that returns `any` widens every value that passes through it, which is a type assertion the reader cannot see.',
    },
    messages: {
      anyReturn:
        'Returning `any` asserts every caller\'s type for them, invisibly. Return `unknown` and make the caller narrow, or a generic the caller supplies.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const check = (node: Returning): void => {
      const annotation = node.returnType?.typeAnnotation;

      if (
        annotation !== undefined &&
        awaited(annotation).type === AST_NODE_TYPES.TSAnyKeyword
      ) {
        context.report({ node: annotation, messageId: 'anyReturn' });
      }
    };

    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
      TSCallSignatureDeclaration: check,
      TSConstructSignatureDeclaration: check,
      TSDeclareFunction: check,
      TSEmptyBodyFunctionExpression: check,
      TSFunctionType: check,
      TSMethodSignature: check,
    };
  },
});
