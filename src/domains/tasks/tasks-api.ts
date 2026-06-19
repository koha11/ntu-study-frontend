import { HttpError, normalizeApiBase } from "@/domains/auth/auth-api";
import type {
  Task,
  TaskStatus,
  TaskOutcomeLink,
  OutcomeFile,
  CreateTaskInput,
  UpdateTaskInput,
  ApproveTaskInput,
  AddOutcomeLinkInput,
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

function iso(d: unknown): string | undefined {
  if (d == null) return undefined;
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString();
  return undefined;
}

function mapNestedUser(
  u: unknown,
): { id?: string; name?: string; avatarUrl?: string } {
  if (!u || typeof u !== "object") return {};
  const o = u as Record<string, unknown>;
  return {
    id: o.id != null ? String(o.id) : undefined,
    name: o.full_name != null ? String(o.full_name) : undefined,
    avatarUrl: o.avatar_url != null ? String(o.avatar_url) : undefined,
  };
}

function mapParentTaskTitle(parent: unknown): string | undefined {
  if (!parent || typeof parent !== "object") return undefined;
  const o = parent as Record<string, unknown>;
  if (o.title == null) return undefined;
  const t = String(o.title).trim();
  return t || undefined;
}

/** Maps backend JSON (snake_case) to domain Task */
export function mapTaskFromApi(raw: Record<string, unknown>): Task {
  const subtasksRaw = raw.subtasks;
  const nested = Array.isArray(subtasksRaw)
    ? (subtasksRaw as Record<string, unknown>[]).map((s) => mapTaskFromApi(s))
    : [];

  const assigneeFromNested = mapNestedUser(raw.assignee);
  const parentFromSnake = raw.parent_task;
  const parentFromCamel = raw.parentTask;
  const parentTaskTitle =
    mapParentTaskTitle(parentFromSnake) ?? mapParentTaskTitle(parentFromCamel);

  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    description: raw.description != null ? String(raw.description) : undefined,
    status: raw.status as TaskStatus,
    groupId: raw.group_id != null ? String(raw.group_id) : undefined,
    parentTaskId: raw.parent_task_id != null ? String(raw.parent_task_id) : undefined,
    parentTaskTitle,
    assigneeId: raw.assignee_id != null ? String(raw.assignee_id) : assigneeFromNested.id,
    assigneeName: assigneeFromNested.name,
    assigneeAvatarUrl: assigneeFromNested.avatarUrl,
    createdById: String(raw.created_by_id ?? ""),
    dueDate: iso(raw.due_date),
    submittedAt: iso(raw.submitted_at),
    reviewedAt: iso(raw.reviewed_at),
    reviewedById: raw.reviewed_by_id != null ? String(raw.reviewed_by_id) : undefined,
    expectedOutcomeType: raw.expected_outcome_type != null
      ? String(raw.expected_outcome_type) as Task["expectedOutcomeType"]
      : undefined,
    expectedOutcomeDescription: raw.expected_outcome_description != null
      ? String(raw.expected_outcome_description)
      : undefined,
    driveFolderId: raw.drive_folder_id != null ? String(raw.drive_folder_id) : undefined,
    subtasks: nested,
    createdAt: iso(raw.created_at) ?? "",
    updatedAt: iso(raw.updated_at) ?? "",
  };
}

export function mapOutcomeLinkFromApi(raw: Record<string, unknown>): TaskOutcomeLink {
  return {
    id: String(raw.id),
    taskId: String(raw.task_id ?? ""),
    url: String(raw.url ?? ""),
    label: raw.label != null ? String(raw.label) : undefined,
    createdById: raw.created_by_id != null ? String(raw.created_by_id) : undefined,
    createdAt: iso(raw.created_at) ?? "",
    updatedAt: iso(raw.updated_at) ?? "",
  };
}

export function mapOutcomeFileFromApi(raw: Record<string, unknown>): OutcomeFile {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    mimeType: String(raw.mimeType ?? raw.mime_type ?? ""),
    webViewLink: raw.webViewLink != null ? String(raw.webViewLink) : undefined,
    modifiedTime: raw.modifiedTime != null ? String(raw.modifiedTime) : undefined,
  };
}

export async function fetchUserTasks(
  token: string,
  filters?: { status?: TaskStatus; assignedInGroups?: boolean },
): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.assignedInGroups) params.set("assignedInGroups", "true");
  const qs = params.toString();
  const res = await fetch(`${getApiBase()}/tasks${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  const data = await handleJson<Record<string, unknown>[]>(res);
  return data.map((row) => mapTaskFromApi(row));
}

export async function fetchGroupTasks(groupId: string, token: string): Promise<Task[]> {
  const params = new URLSearchParams({ groupId });
  const res = await fetch(`${getApiBase()}/tasks?${params.toString()}`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  const data = await handleJson<Record<string, unknown>[]>(res);
  return data.map((row) => mapTaskFromApi(row));
}

export async function fetchTaskById(id: string, token: string): Promise<Task> {
  const res = await fetch(`${getApiBase()}/tasks/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapTaskFromApi(row);
}

