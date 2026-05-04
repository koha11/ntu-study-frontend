import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@/test/test-utils";
import { SettingsPage } from "./SettingsPage";
import { UserRole } from "@/common/enums/user-role.enum";
import { startCanvaOAuth } from "@/domains/auth/auth-api";

const mockUseCurrentUser = vi.fn();
const mockPatchMutate = vi.fn();

vi.mock("@/domains/auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  usePatchProfile: () => ({
    mutate: mockPatchMutate,
    isPending: false,
  }),
  useSyncGoogleProfile: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/domains/auth/auth-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/auth/auth-api")>();
  return {
    ...actual,
    startCanvaOAuth: vi.fn(),
  };
});

vi.mock("@/domains/auth/token-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/auth/token-storage")>();
  return {
    ...actual,
    getAccessToken: vi.fn(() => "access-token"),
  };
});

const baseUser = {
  id: "u1",
  email: "student@ntu.edu.sg",
  name: "Alex Student",
  avatar: "https://example.com/a.png",
  role: UserRole.USER,
  notificationEnabled: true,
  canvaConnected: false,
  driveTotalQuotaBytes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.mocked(startCanvaOAuth).mockReset();
    mockPatchMutate.mockReset();
    mockUseCurrentUser.mockReturnValue({
      data: baseUser,
      isLoading: false,
      isError: false,
    });
  });

  it("shows Google account name and email", () => {
    render(<SettingsPage />);

    expect(screen.getByDisplayValue("Alex Student")).toBeInTheDocument();
    expect(screen.getByText("student@ntu.edu.sg")).toBeInTheDocument();
    expect(screen.getByText(/signed in with google/i)).toBeInTheDocument();
  });

  it("notification switch reflects notificationEnabled and calls patch when toggled", () => {
    render(<SettingsPage />);

    const sw = screen.getByRole("switch", { name: /email notifications/i });
    expect(sw).toBeChecked();

    fireEvent.click(sw);

    expect(mockPatchMutate).toHaveBeenCalledWith({
      notification_enabled: false,
    });
  });

  it("shows Connect to Canva when not connected and redirects on click", async () => {
    vi.mocked(startCanvaOAuth).mockResolvedValue({
      authorizeUrl: "https://canva.example/oauth",
    });

    render(<SettingsPage />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /connect to canva/i }));
    });

    expect(startCanvaOAuth).toHaveBeenCalledWith("access-token");
    await waitFor(() => {
      expect(window.location.href).toBe("https://canva.example/oauth");
    });
  });

  it("shows connected state when canvaConnected is true", () => {
    mockUseCurrentUser.mockReturnValue({
      data: { ...baseUser, canvaConnected: true },
      isLoading: false,
      isError: false,
    });

    render(<SettingsPage />);

    expect(screen.getByText(/canva connected/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /connect to canva/i }),
    ).toBeNull();
  });
});
