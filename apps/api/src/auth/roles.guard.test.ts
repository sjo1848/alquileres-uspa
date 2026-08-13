import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { AuthenticatedRequest } from './auth.guard.js';
import { REQUIRED_ROLES, RolesGuard } from './roles.guard.js';

function contextFor(
  user: AuthenticatedRequest['user'],
  handler: () => unknown,
): ExecutionContext {
  Reflect.defineMetadata(REQUIRED_ROLES, [Role.ADMIN], handler);
  return {
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows only ADMIN for an ADMIN-protected handler', () => {
    const guard = new RolesGuard({
      assertRole: (user: AuthenticatedRequest['user'], roles: Role[]) => {
        if (!user || !roles.includes(user.role)) throw new Error('denied');
      },
    } as never);
    const handler = () => undefined;
    expect(
      guard.canActivate(
        contextFor({ id: 'a', email: 'a', role: Role.ADMIN }, handler),
      ),
    ).toBe(true);
    expect(() =>
      guard.canActivate(
        contextFor({ id: 'o', email: 'o', role: Role.OWNER }, handler),
      ),
    ).toThrow('denied');
  });
});
