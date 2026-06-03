import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGoogleContactSuggestions } from "./useGoogleContactSuggestions";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
}));

vi.mock("../contacts-api", () => ({
  fetchContactSuggestions: vi.fn().mockResolvedValue([
    { name: "Alice", email: "alice@example.com" },
  ]),
}));

vi.mock("@/shared/adapters/query-keys", () => ({
  contactKeys: {
    suggestions: (q: string) => ["contacts", "suggestions", q],
  },
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useGoogleContactSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a query result object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useGoogleContactSuggestions("al", true),
      { wrapper },
    );
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("is disabled when enabled is false", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useGoogleContactSuggestions("alice", false),
      { wrapper },
    );
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("is disabled when search is shorter than 2 chars", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useGoogleContactSuggestions("a", true),
      { wrapper },
    );
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("is disabled when search is empty", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useGoogleContactSuggestions("", true),
      { wrapper },
    );
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("is disabled when no token is available", async () => {
    const { getAccessToken } = await import("@/domains/auth/token-storage");
    vi.mocked(getAccessToken).mockReturnValue(null);

    const wrapper = makeWrapper();
    const { result } = renderHook(
      () => useGoogleContactSuggestions("alice", true),
      { wrapper },
    );
    expect(result.current.fetchStatus).toBe("idle");
  });
});
