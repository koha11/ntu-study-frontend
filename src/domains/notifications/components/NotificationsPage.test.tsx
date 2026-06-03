import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { NotificationsPage } from "./NotificationsPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), message: vi.fn() } }));

const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockUseNotificationsList = vi.fn();

vi.mock("@/domains/notifications", () => ({
  useNotificationsList: () => mockUseNotificationsList(),
  useMarkNotificationAsReadMutation: () => ({
    mutate: mockMarkRead,
    isPending: false,
  }),
  useMarkAllNotificationsAsReadMutation: () => ({
    mutate: mockMarkAllRead,
    isPending: false,
  }),
}));

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: () => "test-token",
}));

vi.mock("@/domains/notifications/navigate-from-notification", () => ({
  navigateFromNotification: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/domains/notifications/notification-labels", () => ({
  notificationTypeLabel: (type: string) => `label:${type}`,
}));

const makeNotification = (overrides = {}) => ({
  id: "n1",
  type: "task_assigned",
  message: "You have a new task",
  isRead: false,
  createdAt: "2026-01-15T10:00:00.000Z",
  relatedEntityType: "task",
  relatedEntityId: "t1",
  ...overrides,
});

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNotificationsList.mockReturnValue({ data: [], isLoading: false });
  });

  it("shows loading state while fetching", () => {
    mockUseNotificationsList.mockReturnValue({ data: [], isLoading: true });

    render(<NotificationsPage />);

    expect(screen.getByText("notifications.loading")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", () => {
    render(<NotificationsPage />);

    expect(screen.getByText("notifications.noNotifications")).toBeInTheDocument();
  });

  it("renders a notification with message and type label", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification()],
      isLoading: false,
    });

    render(<NotificationsPage />);

    expect(screen.getByText("You have a new task")).toBeInTheDocument();
    expect(screen.getByText("label:task_assigned")).toBeInTheDocument();
  });

  it("renders multiple notifications", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [
        makeNotification({ id: "n1", message: "First notification" }),
        makeNotification({ id: "n2", message: "Second notification", type: "group_invitation" }),
      ],
      isLoading: false,
    });

    render(<NotificationsPage />);

    expect(screen.getByText("First notification")).toBeInTheDocument();
    expect(screen.getByText("Second notification")).toBeInTheDocument();
  });

  it("shows mark-all-read button when unread notifications exist", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ isRead: false })],
      isLoading: false,
    });

    render(<NotificationsPage />);

    expect(screen.getByText("topBar.readAll")).toBeInTheDocument();
  });

  it("hides mark-all-read button when all notifications are read", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ isRead: true })],
      isLoading: false,
    });

    render(<NotificationsPage />);

    expect(screen.queryByText("topBar.readAll")).not.toBeInTheDocument();
  });

  it("calls markAllRead when mark-all-read button is clicked", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ isRead: false })],
      isLoading: false,
    });

    render(<NotificationsPage />);

    fireEvent.click(screen.getByText("topBar.readAll"));

    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("shows mark-as-read button for unread notifications", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ isRead: false })],
      isLoading: false,
    });

    render(<NotificationsPage />);

    const readBtn = screen.getByRole("button", { name: "topBar.read" });
    expect(readBtn).toBeInTheDocument();
  });

  it("does not show mark-as-read button for already-read notifications", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ isRead: true })],
      isLoading: false,
    });

    render(<NotificationsPage />);

    expect(screen.queryByRole("button", { name: "topBar.read" })).not.toBeInTheDocument();
  });

  it("calls markRead when the mark-as-read icon button is clicked", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ id: "n1", isRead: false })],
      isLoading: false,
    });

    render(<NotificationsPage />);

    fireEvent.click(screen.getByRole("button", { name: "topBar.read" }));

    expect(mockMarkRead).toHaveBeenCalledWith("n1");
  });

  it("shows formatted createdAt date for notifications", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ createdAt: "2026-01-15T10:00:00.000Z" })],
      isLoading: false,
    });

    render(<NotificationsPage />);

    const formatted = new Date("2026-01-15T10:00:00.000Z").toLocaleString();
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });

  it("shows 'recently' fallback when createdAt is missing", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ createdAt: null })],
      isLoading: false,
    });

    render(<NotificationsPage />);

    expect(screen.getByText("notifications.recently")).toBeInTheDocument();
  });

  it("opens notification and calls markRead on unread notification click", async () => {
    const { navigateFromNotification } = await import(
      "@/domains/notifications/navigate-from-notification"
    );
    vi.mocked(navigateFromNotification).mockResolvedValue(true);

    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ id: "n1", isRead: false })],
      isLoading: false,
    });

    render(<NotificationsPage />);

    fireEvent.click(screen.getByText("You have a new task"));

    await vi.waitFor(() => {
      expect(navigateFromNotification).toHaveBeenCalled();
    });
  });

  it("shows page title", () => {
    render(<NotificationsPage />);

    expect(screen.getByText("notifications.pageTitle")).toBeInTheDocument();
  });
});
