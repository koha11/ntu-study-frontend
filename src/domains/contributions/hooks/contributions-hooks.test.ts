import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGroupEvaluationRounds } from "./useGroupEvaluationRounds";
import { useOpenEvaluationRound } from "./useOpenEvaluationRound";
import { useCloseEvaluationRound } from "./useCloseEvaluationRound";
import { useSubmitRoundRating } from "./useSubmitRoundRating";
import { useMyRoundRatings } from "./useMyRoundRatings";
import { useRoundResults } from "./useRoundResults";
import { useRecordContribution } from "./useRecordContribution";
import { useContributionSummary } from "./useContributionSummary";
import { useGroupLeaderboard } from "./useGroupLeaderboard";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("../contributions-api", () => ({
  fetchEvaluationRounds: vi.fn().mockResolvedValue([]),
  openEvaluationRound: vi.fn().mockResolvedValue({
    roundStartedAt: "2026-01-01",
    dueDate: "2026-01-15",
    ratingsCreated: 0,
  }),
  closeEvaluationRound: vi.fn().mockResolvedValue(undefined),
  fetchMyRoundRatings: vi.fn().mockResolvedValue([]),
  submitRoundRating: vi.fn().mockResolvedValue(undefined),
  fetchRoundResults: vi.fn().mockResolvedValue([]),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("contributions hooks – function coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useGroupEvaluationRounds returns a query result object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useGroupEvaluationRounds("g1"), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useGroupEvaluationRounds is disabled when groupId is empty", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useGroupEvaluationRounds(""), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useOpenEvaluationRound returns a mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useOpenEvaluationRound(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useCloseEvaluationRound returns a mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCloseEvaluationRound(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useSubmitRoundRating returns a mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useSubmitRoundRating(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useMyRoundRatings returns a query result object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useMyRoundRatings("g1", "2026-01-01"),
      { wrapper },
    );
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useRoundResults returns a query result object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useRoundResults("g1", "2026-01-01"),
      { wrapper },
    );
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useRecordContribution returns a mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useRecordContribution(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useContributionSummary returns a query result object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useContributionSummary("u1", "g1"),
      { wrapper },
    );
    expect(result.current).toHaveProperty("data");
  });

  it("useGroupLeaderboard returns a query result object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useGroupLeaderboard("g1"),
      { wrapper },
    );
    expect(result.current).toHaveProperty("data");
  });
});
