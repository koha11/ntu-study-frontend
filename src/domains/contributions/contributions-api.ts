import { HttpError, normalizeApiBase } from "@/domains/auth/auth-api";
import type { AggregatedRatingResult, EvaluationRound, MyRatingEntry } from "./types";

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

function mapRoundRow(raw: Record<string, unknown>): EvaluationRound {
  return {
    roundStartedAt: String(raw.round_started_at ?? ""),
    dueDate: String(raw.due_date ?? ""),
    isClosed: Boolean(raw.is_round_closed),
    ratedCount: Number(raw.rated_count ?? 0),
    totalCount: Number(raw.total_count ?? 0),
  };
}

function pickAssigneeFullName(raw: Record<string, unknown>): string {
  const flat = raw.assignee_full_name ?? raw.assigneeFullName;
  if (typeof flat === "string" && flat.trim()) {
    return flat.trim();
  }
  const nested = raw.assignee ?? raw.assigneeUser;
  if (nested && typeof nested === "object") {
    const o = nested as Record<string, unknown>;
    const fromNested =
      o.full_name ?? o.fullName ?? o["full_name"] ?? o["fullName"] ?? o.name ?? o["name"];
    if (typeof fromNested === "string" && fromNested.trim()) {
      return fromNested.trim();
    }
  }
  return "";
}

function mapMyRatingRow(raw: Record<string, unknown>): MyRatingEntry {
  return {
    taskId: String(raw.task_id ?? raw.taskId ?? ""),
    taskTitle: String(raw.task_title ?? raw.taskTitle ?? ""),
    assigneeFullName: pickAssigneeFullName(raw),
    score: raw.score === null || raw.score === undefined ? null : Number(raw.score),
  };
}

function mapAggregatedRow(raw: Record<string, unknown>): AggregatedRatingResult {
  return {
    assigneeId: String(raw.assignee_id ?? ""),
    assigneeFullName: String(raw.assignee_full_name ?? ""),
    averageScore:
      raw.average_score === null || raw.average_score === undefined
        ? null
        : Number(raw.average_score),
  };
}

export async function fetchEvaluationRounds(
  groupId: string,
  token: string,
): Promise<EvaluationRound[]> {
  const res = await fetch(
    `${getApiBase()}/contributions/groups/${encodeURIComponent(groupId)}/rounds`,
    { method: "GET", headers: bearerHeaders(token) },
  );
  const data = await handleJson<Record<string, unknown>[]>(res);
  return data.map((row) => mapRoundRow(row));
}

export async function openEvaluationRound(
  groupId: string,
  dueDateIso: string,
  token: string,
): Promise<{ roundStartedAt: string; dueDate: string; ratingsCreated: number }> {
  const res = await fetch(
    `${getApiBase()}/contributions/groups/${encodeURIComponent(groupId)}/open-evaluation`,
    {
      method: "POST",
      headers: bearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ due_date: dueDateIso }),
    },
  );
  const raw = await handleJson<Record<string, unknown>>(res);
  return {
    roundStartedAt: String(raw.round_started_at ?? ""),
    dueDate: String(raw.due_date ?? ""),
    ratingsCreated: Number(raw.ratings_created ?? 0),
  };
}

export async function closeEvaluationRound(
  groupId: string,
  roundStartedAt: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${getApiBase()}/contributions/groups/${encodeURIComponent(groupId)}/rounds/${encodeURIComponent(roundStartedAt)}/close`,
    { method: "PATCH", headers: bearerHeaders(token) },
  );
  await handleVoid(res);
}

export async function fetchMyRoundRatings(
  groupId: string,
  roundStartedAt: string,
  token: string,
): Promise<MyRatingEntry[]> {
  const res = await fetch(
    `${getApiBase()}/contributions/groups/${encodeURIComponent(groupId)}/rounds/${encodeURIComponent(roundStartedAt)}/my-ratings`,
    { method: "GET", headers: bearerHeaders(token) },
  );
  const data = await handleJson<Record<string, unknown>[]>(res);
  return data.map((row) => mapMyRatingRow(row));
}

export async function submitRoundRating(
  groupId: string,
  roundStartedAt: string,
  taskId: string,
  score: number,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${getApiBase()}/contributions/groups/${encodeURIComponent(groupId)}/rounds/${encodeURIComponent(roundStartedAt)}/ratings/${encodeURIComponent(taskId)}`,
    {
      method: "PUT",
      headers: bearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ score }),
    },
  );
  await handleVoid(res);
}

export async function fetchRoundResults(
  groupId: string,
  roundStartedAt: string,
  token: string,
): Promise<AggregatedRatingResult[]> {
  const res = await fetch(
    `${getApiBase()}/contributions/groups/${encodeURIComponent(groupId)}/rounds/${encodeURIComponent(roundStartedAt)}/results`,
    { method: "GET", headers: bearerHeaders(token) },
  );
  const data = await handleJson<Record<string, unknown>[]>(res);
  return data.map((row) => mapAggregatedRow(row));
}
