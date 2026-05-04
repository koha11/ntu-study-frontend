import { HttpError, normalizeApiBase } from "@/domains/auth/auth-api";
import type {
  AcceptInvitationResponse,
  GroupInvitation,
  InvitationValidateResult,
} from "./types";

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

/**
 * Public: preview invitation before accepting (no auth).
 */
export async function validateInvitationToken(
  token: string,
): Promise<InvitationValidateResult> {
  const res = await fetch(
    `${getApiBase()}/invitations/${encodeURIComponent(token)}/validate`,
    { method: "GET" },
  );
  return handleJson(res);
}

/**
 * Public: accept invitation (no auth). Optionally set display name if user is created.
 */
export async function acceptInvitation(
  token: string,
  body?: { full_name?: string },
): Promise<AcceptInvitationResponse> {
  const res = await fetch(
    `${getApiBase()}/invitations/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
  return handleJson(res);
}

/**
 * Leader-only: list invitations sent for a group.
 */
/**
 * Current user: resolve accept-token for a pending invitation by id (must match invitation email).
 */
export async function fetchPendingInvitationToken(
  invitationId: string,
  accessToken: string,
): Promise<{ token: string }> {
  const res = await fetch(
    `${getApiBase()}/invitations/pending-token/${encodeURIComponent(invitationId)}`,
    { method: "GET", headers: bearerHeaders(accessToken) },
  );
  return handleJson(res);
}

export async function fetchGroupInvitations(
  groupId: string,
  accessToken: string,
): Promise<GroupInvitation[]> {
  const res = await fetch(
    `${getApiBase()}/invitations/groups/${encodeURIComponent(groupId)}`,
    { method: "GET", headers: bearerHeaders(accessToken) },
  );
  return handleJson(res);
}

/**
 * Leader-only: expire pending invite (if applicable) and create a new invitation + email.
 */
export async function resendGroupInvitation(
  groupId: string,
  invitationId: string,
  accessToken: string,
): Promise<GroupInvitation> {
  const res = await fetch(
    `${getApiBase()}/invitations/groups/${encodeURIComponent(groupId)}/invitations/${encodeURIComponent(invitationId)}/resend`,
    { method: "POST", headers: bearerHeaders(accessToken) },
  );
  return handleJson(res);
}
