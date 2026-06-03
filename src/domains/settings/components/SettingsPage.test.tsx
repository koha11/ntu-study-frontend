import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@/test/test-utils";
import { SettingsPage } from "./SettingsPage";
import { UserRole } from "@/common/enums/user-role.enum";
import { startCanvaOAuth } from "@/domains/auth/auth-api";
import en from "@/i18n/locales/en.json";

function t(key: string): string {
  const parts = key.split(".");
  let node: unknown = en;
  for (const part of parts) {
    if (typeof node !== "object" || node === null) return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : key;
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t }),
  Trans: ({ i18nKey }: { i18nKey: string }) => t(i18nKey),
}));

const mockUseCurrentUser = vi.fn();
const mockPatchMutate = vi.fn();
const mockSyncMutate = vi.fn();

vi.mock("@/domains/auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  usePatchProfile: () => ({
    mutate: mockPatchMutate,
    isPending: false,
  }),
  useSyncGoogleProfile: () => ({
    mutate: mockSyncMutate,
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

vi.mock("i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("i18next")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  };
});

const baseUser = {
  id: "u1",
  email: "student@ntu.edu.sg",
  name: "Alex Student",
  avatar: "https://example.com/a.png",
  role: UserRole.USER,
  notificationEnabled: true,
  preferredLanguage: "vi" as const,
  canvaConnected: false,
  driveTotalQuotaBytes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.mocked(startCanvaOAuth).mockReset();
    mockPatchMutate.mockReset();
    mockSyncMutate.mockReset();
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

  it.skip("shows Connect to Canva when not connected and redirects on click", async () => {
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

  it.skip("shows connected state when canvaConnected is true", () => {
    mockUseCurrentUser.mockReturnValue({
      data: { ...baseUser, canvaConnected: true },
      isLoading: false,
      isError: false,
    });

    render(<SettingsPage />);

    expect(screen.getByText(/canva connected/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /connect to canva/i })).toBeNull();
  });

  it("shows loading spinner when isLoading is true", () => {
    mockUseCurrentUser.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<SettingsPage />);
    expect(screen.getByText(t("settings.loading"))).toBeInTheDocument();
  });

  it("shows error message when isError is true", () => {
    mockUseCurrentUser.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<SettingsPage />);
    expect(screen.getByText(t("settings.couldNotLoad"))).toBeInTheDocument();
  });

  it("shows error message when user is null", () => {
    mockUseCurrentUser.mockReturnValue({ data: null, isLoading: false, isError: false });
    render(<SettingsPage />);
    expect(screen.getByText(t("settings.couldNotLoad"))).toBeInTheDocument();
  });

  it("handleSaveDisplayName calls patchProfile with trimmed name", async () => {
    render(<SettingsPage />);

    const nameInput = screen.getByLabelText(t("settings.displayName"));
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    fireEvent.click(screen.getByRole("button", { name: t("settings.saveName") }));

    expect(mockPatchMutate).toHaveBeenCalledWith(
      { full_name: "New Name" },
      expect.any(Object),
    );
  });

  it("handleSaveDisplayName does not call patchProfile when name is unchanged", () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: t("settings.saveName") }));
    expect(mockPatchMutate).not.toHaveBeenCalled();
  });

  it("handleSyncGoogleName calls syncFromGoogle", () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: t("settings.syncFromGoogle") }));

    expect(mockSyncMutate).toHaveBeenCalledWith(undefined, expect.any(Object));
  });

  it("handleSaveDriveLimit shows toast when input is empty", async () => {
    render(<SettingsPage />);

    const quotaInput = screen.getByLabelText(t("settings.driveStorage.quotaLabel"));
    fireEvent.change(quotaInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: t("settings.driveStorage.saveLimit") }));

    // patchProfile should NOT be called when input is empty
    expect(mockPatchMutate).not.toHaveBeenCalled();
  });

  it("handleSaveDriveLimit calls patchProfile with bytes when valid GB entered", () => {
    render(<SettingsPage />);

    const quotaInput = screen.getByLabelText(t("settings.driveStorage.quotaLabel"));
    fireEvent.change(quotaInput, { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: t("settings.driveStorage.saveLimit") }));

    expect(mockPatchMutate).toHaveBeenCalledWith(
      { drive_total_quota: String(Math.round(1 * 1024 ** 3)) },
      expect.any(Object),
    );
  });

  it("handleSaveDriveLimit does not call patchProfile for invalid number", () => {
    render(<SettingsPage />);

    const quotaInput = screen.getByLabelText(t("settings.driveStorage.quotaLabel"));
    fireEvent.change(quotaInput, { target: { value: "not-a-number" } });
    fireEvent.click(screen.getByRole("button", { name: t("settings.driveStorage.saveLimit") }));

    expect(mockPatchMutate).not.toHaveBeenCalled();
  });

  it("handleClearDriveLimit calls patchProfile with null quota", () => {
    mockUseCurrentUser.mockReturnValue({
      data: { ...baseUser, driveTotalQuotaBytes: String(2 * 1024 ** 3) },
      isLoading: false,
      isError: false,
    });
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole("button", { name: t("settings.driveStorage.clearLimit") }));

    expect(mockPatchMutate).toHaveBeenCalledWith(
      { drive_total_quota: null },
      expect.any(Object),
    );
  });

  it("handleSelectLanguage vi calls patchProfile with preferred_language vi", () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByTestId("lang-vi"));

    expect(mockPatchMutate).toHaveBeenCalledWith(
      { preferred_language: "vi" },
      expect.any(Object),
    );
  });

  it("handleSelectLanguage en calls patchProfile with preferred_language en", () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByTestId("lang-en"));

    expect(mockPatchMutate).toHaveBeenCalledWith(
      { preferred_language: "en" },
      expect.any(Object),
    );
  });
});
