import { describe, expect, it, vi } from 'vitest';
import { Role } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService, normalizeEmail } from './auth.service.js';

describe('AuthService', () => {
  it('canonicalizes equivalent email addresses', () => {
    expect(normalizeEmail('  Owner@Example.COM ')).toBe('owner@example.com');
  });
  it('registers every new account as OWNER and hashes its password', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const create = vi.fn().mockResolvedValue({
      id: 'u2',
      email: 'new-owner@example.com',
      role: Role.OWNER,
      passwordHash: 'hash',
    });
    const service = new AuthService({ user: { create } } as never);
    await expect(
      service.registerOwner('new-owner@example.com', 'password123'),
    ).resolves.toEqual({
      id: 'u2',
      email: 'new-owner@example.com',
      role: Role.OWNER,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: Role.OWNER }),
      }),
    );
    expect(create.mock.calls[0][0].data.passwordHash).not.toBe('password123');
    expect(create.mock.calls[0][0].data.email).toBe('new-owner@example.com');
  });

  it('maps the unique email constraint to a conflict', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const service = new AuthService({
      user: { create: vi.fn().mockRejectedValue({ code: 'P2002' }) },
    } as never);
    await expect(
      service.registerOwner('duplicate@example.com', 'password123'),
    ).rejects.toMatchObject({ status: 409 });
  });

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

  it('revalidates identity and role from the current database user', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const findUnique = vi.fn().mockResolvedValue({
      id: 'u1',
      email: 'owner@example.com',
      role: Role.ADMIN,
    });
    const service = new AuthService({ user: { findUnique } } as never);
    await expect(
      service.revalidate({
        id: 'u1',
        email: 'owner@example.com',
        role: Role.OWNER,
      }),
    ).resolves.toEqual({
      id: 'u1',
      email: 'owner@example.com',
      role: Role.ADMIN,
    });
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('normalizes email before login lookup', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const findUnique = vi.fn().mockResolvedValue({
      id: 'u1',
      email: 'owner@example.com',
      role: Role.OWNER,
      passwordHash: await bcryptHash('password123'),
    });
    const service = new AuthService({ user: { findUnique } } as never);
    await service.validateCredentials(' Owner@Example.COM ', 'password123');
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'owner@example.com' },
    });
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

async function bcryptHash(value: string) {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(value, 4);
}
