import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFlashcardsList } from "./useFlashcardsList";
import { useCreateFlashcardSet } from "./useCreateFlashcardSet";
import { useDeleteFlashcardSet } from "./useDeleteFlashcardSet";
import { useAddFlashcard } from "./useAddFlashcard";
import { useDeleteFlashcard } from "./useDeleteFlashcard";
import { useFlashcardDetails } from "./useFlashcardDetails";
import { useCompleteFlashcardStudy } from "./useCompleteFlashcardStudy";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("../flashcards-api", () => ({
  fetchFlashcardSets: vi.fn().mockResolvedValue([]),
  fetchFlashcardSetDetails: vi.fn().mockResolvedValue(null),
  createFlashcardSet: vi.fn().mockResolvedValue({ id: "new-set" }),
  deleteFlashcardSet: vi.fn().mockResolvedValue(undefined),
  addFlashcard: vi.fn().mockResolvedValue({ id: "new-card" }),
  deleteFlashcard: vi.fn().mockResolvedValue(undefined),
  completeFlashcardStudy: vi.fn().mockResolvedValue(undefined),
  startFlashcardStudy: vi.fn().mockResolvedValue({}),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("flashcards hooks – function coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useFlashcardsList returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useFlashcardsList(), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useFlashcardsList accepts filter options", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useFlashcardsList({ subject: "Math" }),
      { wrapper },
    );
    expect(result.current).toHaveProperty("data");
  });

  it("useCreateFlashcardSet returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCreateFlashcardSet(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useDeleteFlashcardSet returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useDeleteFlashcardSet(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useAddFlashcard returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useAddFlashcard(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useDeleteFlashcard returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useDeleteFlashcard(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useFlashcardDetails returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useFlashcardDetails("set-1"), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useCompleteFlashcardStudy returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCompleteFlashcardStudy(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });
});
