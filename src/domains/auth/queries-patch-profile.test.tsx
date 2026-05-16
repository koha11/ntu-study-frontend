import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePatchProfileMutation } from "./queries";
import { patchCurrentUser } from "./auth-api";
import { UserRole } from "@/common/enums/user-role.enum";

vi.mock("./auth-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./auth-api")>();
  return {
    ...actual,
    patchCurrentUser: vi.fn(),
  };
});

vi.mock("./token-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./token-storage")>();
  return {
    ...actual,
    getAccessToken: vi.fn(() => "access-token"),
  };
});

describe("usePatchProfileMutation", () => {
  beforeEach(() => {
    vi.mocked(patchCurrentUser).mockReset();
  });

  it("sets current-user cache from PATCH response", async () => {
    vi.mocked(patchCurrentUser).mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      full_name: "Alice",
      avatar_url: null,
      role: "user",
      notification_enabled: false,
      preferred_language: "vi",
      canva_connected: true,
      drive_total_quota: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePatchProfileMutation(), {
      wrapper,
    });

    await result.current.mutateAsync({ notification_enabled: false });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(patchCurrentUser).toHaveBeenCalledWith("access-token", {
      notification_enabled: false,
    });

    const cached = queryClient.getQueryData<{
      notificationEnabled: boolean;
      canvaConnected: boolean;
    }>(["auth", "current-user"]);
    expect(cached?.notificationEnabled).toBe(false);
    expect(cached?.canvaConnected).toBe(true);
    expect(cached).toMatchObject({
      id: "u1",
      email: "a@b.com",
      name: "Alice",
      role: UserRole.USER,
    });
  });
});
