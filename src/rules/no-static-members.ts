import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Allowances = {
  allowReadonly: boolean;
  allowSelfReturning: boolean;
  allowModuleFactories: boolean;
};

type Options = [Allowances];
type MessageIds = 'staticMember';

/**
 * Whether the annotation denotes the class itself. TypeScript has no secondary
 * constructors, so `static of(...): DueDate` inside `DueDate` is the only way
 * to write one — and calling it is indistinguishable from calling `new`, which
 * is what separates a named constructor from a procedure that moved into a
 * class.
 *
 * `this`, `Promise<Self>` and `Self | undefined` all count: a polymorphic, an
 * asynchronous and a failing constructor are still constructors. `Self | null`
 * deliberately does not, because `no-null-return` already owns that shape.
 */
const isNamed = (node: TSESTree.TypeNode, name: string): boolean =>
  node.type === AST_NODE_TYPES.TSTypeReference &&
  node.typeName.type === AST_NODE_TYPES.Identifier &&
  node.typeName.name === name;

/** What a `Promise<T>` resolves to, or the node itself. */
const awaited = (node: TSESTree.TypeNode): TSESTree.TypeNode =>
  isNamed(node, 'Promise') && node.type === AST_NODE_TYPES.TSTypeReference
    ? (node.typeArguments?.params[0] ?? node)
    : node;

const isSelf = (node: TSESTree.TypeNode, className: string): boolean => {
  const resolved = awaited(node);

  if (resolved.type === AST_NODE_TYPES.TSThisType) {
    return true;
  }

  if (resolved.type === AST_NODE_TYPES.TSUnionType) {
    return (
      resolved.types.some((member) => isSelf(member, className)) &&
      resolved.types.every(
        (member) =>
          isSelf(member, className) ||
          member.type === AST_NODE_TYPES.TSUndefinedKeyword,
      )
    );
  }

  return isNamed(resolved, className);
};

/**
 * A Nest module factory: `DynamicModule` returned from a class Nest recognises
 * as a module. Both halves are required, so `DynamicModule` cannot become a
 * general escape from the rule by being named in a return type.
 */
const isModuleFactory = (method: TSESTree.MethodDefinition): boolean => {
  const annotation = method.value.returnType?.typeAnnotation;

  if (annotation === undefined || !isNamed(awaited(annotation), 'DynamicModule')) {
    return false;
  }

  return method.parent.parent.decorators.some((decorator) =>
    decorator.expression.type === AST_NODE_TYPES.CallExpression
      ? isModuleIdentifier(decorator.expression.callee)
      : isModuleIdentifier(decorator.expression),
  );
};

const isModuleIdentifier = (node: TSESTree.Node): boolean =>
  node.type === AST_NODE_TYPES.Identifier && node.name === 'Module';

/**
 * A secondary constructor's return, read from the annotation alone. The rule
 * carries no type information, so an unannotated static stays reported: on a
 * factory the annotation is one word, and it is what makes the intent legible.
 */
const returnsSelf = (
  method: TSESTree.MethodDefinition,
  className: string | undefined,
): boolean => {
  const annotation = method.value.returnType?.typeAnnotation;

  return (
    className !== undefined &&
    annotation !== undefined &&
    isSelf(annotation, className)
  );
};

/**
 * A static the rule lets through: a secondary constructor, or a module factory
 * the framework demands. An accessor is neither, whatever it returns — reading
 * one is reaching for static state.
 */
const isPermitted = (
  node: TSESTree.MethodDefinition,
  allow: Allowances,
): boolean =>
  node.kind === 'method' &&
  ((allow.allowSelfReturning &&
    returnsSelf(node, node.parent.parent.id?.name)) ||
    (allow.allowModuleFactories && isModuleFactory(node)));

export default createRule<Options, MessageIds>({
  name: 'no-static-members',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow static members. Static state and behavior cannot be injected, substituted, or mocked; prefer instances and a module-level value when you need a constant.',
    },
    messages: {
      staticMember:
        'Avoid static members. Use an injectable instance, or a module-level constant for shared values.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowReadonly: { type: 'boolean' },
          allowSelfReturning: { type: 'boolean' },
          allowModuleFactories: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      allowReadonly: false,
      allowSelfReturning: true,
      allowModuleFactories: true,
    },
  ],
  create(context, [allow]) {
    const reportKey = (key: TSESTree.Node): void => {
      context.report({ node: key, messageId: 'staticMember' });
    };

    return {
      MethodDefinition(node): void {
        if (node.static && !isPermitted(node, allow)) {
          reportKey(node.key);
        }
      },
      PropertyDefinition(node): void {
        if (node.static && !(allow.allowReadonly && node.readonly)) {
          reportKey(node.key);
        }
      },
      AccessorProperty(node): void {
        if (node.static) {
          reportKey(node.key);
        }
      },
      StaticBlock(node): void {
        context.report({ node, messageId: 'staticMember' });
      },
    };
  },
});
