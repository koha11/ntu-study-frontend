import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { GroupCard } from "./GroupCard";
import type { GroupSummary } from "../types";

const makeGroup = (overrides: Partial<GroupSummary> = {}): GroupSummary => ({
  id: "g1",
  name: "Test Group",
  description: "A test group",
  member_count: 3,
  leader_id: "u1",
  created_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("GroupCard", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("renders group name", () => {
    render(<GroupCard group={makeGroup()} />);
    expect(screen.getByText("Test Group")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<GroupCard group={makeGroup({ description: "My description" })} />);
    expect(screen.getByText("My description")).toBeInTheDocument();
  });

  it("does not render description when absent", () => {
    render(<GroupCard group={makeGroup({ description: undefined })} />);
    expect(screen.queryByText("My description")).not.toBeInTheDocument();
  });

  it("renders View button when onSelect is provided", () => {
    render(<GroupCard group={makeGroup()} onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
  });

  it("calls onSelect with group id when View is clicked", () => {
    const onSelect = vi.fn();
    render(<GroupCard group={makeGroup({ id: "g42" })} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(onSelect).toHaveBeenCalledWith("g42");
  });

  it("renders Edit button when onEdit is provided", () => {
    render(<GroupCard group={makeGroup()} onEdit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("calls onEdit with group id when Edit is clicked", () => {
    const onEdit = vi.fn();
    render(<GroupCard group={makeGroup({ id: "g7" })} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith("g7");
  });

  it("renders Delete button when onDelete is provided", () => {
    render(<GroupCard group={makeGroup()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls onDelete with group id when Delete is clicked", () => {
    const onDelete = vi.fn();
    render(<GroupCard group={makeGroup({ id: "g9" })} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("g9");
  });

  it("does not render View/Edit/Delete buttons when handlers are absent", () => {
    render(<GroupCard group={makeGroup()} />);
    expect(screen.queryByRole("button", { name: "View" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
