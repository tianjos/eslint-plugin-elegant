import type { TSESLint } from '@typescript-eslint/utils';
import noAnonymousParamType from './rules/no-anonymous-param-type';
import maxClassDependencies from './rules/max-class-dependencies';
import maxMethodLines from './rules/max-method-lines';
import maxClassFields from './rules/max-class-fields';
import maxReturns from './rules/max-returns';
import maxClassMethods from './rules/max-class-methods';
import noBooleanParam from './rules/no-boolean-param';
import noCommentsInFunctionBody from './rules/no-comments-in-function-body';
import noElseAfterThrow from './rules/no-else-after-throw';
import noGettersSetters from './rules/no-getters-setters';
import noInstanceof from './rules/no-instanceof';
import noInterpolatedLogMessage from './rules/no-interpolated-log-message';
import noLogicInConstructor from './rules/no-logic-in-constructor';
import noNull from './rules/no-null';
import noGenericError from './rules/no-generic-error';
import noNullReturn from './rules/no-null-return';
import noSelfMutation from './rules/no-self-mutation';
import noPropertyAlias from './rules/no-property-alias';
import noPropertyDestructuring from './rules/no-property-destructuring';
import noPublicMutableProps from './rules/no-public-mutable-props';
import noStaticMembers from './rules/no-static-members';
import noTypeAssertion from './rules/no-type-assertion';

// require() of a JSON file yields `any`, so there is no honest type to reach
// for here. Importing it instead would put package.json inside the emitted
// tree and move dist/index.js, which the "exports" map pins.
// eslint-disable-next-line elegant/no-type-assertion
const { name, version } = require('../package.json') as {
  name: string;
  version: string;
};

const rules = {
  'no-boolean-param': noBooleanParam,
  'max-class-methods': maxClassMethods,
  'max-class-dependencies': maxClassDependencies,
  'max-class-fields': maxClassFields,
  'no-type-assertion': noTypeAssertion,
  'no-null-return': noNullReturn,
  'no-public-mutable-props': noPublicMutableProps,
  'no-logic-in-constructor': noLogicInConstructor,
  'no-getters-setters': noGettersSetters,
  'no-instanceof': noInstanceof,
  'no-static-members': noStaticMembers,
  'no-null': noNull,
  'no-comments-in-function-body': noCommentsInFunctionBody,
  'no-else-after-throw': noElseAfterThrow,
  'no-interpolated-log-message': noInterpolatedLogMessage,
  'max-returns': maxReturns,
  'no-property-alias': noPropertyAlias,
  'no-property-destructuring': noPropertyDestructuring,
  'no-anonymous-param-type': noAnonymousParamType,
  'no-self-mutation': noSelfMutation,
  'no-generic-error': noGenericError,
  'max-method-lines': maxMethodLines,
};

type Plugin = {
  meta: { name: string; version: string };
  rules: typeof rules;
  configs: Record<string, TSESLint.FlatConfig.Config>;
  /**
   * Self-reference so the package resolves identically whether consumers reach
   * it via `require('...')`, `require('...').default`, or an ESM
   * `import elegant from '...'`. This sidesteps the CJS/ESM interop hazard.
   */
  default?: Plugin;
};

const plugin: Plugin = {
  meta: { name, version },
  rules,
  configs: {},
};

plugin.configs.recommended = {
  name: 'elegant/recommended',
  plugins: { elegant: plugin },
  rules: {
    'elegant/no-boolean-param': 'error',
    'elegant/max-class-methods': ['warn', { max: 10 }],
    'elegant/max-class-dependencies': ['warn', { max: 4 }],
    'elegant/max-class-fields': ['warn', { max: 5 }],
    'elegant/max-returns': ['warn', { max: 3 }],
    'elegant/no-type-assertion': 'error',
    'elegant/no-null-return': 'error',
    'elegant/no-public-mutable-props': 'error',
    'elegant/no-logic-in-constructor': 'error',
    'elegant/no-getters-setters': 'error',
    'elegant/no-instanceof': 'error',
    'elegant/no-static-members': 'error',
    'elegant/no-null': 'error',
    'elegant/no-comments-in-function-body': 'error',
    'elegant/no-else-after-throw': 'error',
    'elegant/no-interpolated-log-message': 'error',
    'elegant/no-property-alias': 'error',
    'elegant/no-property-destructuring': 'error',
    'elegant/no-anonymous-param-type': ['error', { minMembers: 2 }],
    'elegant/no-self-mutation': 'error',
    'elegant/no-generic-error': 'error',
    'elegant/max-method-lines': ['warn', { max: 50 }],
    'max-params': ['warn', { max: 3 }],
    'no-else-return': ['error', { allowElseIf: false }],
  },
};

plugin.default = plugin;

export = plugin;
