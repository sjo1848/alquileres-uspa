export type Role = 'OWNER' | 'ADMIN';
export type User = { id: string; email: string; role: Role };

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
export const apiUrl = (path: string) => `${API_URL}${path}`;
export const publicListingPath = (id: string) =>
  `/public/listings/${encodeURIComponent(id)}`;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    ...options,
    headers,
  });
  const body = (await response.json().catch(() => ({}))) as {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join('. ')
      : body.message;
    throw new ApiError(response.status, message ?? 'Ocurrió un error');
  }
  return body as T;
}
