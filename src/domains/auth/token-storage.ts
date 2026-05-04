const PREFIX = "ntu_study_";

export const STORAGE_KEYS = {
  access: `${PREFIX}access_token`,
  refresh: `${PREFIX}refresh_token`,
  oauthVerifier: `${PREFIX}oauth_code_verifier`,
  oauthState: `${PREFIX}oauth_state`,
} as const;

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.access);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.refresh);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(STORAGE_KEYS.access, accessToken);
  localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.access);
  localStorage.removeItem(STORAGE_KEYS.refresh);
}

/** PKCE verifier + CSRF state (session-only, cleared after callback). */
export function setOAuthSession(verifier: string, state: string): void {
  sessionStorage.setItem(STORAGE_KEYS.oauthVerifier, verifier);
  sessionStorage.setItem(STORAGE_KEYS.oauthState, state);
}

export function getOAuthVerifier(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.oauthVerifier);
}

export function getOAuthState(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.oauthState);
}

export function clearOAuthSession(): void {
  sessionStorage.removeItem(STORAGE_KEYS.oauthVerifier);
  sessionStorage.removeItem(STORAGE_KEYS.oauthState);
}

export function authHeaders(accessToken?: string | null): HeadersInit {
  const token = accessToken ?? getAccessToken();
  const h: Record<string, string> = {};
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}
