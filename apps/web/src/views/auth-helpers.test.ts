import { describe, expect, it } from 'vitest';
import { safeLoginRedirect } from './auth-helpers';

describe('safeLoginRedirect', () => {
  it('accepts an internal route for a successful login return', () => {
    expect(safeLoginRedirect('/owner?from=listing')).toBe(
      '/owner?from=listing',
    );
  });

  it.each([
    'https://attacker.example',
    '//attacker.example/path',
    '/\\attacker.example/path',
    '/auth/login?redirect=/owner',
    undefined,
  ])('rejects unsafe redirect %s', (value) => {
    expect(safeLoginRedirect(value)).toBeUndefined();
  });
});
