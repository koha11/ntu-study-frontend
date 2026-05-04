import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CalendarTab } from "./CalendarTab";
import * as groupsApi from "../groups-api";

vi.mock("../groups-api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../groups-api")>();
  return {
    ...mod,
    fetchGroupCalendarEvents: vi.fn(),
  };
});

const fetchCal = vi.mocked(groupsApi.fetchGroupCalendarEvents);

function renderCalendarTab(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CalendarTab", () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue("test-jwt");
    fetchCal.mockReset();
    fetchCal.mockResolvedValue([]);
  });

  it("shows setup when no calendar id", () => {
    renderCalendarTab(
      <CalendarTab
        groupId="g1"
        groupName="G"
        google_calendar_id={null}
        meet_link={null}
        isLeader={true}
      />,
    );

    expect(screen.getByText(/Connect a Google Calendar/i)).toBeInTheDocument();
    expect(fetchCal).not.toHaveBeenCalled();
  });

  it("fetches events when calendar id is configured", async () => {
    renderCalendarTab(
      <CalendarTab
        groupId="g1"
        groupName="G"
        google_calendar_id="cal@group.calendar.google.com"
        meet_link={null}
        isLeader={false}
      />,
    );

    await waitFor(() => expect(fetchCal).toHaveBeenCalled());
  });

  it("shows view-only hint for non-leader", async () => {
    renderCalendarTab(
      <CalendarTab
        groupId="g1"
        groupName="G"
        google_calendar_id="cal@group.calendar.google.com"
        meet_link={null}
        isLeader={false}
      />,
    );

    await waitFor(() => expect(fetchCal).toHaveBeenCalled());
    expect(screen.getByText(/View-only/i)).toBeInTheDocument();
  });
});
