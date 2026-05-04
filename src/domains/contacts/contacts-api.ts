import { HttpError, normalizeApiBase } from "@/domains/auth/auth-api";

export interface ContactSuggestion {
  email: string;
  display_name: string | null;
  photo_url: string | null;
}

function getApiBase(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (!apiBase?.trim()) {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return normalizeApiBase(apiBase);
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchContactSuggestions(
  token: string,
  query: string,
): Promise<ContactSuggestion[]> {
  const q = new URLSearchParams({ q: query.trim() });
  const res = await fetch(`${getApiBase()}/contacts/suggestions?${q.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleJson<ContactSuggestion[]>(res);
}
