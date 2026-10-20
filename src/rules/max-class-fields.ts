import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { annotatedReference, isCollaborator } from '../utils/collaborators';
import { createRule } from '../utils/createRule';

type Options = [{ max: number; ignoreDecorated: boolean }];
type MessageIds = 'tooManyFields';

const DEFAULT_MAX = 5;

/** Every shape a declared instance field takes: plain, abstract, or `accessor`. */
type Field =
  | TSESTree.PropertyDefinition
  | TSESTree.TSAbstractPropertyDefinition
  | TSESTree.AccessorProperty;

const isField = (member: TSESTree.ClassElement): member is Field =>
  member.type === AST_NODE_TYPES.PropertyDefinition ||
  member.type === AST_NODE_TYPES.TSAbstractPropertyDefinition ||
  member.type === AST_NODE_TYPES.AccessorProperty;

const named = (
  key: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): string =>
  key.type === AST_NODE_TYPES.Identifier ? key.name : sourceCode.getText(key);

/**
 * `private readonly logger = new Logger()` holds a collaborator, not state.
 * `max-class-dependencies` already counts it from that same `new`, so counting
 * the field as well would report one dependency on two axes.
 */
const holdsCollaborator = (
  field: Field,
  sourceCode: TSESLint.SourceCode,
): boolean =>
  field.value?.type === AST_NODE_TYPES.NewExpression &&
  isCollaborator(field.value.callee, sourceCode);

/** Every property declared in the class body that holds state. */
const declared = (
  member: TSESTree.ClassElement,
  sourceCode: TSESLint.SourceCode,
): string[] =>
  isField(member) && !member.static && !holdsCollaborator(member, sourceCode)
    ? [named(member.key, sourceCode)]
    : [];

/**
 * The same, minus the decorated ones: `@Column`, `@IsString` and friends map a
 * field to a table or a payload, which is framework shape rather than state the
 * class chose to carry.
 */
const declaredUndecorated = (
  member: TSESTree.ClassElement,
  sourceCode: TSESLint.SourceCode,
): string[] =>
  isField(member) && member.decorators.length > 0
    ? []
    : declared(member, sourceCode);

/**
 * A parameter property typed with a collaborator is an injected dependency,
 * which `max-class-dependencies` budgets from the same annotation. One typed as
 * a primitive or a built-in (`region: string`, `issuedAt: Date`) is state and
 * stays here.
 */
const injectsCollaborator = (
  param: TSESTree.Parameter,
  sourceCode: TSESLint.SourceCode,
): boolean => {
  const annotation = annotatedReference(param);

  return (
    annotation !== undefined && isCollaborator(annotation.typeName, sourceCode)
  );
};

/**
 * Constructor parameter properties that hold state. `ignoreDecorated`
 * deliberately does not reach them: a decorator on a parameter is injection
 * (`@Inject(TOKEN)`), not mapping, so `@Inject(REGION) region: string` is state
 * the class chose to carry and stays inside the budget.
 */
const promoted = (
  member: TSESTree.ClassElement,
  sourceCode: TSESLint.SourceCode,
): string[] => {
  if (
    member.type !== AST_NODE_TYPES.MethodDefinition ||
    member.kind !== 'constructor'
  ) {
    return [];
  }

  return member.value.params.flatMap((param) =>
    param.type === AST_NODE_TYPES.TSParameterProperty &&
    !injectsCollaborator(param, sourceCode)
      ? [named(param.parameter, sourceCode)]
      : [],
  );
};

export default createRule<Options, MessageIds>({
  name: 'max-class-fields',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a maximum number of instance fields per class to keep objects from becoming data bags.',
    },
    messages: {
      tooManyFields:
        "Class '{{name}}' holds {{count}} fields (max {{max}}): {{names}}. Consider grouping related fields into a value object.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'integer', minimum: 1 },
          ignoreDecorated: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ max: DEFAULT_MAX, ignoreDecorated: true }],
  create(context, [{ max, ignoreDecorated }]) {
    const sourceCode = context.sourceCode;
    const fieldsOf = ignoreDecorated ? declaredUndecorated : declared;

    return {
      ClassBody(node): void {
        const fields = node.body.flatMap((member) => [
          ...fieldsOf(member, sourceCode),
          ...promoted(member, sourceCode),
        ]);

        if (fields.length <= max) {
          return;
        }

        context.report({
          node: node.parent.id ?? node,
          messageId: 'tooManyFields',
          data: {
            name: node.parent.id?.name ?? '(anonymous)',
            count: fields.length,
            max,
            names: fields.join(', '),
          },
        });
      },
    };
  },
});
