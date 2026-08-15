import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthGuard } from './auth.guard.js';

const context = (headers: Record<string, string>): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  }) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  it('returns 401 by throwing when no cookie or bearer exists', async () => {
    await expect(
      new AuthGuard({} as never).canActivate(context({})),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts bearer and cookie credentials', async () => {
    const auth = {
      verify: vi
        .fn()
        .mockReturnValue({ id: 'u', email: 'u@e.com', role: 'OWNER' }),
      revalidate: vi
        .fn()
        .mockResolvedValue({ id: 'u', email: 'u@e.com', role: 'OWNER' }),
    };
    const guard = new AuthGuard(auth as never);
    await expect(
      guard.canActivate(context({ authorization: 'Bearer abc' })),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(context({ cookie: 'alquileres_session=abc' })),
    ).resolves.toBe(true);
    expect(auth.verify).toHaveBeenCalledTimes(2);
  });
});
