import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller.js';

function response() {
  const result = { statusCode: 0, body: undefined as unknown };
  return {
    result,
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return body;
    },
  };
}

describe('HealthController', () => {
  it('reports API and database health', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const output = response();

    await new HealthController(prisma as never).check(output as never);

    expect(output.result).toEqual({
      statusCode: 200,
      body: { status: 'ok', checks: { database: 'ok' } },
    });
  });

  it('returns a safe degraded response when the database is unavailable', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('connection details')),
    };
    const output = response();

    await new HealthController(prisma as never).check(output as never);

    expect(output.result).toEqual({
      statusCode: 503,
      body: { status: 'degraded', checks: { database: 'unavailable' } },
    });
  });
});
