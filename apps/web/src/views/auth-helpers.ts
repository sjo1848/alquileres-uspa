export function safeLoginRedirect(value: unknown): string | undefined {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/auth/') ||
    value.includes('\\')
  ) {
    return undefined;
  }

  return value;
}
