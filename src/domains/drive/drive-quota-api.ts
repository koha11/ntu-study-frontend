import { HttpError, normalizeApiBase } from "@/domains/auth/auth-api";

export interface DriveQuotaResponse {
  total_bytes: string | null;
  used_bytes: string | null;
  quota_last_updated: string | null;
}

function getApiBase(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (!apiBase?.trim()) {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return normalizeApiBase(apiBase);
}

function bearerHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchDriveQuota(
  accessToken: string,
): Promise<DriveQuotaResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/drive/me/quota`, {
    method: "GET",
    headers: bearerHeaders(accessToken),
  });
  return handleJson<DriveQuotaResponse>(res);
}

export async function refreshDriveQuota(
  accessToken: string,
): Promise<DriveQuotaResponse> {
  const base = getApiBase();
  const res = await fetch(`${base}/drive/me/quota/refresh`, {
    method: "POST",
    headers: bearerHeaders(accessToken),
  });
  return handleJson<DriveQuotaResponse>(res);
}
