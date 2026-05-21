import { HttpError, normalizeApiBase } from "@/domains/auth/auth-api";
import type {
  CreateGroupInput,
  CreateGroupCalendarEventInput,
  CreateGroupCalendarEventResult,
  CreateGroupMeetEventInput,
  CreateGroupMeetEventResult,
  GroupCalendarEventRow,
  GroupDetail,
  GroupInvitation,
  GroupMember,
  GroupSummary,
  MemberRow,
  UpdateGroupInput,
} from "./types";

function getApiBase(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (!apiBase?.trim()) {
    throw new Error("VITE_API_BASE_URL is not set");
  }
  return normalizeApiBase(apiBase);
}

function bearerHeaders(token: string, extra?: Record<string, string>): HeadersInit {
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
  return h;
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

async function handleVoid(res: Response): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new HttpError(res.status, text || res.statusText);
  }
}

export async function fetchUserGroups(token: string): Promise<GroupSummary[]> {
  const res = await fetch(`${getApiBase()}/groups`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  return handleJson(res);
}

export async function fetchGroupDetails(
  id: string,
  token: string,
): Promise<GroupDetail> {
  const res = await fetch(`${getApiBase()}/groups/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  return handleJson(res);
}

export async function createGroup(
  input: CreateGroupInput,
  token: string,
): Promise<GroupDetail> {
  const body: Record<string, unknown> = { name: input.name };
  if (input.description !== undefined) {
    body.description = input.description;
  }
  if (input.tags !== undefined) {
    body.tags = input.tags;
  }
  if (input.report_date !== undefined && input.report_date.trim() !== "") {
    body.report_date = input.report_date.trim();
  }
  const res = await fetch(`${getApiBase()}/groups`, {
    method: "POST",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleJson(res);
}

export async function updateGroup(
  id: string,
  input: UpdateGroupInput,
  token: string,
): Promise<GroupDetail> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.description !== undefined) body.description = input.description;
  if (input.tags !== undefined) body.tags = input.tags;
  if (input.meet_link !== undefined) body.meet_link = input.meet_link;
  if (input.report_date !== undefined) body.report_date = input.report_date;
  if (input.canva_file_url !== undefined) body.canva_file_url = input.canva_file_url;
  if (input.doc_file_url !== undefined) body.doc_file_url = input.doc_file_url;
  if (input.google_calendar_id !== undefined) {
    body.google_calendar_id = input.google_calendar_id;
  }
  const res = await fetch(`${getApiBase()}/groups/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return handleJson(res);
}

export async function fetchGroupMembers(
  id: string,
  token: string,
): Promise<MemberRow[]> {
  const res = await fetch(
    `${getApiBase()}/groups/${encodeURIComponent(id)}/members`,
    { method: "GET", headers: bearerHeaders(token) },
  );
  return handleJson(res);
}

export async function inviteMember(
  groupId: string,
  email: string,
  token: string,
): Promise<GroupInvitation> {
  const res = await fetch(
    `${getApiBase()}/groups/${encodeURIComponent(groupId)}/members/invite`,
    {
      method: "POST",
      headers: bearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ email }),
    },
  );
  return handleJson(res);
}

export async function toggleMemberStatus(
  groupId: string,
  userId: string,
  token: string,
): Promise<GroupMember> {
  const res = await fetch(
    `${getApiBase()}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/toggle`,
    {
      method: "PATCH",
      headers: bearerHeaders(token),
    },
  );
  return handleJson(res);
}

export async function removeMember(
  groupId: string,
  userId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${getApiBase()}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      headers: bearerHeaders(token),
    },
  );
  return handleVoid(res);
}

export async function createGroupMeetEvent(
  groupId: string,
  input: CreateGroupMeetEventInput,
  token: string,
): Promise<CreateGroupMeetEventResult> {
  const body: Record<string, string> = { start: input.start };
  if (input.end !== undefined && input.end.trim() !== "") {
    body.end = input.end.trim();
  }
  const res = await fetch(
    `${getApiBase()}/groups/${encodeURIComponent(groupId)}/calendar/meet-event`,
    {
      method: "POST",
      headers: bearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    },
  );
  return handleJson(res);
}

export async function fetchGroupCalendarEvents(
  groupId: string,
  timeMin: string,
  timeMax: string,
  token: string,
): Promise<GroupCalendarEventRow[]> {
  const params = new URLSearchParams({
    time_min: timeMin,
    time_max: timeMax,
  });
  const res = await fetch(
    `${getApiBase()}/groups/${encodeURIComponent(groupId)}/calendar/events?${params.toString()}`,
    { method: "GET", headers: bearerHeaders(token) },
  );
  return handleJson(res);
}

export interface CanvaPreview {
  editUrl: string | null;
  pages: { index: number; thumbnailUrl: string }[];
}

export async function fetchCanvaPreview(
  groupId: string,
  token: string,
): Promise<CanvaPreview> {
  const res = await fetch(
    `${getApiBase()}/groups/${encodeURIComponent(groupId)}/canva-preview`,
    { method: "GET", headers: bearerHeaders(token) },
  );
  return handleJson(res);
}

export async function createGroupCalendarEvent(
  groupId: string,
  input: CreateGroupCalendarEventInput,
  token: string,
): Promise<CreateGroupCalendarEventResult> {
  const res = await fetch(
    `${getApiBase()}/groups/${encodeURIComponent(groupId)}/calendar/events`,
    {
      method: "POST",
      headers: bearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(input),
    },
  );
  return handleJson(res);
}
