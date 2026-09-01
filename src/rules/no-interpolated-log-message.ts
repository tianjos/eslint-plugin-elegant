import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ objects: string[]; methods: string[] }];
type MessageIds = 'interpolatedMessage';

const OBJECTS = ['log', 'logger'];

const METHODS = [
  'debug',
  'error',
  'fatal',
  'info',
  'log',
  'trace',
  'verbose',
  'warn',
];

/**
 * The name a call hangs off, as written. `logger.info` yields `logger`, and
 * `this.logger.info` yields `logger` too, so a field and a local read alike.
 */
const receiver = (node: TSESTree.Expression): string | undefined => {
  if (node.type === AST_NODE_TYPES.Identifier) {
    return node.name;
  }

  if (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier
  ) {
    return node.property.name;
  }

  return undefined;
};

/**
 * The message is the first argument that is not an object literal, which lands
 * on the message under either convention: `info(msg, data)` as in Nest and
 * winston, and `info(data, msg)` as in pino.
 */
const message = (
  args: TSESTree.CallExpressionArgument[],
): TSESTree.CallExpressionArgument | undefined =>
  args.find((arg) => arg.type !== AST_NODE_TYPES.ObjectExpression);

const computed = (node: TSESTree.CallExpressionArgument): boolean =>
  (node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length > 0) ||
  (node.type === AST_NODE_TYPES.BinaryExpression && node.operator === '+');

export default createRule<Options, MessageIds>({
  name: 'no-interpolated-log-message',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require log messages to be constant, with the varying parts passed as structured data.',
    },
    messages: {
      interpolatedMessage:
        'A computed log message cannot be grouped or searched. Keep the message constant and pass the varying parts as structured data.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          objects: { type: 'array', items: { type: 'string' } },
          methods: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ objects: [], methods: [] }],
  create(context, [{ objects, methods }]) {
    const logging = new Set([...OBJECTS, ...objects]);
    const levels = new Set([...METHODS, ...methods]);

    return {
      CallExpression(node): void {
        if (
          node.callee.type !== AST_NODE_TYPES.MemberExpression ||
          node.callee.computed ||
          node.callee.property.type !== AST_NODE_TYPES.Identifier ||
          !levels.has(node.callee.property.name)
        ) {
          return;
        }

        const name = receiver(node.callee.object);

        if (name === undefined || !logging.has(name)) {
          return;
        }

        const argument = message(node.arguments);

        if (argument !== undefined && computed(argument)) {
          context.report({
            node: argument,
            messageId: 'interpolatedMessage',
          });
        }
      },
    };
  },
});