export async function createTask(input: CreateTaskInput, token: string): Promise<Task> {
  const body: Record<string, unknown> = {
    title: input.title,
    expected_outcome_type: input.expectedOutcomeType,
  };
  if (input.description !== undefined) body.description = input.description;
  if (input.groupId !== undefined) body.group_id = input.groupId;
  if (input.assigneeId !== undefined) body.assignee_id = input.assigneeId;
  if (input.parentTaskId !== undefined) body.parent_task_id = input.parentTaskId;
  if (input.dueDate !== undefined && input.dueDate !== "") {
    body.due_date = new Date(input.dueDate).toISOString();
  }
  if (input.expectedOutcomeDescription !== undefined) {
    body.expected_outcome_description = input.expectedOutcomeDescription;
  }
  const res = await fetch(`${getApiBase()}/tasks`, {
    method: "POST",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapTaskFromApi(row);
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  token: string,
): Promise<Task> {
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.title = input.title;
  if (input.description !== undefined) body.description = input.description;
  if (input.status !== undefined) body.status = input.status;
  if (input.assigneeId !== undefined) body.assignee_id = input.assigneeId;
  if (input.dueDate !== undefined) {
    body.due_date =
      input.dueDate === "" ? null : new Date(input.dueDate).toISOString();
  }
  if (input.expectedOutcomeType !== undefined) {
    body.expected_outcome_type = input.expectedOutcomeType;
  }
  if (input.expectedOutcomeDescription !== undefined) {
    body.expected_outcome_description = input.expectedOutcomeDescription;
  }
  const res = await fetch(`${getApiBase()}/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapTaskFromApi(row);
}

// ---------------------------------------------------------------------------
// Outcome links
// ---------------------------------------------------------------------------

export async function fetchOutcomeLinks(taskId: string, token: string): Promise<TaskOutcomeLink[]> {
  const res = await fetch(`${getApiBase()}/tasks/${encodeURIComponent(taskId)}/outcome-links`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  const data = await handleJson<Record<string, unknown>[]>(res);
  return data.map((row) => mapOutcomeLinkFromApi(row));
}

export async function addOutcomeLink(
  taskId: string,
  input: AddOutcomeLinkInput,
  token: string,
): Promise<TaskOutcomeLink> {
  const body: Record<string, unknown> = { url: input.url };
  if (input.label !== undefined) body.label = input.label;
  const res = await fetch(`${getApiBase()}/tasks/${encodeURIComponent(taskId)}/outcome-links`, {
    method: "POST",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapOutcomeLinkFromApi(row);
}

export async function removeOutcomeLink(
  taskId: string,
  linkId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${getApiBase()}/tasks/${encodeURIComponent(taskId)}/outcome-links/${encodeURIComponent(linkId)}`,
    { method: "DELETE", headers: bearerHeaders(token) },
  );
  await handleVoid(res);
}

// ---------------------------------------------------------------------------
// Outcome files
// ---------------------------------------------------------------------------

export async function fetchOutcomeFiles(taskId: string, token: string): Promise<OutcomeFile[]> {
  const res = await fetch(`${getApiBase()}/tasks/${encodeURIComponent(taskId)}/files`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  const data = await handleJson<Record<string, unknown>[]>(res);
  return data.map((row) => mapOutcomeFileFromApi(row));
}

export async function uploadOutcomeFile(
  taskId: string,
  file: File,
  token: string,
): Promise<OutcomeFile> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${getApiBase()}/tasks/${encodeURIComponent(taskId)}/files`, {
    method: "POST",
    headers: bearerHeaders(token),
    body: formData,
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapOutcomeFileFromApi(row);
}

export async function deleteOutcomeFile(
  taskId: string,
  fileId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${getApiBase()}/tasks/${encodeURIComponent(taskId)}/files/${encodeURIComponent(fileId)}`,
    { method: "DELETE", headers: bearerHeaders(token) },
  );
  await handleVoid(res);
}

export async function submitTask(id: string, token: string): Promise<Task> {
  const res = await fetch(`${getApiBase()}/tasks/${encodeURIComponent(id)}/submit`, {
    method: "PATCH",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({}),
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapTaskFromApi(row);
}

export async function approveTask(
  id: string,
  input: ApproveTaskInput,
  token: string,
): Promise<Task> {
  const res = await fetch(`${getApiBase()}/tasks/${encodeURIComponent(id)}/approve`, {
    method: "PATCH",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(
      input.comment !== undefined
        ? { status: input.status, comment: input.comment }
        : { status: input.status },
    ),
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapTaskFromApi(row);
}

export async function fetchPendingReviewTasksForLeader(token: string): Promise<Task[]> {
  const res = await fetch(`${getApiBase()}/tasks?pendingReviewAsLeader=true`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  const data = await handleJson<Record<string, unknown>[]>(res);
  return data.map((row) => mapTaskFromApi(row));
}

export async function deleteTask(id: string, token: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
  await handleVoid(res);
}
