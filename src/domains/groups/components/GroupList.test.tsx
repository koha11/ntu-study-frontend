import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { GroupList } from "./GroupList";
import type { GroupSummary } from "../types";

const makeGroup = (id: string, name: string): GroupSummary => ({
  id,
  name,
  description: `Desc for ${name}`,
  member_count: 2,
  leader_id: "u1",
  created_at: "2026-01-01T00:00:00.000Z",
});

describe("GroupList", () => {
  it("shows loading state", () => {
    render(<GroupList groups={undefined} isLoading error={null} />);
    expect(screen.getByText("Loading groups...")).toBeInTheDocument();
  });

  it("shows error message when error is provided", () => {
    render(
      <GroupList groups={undefined} isLoading={false} error={new Error("Network error")} />,
    );
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it("shows empty state when groups is empty array", () => {
    render(<GroupList groups={[]} isLoading={false} error={null} />);
    expect(screen.getByText("No groups found")).toBeInTheDocument();
  });

  it("shows empty state when groups is undefined and not loading", () => {
    render(<GroupList groups={undefined} isLoading={false} error={null} />);
    expect(screen.getByText("No groups found")).toBeInTheDocument();
  });

  it("renders all group names", () => {
    const groups = [makeGroup("g1", "Alpha Team"), makeGroup("g2", "Beta Squad")];
    render(<GroupList groups={groups} isLoading={false} error={null} />);
    expect(screen.getByText("Alpha Team")).toBeInTheDocument();
    expect(screen.getByText("Beta Squad")).toBeInTheDocument();
  });

  it("calls onSelectGroup with group id when View is clicked", () => {
    const onSelect = vi.fn();
    render(
      <GroupList
        groups={[makeGroup("g1", "Alpha Team")]}
        isLoading={false}
        error={null}
        onSelectGroup={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(onSelect).toHaveBeenCalledWith("g1");
  });

  it("calls onEditGroup with group id when Edit is clicked", () => {
    const onEdit = vi.fn();
    render(
      <GroupList
        groups={[makeGroup("g1", "Alpha Team")]}
        isLoading={false}
        error={null}
        onEditGroup={onEdit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith("g1");
  });

  it("calls onDeleteGroup with group id when Delete is clicked", () => {
    const onDelete = vi.fn();
    render(
      <GroupList
        groups={[makeGroup("g1", "Alpha Team")]}
        isLoading={false}
        error={null}
        onDeleteGroup={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("g1");
  });
});
