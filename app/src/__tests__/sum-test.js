jest.unmock('../utils/sum'); // unmock to use the actual implementation of sum

import sum from '../utils/sum';

describe('sum', () => {
  it('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3);
  });
});