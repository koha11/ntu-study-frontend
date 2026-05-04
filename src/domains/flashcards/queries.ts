/**
 * Flashcards Domain — TanStack Query + REST API
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { flashcardKeys } from "@/shared/adapters/query-keys";
import { getAccessToken } from "@/domains/auth/token-storage";
import {
  fetchFlashcardSets,
  fetchFlashcardSetById,
  createFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
  completeFlashcardStudy,
} from "./flashcards-api";
import type {
  CreateFlashcardSetInput,
  CreateFlashcardInput,
  UpdateFlashcardSetInput,
  UpdateFlashcardInput,
} from "./types";

function requireAccessToken(): string {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  return token;
}

export const flashcardsListQueryOptions = (filters?: { subject?: string; groupId?: string }) =>
  queryOptions({
    queryKey: flashcardKeys.list(filters),
    queryFn: async () => {
      const token = requireAccessToken();
      return fetchFlashcardSets(token);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

export const flashcardDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: flashcardKeys.detail(id),
    queryFn: async () => {
      const token = requireAccessToken();
      return fetchFlashcardSetById(id, token);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: Boolean(id),
  });

export const useCreateFlashcardSetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFlashcardSetInput) => {
      const token = requireAccessToken();
      return createFlashcardSet(input, token);
    },
    onSuccess: (newSet) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
      queryClient.setQueryData(flashcardKeys.detail(newSet.id), newSet);
    },
  });
};

export const useUpdateFlashcardSetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { setId: string; input: UpdateFlashcardSetInput }) => {
      const token = requireAccessToken();
      return updateFlashcardSet(params.setId, params.input, token);
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.detail(setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
};

export const useUpdateFlashcardMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      setId: string;
      cardId: string;
      input: UpdateFlashcardInput;
    }) => {
      const token = requireAccessToken();
      return updateFlashcard(params.setId, params.cardId, params.input, token);
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.detail(setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
};

export const useDeleteFlashcardSetMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = requireAccessToken();
      return deleteFlashcardSet(id, token);
    },
    onSuccess: (_, setId) => {
      queryClient.removeQueries({ queryKey: flashcardKeys.detail(setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
};

export const useAddFlashcardMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { setId: string; input: CreateFlashcardInput }) => {
      const token = requireAccessToken();
      return addFlashcard(params.setId, params.input, token);
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.detail(setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
};

export const useDeleteFlashcardMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { setId: string; cardId: string }) => {
      const token = requireAccessToken();
      return deleteFlashcard(params.setId, params.cardId, token);
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.detail(setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
};

export const useCompleteFlashcardStudyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { setId: string; score: number }) => {
      const token = requireAccessToken();
      return completeFlashcardStudy(params.setId, params.score, token);
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: flashcardKeys.detail(setId) });
      queryClient.invalidateQueries({ queryKey: flashcardKeys.lists() });
    },
  });
};
