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

  it('enables every rule in the recommended config', () => {
    for (const name of Object.keys(plugin.rules)) {
      expect(plugin.configs.recommended.rules).toHaveProperty(
        `elegant/${name}`,
      );
    }
  });
});
