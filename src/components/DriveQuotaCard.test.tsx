import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import { DriveQuotaCard } from "./DriveQuotaCard";

const fetchDriveQuota = vi.fn();
const refreshDriveQuota = vi.fn();

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: vi.fn(() => "test-token"),
}));

vi.mock("@/domains/drive/drive-quota-api", () => ({
  fetchDriveQuota: (...args: unknown[]) => fetchDriveQuota(...args),
  refreshDriveQuota: (...args: unknown[]) => refreshDriveQuota(...args),
}));

function renderCard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <DriveQuotaCard />
    </QueryClientProvider>,
  );
}

describe("DriveQuotaCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchDriveQuota.mockResolvedValue({
      total_bytes: String(16 * 1024 ** 3),
      used_bytes: String(Math.round(12.4 * 1024 ** 3)),
      quota_last_updated: "2026-05-01T10:00:00.000Z",
    });
    refreshDriveQuota.mockResolvedValue({
      total_bytes: String(16 * 1024 ** 3),
      used_bytes: String(Math.round(13 * 1024 ** 3)),
      quota_last_updated: "2026-05-01T11:00:00.000Z",
    });
  });

  it("loads quota and shows formatted usage", async () => {
    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("drive-quota-usage")).toHaveTextContent(
        "12.4 / 16.0 GB used",
      );
    });

    expect(fetchDriveQuota).toHaveBeenCalledWith("test-token");
  });

  it("refresh button triggers POST refresh and updates displayed quota", async () => {
    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("drive-quota-usage")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /refresh quota/i }));

    await waitFor(() => {
      expect(refreshDriveQuota).toHaveBeenCalledWith("test-token");
    });

    await waitFor(() => {
      expect(screen.getByTestId("drive-quota-usage")).toHaveTextContent(
        "13.0 / 16.0 GB used",
      );
    });
  });

  it("shows unavailable message when quota fields are null", async () => {
    fetchDriveQuota.mockResolvedValue({
      total_bytes: null,
      used_bytes: null,
      quota_last_updated: null,
    });

    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId("drive-quota-unavailable")).toBeInTheDocument();
    });
  });
});
