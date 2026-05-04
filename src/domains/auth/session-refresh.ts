/**
 * Single-flight refresh: concurrent 401s share one /auth/refresh call.
 */

import { refreshTokens as refreshTokensApi, type LoginTokens } from "./auth-api";
import { getRefreshToken, setTokens, clearTokens } from "./token-storage";

let refreshPromise: Promise<LoginTokens> | null = null;

export function refreshSessionLocked(): Promise<LoginTokens> {
  if (refreshPromise) return refreshPromise;

  const rt = getRefreshToken();
  if (!rt) {
    clearTokens();
    return Promise.reject(new Error("Not authenticated"));
  }

  refreshPromise = refreshTokensApi(rt)
    .then((tokens) => {
      setTokens(tokens.access_token, tokens.refresh_token);
      return tokens;
    })
    .catch((err: unknown) => {
      clearTokens();
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}
