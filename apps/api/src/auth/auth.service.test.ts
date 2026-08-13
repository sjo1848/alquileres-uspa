import { describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  it('signs and verifies a role-bearing token', () => {
    process.env.JWT_SECRET = 'test-secret';
    const service = new AuthService({} as never);
    const token = service.sign({
      id: 'u1',
      email: 'owner@example.com',
      role: Role.OWNER,
    });
    expect(service.verify(token)).toMatchObject({ id: 'u1', role: Role.OWNER });
  });

  it('rejects a token with an invalid signature', () => {
    process.env.JWT_SECRET = 'test-secret';
    const service = new AuthService({} as never);
    expect(() => service.verify('not-a-token')).toThrow(UnauthorizedException);
  });

  it('enforces roles server-side', () => {
    process.env.JWT_SECRET = 'test-secret';
    const service = new AuthService({} as never);
    expect(() =>
      service.assertRole({ id: 'u1', email: 'x', role: Role.OWNER }, [
        Role.ADMIN,
      ]),
    ).toThrow(UnauthorizedException);
    expect(() =>
      service.assertRole({ id: 'u1', email: 'x', role: Role.ADMIN }, [
        Role.ADMIN,
      ]),
    ).not.toThrow();
  });
});
