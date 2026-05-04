/** Session-only storage for OAuth return URL (validated before navigation). */

export const POST_LOGIN_REDIRECT_KEY = "ntu_study_post_login_redirect";

/** Full path + query + hash relative to origin, from requireSession redirect. */
export function storePostLoginRedirect(pathWithQueryHash: string): void {
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, pathWithQueryHash);
}

export function peekPostLoginRedirect(): string | null {
  return sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
}

export function consumePostLoginRedirect(): string | null {
  const v = peekPostLoginRedirect();
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  return v;
}

/** Same-origin path only; excludes `/login` to avoid loops. */
export function normalizeSafeAppPath(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  let decoded = raw.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  try {
    const u = new URL(decoded, window.location.origin);
    if (u.origin !== window.location.origin) return null;
    const path = u.pathname + u.search + u.hash;
    if (!path.startsWith("/") || path.startsWith("//")) return null;
    if (u.pathname.startsWith("/login")) return null;
    return path;
  } catch {
    return null;
  }
}

/** Full navigation after OAuth so dynamic routes resolve correctly. */
export function navigateAfterLogin(): void {
  const stored = consumePostLoginRedirect();
  const safe = stored ? normalizeSafeAppPath(stored) : null;
  window.location.replace(safe ?? "/dashboard");
}
