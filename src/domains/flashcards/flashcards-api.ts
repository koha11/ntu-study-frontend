import { HttpError, normalizeApiBase } from "@/domains/auth/auth-api";
import type {
  Flashcard,
  FlashcardSet,
  CreateFlashcardSetInput,
  CreateFlashcardInput,
  UpdateFlashcardSetInput,
  UpdateFlashcardInput,
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

function iso(d: unknown): string {
  if (d == null) return "";
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString();
  return "";
}

export function mapFlashcardFromApi(row: Record<string, unknown>): Flashcard {
  return {
    id: String(row.id ?? ""),
    setId: String(row.set_id ?? ""),
    front: String(row.front ?? ""),
    back: String(row.back ?? ""),
  };
}

export function mapFlashcardSetFromApi(row: Record<string, unknown>): FlashcardSet {
  const rawCards = row.flashcards;
  const cards: Flashcard[] = Array.isArray(rawCards)
    ? rawCards.map((c) => mapFlashcardFromApi(c as Record<string, unknown>))
    : [];
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    subject: row.subject != null ? String(row.subject) : undefined,
    description: row.description != null ? String(row.description) : undefined,
    ownerId: String(row.owner_id ?? ""),
    cardCount: Number(row.card_count ?? cards.length),
    cards,
    nextReviewAt:
      row.next_review_at != null && row.next_review_at !== ""
        ? iso(row.next_review_at)
        : null,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function fetchFlashcardSets(token: string): Promise<FlashcardSet[]> {
  const res = await fetch(`${getApiBase()}/flashcard-sets`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  const data = await handleJson<Record<string, unknown>[]>(res);
  return data.map((row) => mapFlashcardSetFromApi(row));
}

export async function fetchFlashcardSetById(id: string, token: string): Promise<FlashcardSet> {
  const res = await fetch(`${getApiBase()}/flashcard-sets/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: bearerHeaders(token),
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapFlashcardSetFromApi(row);
}

export async function createFlashcardSet(
  input: CreateFlashcardSetInput,
  token: string,
): Promise<FlashcardSet> {
  const body: Record<string, unknown> = { name: input.name };
  if (input.subject !== undefined) body.subject = input.subject;
  if (input.description !== undefined) body.description = input.description;
  const res = await fetch(`${getApiBase()}/flashcard-sets`, {
    method: "POST",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapFlashcardSetFromApi(row);
}

export async function updateFlashcardSet(
  setId: string,
  input: UpdateFlashcardSetInput,
  token: string,
): Promise<FlashcardSet> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.subject !== undefined) body.subject = input.subject;
  if (input.description !== undefined) body.description = input.description;
  const res = await fetch(`${getApiBase()}/flashcard-sets/${encodeURIComponent(setId)}`, {
    method: "PATCH",
    headers: bearerHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  const row = await handleJson<Record<string, unknown>>(res);
  return mapFlashcardSetFromApi(row);
}

export async function updateFlashcard(
  setId: string,
  cardId: string,
  input: UpdateFlashcardInput,
  token: string,
): Promise<Flashcard> {
  const body: Record<string, unknown> = {};
  if (input.front !== undefined) body.front = input.front;
  if (input.back !== undefined) body.back = input.back;
  const res = await fetch(
    `${getApiBase()}/flashcard-sets/${encodeURIComponent(setId)}/cards/${encodeURIComponent(cardId)}`,
    {
      method: "PATCH",
      headers: bearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    },
  );
  const row = await handleJson<Record<string, unknown>>(res);
  return mapFlashcardFromApi(row);
}

export async function deleteFlashcardSet(id: string, token: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/flashcard-sets/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: bearerHeaders(token),
  });
  await handleVoid(res);
}

export async function addFlashcard(
  setId: string,
  input: CreateFlashcardInput,
  token: string,
): Promise<Flashcard> {
  const res = await fetch(
    `${getApiBase()}/flashcard-sets/${encodeURIComponent(setId)}/cards`,
    {
      method: "POST",
      headers: bearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ front: input.front, back: input.back }),
    },
  );
  const row = await handleJson<Record<string, unknown>>(res);
  return mapFlashcardFromApi(row);
}

export async function deleteFlashcard(
  setId: string,
  cardId: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${getApiBase()}/flashcard-sets/${encodeURIComponent(setId)}/cards/${encodeURIComponent(cardId)}`,
    {
      method: "DELETE",
      headers: bearerHeaders(token),
    },
  );
  await handleVoid(res);
}

export type StartStudyResult = {
  setId: string;
  totalCards: number;
  nextReviewAt: string | null;
};

export function mapStartStudyFromApi(row: Record<string, unknown>): StartStudyResult {
  return {
    setId: String(row.set_id ?? ""),
    totalCards: Number(row.total_cards ?? 0),
    nextReviewAt:
      row.next_review_at != null && row.next_review_at !== ""
        ? iso(row.next_review_at)
        : null,
  };
}

export async function startFlashcardStudy(setId: string, token: string): Promise<StartStudyResult> {
  const res = await fetch(
    `${getApiBase()}/flashcard-sets/${encodeURIComponent(setId)}/study`,
    {
      method: "POST",
      headers: bearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({}),
    },
  );
  const row = await handleJson<Record<string, unknown>>(res);
  return mapStartStudyFromApi(row);
}

export type CompleteStudyResult = {
  id: string;
  score: number;
  nextReviewAt: string | null;
};

export function mapCompleteStudyFromApi(row: Record<string, unknown>): CompleteStudyResult {
  return {
    id: String(row.id ?? ""),
    score: Number(row.score ?? 0),
    nextReviewAt:
      row.next_review_at != null && row.next_review_at !== ""
        ? iso(row.next_review_at)
        : null,
  };
}

export async function completeFlashcardStudy(
  setId: string,
  score: number,
  token: string,
): Promise<CompleteStudyResult> {
  const res = await fetch(
    `${getApiBase()}/flashcard-sets/${encodeURIComponent(setId)}/study/complete`,
    {
      method: "POST",
      headers: bearerHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ score }),
    },
  );
  const row = await handleJson<Record<string, unknown>>(res);
  return mapCompleteStudyFromApi(row);
}
