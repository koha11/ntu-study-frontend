import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { GroupsListPage } from "./GroupsListPage";
import type { GroupSummary } from "../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
    className?: string;
  }) => (
    <a href={`${to}${params ? `/${params.groupId}` : ""}`} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({ onChange }: { onChange: (v: string) => void }) => (
    <input data-testid="date-picker" onChange={(e) => onChange(e.target.value)} />
  ),
}));

const mockCreateGroup = vi.fn();
const mockUseGroupsList = vi.fn();

vi.mock("@/domains/groups", () => ({
  useGroupsList: () => mockUseGroupsList(),
  useCreateGroup: () => ({ mutate: mockCreateGroup, isPending: false }),
}));

const makeGroup = (id: string, name: string): GroupSummary => ({
  id,
  name,
  description: `Description for ${name}`,
  member_count: 3,
  leader_id: "u1",
  created_at: "2026-01-01T00:00:00.000Z",
});

describe("GroupsListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGroupsList.mockReturnValue({ data: [], isLoading: false });
  });

  it("shows loading state while fetching", () => {
    mockUseGroupsList.mockReturnValue({ data: [], isLoading: true });
    render(<GroupsListPage />);
    expect(screen.getByText("groups.loading")).toBeInTheDocument();
  });

  it("renders page title when loaded", () => {
    render(<GroupsListPage />);
    expect(screen.getByText("groups.pageTitle")).toBeInTheDocument();
  });

  it("renders group cards when groups exist", () => {
    mockUseGroupsList.mockReturnValue({
      data: [makeGroup("g1", "Alpha Team"), makeGroup("g2", "Beta Squad")],
      isLoading: false,
    });
    render(<GroupsListPage />);
    expect(screen.getByText("Alpha Team")).toBeInTheDocument();
    expect(screen.getByText("Beta Squad")).toBeInTheDocument();
  });

  it("renders member count for each group", () => {
    mockUseGroupsList.mockReturnValue({
      data: [makeGroup("g1", "Alpha Team")],
      isLoading: false,
    });
    render(<GroupsListPage />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it("shows New Group button", () => {
    render(<GroupsListPage />);
    expect(screen.getByText("groups.newGroup")).toBeInTheDocument();
  });

  it("opens create group dialog when New Group is clicked", () => {
    render(<GroupsListPage />);
    fireEvent.click(screen.getByText("groups.newGroup"));
    expect(screen.getByText("groups.createGroupDesc")).toBeInTheDocument();
  });

  it("create button is disabled when name is empty", () => {
    render(<GroupsListPage />);
    fireEvent.click(screen.getByText("groups.newGroup"));
    const createBtn = screen.getByRole("button", { name: "groups.createGroup" });
    expect(createBtn).toBeDisabled();
  });

  it("enables create button when name is filled", () => {
    render(<GroupsListPage />);
    fireEvent.click(screen.getByText("groups.newGroup"));
    fireEvent.change(screen.getByPlaceholderText("groups.groupNamePlaceholder"), {
      target: { value: "My New Group" },
    });
    expect(screen.getByRole("button", { name: "groups.createGroup" })).not.toBeDisabled();
  });

  it("calls createGroup mutation when dialog form is submitted", () => {
    render(<GroupsListPage />);
    fireEvent.click(screen.getByText("groups.newGroup"));
    fireEvent.change(screen.getByPlaceholderText("groups.groupNamePlaceholder"), {
      target: { value: "New Group Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "groups.createGroup" }));
    expect(mockCreateGroup).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New Group Name" }),
      expect.anything(),
    );
  });
});
