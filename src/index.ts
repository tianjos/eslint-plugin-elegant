import type { TSESLint } from '@typescript-eslint/utils';
import maxClassDependencies from './rules/max-class-dependencies';
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
import noNullReturn from './rules/no-null-return';
import noPublicMutableProps from './rules/no-public-mutable-props';
import noStaticMembers from './rules/no-static-members';
import noTypeAssertion from './rules/no-type-assertion';

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
    'max-params': ['warn', { max: 3 }],
    'no-else-return': ['error', { allowElseIf: false }],
  },
};

plugin.default = plugin;

export = plugin;
