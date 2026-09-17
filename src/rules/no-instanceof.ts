import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { closestAncestor } from '../utils/ancestors';
import { createRule } from '../utils/createRule';
import { isCaughtBinding } from '../utils/locals';

type Options = [
  {
    allowSelfGuard: boolean;
    allowCaughtValues: boolean;
    allowTypeGuards: boolean;
  },
];
type MessageIds = 'noInstanceof';

const FUNCTIONS = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

/**
 * Whether the check sits inside a function that declares a type predicate.
 * A `value is X` signature is the one place a nominal check states what it is
 * doing: the answer leaves as a narrowed type rather than as a bare boolean,
 * every call site reads the class name once, and the project ends up with one
 * greppable guard per class instead of an `instanceof` in the middle of a
 * method. Only the innermost function counts, so a guard cannot lend its
 * exemption to code that merely follows it.
 */
const isInsideTypeGuard = (node: TSESTree.Node): boolean => {
  const fn = closestAncestor(node, (candidate) =>
    FUNCTIONS.has(candidate.type),
  );

  return (
    fn !== undefined &&
    'returnType' in fn &&
    fn.returnType?.typeAnnotation.type === AST_NODE_TYPES.TSTypePredicate
  );
};

/** The name of the class a node sits inside, if it sits inside a named one. */
const enclosingClass = (node: TSESTree.Node): string | undefined => {
  const found = closestAncestor(
    node,
    (candidate) =>
      candidate.type === AST_NODE_TYPES.ClassDeclaration ||
      candidate.type === AST_NODE_TYPES.ClassExpression,
  );

  return found?.type === AST_NODE_TYPES.ClassDeclaration ||
    found?.type === AST_NODE_TYPES.ClassExpression
    ? found.id?.name
    : undefined;
};

/**
 * `other instanceof Money` inside `class Money`. Value equality has to guard
 * its own type before comparing fields, and a structurally typed language
 * offers no polymorphic way to do it: the method is already on the object, so
 * the rule's own advice has nowhere left to go.
 */
const isSelfGuard = (node: TSESTree.BinaryExpression): boolean =>
  node.right.type === AST_NODE_TYPES.Identifier &&
  node.right.name === enclosingClass(node);

export default createRule<Options, MessageIds>({
  name: 'no-instanceof',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow the `instanceof` operator. Type discrimination breaks polymorphism; let the object decide via a method instead. A check that has no polymorphic form belongs in a declared `value is X` type guard.',
    },
    messages: {
      noInstanceof:
        'Avoid `instanceof`. Replace type discrimination with a polymorphic method on the object. If the class is nominal and offers no discriminant, move the check into a function that declares `value is {{name}}` and call that.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowSelfGuard: { type: 'boolean' },
          allowCaughtValues: { type: 'boolean' },
          allowTypeGuards: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    { allowSelfGuard: true, allowCaughtValues: true, allowTypeGuards: true },
  ],
  create(context, [{ allowSelfGuard, allowCaughtValues, allowTypeGuards }]) {
    return {
      'BinaryExpression[operator="instanceof"]'(
        node: TSESTree.BinaryExpression,
      ): void {
        if (allowSelfGuard && isSelfGuard(node)) {
          return;
        }

        if (allowTypeGuards && isInsideTypeGuard(node)) {
          return;
        }

        if (
          allowCaughtValues &&
          node.left.type === AST_NODE_TYPES.Identifier &&
          isCaughtBinding(
            context.sourceCode.getScope(node),
            node.left.name,
          )
        ) {
          return;
        }

        context.report({
          node,
          messageId: 'noInstanceof',
          data: { name: context.sourceCode.getText(node.right) },
        });
      },
    };
  },
});
