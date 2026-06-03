import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLogin } from "./useLogin";
import { useLogout } from "./useLogout";
import { useRegister } from "./useRegister";
import { useChangePassword } from "./useChangePassword";
import { usePatchProfile } from "./usePatchProfile";
import { useSyncGoogleProfile } from "./useSyncGoogleProfile";
import { useCurrentUser } from "./useCurrentUser";

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
  clearTokens: vi.fn(),
  setTokens: vi.fn(),
}));

vi.mock("../auth-api", () => ({
  fetchCurrentUser: vi.fn().mockResolvedValue({ id: "u1", name: "Alice", role: "student" }),
  patchCurrentUser: vi.fn().mockResolvedValue({ id: "u1", name: "Updated" }),
  loginUser: vi.fn().mockResolvedValue({ accessToken: "tok", refreshToken: "ref" }),
  registerUser: vi.fn().mockResolvedValue({ accessToken: "tok", refreshToken: "ref" }),
  logoutUser: vi.fn().mockResolvedValue(undefined),
  changePassword: vi.fn().mockResolvedValue(undefined),
  syncGoogleProfile: vi.fn().mockResolvedValue({}),
  getRequiredEnv: vi.fn().mockReturnValue({ apiBase: "http://localhost:3000" }),
  HttpError: class HttpError extends Error {
    constructor(public status: number, message: string) { super(message); }
  },
  normalizeApiBase: vi.fn((u: string) => u.replace(/\/$/, "")),
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("auth hooks – function coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("useCurrentUser returns query result", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useCurrentUser(), { wrapper });
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
  });

  it("useLogin returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useLogout returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useLogout(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useRegister returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useRegister(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useChangePassword returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useChangePassword(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("usePatchProfile returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => usePatchProfile(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("useSyncGoogleProfile returns mutation object", () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useSyncGoogleProfile(), { wrapper });
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });
});
