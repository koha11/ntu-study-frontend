import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { DashboardPage } from "./DashboardPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.name) return `Hello, ${String(opts.name)}!`;
      return key;
    },
  }),
}));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/StatCard", () => ({
  StatCard: ({ label, value }: { label: string; value: number }) => (
    <div data-testid="stat-card">
      {label}: {value}
    </div>
  ),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), message: vi.fn() } }));

const mockUseGroupsList = vi.fn();
const mockUseTasksList = vi.fn();
const mockUseFlashcardsList = vi.fn();
const mockUseCurrentUser = vi.fn();
const mockUseQuery = vi.fn();

vi.mock("@/domains/groups", () => ({
  useGroupsList: () => mockUseGroupsList(),
}));

vi.mock("@/domains/tasks", () => ({
  useTasksList: () => mockUseTasksList(),
}));

vi.mock("@/domains/flashcards", () => ({
  useFlashcardsList: () => mockUseFlashcardsList(),
}));

vi.mock("@/domains/auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return { ...actual, useQuery: (...args: unknown[]) => mockUseQuery(...args) };
});

vi.mock("@/domains/notifications/navigate-from-notification", () => ({
  navigateFromNotification: vi.fn(),
}));

vi.mock("@/domains/notifications/notification-labels", () => ({
  notificationTypeLabel: (_type: string, t: (k: string) => string) =>
    t("notifications.types.task_assigned"),
}));

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

