import { buildGoogleAuthorizeUrl } from "./auth-api";
import {
  computeCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
} from "./pkce";
import { normalizeSafeAppPath, storePostLoginRedirect } from "./post-login-redirect";
import { setOAuthSession } from "./token-storage";

/** Redirects the browser to Google OAuth (PKCE). */
export async function startGoogleLogin(options?: {
  /** App path after sign-in (same-origin path from ?redirect=). */
  redirectAfterLogin?: string | null;
}): Promise<void> {
  const verifier = generateCodeVerifier();
  const state = generateOAuthState();
  const challenge = await computeCodeChallenge(verifier);
  setOAuthSession(verifier, state);
  const safe = options?.redirectAfterLogin
    ? normalizeSafeAppPath(options.redirectAfterLogin)
    : null;
  if (safe) {
    storePostLoginRedirect(safe);
  }
  const url = buildGoogleAuthorizeUrl({ codeChallenge: challenge, state });
  window.location.assign(url);
}
