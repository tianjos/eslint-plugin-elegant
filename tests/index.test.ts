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

  it('enables every rule in the recommended config', () => {
    for (const name of Object.keys(plugin.rules)) {
      expect(plugin.configs.recommended.rules).toHaveProperty(
        `elegant/${name}`,
      );
    }
  });
});
