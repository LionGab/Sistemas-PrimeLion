const { capitalize, gerarId } = require('../assets/js/main');

describe('Utility functions', () => {
  test('capitalize should capitalize first letter', () => {
    expect(capitalize('aluno')).toBe('Aluno');
  });

  test('gerarId should generate unique IDs', () => {
    const id1 = gerarId();
    const id2 = gerarId();
    expect(id1).not.toBe(id2);
  });
});
