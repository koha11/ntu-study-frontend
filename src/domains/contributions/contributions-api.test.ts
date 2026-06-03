import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchEvaluationRounds,
  openEvaluationRound,
  closeEvaluationRound,
  fetchMyRoundRatings,
  submitRoundRating,
  fetchRoundResults,
} from "./contributions-api";
import { HttpError } from "@/domains/auth/auth-api";

describe("contributions-api", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const token = "bearer-token";
  const groupId = "g1";
  const roundStartedAt = "2026-05-01T00:00:00.000Z";

  describe("fetchEvaluationRounds", () => {
    it("maps response rows to EvaluationRound objects", async () => {
      const raw = [
        {
          round_started_at: "2026-05-01T00:00:00.000Z",
          due_date: "2026-05-15T00:00:00.000Z",
          is_round_closed: false,
          rated_count: 2,
          total_count: 5,
        },
      ];
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(raw),
        }),
      );

      const result = await fetchEvaluationRounds(groupId, token);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        roundStartedAt: "2026-05-01T00:00:00.000Z",
        dueDate: "2026-05-15T00:00:00.000Z",
        isClosed: false,
        ratedCount: 2,
        totalCount: 5,
      });
    });

    it("correctly maps is_round_closed truthy value", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                round_started_at: "2026-04-01T00:00:00.000Z",
                due_date: "2026-04-30T00:00:00.000Z",
                is_round_closed: true,
                rated_count: 5,
                total_count: 5,
              },
            ]),
        }),
      );

      const result = await fetchEvaluationRounds(groupId, token);
      expect(result[0].isClosed).toBe(true);
    });

    it("throws HttpError on non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          text: () => Promise.resolve(""),
        }),
      );

      await expect(fetchEvaluationRounds(groupId, token)).rejects.toThrow(HttpError);
    });

    it("calls the correct URL with groupId encoded", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchEvaluationRounds("group with space", token);

      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain("group%20with%20space");
    });
  });

  describe("openEvaluationRound", () => {
    it("returns mapped round data on success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              round_started_at: "2026-05-01T00:00:00.000Z",
              due_date: "2026-05-15T00:00:00.000Z",
              ratings_created: 8,
            }),
        }),
      );

      const result = await openEvaluationRound(groupId, "2026-05-15T00:00:00.000Z", token);

      expect(result).toEqual({
        roundStartedAt: "2026-05-01T00:00:00.000Z",
        dueDate: "2026-05-15T00:00:00.000Z",
        ratingsCreated: 8,
      });
    });

    it("sends due_date in request body", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            round_started_at: "",
            due_date: "2026-05-15T00:00:00.000Z",
            ratings_created: 0,
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await openEvaluationRound(groupId, "2026-05-15T00:00:00.000Z", token);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string) as Record<string, string>;
      expect(body.due_date).toBe("2026-05-15T00:00:00.000Z");
    });

    it("throws HttpError on non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 409,
          statusText: "Conflict",
          text: () => Promise.resolve("Round already open"),
        }),
      );

      await expect(
        openEvaluationRound(groupId, "2026-05-15T00:00:00.000Z", token),
      ).rejects.toThrow(HttpError);
    });
  });

  describe("closeEvaluationRound", () => {
    it("resolves without error on success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, status: 200 }),
      );

      await expect(closeEvaluationRound(groupId, roundStartedAt, token)).resolves.toBeUndefined();
    });

    it("uses PATCH method", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", fetchMock);

      await closeEvaluationRound(groupId, roundStartedAt, token);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("PATCH");
    });

    it("throws HttpError on non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          statusText: "Not Found",
          text: () => Promise.resolve(""),
        }),
      );

      await expect(closeEvaluationRound(groupId, roundStartedAt, token)).rejects.toThrow(HttpError);
    });
  });

  describe("fetchMyRoundRatings", () => {
    it("maps rating rows with flat assignee_full_name", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                task_id: "task-1",
                task_title: "Write report",
                assignee_full_name: "Alice",
                score: 4,
              },
            ]),
        }),
      );

      const result = await fetchMyRoundRatings(groupId, roundStartedAt, token);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        taskId: "task-1",
        taskTitle: "Write report",
        assigneeFullName: "Alice",
        score: 4,
      });
    });

    it("maps rating row with nested assignee object", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                task_id: "task-2",
                task_title: "Review code",
                assignee: { full_name: "Bob Smith" },
                score: null,
              },
            ]),
        }),
      );

      const result = await fetchMyRoundRatings(groupId, roundStartedAt, token);
      expect(result[0].assigneeFullName).toBe("Bob Smith");
      expect(result[0].score).toBeNull();
    });

    it("maps null score correctly", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                task_id: "t1",
                task_title: "Task",
                assignee_full_name: "Alice",
                score: null,
              },
            ]),
        }),
      );

      const result = await fetchMyRoundRatings(groupId, roundStartedAt, token);
      expect(result[0].score).toBeNull();
    });

    it("throws HttpError on non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Server Error",
          text: () => Promise.resolve(""),
        }),
      );

      await expect(fetchMyRoundRatings(groupId, roundStartedAt, token)).rejects.toThrow(HttpError);
    });
  });

  describe("submitRoundRating", () => {
    it("resolves without error on success", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, status: 200 }),
      );

      await expect(
        submitRoundRating(groupId, roundStartedAt, "task-1", 5, token),
      ).resolves.toBeUndefined();
    });

    it("sends score in PUT request body", async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      vi.stubGlobal("fetch", fetchMock);

      await submitRoundRating(groupId, roundStartedAt, "task-1", 3, token);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("PUT");
      const body = JSON.parse(init.body as string) as { score: number };
      expect(body.score).toBe(3);
    });

    it("throws HttpError on non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 422,
          statusText: "Unprocessable Entity",
          text: () => Promise.resolve("Invalid score"),
        }),
      );

      await expect(
        submitRoundRating(groupId, roundStartedAt, "task-1", 6, token),
      ).rejects.toThrow(HttpError);
    });
  });

  describe("fetchRoundResults", () => {
    it("maps aggregated result rows", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                assignee_id: "u1",
                assignee_full_name: "Alice",
                average_score: 4.5,
              },
              {
                assignee_id: "u2",
                assignee_full_name: "Bob",
                average_score: null,
              },
            ]),
        }),
      );

      const result = await fetchRoundResults(groupId, roundStartedAt, token);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        assigneeId: "u1",
        assigneeFullName: "Alice",
        averageScore: 4.5,
      });
      expect(result[1].averageScore).toBeNull();
    });

    it("throws HttpError on non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          text: () => Promise.resolve(""),
        }),
      );

      await expect(fetchRoundResults(groupId, roundStartedAt, token)).rejects.toThrow(HttpError);
    });
  });
});
