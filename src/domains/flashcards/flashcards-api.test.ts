import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mapFlashcardFromApi,
  mapFlashcardSetFromApi,
  mapStartStudyFromApi,
  mapCompleteStudyFromApi,
  fetchFlashcardSets,
  createFlashcardSet,
  deleteFlashcardSet,
  addFlashcard,
  startFlashcardStudy,
  completeFlashcardStudy,
} from "./flashcards-api";

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
});
