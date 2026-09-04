import { TSESLint } from '@typescript-eslint/utils';

/**
 * Whether anything writes to the variable after its declaration. Such a local
 * holds mutable state that no member access stands in for, so it is not a copy
 * of the object's state to begin with.
 */
export const isReassigned = (variable: TSESLint.Scope.Variable): boolean =>
  variable.references.some(
    (reference) => reference.isWrite() && !reference.init,
  );

/**
 * Whether the variable is read from inside a nested function. TypeScript drops
 * a narrowing of `obj.prop` at the callback boundary but keeps it on a local,
 * so such a declaration is load-bearing: inlining it stops compiling.
 */
export const escapesIntoFunction = (
  variable: TSESLint.Scope.Variable,
): boolean =>
  variable.references.some((reference) => {
    let scope: TSESLint.Scope.Scope | null = reference.from;

    while (scope !== null && scope !== variable.scope) {
      if (scope.type === 'function') {
        return true;
      }
      scope = scope.upper;
    }

    return false;
  });

/**
 * Whether a name resolves to a binding a `catch` clause introduced.
 * TypeScript types a caught value as `unknown`, so `instanceof` is the only
 * narrowing the language offers there — no method on the value can stand in
 * for it, because at that point the value has no known methods.
 */
export const isCaughtBinding = (
  scope: TSESLint.Scope.Scope,
  name: string,
): boolean => {
  let current: TSESLint.Scope.Scope | null = scope;

  while (current !== null) {
    const found = current.variables.find((variable) => variable.name === name);

    if (found !== undefined) {
      return found.defs.some((def) => def.type === 'CatchClause');
    }
    current = current.upper;
  }

  return false;
};
