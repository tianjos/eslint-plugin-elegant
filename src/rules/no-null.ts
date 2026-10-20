import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import { isInsideTypeGuard } from '../utils/typeGuards';

type Options = [{ allowTypeGuards: boolean }];
type MessageIds = 'noNull';

const EQUALITY = new Set(['===', '!==', '==', '!=']);

/**
 * A `null` sitting directly in a `return`. That shape is the domain of
 * `no-null-return`, which reports it with its own message; reporting it here
 * too would double up on one line of code.
 */
const isDirectReturn = (node: TSESTree.Literal): boolean =>
  node.parent.type === AST_NODE_TYPES.ReturnStatement &&
  node.parent.argument === node;

/** `value === null`: the literal is being asked about, not handed on. */
const isCompared = (node: TSESTree.Literal): boolean =>
  node.parent.type === AST_NODE_TYPES.BinaryExpression &&
  EQUALITY.has(node.parent.operator);

export default createRule<Options, MessageIds>({
  name: 'no-null',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow the `null` literal as a value. Model absence with an explicit domain type, an Optional/Maybe, or by throwing. Null inside type annotations is allowed; direct `return null` is owned by `no-null-return`; a comparison inside a declared `value is T` guard narrows null away and is allowed.',
    },
    messages: {
      noNull:
        'Avoid the null literal. Model absence explicitly instead of leaking null into the code. If a nullable value arrives from a boundary, narrow it in a function that declares `value is T` and call that.',
    },
    schema: [
      {
        type: 'object',
        properties: { allowTypeGuards: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ allowTypeGuards: true }],
  create(context, [{ allowTypeGuards }]) {
    return {
      Literal(node): void {
        if (node.value !== null || node.raw !== 'null') {
          return;
        }

        if (isDirectReturn(node)) {
          return;
        }

        if (allowTypeGuards && isCompared(node) && isInsideTypeGuard(node)) {
          return;
        }

        context.report({ node, messageId: 'noNull' });
      },
    };
  },
});
