import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ allow: string[] }];
type MessageIds = 'commentInBody';

type FunctionLike =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

/**
 * Comments the toolchain reads rather than humans. Suppressing another rule or
 * a type error inside a body is routine and says nothing about the code's shape,
 * so these never count — the counterpart of qulice's `@checkstyle` exemption.
 */
const DIRECTIVES = [
  '@ts-',
  '@vite-ignore',
  'c8 ignore',
  'eslint',
  'istanbul ignore',
  'prettier-ignore',
  'v8 ignore',
  'webpackChunkName',
];

const directs = (comment: TSESTree.Comment, allow: string[]): boolean => {
  const text = comment.value.trim();

  return [...DIRECTIVES, ...allow].some((prefix) => text.startsWith(prefix));
};

const encloses = (
  block: TSESTree.BlockStatement,
  comment: TSESTree.Comment,
): boolean =>
  block.range[0] < comment.range[0] && comment.range[1] < block.range[1];

const span = (block: TSESTree.BlockStatement): number =>
  block.range[1] - block.range[0];

/**
 * The tightest block wrapping the comment, which is what decides whether it is
 * merely annotating an empty one. An empty `catch` inside a busy function still
 * earns its explanation, so the lookup cannot stop at the function body.
 */
const innermost = (
  blocks: TSESTree.BlockStatement[],
  comment: TSESTree.Comment,
): TSESTree.BlockStatement | undefined =>
  blocks
    .filter((block) => encloses(block, comment))
    .reduce<TSESTree.BlockStatement | undefined>(
      (tightest, block) =>
        tightest === undefined || span(block) < span(tightest)
          ? block
          : tightest,
      undefined,
    );

export default createRule<Options, MessageIds>({
  name: 'no-comments-in-function-body',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow comments inside function bodies, where they stand in for a name the code should carry itself.',
    },
    messages: {
      commentInBody:
        'A comment inside a function body signals code that needs a better name. Move it to a docblock above the function, or extract what it explains into a named function.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ allow: [] }],
  create(context, [{ allow }]) {
    const sourceCode = context.sourceCode;
    const bodies: TSESTree.BlockStatement[] = [];
    const blocks: TSESTree.BlockStatement[] = [];

    const collect = (node: FunctionLike): void => {
      if (node.body.type === AST_NODE_TYPES.BlockStatement) {
        bodies.push(node.body);
      }
    };

    return {
      BlockStatement(node): void {
        blocks.push(node);
      },

      ArrowFunctionExpression: collect,
      FunctionDeclaration: collect,
      FunctionExpression: collect,

      'Program:exit'(): void {
        for (const comment of sourceCode.getAllComments()) {
          const inside = bodies.some((body) => encloses(body, comment));
          const block = innermost(blocks, comment);
          const explains = block === undefined || block.body.length === 0;

          if (inside && !explains && !directs(comment, allow)) {
            context.report({ loc: comment.loc, messageId: 'commentInBody' });
          }
        }
      },
    };
  },
});
