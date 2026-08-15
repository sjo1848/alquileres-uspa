import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, publicListingPath, request } from './api';
import { setSessionExpiredHandler, useSession } from './session';
import {
  canEditListing,
  createMutationOwnership,
  createSelectionGuard,
} from './views/area-helpers';

afterEach(() => {
  setSessionExpiredHandler(undefined);
  vi.restoreAllMocks();
});

describe('web foundation', () => {
  it('rejects stale selection responses after a newer selection and invalidation', () => {
    const guard = createSelectionGuard();
    const first = guard.begin('one');
    const second = guard.begin('two');
    expect(guard.isCurrent(first, 'two')).toBe(false);
    expect(guard.isCurrent(second, 'two')).toBe(true);
    guard.invalidate();
    expect(guard.isCurrent(second, 'two')).toBe(false);
  });

  it('does not accept a response for the right id when its request is older', () => {
    const guard = createSelectionGuard();
    const first = guard.begin('listing-1');
    const second = guard.begin('listing-1');

    expect(guard.isCurrent(first, 'listing-1')).toBe(false);
    expect(guard.isCurrent(second, 'listing-1')).toBe(true);
  });

  it('allows image mutations only for editable owner statuses', () => {
    expect(canEditListing('DRAFT')).toBe(true);
    expect(canEditListing('REJECTED')).toBe(true);
    expect(canEditListing('SUBMITTED')).toBe(false);
    expect(canEditListing('APPROVED')).toBe(false);
  });
  it('keeps mutation ownership independent from selection invalidation', () => {
    const mutations = createMutationOwnership();
    const first = mutations.acquire();
    expect(mutations.owns(first)).toBe(true);
    const second = mutations.acquire();
    expect(mutations.owns(first)).toBe(false);
    expect(mutations.owns(second)).toBe(true);
  });
  it('builds encoded public listing paths', () => {
    expect(publicListingPath('cabaña/uspa')).toBe(
      '/public/listings/caba%C3%B1a%2Fuspa',
    );
  });

  it('normalizes validation arrays and sends cookie credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ message: ['Email inválido', 'Es requerido'] }),
          {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );
    await expect(request('/auth/login')).rejects.toEqual(
      new ApiError(422, 'Email inválido. Es requerido'),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('restores and clears a cookie-backed session without exposing a bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              user: { id: 'u1', email: 'owner@example.com', role: 'OWNER' },
            }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        ),
    );
    const session = useSession();
    await session.authenticate(
      '/auth/login',
      'owner@example.com',
      'password123',
    );
    expect(session.isAuthenticated.value).toBe(true);
    expect(session.token.value).toBe(true);
    session.clear();
    expect(session.user.value).toBeNull();
    expect(session.token.value).toBe(false);
  });

  it('bootstraps from /auth/me and treats 401 as anonymous', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'u1',
            email: 'owner@example.com',
            role: 'OWNER',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const session = useSession();
    session.anonymous();
    await session.restore();
    expect(session.status.value).toBe('authenticated');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ credentials: 'include' }),
    );
    session.anonymous();
    await session.restore();
    expect(session.status.value).toBe('anonymous');
    expect(session.user.value).toBeNull();
  });

  it('clears the session and notifies the app when a protected request expires', async () => {
    const expired = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    setSessionExpiredHandler(expired);
    const session = useSession();
    session.anonymous();
    await expect(session.apiRequest('/listings')).rejects.toEqual(
      new ApiError(401, 'Unauthorized'),
    );
    expect(session.status.value).toBe('anonymous');
    expect(session.user.value).toBeNull();
    expect(expired).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('exposes recoverable restore errors and can retry', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'u1',
            email: 'owner@example.com',
            role: 'OWNER',
          }),
          { status: 200 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    const session = useSession();
    session.anonymous();
    await expect(session.restore()).rejects.toThrow('network unavailable');
    expect(session.status.value).toBe('error');
    await session.restore();
    expect(session.status.value).toBe('authenticated');
  });
});
