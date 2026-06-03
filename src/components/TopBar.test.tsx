import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import { TopBar } from "./TopBar";
import { UserRole } from "@/common/enums/user-role.enum";
import type { NotificationListItem } from "@/domains/notifications/notifications-api";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button type="button">{children}</button>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) =>
    <button type="button" onClick={onClick} disabled={disabled}>{children}</button>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockLogout = vi.fn();
const mockUseCurrentUser = vi.fn();
const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockUseNotificationsList = vi.fn();

vi.mock("@/domains/auth", () => ({
  useLogout: () => ({ mutate: mockLogout, isPending: false }),
  useCurrentUser: () => mockUseCurrentUser(),
}));

vi.mock("@/domains/notifications", () => ({
  useNotificationsList: () => mockUseNotificationsList(),
  useMarkNotificationAsReadMutation: () => ({ mutate: mockMarkRead, isPending: false }),
  useMarkAllNotificationsAsReadMutation: () => ({ mutate: mockMarkAllRead, isPending: false }),
}));

vi.mock("@/domains/notifications/navigate-from-notification", () => ({
  navigateFromNotification: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/domains/auth/token-storage", () => ({
  getAccessToken: vi.fn(() => "tok"),
}));

const mockMobileNavIsAdmin = vi.fn();
vi.mock("./MobileNav", () => ({
  MobileNav: ({ isAdmin }: { isAdmin: boolean }) => {
    mockMobileNavIsAdmin(isAdmin);
    return <button type="button" aria-label="Open navigation menu">Menu</button>;
  },
}));

const baseUser = {
  id: "u1",
  name: "Jane Doe",
  email: "jane@test.com",
  role: UserRole.USER,
  avatar: null,
  notificationEnabled: true,
  preferredLanguage: "en" as const,
  canvaConnected: false,
  driveTotalQuotaBytes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makeNotification = (overrides: Partial<NotificationListItem> = {}): NotificationListItem => ({
  id: "n1",
  type: "task_assigned",
  message: "You have a new task",
  isRead: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("TopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentUser.mockReturnValue({ data: baseUser });
    mockUseNotificationsList.mockReturnValue({ data: [], isLoading: false });
  });

  it("renders without crashing", () => {
    render(<TopBar />);
    expect(screen.getByRole("button", { name: "topBar.notifications" })).toBeInTheDocument();
  });

  it("does not show unread badge when all notifications are read", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ isRead: true })],
      isLoading: false,
    });
    render(<TopBar />);
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("shows unread count badge for unread notifications", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ isRead: false }), makeNotification({ id: "n2", isRead: false })],
      isLoading: false,
    });
    render(<TopBar />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows 99+ badge when unread count exceeds 99", () => {
    const many = Array.from({ length: 100 }, (_, i) => makeNotification({ id: `n${i}`, isRead: false }));
    mockUseNotificationsList.mockReturnValue({ data: many, isLoading: false });
    render(<TopBar />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("shows empty state when no notifications", () => {
    render(<TopBar />);
    expect(screen.getByText("topBar.noNotifications")).toBeInTheDocument();
  });

  it("shows mark-all-read button when there are unread notifications", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ isRead: false })],
      isLoading: false,
    });
    render(<TopBar />);
    expect(screen.getByText("topBar.readAll")).toBeInTheDocument();
  });

  it("calls markAllRead when mark-all-read button is clicked", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ isRead: false })],
      isLoading: false,
    });
    render(<TopBar />);
    fireEvent.click(screen.getByText("topBar.readAll"));
    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("shows notification message in the dropdown", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ message: "Task Alpha assigned" })],
      isLoading: false,
    });
    render(<TopBar />);
    expect(screen.getByText("Task Alpha assigned")).toBeInTheDocument();
  });

  it("view-all navigates to /notifications", () => {
    render(<TopBar />);
    fireEvent.click(screen.getByText("topBar.viewAll"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/notifications" });
  });

  it("shows user initials in avatar trigger", () => {
    render(<TopBar />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("shows first name in the trigger", () => {
    render(<TopBar />);
    expect(screen.getByText("Jane")).toBeInTheDocument();
  });

  it("does not show admin console item for regular users", () => {
    render(<TopBar />);
    expect(screen.queryByText("topBar.adminConsole")).not.toBeInTheDocument();
  });

  it("shows admin console item for admin users", () => {
    mockUseCurrentUser.mockReturnValue({
      data: { ...baseUser, role: UserRole.ADMIN },
    });
    render(<TopBar />);
    expect(screen.getByText("topBar.adminConsole")).toBeInTheDocument();
  });

  it("calls logout mutate on sign-out click", () => {
    render(<TopBar />);
    fireEvent.click(screen.getByText("topBar.signOut"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("navigates to /settings on profile settings click", () => {
    render(<TopBar />);
    fireEvent.click(screen.getByText("topBar.profileSettings"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/settings" });
  });

  it("navigates to /dashboard on dashboard click", () => {
    render(<TopBar />);
    fireEvent.click(screen.getByText("topBar.dashboard"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("renders the mobile nav hamburger button", () => {
    render(<TopBar />);
    expect(screen.getByRole("button", { name: "Open navigation menu" })).toBeInTheDocument();
  });

  it("passes isAdmin=false to MobileNav by default", () => {
    render(<TopBar />);
    expect(mockMobileNavIsAdmin).toHaveBeenCalledWith(false);
  });

  it("passes isAdmin=true to MobileNav when prop is set", () => {
    render(<TopBar isAdmin={true} />);
    expect(mockMobileNavIsAdmin).toHaveBeenCalledWith(true);
  });

  it("shows loading indicator while notifications are being fetched", () => {
    mockUseNotificationsList.mockReturnValue({ data: [], isLoading: true });
    render(<TopBar />);
    expect(screen.getByText("topBar.loading")).toBeInTheDocument();
  });

  it("calls markRead with notification id when per-notification read button is clicked", () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ id: "n1", isRead: false })],
      isLoading: false,
    });
    render(<TopBar />);
    fireEvent.click(screen.getByRole("button", { name: "topBar.read" }));
    expect(mockMarkRead).toHaveBeenCalledWith("n1");
  });

  it("calls navigateFromNotification and markRead when unread notification body is clicked", async () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ id: "n1", isRead: false, message: "You have a new task" })],
      isLoading: false,
    });
    render(<TopBar />);
    fireEvent.click(screen.getByText("You have a new task").closest("button")!);
    await waitFor(() => expect(mockMarkRead).toHaveBeenCalledWith("n1"));
  });

  it("does not call markRead when an already-read notification body is clicked", async () => {
    mockUseNotificationsList.mockReturnValue({
      data: [makeNotification({ id: "n1", isRead: true, message: "Already read task" })],
      isLoading: false,
    });
    render(<TopBar />);
    fireEvent.click(screen.getByText("Already read task").closest("button")!);
    await waitFor(() => expect(mockMarkRead).not.toHaveBeenCalled());
  });
});
