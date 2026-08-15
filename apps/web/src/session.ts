import { computed, ref } from 'vue';
import { ApiError, request, type Role, type User } from './api';

export type SessionStatus =
  'unknown' | 'loading' | 'authenticated' | 'anonymous' | 'error';
const status = ref<SessionStatus>('unknown');
const user = ref<User | null>(null);
let restorePromise: Promise<void> | undefined;
let onSessionExpired: (() => void) | undefined;

export function setSessionExpiredHandler(handler: (() => void) | undefined) {
  onSessionExpired = handler;
}

export function useSession() {
  const isAuthenticated = computed(
    () => status.value === 'authenticated' && Boolean(user.value),
  );
  const role = computed<Role | null>(() => user.value?.role ?? null);

  function clear() {
    status.value = 'anonymous';
    user.value = null;
    void request('/auth/logout', { method: 'POST' });
  }

  function anonymous() {
    status.value = 'anonymous';
    user.value = null;
  }

  async function authenticate(
    path: '/auth/login' | '/auth/register',
    email: string,
    password: string,
  ) {
    const result = await request<{ user: User }>(path, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    status.value = 'authenticated';
    user.value = result.user;
  }

  async function restore() {
    if (restorePromise) return restorePromise;
    status.value = 'loading';
    restorePromise = request<User>('/auth/me')
      .then((restored) => {
        user.value = restored;
        status.value = 'authenticated';
      })
      .catch((error) => {
        user.value = null;
        if (error instanceof ApiError && error.status === 401) {
          status.value = 'anonymous';
          return;
        }
        status.value = 'error';
        throw error;
      })
      .finally(() => {
        restorePromise = undefined;
      });
    return restorePromise;
  }

  async function apiRequest<T>(path: string, options: RequestInit = {}) {
    try {
      return await request<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clear();
        onSessionExpired?.();
      }
      throw error;
    }
  }

  return {
    token: computed(() => status.value === 'authenticated'),
    status,
    user,
    role,
    isAuthenticated,
    authenticate,
    restore,
    clear,
    anonymous,
    apiRequest,
  };
}
