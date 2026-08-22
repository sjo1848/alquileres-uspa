import { afterEach, describe, expect, it } from 'vitest';
import { AuthController } from './auth.controller.js';

describe('AuthController session cookie policy', () => {
  const originalSameSite = process.env.COOKIE_SAME_SITE;
  const originalSecure = process.env.COOKIE_SECURE;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    restoreEnv('COOKIE_SAME_SITE', originalSameSite);
    restoreEnv('COOKIE_SECURE', originalSecure);
    restoreEnv('NODE_ENV', originalNodeEnv);
  });

  it('keeps local cookies lax and insecure by default', () => {
    delete process.env.COOKIE_SAME_SITE;
    delete process.env.COOKIE_SECURE;
    process.env.NODE_ENV = 'test';

    expect(cookieOptions()).toMatchObject({
      sameSite: 'lax',
      secure: false,
    });
  });

  it('uses a secure cross-site cookie when explicitly configured', () => {
    process.env.COOKIE_SAME_SITE = 'none';
    delete process.env.COOKIE_SECURE;
    process.env.NODE_ENV = 'test';

    expect(cookieOptions()).toMatchObject({
      sameSite: 'none',
      secure: true,
    });
  });
});

function cookieOptions() {
  const controller = new AuthController({} as never);
  return (controller as unknown as { cookieOptions: () => unknown })[
    'cookieOptions'
  ]();
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
