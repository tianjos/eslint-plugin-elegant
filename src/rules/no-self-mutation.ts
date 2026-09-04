import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { closestAncestor } from '../utils/ancestors';
import { createRule } from '../utils/createRule';

type Options = [{ allowedMethods: string[] }];
type MessageIds = 'mutatesSelf';

/**
 * Nest calls these after the container has built the instance, so they finish
 * a construction the constructor could not: a timer needs a running event
 * loop, a pool needs a connection. Teardown is the same seam in reverse.
 */
const LIFECYCLE_HOOKS = [
  'onModuleInit',
  'onApplicationBootstrap',
  'onModuleDestroy',
  'beforeApplicationShutdown',
  'onApplicationShutdown',
];

/**
 * The field a write targets, when the target is a field of `this`. A computed
 * write (`this[key] = value`) names no field and is left to other rules.
 */
const fieldOf = (target: TSESTree.Node): string | undefined =>
  target.type === AST_NODE_TYPES.MemberExpression &&
  !target.computed &&
  target.object.type === AST_NODE_TYPES.ThisExpression &&
  target.property.type === AST_NODE_TYPES.Identifier
    ? target.property.name
    : undefined;

/**
 * Whether the write sits inside a class body at all. `this` outside one is
 * `module.exports`, `undefined`, or an object literal's own receiver — none of
 * which is an object with holders to surprise, so the rule has nothing to say
 * about them.
 */
const isInsideClass = (node: TSESTree.Node): boolean =>
  closestAncestor(
    node,
    (candidate) =>
      candidate.type === AST_NODE_TYPES.ClassBody ||
      candidate.type === AST_NODE_TYPES.ClassDeclaration ||
      candidate.type === AST_NODE_TYPES.ClassExpression,
  ) !== undefined;

/**
 * Whether the write happens while the object is still being built. Only the
 * constructor's own body counts: a callback the constructor schedules runs
 * after construction has returned, so it mutates a finished object.
 */
const isDuringConstruction = (node: TSESTree.Node): boolean => {
  const fn = closestAncestor(
    node,
    (candidate) =>
      candidate.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      candidate.type === AST_NODE_TYPES.FunctionDeclaration ||
      candidate.type === AST_NODE_TYPES.FunctionExpression,
  );

  return (
    fn?.parent?.type === AST_NODE_TYPES.MethodDefinition &&
    fn.parent.kind === 'constructor'
  );
};

/** The method a write sits in, if it sits in one directly. */
const enclosingMethod = (node: TSESTree.Node): string | undefined => {
  const method = closestAncestor(
    node,
    (candidate) => candidate.type === AST_NODE_TYPES.MethodDefinition,
  );

  return method?.type === AST_NODE_TYPES.MethodDefinition &&
    method.key.type === AST_NODE_TYPES.Identifier
    ? method.key.name
    : undefined;
};

export default createRule<Options, MessageIds>({
  name: 'no-self-mutation',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow writing to your own fields outside the constructor. An object that changes after construction is holding a lifecycle, not modelling a value.',
    },
    messages: {
      mutatesSelf:
        "'this.{{name}}' is written after construction. Build a new object instead of letting this one change underneath its holders.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedMethods: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ allowedMethods: LIFECYCLE_HOOKS }],
  create(context, [{ allowedMethods }]) {
    const check = (node: TSESTree.Node, target: TSESTree.Node): void => {
      const name = fieldOf(target);

      if (
        name === undefined ||
        !isInsideClass(node) ||
        isDuringConstruction(node)
      ) {
        return;
      }

      const method = enclosingMethod(node);

      if (method !== undefined && allowedMethods.includes(method)) {
        return;
      }

      context.report({ node, messageId: 'mutatesSelf', data: { name } });
    };

    return {
      AssignmentExpression(node): void {
        check(node, node.left);
      },
      UpdateExpression(node): void {
        check(node, node.argument);
      },
    };
  },
});
