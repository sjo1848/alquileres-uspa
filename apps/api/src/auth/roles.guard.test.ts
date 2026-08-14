import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { AuthenticatedRequest } from './auth.guard.js';
import { REQUIRED_ROLES, RolesGuard } from './roles.guard.js';

function contextFor(
  user: AuthenticatedRequest['user'],
  handler: () => unknown,
  controller?: object,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => controller ?? class TestController {},
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
    Reflect.defineMetadata(REQUIRED_ROLES, [Role.ADMIN], handler);
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

  it('reads controller metadata and allows OWNER but rejects ADMIN', () => {
    const guard = new RolesGuard({
      assertRole: (user: AuthenticatedRequest['user'], roles: Role[]) => {
        if (!user || !roles.includes(user.role)) throw new Error('denied');
      },
    } as never);
    const handler = () => undefined;
    class ListingsController {}
    Reflect.defineMetadata(REQUIRED_ROLES, [Role.OWNER], ListingsController);

    expect(
      guard.canActivate(
        contextFor(
          { id: 'o', email: 'o', role: Role.OWNER },
          handler,
          ListingsController,
        ),
      ),
    ).toBe(true);
    expect(() =>
      guard.canActivate(
        contextFor(
          { id: 'a', email: 'a', role: Role.ADMIN },
          handler,
          ListingsController,
        ),
      ),
    ).toThrow('denied');
  });
});
