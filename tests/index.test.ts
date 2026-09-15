import plugin from '../src/index';

describe('plugin surface', () => {
  it('exposes max-class-dependencies', () => {
    expect(Object.keys(plugin.rules)).toContain('max-class-dependencies');
  });

  it('warns at four dependencies by default', () => {
    expect(
      plugin.configs.recommended.rules?.['elegant/max-class-dependencies'],
    ).toEqual(['warn', { max: 4 }]);
  });

  it('errors on property aliases by default', () => {
    expect(plugin.configs.recommended.rules?.['elegant/no-property-alias']).toBe(
      'error',
    );
  });

  it('errors on reach-in destructuring by default', () => {
    expect(
      plugin.configs.recommended.rules?.['elegant/no-property-destructuring'],
    ).toBe('error');
  });

  it('errors on anonymous parameter shapes of two properties by default', () => {
    expect(
      plugin.configs.recommended.rules?.['elegant/no-anonymous-param-type'],
    ).toEqual(['error', { minMembers: 2 }]);
  });

  it('warns past fifty lines in one method by default', () => {
    expect(
      plugin.configs.recommended.rules?.['elegant/max-method-lines'],
    ).toEqual(['warn', { max: 50 }]);
  });

  it('errors on self-mutation and generic errors by default', () => {
    expect(plugin.configs.recommended.rules?.['elegant/no-self-mutation']).toBe(
      'error',
    );
    expect(plugin.configs.recommended.rules?.['elegant/no-generic-error']).toBe(
      'error',
    );
  });

  it('errors on `any` return types by default, in both configs', () => {
    expect(plugin.configs.recommended.rules?.['elegant/no-any-return']).toBe(
      'error',
    );
    expect(plugin.configs.starter.rules?.['elegant/no-any-return']).toBe(
      'error',
    );
  });

  it('offers a starter config that demotes the four noisiest rules', () => {
    const starter = plugin.configs.starter.rules ?? {};

    expect(starter['elegant/no-comments-in-function-body']).toBe('off');
    expect(starter['elegant/no-interpolated-log-message']).toBe('warn');
    expect(starter['elegant/no-null']).toBe('warn');
    expect(starter['elegant/no-type-assertion']).toBe('warn');
  });

  it('starter carries every rule recommended carries', () => {
    const recommended = Object.keys(plugin.configs.recommended.rules ?? {});
    const starter = Object.keys(plugin.configs.starter.rules ?? {});

    expect(starter.sort()).toEqual(recommended.sort());
  });

  it('offers an off config covering exactly the rules the plugin ships', () => {
    const off = plugin.configs.off.rules ?? {};

    expect(Object.keys(off).sort()).toEqual(
      Object.keys(plugin.rules)
        .map((name) => `elegant/${name}`)
        .sort(),
    );
    expect(Object.values(off).every((severity) => severity === 'off')).toBe(
      true,
    );
  });

  it('offers a tests config that silences the eight rules specs legitimately trip', () => {
    const tests = plugin.configs.tests.rules ?? {};

    expect(Object.keys(tests).sort()).toEqual(
      [
        'elegant/no-anonymous-param-type',
        'elegant/no-boolean-param',
        'elegant/no-comments-in-function-body',
        'elegant/no-generic-error',
        'elegant/no-null',
        'elegant/no-null-return',
        'elegant/no-type-assertion',
        'max-params',
      ].sort(),
    );
    expect(Object.values(tests).every((severity) => severity === 'off')).toBe(
      true,
    );
  });

  it('leaves rules that never fire in specs enabled, rather than off by superstition', () => {
    const tests = plugin.configs.tests.rules ?? {};

    for (const name of [
      'elegant/max-class-methods',
      'elegant/max-class-dependencies',
      'elegant/max-class-fields',
      'elegant/max-returns',
      'elegant/no-static-members',
      'elegant/no-interpolated-log-message',
      'elegant/no-any-return',
    ]) {
      expect(tests).not.toHaveProperty(name);
    }
  });

  it('enables every rule in the recommended config', () => {
    for (const name of Object.keys(plugin.rules)) {
      expect(plugin.configs.recommended.rules).toHaveProperty(
        `elegant/${name}`,
      );
    }
  });
});
