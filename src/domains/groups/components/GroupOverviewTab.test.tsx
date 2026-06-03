import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { GroupOverviewTab } from "./GroupOverviewTab";
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

const noopSave = vi.fn();

const { mockMutateAsync } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
}));

vi.mock("@/domains/groups/hooks/useCreateGroupMeetEvent", () => ({
  useCreateGroupMeetEvent: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

function renderOverview(
  props: Partial<React.ComponentProps<typeof GroupOverviewTab>> = {},
) {
  return render(
    <GroupOverviewTab
      groupId="group-test-id"
      driveFolderId={null}
      canvaFileUrl={null}
      docFileUrl={null}
      meetLink={null}
      reportDate={null}
      isLeader={false}
      groupLocked={false}
      onSave={noopSave}
      isSaving={false}
      {...props}
    />,
  );
}

describe("GroupOverviewTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({
      event_id: "evt-1",
      meet_link: "https://meet.google.com/aaa-bbbb-ccc",
      html_link: "https://calendar.google.com/event?eid=1",
      start: "2026-06-15T06:00:00.000Z",
      end: "2026-06-15T07:00:00.000Z",
    });
  });

  it("shows Open in Drive link when drive folder id is set", () => {
    renderOverview({ driveFolderId: "folder-abc" });

    const link = screen.getByRole("link", { name: /open in drive/i });
    expect(link).toHaveAttribute(
      "href",
      "https://drive.google.com/drive/folders/folder-abc",
    );
  });

  it("shows no Drive folder copy when drive folder id is missing", () => {
    renderOverview({ driveFolderId: null });

    expect(screen.getByText(/no drive folder linked/i)).toBeInTheDocument();
  });

  it("shows Open in Canva when canva URL is set", () => {
    renderOverview({
      canvaFileUrl: "https://www.canva.com/design/ABC/view?embed",
    });

    const link = screen.getByRole("link", { name: /open in canva/i });
    expect(link).toHaveAttribute(
      "href",
      "https://www.canva.com/design/ABC/view?embed",
    );
  });

  it("shows no Canva copy when URL is missing", () => {
    renderOverview({ canvaFileUrl: null });

    expect(screen.getByText(/no canva presentation linked/i)).toBeInTheDocument();
  });

  it("shows Meet link when meet_link is set", () => {
    renderOverview({
      meetLink: "https://meet.google.com/abc-defg-hij",
    });

    const link = screen.getByRole("link", { name: /open google meet/i });
    expect(link).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
  });

  it("shows no Meet copy when meet link is missing", () => {
    renderOverview({ meetLink: null });

    expect(screen.getByText(/no meeting link yet/i)).toBeInTheDocument();
  });

  it("shows formatted project due when report_date is set", () => {
    renderOverview({ reportDate: "2026-08-20" });

    expect(screen.getByText(/project due/i)).toBeInTheDocument();
    expect(screen.getByTestId("report-date-display")).toHaveTextContent("August 20, 2026");
  });

  it("shows no due date copy when report_date is missing", () => {
    renderOverview({ reportDate: null });

    expect(screen.getByText(/no project due date set/i)).toBeInTheDocument();
  });

  it("shows Open project doc when doc_file_url is set", () => {
    renderOverview({
      docFileUrl: "https://docs.google.com/document/d/xyz/edit",
    });

    const link = screen.getByRole("link", { name: /open project doc/i });
    expect(link).toHaveAttribute(
      "href",
      "https://docs.google.com/document/d/xyz/edit",
    );
  });

  it("hides quick-links editor for members", () => {
    renderOverview({ isLeader: false });

    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
  });

  it("shows editor and calls onSave for leader when group is not locked", () => {
    const onSave = vi.fn();
    renderOverview({
      isLeader: true,
      groupLocked: false,
      canvaFileUrl: "https://www.canva.com/design/OLD/view",
      docFileUrl: "https://docs.google.com/document/d/old/edit",
      meetLink: "https://meet.google.com/old",
      reportDate: "2026-01-15",
      onSave,
    });

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));

    fireEvent.change(screen.getByLabelText(/canva presentation url/i), {
      target: { value: "https://www.canva.com/design/NEW/view" },
    });
    fireEvent.change(screen.getByLabelText(/project doc url/i), {
      target: { value: "https://docs.google.com/document/d/new/edit" },
    });
    fireEvent.change(screen.getByLabelText(/meet link/i), {
      target: { value: "https://meet.google.com/new-link" },
    });
    fireEvent.change(screen.getByLabelText(/project due date/i), {
      target: { value: "2026-12-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith({
      canva_file_url: "https://www.canva.com/design/NEW/view",
      doc_file_url: "https://docs.google.com/document/d/new/edit",
      meet_link: "https://meet.google.com/new-link",
      report_date: "2026-12-01",
    });
  });

  it("hides editor when group is locked even for leader", () => {
    renderOverview({ isLeader: true, groupLocked: true });

    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
  });

  it("shows Schedule Meet & invite for leader when group is not locked", () => {
    renderOverview({ isLeader: true, groupLocked: false });

    expect(
      screen.getByRole("button", { name: /schedule meet & invite/i }),
    ).toBeInTheDocument();
  });

  it("hides Schedule Meet & invite for non-leader", () => {
    renderOverview({ isLeader: false });

    expect(
      screen.queryByRole("button", { name: /schedule meet & invite/i }),
    ).not.toBeInTheDocument();
  });

  it("submits meet schedule with start ISO and default end omitted", async () => {
    renderOverview({ isLeader: true, groupLocked: false, groupId: "my-gid" });

    fireEvent.click(screen.getByRole("button", { name: /schedule meet & invite/i }));

    fireEvent.change(screen.getByLabelText(/start \(required\)/i), {
      target: { value: "2026-08-20T10:30" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create & invite/i }));

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    const arg = mockMutateAsync.mock.calls[0][0] as {
      groupId: string;
      input: { start: string; end?: string };
    };
    expect(arg.groupId).toBe("my-gid");
    expect(arg.input.start).toMatch(/2026-08-20/);
    expect(arg.input.end).toBeUndefined();
  });
});
