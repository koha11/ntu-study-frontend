/**
 * Contributions Domain - TanStack Query Configuration
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { contributionKeys } from "@/shared/adapters/query-keys";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  closeEvaluationRound,
  fetchEvaluationRounds,
  fetchMyRoundRatings,
  fetchRoundResults,
  openEvaluationRound,
  submitRoundRating,
} from "./contributions-api";
import type {
  ContributionSummary,
  GroupLeaderboard,
  CreateContributionInput,
  AggregatedRatingResult,
  EvaluationRound,
  MyRatingEntry,
} from "./types";

function requireAccessToken(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
}

// Mock contributions data
const mockContributions = new Map<string, ContributionSummary>();

/**
 * Query: Get contribution summary for a user in a group
 */
export const contributionSummaryQueryOptions = (userId: string, groupId: string) =>
  queryOptions({
    queryKey: contributionKeys.summary(userId, groupId),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const key = `${userId}:${groupId}`;
      return (
        mockContributions.get(key) || {
          userId,
          groupId,
          totalPoints: 0,
          tasksCompleted: 0,
          flashcardsReviewed: 0,
          comments: 0,
          contributions: [],
        }
      );
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });

/**
 * Query: Get group leaderboard
 */
export const groupLeaderboardQueryOptions = (
  groupId: string,
  period: "week" | "month" | "all-time" = "week",
) =>
  queryOptions({
    queryKey: contributionKeys.leaderboard(groupId, period),
    queryFn: async (): Promise<GroupLeaderboard> => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return {
        groupId,
        period,
        entries: [],
      };
    },
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 45,
  });

/**
 * Mutation: Create/record a contribution
 */
export const useRecordContributionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContributionInput) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Mock: add points to summary
      const key = `${input.userId}:${input.groupId}`;
      const current = mockContributions.get(key) || {
        userId: input.userId,
        groupId: input.groupId,
        totalPoints: 0,
        tasksCompleted: 0,
        flashcardsReviewed: 0,
        comments: 0,
        contributions: [],
      };
      current.totalPoints += input.points;
      mockContributions.set(key, current);
      return current;
    },
    onSuccess: (summary) => {
      queryClient.invalidateQueries({ queryKey: contributionKeys.summaries(summary.groupId) });
      queryClient.invalidateQueries({ queryKey: contributionKeys.leaderboards(summary.groupId) });
    },
  });
};

export const evaluationRoundsQueryOptions = (groupId: string) =>
  queryOptions({
    queryKey: contributionKeys.evaluationRounds(groupId),
    queryFn: async (): Promise<EvaluationRound[]> => {
      const token = requireAccessToken();
      return fetchEvaluationRounds(groupId, token);
    },
    enabled: Boolean(groupId),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
  });

export const myRoundRatingsQueryOptions = (groupId: string, roundStartedAt: string) =>
  queryOptions({
    queryKey: contributionKeys.myRoundRatings(groupId, roundStartedAt),
    queryFn: async (): Promise<MyRatingEntry[]> => {
      const token = requireAccessToken();
      return fetchMyRoundRatings(groupId, roundStartedAt, token);
    },
    enabled: Boolean(groupId && roundStartedAt),
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 10,
  });

export const roundResultsQueryOptions = (groupId: string, roundStartedAt: string) =>
  queryOptions({
    queryKey: contributionKeys.roundResults(groupId, roundStartedAt),
    queryFn: async (): Promise<AggregatedRatingResult[]> => {
      const token = requireAccessToken();
      return fetchRoundResults(groupId, roundStartedAt, token);
    },
    enabled: Boolean(groupId && roundStartedAt),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 15,
  });

export const useOpenEvaluationRoundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; dueDateIso: string }) => {
      const token = requireAccessToken();
      return openEvaluationRound(input.groupId, input.dueDateIso, token);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: contributionKeys.evaluationRounds(variables.groupId),
      });
    },
  });
};

export const useCloseEvaluationRoundMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { groupId: string; roundStartedAt: string }) => {
      const token = requireAccessToken();
      await closeEvaluationRound(input.groupId, input.roundStartedAt, token);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: contributionKeys.evaluationRounds(variables.groupId),
      });
      void queryClient.invalidateQueries({
        queryKey: contributionKeys.myRoundRatings(
          variables.groupId,
          variables.roundStartedAt,
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: contributionKeys.roundResults(
          variables.groupId,
          variables.roundStartedAt,
        ),
      });
    },
  });
};

export const useSubmitRoundRatingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      groupId: string;
      roundStartedAt: string;
      rateeId: string;
      score: number;
    }) => {
      const token = requireAccessToken();
      await submitRoundRating(
        input.groupId,
        input.roundStartedAt,
        input.rateeId,
        input.score,
        token,
      );
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: contributionKeys.myRoundRatings(
          variables.groupId,
          variables.roundStartedAt,
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: contributionKeys.evaluationRounds(variables.groupId),
      });
    },
  });
};
