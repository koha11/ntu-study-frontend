import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapFlashcardFromApi,
  mapFlashcardSetFromApi,
  mapStartStudyFromApi,
  mapCompleteStudyFromApi,
  mapSharedFlashcardSetFromApi,
  fetchFlashcardSets,
  fetchFlashcardSetById,
  createFlashcardSet,
  updateFlashcardSet,
  updateFlashcard,
  deleteFlashcardSet,
  deleteFlashcard,
  addFlashcard,
  startFlashcardStudy,
  completeFlashcardStudy,
  fetchGroupSharedFlashcardSets,
  shareFlashcardSetWithGroup,
  unshareFlashcardSetFromGroup,
} from "./flashcards-api";
import { HttpError } from "@/domains/auth/auth-api";

describe("flashcards-api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("mapFlashcardSetFromApi", () => {
    it("maps snake_case and nested flashcards", () => {
      const s = mapFlashcardSetFromApi({
        id: "s1",
        name: "Alg",
        owner_id: "u1",
        card_count: 2,
        subject: "CS",
        next_review_at: "2026-06-01T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
        flashcards: [
          {
            id: "c1",
            set_id: "s1",
            front: "Q",
            back: "A",
            created_at: "",
            updated_at: "",
          },
        ],
      });
      expect(s.id).toBe("s1");
      expect(s.ownerId).toBe("u1");
      expect(s.cardCount).toBe(2);
      expect(s.nextReviewAt).toBe("2026-06-01T00:00:00.000Z");
      expect(s.cards[0]?.front).toBe("Q");
    });

    it("uses card_count when flashcards omitted", () => {
      const s = mapFlashcardSetFromApi({
        id: "s1",
        name: "N",
        owner_id: "u1",
        card_count: 5,
        created_at: "",
        updated_at: "",
      });
      expect(s.cards).toEqual([]);
      expect(s.cardCount).toBe(5);
    });
  });

  describe("mapFlashcardFromApi", () => {
    it("maps fields", () => {
      const c = mapFlashcardFromApi({
        id: "c1",
        set_id: "s1",
        front: "F",
        back: "B",
      });
      expect(c.setId).toBe("s1");
    });
  });

  describe("mapStartStudyFromApi", () => {
    it("maps session fields", () => {
      const r = mapStartStudyFromApi({
        set_id: "s1",
        total_cards: 4,
        next_review_at: null,
      });
      expect(r.totalCards).toBe(4);
      expect(r.nextReviewAt).toBeNull();
    });
  });

  describe("mapCompleteStudyFromApi", () => {
    it("maps log fields", () => {
      const r = mapCompleteStudyFromApi({
        id: "l1",
        score: 90,
        next_review_at: "2026-07-01T00:00:00.000Z",
      });
      expect(r.score).toBe(90);
      expect(r.nextReviewAt).toBe("2026-07-01T00:00:00.000Z");
    });
  });

  describe("fetchFlashcardSets", () => {
    it("calls GET /flashcard-sets with Authorization", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchFlashcardSets("tok");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:3000/flashcard-sets");
      expect(init.method).toBe("GET");
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    });
  });

  describe("createFlashcardSet", () => {
    it("POSTs name and subject", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: "s1",
            name: "S",
            owner_id: "u1",
            card_count: 0,
            created_at: "",
            updated_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await createFlashcardSet({ name: "S", subject: "CS" }, "tok");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("POST");
      expect(JSON.parse((init.body as string) ?? "{}")).toEqual({
        name: "S",
        subject: "CS",
      });
    });
  });

  describe("deleteFlashcardSet", () => {
    it("DELETEs set", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        text: () => Promise.resolve(""),
      });
      vi.stubGlobal("fetch", fetchMock);

      await deleteFlashcardSet("s1", "tok");

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:3000/flashcard-sets/s1");
    });
  });

  describe("addFlashcard", () => {
    it("POSTs to /flashcard-sets/:id/cards", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: "c1",
            set_id: "s1",
            front: "Q",
            back: "A",
            created_at: "",
            updated_at: "",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await addFlashcard("s1", { front: "Q", back: "A" }, "tok");

      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/flashcard-sets/s1/cards");
    });
  });

  describe("startFlashcardStudy", () => {
    it("POSTs to study", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            set_id: "s1",
            total_cards: 3,
            next_review_at: null,
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const r = await startFlashcardStudy("s1", "tok");
      expect(r.totalCards).toBe(3);
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/study");
    });
  });

  describe("completeFlashcardStudy", () => {
    it("POSTs score", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            id: "l1",
            score: 70,
            next_review_at: "2026-06-01T00:00:00.000Z",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const r = await completeFlashcardStudy("s1", 70, "tok");
      expect(r.score).toBe(70);
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse((init.body as string) ?? "{}")).toEqual({ score: 70 });
    });
  });

  describe("fetchFlashcardSetById", () => {
    it("calls GET /flashcard-sets/:id with Authorization", async () => {
      const row = { id: "s1", name: "N", owner_id: "u1", card_count: 0, created_at: "", updated_at: "" };
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(row) });
      vi.stubGlobal("fetch", fetchMock);

      const s = await fetchFlashcardSetById("s1", "tok");

      expect(s.id).toBe("s1");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:3000/flashcard-sets/s1");
      expect(init.method).toBe("GET");
    });

    it("throws HttpError on non-ok response", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("not found"),
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(fetchFlashcardSetById("missing", "tok")).rejects.toBeInstanceOf(HttpError);
    });
  });

  describe("updateFlashcardSet", () => {
    it("PATCHes set with provided fields", async () => {
      const row = { id: "s1", name: "Updated", owner_id: "u1", card_count: 0, created_at: "", updated_at: "" };
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(row) });
      vi.stubGlobal("fetch", fetchMock);

      const s = await updateFlashcardSet("s1", { name: "Updated", subject: "Math" }, "tok");

      expect(s.name).toBe("Updated");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("http://localhost:3000/flashcard-sets/s1");
      expect(init.method).toBe("PATCH");
      expect(JSON.parse((init.body as string) ?? "{}")).toEqual({ name: "Updated", subject: "Math" });
    });
  });

  describe("updateFlashcard", () => {
    it("PATCHes card with provided fields", async () => {
      const row = { id: "c1", set_id: "s1", front: "NewF", back: "NewB" };
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(row) });
      vi.stubGlobal("fetch", fetchMock);

      const c = await updateFlashcard("s1", "c1", { front: "NewF", back: "NewB" }, "tok");

      expect(c.front).toBe("NewF");
      expect(c.back).toBe("NewB");
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/flashcard-sets/s1/cards/c1");
    });
  });

  describe("deleteFlashcard", () => {
    it("DELETEs the card", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, text: () => Promise.resolve("") });
      vi.stubGlobal("fetch", fetchMock);

      await deleteFlashcard("s1", "c1", "tok");

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/flashcard-sets/s1/cards/c1");
      expect(init.method).toBe("DELETE");
    });

    it("throws HttpError on non-ok response", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        text: () => Promise.resolve("forbidden"),
      });
      vi.stubGlobal("fetch", fetchMock);

      await expect(deleteFlashcard("s1", "c1", "tok")).rejects.toBeInstanceOf(HttpError);
    });
  });

  describe("mapSharedFlashcardSetFromApi", () => {
    it("maps shared set fields", () => {
      const entry = mapSharedFlashcardSetFromApi({
        share_id: "sh1",
        shared_at: "2026-01-01T00:00:00.000Z",
        set_id: "s1",
        group_id: "g1",
        owner_id: "u1",
        name: "SharedSet",
        subject: "Physics",
        description: "desc",
        card_count: 3,
      });

      expect(entry.shareId).toBe("sh1");
      expect(entry.setId).toBe("s1");
      expect(entry.groupId).toBe("g1");
      expect(entry.ownerId).toBe("u1");
      expect(entry.name).toBe("SharedSet");
      expect(entry.subject).toBe("Physics");
      expect(entry.description).toBe("desc");
      expect(entry.cardCount).toBe(3);
    });

    it("sets subject and description to undefined when null", () => {
      const entry = mapSharedFlashcardSetFromApi({
        share_id: "sh2",
        shared_at: "",
        set_id: "s2",
        group_id: "g2",
        owner_id: "u2",
        name: "No extras",
        subject: null,
        description: null,
        card_count: 0,
      });

      expect(entry.subject).toBeUndefined();
      expect(entry.description).toBeUndefined();
    });
  });

  describe("fetchGroupSharedFlashcardSets", () => {
    it("calls correct URL and maps results", async () => {
      const row = {
        share_id: "sh1", shared_at: "", set_id: "s1",
        group_id: "g1", owner_id: "u1", name: "Set1", card_count: 2,
      };
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([row]) });
      vi.stubGlobal("fetch", fetchMock);

      const result = await fetchGroupSharedFlashcardSets("g1", "tok");

      expect(result).toHaveLength(1);
      expect(result[0]?.shareId).toBe("sh1");
      const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/flashcard-sets/groups/g1/shared");
    });
  });

  describe("shareFlashcardSetWithGroup", () => {
    it("POSTs group_id and returns share info", async () => {
      const row = { share_id: "sh1", set_id: "s1", group_id: "g1", shared_at: "2026-01-01T00:00:00.000Z" };
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(row) });
      vi.stubGlobal("fetch", fetchMock);

      const result = await shareFlashcardSetWithGroup("s1", "g1", "tok");

      expect(result.shareId).toBe("sh1");
      expect(result.setId).toBe("s1");
      expect(result.groupId).toBe("g1");
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/flashcard-sets/s1/share");
      expect(JSON.parse((init.body as string) ?? "{}")).toEqual({ group_id: "g1" });
    });
  });

  describe("unshareFlashcardSetFromGroup", () => {
    it("DELETEs the share", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, text: () => Promise.resolve("") });
      vi.stubGlobal("fetch", fetchMock);

      await unshareFlashcardSetFromGroup("s1", "g1", "tok");

      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/flashcard-sets/s1/share/g1");
      expect(init.method).toBe("DELETE");
    });
  });

  describe("mapFlashcardSetFromApi – edge cases", () => {
    it("sets nextReviewAt to null when field is empty string", () => {
      const s = mapFlashcardSetFromApi({
        id: "s1", name: "N", owner_id: "u1", card_count: 0,
        created_at: "", updated_at: "", next_review_at: "",
      });
      expect(s.nextReviewAt).toBeNull();
    });

    it("sets nextReviewAt to null when field is null", () => {
      const s = mapFlashcardSetFromApi({
        id: "s1", name: "N", owner_id: "u1", card_count: 0,
        created_at: "", updated_at: "", next_review_at: null,
      });
      expect(s.nextReviewAt).toBeNull();
    });

    it("sets subject/description to undefined when null", () => {
      const s = mapFlashcardSetFromApi({
        id: "s1", name: "N", owner_id: "u1", card_count: 0,
        created_at: "", updated_at: "", subject: null, description: null,
      });
      expect(s.subject).toBeUndefined();
      expect(s.description).toBeUndefined();
    });
  });

  describe("mapStartStudyFromApi – nextReviewAt branches", () => {
    it("sets nextReviewAt when field is a non-empty string", () => {
      const r = mapStartStudyFromApi({ set_id: "s1", total_cards: 1, next_review_at: "2026-07-01T00:00:00.000Z" });
      expect(r.nextReviewAt).toBe("2026-07-01T00:00:00.000Z");
    });

    it("sets nextReviewAt to null when field is empty string", () => {
      const r = mapStartStudyFromApi({ set_id: "s1", total_cards: 0, next_review_at: "" });
      expect(r.nextReviewAt).toBeNull();
    });
  });

  describe("mapCompleteStudyFromApi – nextReviewAt null", () => {
    it("sets nextReviewAt to null when field is null", () => {
      const r = mapCompleteStudyFromApi({ id: "l1", score: 0, next_review_at: null });
      expect(r.nextReviewAt).toBeNull();
    });
  });

  describe("error handling", () => {
    it("fetchFlashcardSets throws HttpError with status on failure", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve("Unauthorized"),
      });
      vi.stubGlobal("fetch", fetchMock);

      const err = await fetchFlashcardSets("bad-token").catch((e: unknown) => e);
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(401);
    });
  });
});
