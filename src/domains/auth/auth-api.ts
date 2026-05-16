const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";

export interface LoginTokens {
  access_token: string;
  refresh_token: string;
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function normalizeApiBase(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Builds POST URL for backend code exchange (matches Nest query contract). */
export function buildGoogleCallbackPostUrl(
  apiBase: string,
  code: string,
  codeVerifier: string,
): string {
  const base = normalizeApiBase(apiBase);
  const q = new URLSearchParams({
    code,
    code_verifier: codeVerifier,
  });
  return `${base}/auth/google/callback?${q.toString()}`;
}

export function getRequiredEnv(): {
  apiBase: string;
  clientId: string;
  redirectUri: string;
  hd?: string;
} {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  const hd = import.meta.env.VITE_GOOGLE_HD;

  if (!apiBase?.trim()) {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  if (!clientId?.trim()) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not set");
  }
  if (!redirectUri?.trim()) {
    throw new Error("VITE_GOOGLE_REDIRECT_URI is not set");
  }

  return {
    apiBase: normalizeApiBase(apiBase),
    clientId: clientId.trim(),
    redirectUri: redirectUri.trim(),
    ...(hd?.trim() ? { hd: hd.trim() } : {}),
  };
}

export function buildGoogleAuthorizeUrl(params: {
  codeChallenge: string;
  state: string;
}): string {
  const { clientId, redirectUri, hd } = getRequiredEnv();

  const search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.activity.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.calendars",
      "https://www.googleapis.com/auth/contacts.readonly",
      "https://www.googleapis.com/auth/contacts.other.readonly",
    ].join(" "),
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
    state: params.state,
    access_type: "offline",
    prompt: "consent",
  });

  if (hd) {
    search.set("hd", hd);
  }

  return `${GOOGLE_AUTH}?${search.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
): Promise<LoginTokens> {
  const { apiBase } = getRequiredEnv();
  const url = buildGoogleCallbackPostUrl(apiBase, code, codeVerifier);
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Token exchange failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
  return res.json() as Promise<LoginTokens>;
}

export async function refreshTokens(
  refreshToken: string,
): Promise<LoginTokens> {
  const { apiBase } = getRequiredEnv();
  const res = await fetch(`${apiBase}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Refresh failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
  return res.json() as Promise<LoginTokens>;
}

export async function logoutRequest(accessToken: string): Promise<void> {
  const { apiBase } = getRequiredEnv();
  const res = await fetch(`${apiBase}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 401) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Logout failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
}

export interface UserProfileResponse {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  notification_enabled: boolean;
  preferred_language: "en" | "vi";
  canva_connected: boolean;
  /** Manual Drive quota cap in bytes (decimal string). Null if unset. */
  drive_total_quota?: string | null;
  created_at: string;
  updated_at: string;
}

export type PatchUserBody = {
  full_name?: string;
  avatar_url?: string | null;
  notification_enabled?: boolean;
  /** Bytes as decimal string, or null to clear the manual limit. */
  drive_total_quota?: string | null;
  preferred_language?: "en" | "vi";
};

export async function fetchCurrentUser(accessToken: string): Promise<UserProfileResponse> {
  const { apiBase } = getRequiredEnv();
  const res = await fetch(`${apiBase}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(
      res.status,
      `Profile fetch failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
  return res.json() as Promise<UserProfileResponse>;
}

export async function patchCurrentUser(
  accessToken: string,
  body: PatchUserBody,
): Promise<UserProfileResponse> {
  const { apiBase } = getRequiredEnv();
  const res = await fetch(`${apiBase}/users/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(
      res.status,
      `Profile update failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
  return res.json() as Promise<UserProfileResponse>;
}

/**
 * Fetches Google account name/photo and updates the local profile (same JWT session).
 */
export async function syncGoogleProfile(accessToken: string): Promise<UserProfileResponse> {
  const { apiBase } = getRequiredEnv();
  const res = await fetch(`${apiBase}/users/me/google-profile/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(
      res.status,
      `Google profile sync failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
  return res.json() as Promise<UserProfileResponse>;
}

export async function startCanvaOAuth(
  accessToken: string,
): Promise<{ authorizeUrl: string }> {
  const { apiBase } = getRequiredEnv();
  const res = await fetch(`${apiBase}/auth/canva/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(
      res.status,
      `Canva OAuth start failed: ${res.status} ${res.statusText} ${text}`.trim(),
    );
  }
  return res.json() as Promise<{ authorizeUrl: string }>;
}
