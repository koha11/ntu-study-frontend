import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreateFlashcardSetMutation,
  useUpdateFlashcardSetMutation,
  useUpdateFlashcardMutation,
  useDeleteFlashcardSetMutation,
  useAddFlashcardMutation,
  useDeleteFlashcardMutation,
  useCompleteFlashcardStudyMutation,
  useShareFlashcardSetMutation,
  useUnshareFlashcardSetMutation,
} from "./queries";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: vi.fn(() => "test-token"),
}));

vi.mock("./flashcards-api", () => {
  const set = { id: "s1", name: "N", ownerId: "u1", cardCount: 0, cards: [], nextReviewAt: null, createdAt: "", updatedAt: "" };
  const card = { id: "c1", setId: "s1", front: "F", back: "B" };
  return {
    fetchFlashcardSets: vi.fn().mockResolvedValue([]),
    fetchFlashcardSetById: vi.fn().mockResolvedValue(set),
    createFlashcardSet: vi.fn().mockResolvedValue(set),
    updateFlashcardSet: vi.fn().mockResolvedValue(set),
    updateFlashcard: vi.fn().mockResolvedValue(card),
    deleteFlashcardSet: vi.fn().mockResolvedValue(undefined),
    addFlashcard: vi.fn().mockResolvedValue(card),
    deleteFlashcard: vi.fn().mockResolvedValue(undefined),
    completeFlashcardStudy: vi.fn().mockResolvedValue({ id: "l1", score: 80, nextReviewAt: null }),
    shareFlashcardSetWithGroup: vi.fn().mockResolvedValue({ shareId: "sh1", setId: "s1", groupId: "g1", sharedAt: "" }),
    unshareFlashcardSetFromGroup: vi.fn().mockResolvedValue(undefined),
    startFlashcardStudy: vi.fn().mockResolvedValue({ setId: "s1", totalCards: 3, nextReviewAt: null }),
    fetchGroupSharedFlashcardSets: vi.fn().mockResolvedValue([]),
  };
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("flashcards/queries – mutation coverage", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("useCreateFlashcardSetMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCreateFlashcardSetMutation(), { wrapper });
    result.current.mutate({ name: "New Set" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useUpdateFlashcardSetMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useUpdateFlashcardSetMutation(), { wrapper });
    result.current.mutate({ setId: "s1", input: { name: "Updated" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useUpdateFlashcardMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useUpdateFlashcardMutation(), { wrapper });
    result.current.mutate({ setId: "s1", cardId: "c1", input: { front: "New Q" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useDeleteFlashcardSetMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useDeleteFlashcardSetMutation(), { wrapper });
    result.current.mutate("s1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useAddFlashcardMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useAddFlashcardMutation(), { wrapper });
    result.current.mutate({ setId: "s1", input: { front: "Q", back: "A" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useDeleteFlashcardMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useDeleteFlashcardMutation(), { wrapper });
    result.current.mutate({ setId: "s1", cardId: "c1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useCompleteFlashcardStudyMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCompleteFlashcardStudyMutation(), { wrapper });
    result.current.mutate({ setId: "s1", score: 80 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useShareFlashcardSetMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useShareFlashcardSetMutation(), { wrapper });
    result.current.mutate({ setId: "s1", groupId: "g1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("useUnshareFlashcardSetMutation fires and succeeds", async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useUnshareFlashcardSetMutation(), { wrapper });
    result.current.mutate({ setId: "s1", groupId: "g1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