function setupDefaults() {
  mockUseGroupsList.mockReturnValue({ data: [], isLoading: false });
  mockUseTasksList.mockReturnValue({ data: [], isLoading: false });
  mockUseFlashcardsList.mockReturnValue({ data: [], isLoading: false });
  mockUseCurrentUser.mockReturnValue({
    data: { id: "u1", name: "Alice Student", role: "student" },
    isLoading: false,
  });
  mockUseQuery.mockReturnValue({ data: null, isLoading: false });
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaults();
  });

  it("shows loading state when any query is loading", () => {
    mockUseGroupsList.mockReturnValue({ data: [], isLoading: true });

    render(<DashboardPage />);

    expect(screen.getByText("dashboard.loading")).toBeInTheDocument();
  });

  it("renders greeting with user's first name", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Hello, Alice!")).toBeInTheDocument();
  });

  it("shows studentView label for student role", () => {
    render(<DashboardPage />);

    expect(screen.getByText("dashboard.studentView")).toBeInTheDocument();
  });

  it("shows adminView label for admin role", () => {
    mockUseCurrentUser.mockReturnValue({
      data: { id: "u1", name: "Admin User", role: "admin" },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("dashboard.adminView")).toBeInTheDocument();
  });

  it("shows stat cards", () => {
    render(<DashboardPage />);

    const cards = screen.getAllByTestId("stat-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it("counts active groups correctly", () => {
    mockUseGroupsList.mockReturnValue({
      data: [
        { id: "g1", name: "Group 1", member_count: 3 },
        { id: "g2", name: "Group 2", member_count: 2 },
      ],
      isLoading: false,
    });

    render(<DashboardPage />);

    const cards = screen.getAllByTestId("stat-card");
    expect(cards[0]).toHaveTextContent("2");
  });

  it("counts only non-done non-failed tasks assigned to current user", () => {
    mockUseTasksList.mockReturnValue({
      data: [
        { id: "t1", title: "Active", status: "todo", assigneeId: "u1", createdById: "other" },
        { id: "t2", title: "Done", status: "done", assigneeId: "u1", createdById: "other" },
        { id: "t3", title: "Other", status: "todo", assigneeId: "u2", createdById: "u2" },
      ],
      isLoading: false,
    });

    render(<DashboardPage />);

    const cards = screen.getAllByTestId("stat-card");
    expect(cards[1]).toHaveTextContent("1");
  });

  it("shows noActivity message when recentActivity is empty", () => {
    mockUseQuery.mockReturnValue({
      data: { recentActivity: [], upcoming: [] },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("dashboard.noActivity")).toBeInTheDocument();
  });

  it("shows notification activity items", () => {
    mockUseQuery.mockReturnValue({
      data: {
        recentActivity: [
          {
            kind: "notification",
            occurredAt: "2026-05-01T10:00:00.000Z",
            notification: {
              id: "n1",
              type: "task_assigned",
              message: "Task assigned to you",
              isRead: false,
            },
          },
        ],
        upcoming: [],
      },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Task assigned to you")).toBeInTheDocument();
  });

  it("shows drive activity items", () => {
    mockUseQuery.mockReturnValue({
      data: {
        recentActivity: [
          {
            kind: "drive_activity",
            occurredAt: "2026-05-01T10:00:00.000Z",
            driveActivity: {
              fileName: "report.pdf",
              fileId: "file-1",
              action: "uploaded",
              actorLabel: "alice@example.com",
              actorDisplayName: "Alice",
              groupId: "g1",
              groupName: "Team Alpha",
            },
          },
        ],
        upcoming: [],
      },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("shows noUpcoming message when upcoming is empty", () => {
    mockUseQuery.mockReturnValue({
      data: { recentActivity: [], upcoming: [] },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("dashboard.noUpcoming")).toBeInTheDocument();
  });

  it("shows upcoming task items", () => {
    mockUseQuery.mockReturnValue({
      data: {
        recentActivity: [],
        upcoming: [
          {
            kind: "task",
            date: "2026-06-15",
            task: {
              id: "t1",
              title: "Submit report",
              status: "todo",
              groupId: "g1",
              groupName: "NTU Group",
            },
          },
        ],
      },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Submit report")).toBeInTheDocument();
    expect(screen.getByText("NTU Group")).toBeInTheDocument();
  });

  it("shows upcoming calendar event items", () => {
    mockUseQuery.mockReturnValue({
      data: {
        recentActivity: [],
        upcoming: [
          {
            kind: "calendar_event",
            date: "2026-06-20",
            calendarEvent: {
              id: "evt-1",
              summary: "Team Meeting",
              start: { dateTime: "2026-06-20T09:00:00.000Z" },
              end: { dateTime: "2026-06-20T10:00:00.000Z" },
              htmlLink: "https://calendar.google.com/event?eid=1",
              groupId: "g1",
              groupName: "Alpha Team",
            },
          },
        ],
      },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Team Meeting")).toBeInTheDocument();
    expect(screen.getByText("Alpha Team")).toBeInTheDocument();
  });

  it("shows group cards in the quick-access grid", () => {
    mockUseGroupsList.mockReturnValue({
      data: [
        { id: "g1", name: "Group Alpha", description: "A group", member_count: 5 },
        { id: "g2", name: "Group Beta", description: null, member_count: 3 },
      ],
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Group Alpha")).toBeInTheDocument();
    expect(screen.getByText("Group Beta")).toBeInTheDocument();
  });

  it("uses fallback name when currentUser has no name", () => {
    mockUseCurrentUser.mockReturnValue({
      data: { id: "u1", name: null, role: "student" },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Hello, Student!")).toBeInTheDocument();
  });

  it("handles null dashboardData gracefully (shows empty sections)", () => {
    mockUseQuery.mockReturnValue({ data: null, isLoading: false });

    render(<DashboardPage />);

    expect(screen.getByText("dashboard.noActivity")).toBeInTheDocument();
    expect(screen.getByText("dashboard.noUpcoming")).toBeInTheDocument();
  });

  it("clicking a notification activity calls handleNotificationClick", async () => {
    const { navigateFromNotification } = await import("@/domains/notifications/navigate-from-notification");
    vi.mocked(navigateFromNotification).mockResolvedValue(true);

    mockUseQuery.mockReturnValue({
      data: {
        recentActivity: [
          {
            kind: "notification",
            occurredAt: "2026-05-01T10:00:00.000Z",
            notification: {
              id: "n1",
              type: "task_assigned",
              message: "Click me notification",
              isRead: false,
              relatedEntityType: "task",
              relatedEntityId: "t1",
            },
          },
        ],
        upcoming: [],
      },
      isLoading: false,
    });

    render(<DashboardPage />);
    fireEvent.click(screen.getByText("Click me notification").closest("button")!);

    expect(navigateFromNotification).toHaveBeenCalled();
  });

  it("clicking a drive activity with fileId opens Drive link in new tab", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    mockUseQuery.mockReturnValue({
      data: {
        recentActivity: [
          {
            kind: "drive_activity",
            occurredAt: "2026-05-01T10:00:00.000Z",
            driveActivity: {
              fileName: "notes.docx",
              fileId: "drive-file-123",
              action: "edited",
              actorLabel: "bob@example.com",
              groupId: "g1",
              groupName: "Team",
            },
          },
        ],
        upcoming: [],
      },
      isLoading: false,
    });

    render(<DashboardPage />);

    fireEvent.click(screen.getByText("notes.docx").closest("button")!);

    expect(openSpy).toHaveBeenCalledWith(
      "https://drive.google.com/file/d/drive-file-123",
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });
});
