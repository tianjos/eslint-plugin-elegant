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
