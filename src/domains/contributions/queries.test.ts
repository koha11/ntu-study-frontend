import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  contributionSummaryQueryOptions,
  groupLeaderboardQueryOptions,
  evaluationRoundsQueryOptions,
  myRoundRatingsQueryOptions,
  roundResultsQueryOptions,
  useRecordContributionMutation,
  useOpenEvaluationRoundMutation,
  useCloseEvaluationRoundMutation,
  useSubmitRoundRatingMutation,
} from "./queries";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("./contributions-api", () => ({
  fetchEvaluationRounds: vi.fn().mockResolvedValue([
    {
      roundStartedAt: "2026-01-01T00:00:00.000Z",
      dueDate: "2026-01-15T00:00:00.000Z",
      isClosed: false,
      ratedCount: 0,
      totalCount: 5,
    },
  ]),
  fetchMyRoundRatings: vi.fn().mockResolvedValue([
    { taskId: "t1", taskTitle: "Task 1", assigneeFullName: "Alice", score: null },
  ]),
  fetchRoundResults: vi.fn().mockResolvedValue([
    { assigneeId: "u1", assigneeFullName: "Alice", averageScore: 4.5 },
  ]),
  openEvaluationRound: vi.fn().mockResolvedValue({}),
  closeEvaluationRound: vi.fn().mockResolvedValue(undefined),
  submitRoundRating: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/shared/adapters/query-keys", () => ({
  contributionKeys: {
    summary: (userId: string, groupId: string) => ["contributions", "summary", userId, groupId],
    summaries: (groupId: string) => ["contributions", "summaries", groupId],
    leaderboard: (groupId: string, period: string) => ["contributions", "leaderboard", groupId, period],
    leaderboards: (groupId: string) => ["contributions", "leaderboards", groupId],
    evaluationRounds: (groupId: string) => ["contributions", "rounds", groupId],
    myRoundRatings: (groupId: string, r: string) => ["contributions", "myRatings", groupId, r],
    roundResults: (groupId: string, r: string) => ["contributions", "results", groupId, r],
  },
}));

describe("contributions/queries – factory functions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("contributionSummaryQueryOptions", () => {
    it("returns an object with queryKey and queryFn", () => {
      const opts = contributionSummaryQueryOptions("u1", "g1");
      expect(opts.queryKey).toBeDefined();
      expect(typeof opts.queryFn).toBe("function");
    });

    it("queryFn returns default summary when no data exists", async () => {
      const opts = contributionSummaryQueryOptions("u1", "g1");
      const promise = (opts.queryFn as () => Promise<unknown>)();
      vi.runAllTimers();
      const result = await promise;
      expect(result).toMatchObject({
        userId: "u1",
        groupId: "g1",
        totalPoints: 0,
        tasksCompleted: 0,
      });
    });
  });

  describe("groupLeaderboardQueryOptions", () => {
    it("returns an object with queryKey and queryFn", () => {
      const opts = groupLeaderboardQueryOptions("g1");
      expect(opts.queryKey).toBeDefined();
      expect(typeof opts.queryFn).toBe("function");
    });

    it("queryFn returns leaderboard with empty entries", async () => {
      const opts = groupLeaderboardQueryOptions("g1", "week");
      const promise = (opts.queryFn as () => Promise<unknown>)();
      vi.runAllTimers();
      const result = await promise;
      expect(result).toMatchObject({ groupId: "g1", period: "week", entries: [] });
    });

    it("defaults to 'week' period", async () => {
      const opts = groupLeaderboardQueryOptions("g1");
      const promise = (opts.queryFn as () => Promise<unknown>)();
      vi.runAllTimers();
      const result = (await promise) as { period: string };
      expect(result.period).toBe("week");
    });
  });

  describe("evaluationRoundsQueryOptions", () => {
    it("returns an object with queryKey and queryFn", () => {
      const opts = evaluationRoundsQueryOptions("g1");
      expect(opts.queryKey).toBeDefined();
      expect(typeof opts.queryFn).toBe("function");
    });

    it("queryFn calls fetchEvaluationRounds and returns rounds", async () => {
      const { fetchEvaluationRounds } = await import("./contributions-api");
      const opts = evaluationRoundsQueryOptions("g1");
      const result = await (opts.queryFn as () => Promise<unknown>)();
      expect(fetchEvaluationRounds).toHaveBeenCalledWith("g1", "test-token");
      expect(Array.isArray(result)).toBe(true);
    });

    it("is enabled when groupId is provided", () => {
      const opts = evaluationRoundsQueryOptions("g1");
      expect(opts.enabled).toBe(true);
    });

    it("is disabled when groupId is empty", () => {
      const opts = evaluationRoundsQueryOptions("");
      expect(opts.enabled).toBe(false);
    });
  });

  describe("myRoundRatingsQueryOptions", () => {
    it("returns an object with queryKey and queryFn", () => {
      const opts = myRoundRatingsQueryOptions("g1", "2026-01-01");
      expect(opts.queryKey).toBeDefined();
      expect(typeof opts.queryFn).toBe("function");
    });

    it("queryFn calls fetchMyRoundRatings and returns ratings", async () => {
      const { fetchMyRoundRatings } = await import("./contributions-api");
      const opts = myRoundRatingsQueryOptions("g1", "2026-01-01");
      const result = await (opts.queryFn as () => Promise<unknown>)();
      expect(fetchMyRoundRatings).toHaveBeenCalledWith("g1", "2026-01-01", "test-token");
      expect(Array.isArray(result)).toBe(true);
    });

    it("is disabled when groupId or roundStartedAt is empty", () => {
      const opts = myRoundRatingsQueryOptions("", "2026-01-01");
      expect(opts.enabled).toBe(false);
    });
  });

  describe("roundResultsQueryOptions", () => {
    it("returns an object with queryKey and queryFn", () => {
      const opts = roundResultsQueryOptions("g1", "2026-01-01");
      expect(opts.queryKey).toBeDefined();
      expect(typeof opts.queryFn).toBe("function");
    });

    it("queryFn calls fetchRoundResults and returns results", async () => {
      const { fetchRoundResults } = await import("./contributions-api");
      const opts = roundResultsQueryOptions("g1", "2026-01-01");
      const result = await (opts.queryFn as () => Promise<unknown>)();
      expect(fetchRoundResults).toHaveBeenCalledWith("g1", "2026-01-01", "test-token");
      expect(Array.isArray(result)).toBe(true);
    });

    it("is disabled when groupId or roundStartedAt is empty", () => {
      const opts = roundResultsQueryOptions("g1", "");
      expect(opts.enabled).toBe(false);
    });
  });
});

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("contributions/queries – mutation coverage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("useRecordContributionMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useRecordContributionMutation(), { wrapper });
    result.current.mutate({ userId: "u1", groupId: "g1", type: "task-completed", points: 10, description: "Coded the feature" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useOpenEvaluationRoundMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useOpenEvaluationRoundMutation(), { wrapper });
    result.current.mutate({ groupId: "g1", dueDateIso: "2026-06-15T00:00:00.000Z" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useCloseEvaluationRoundMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCloseEvaluationRoundMutation(), { wrapper });
    result.current.mutate({ groupId: "g1", roundStartedAt: "2026-06-01T00:00:00.000Z" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useSubmitRoundRatingMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useSubmitRoundRatingMutation(), { wrapper });
    result.current.mutate({ groupId: "g1", roundStartedAt: "2026-06-01T00:00:00.000Z", taskId: "t1", score: 8 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
