import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { GroupDetailView } from "./GroupDetailView";
import type { GroupDetail } from "../types";

const baseGroup: GroupDetail = {
  id: "g1",
  name: "Test Group",
  description: "A group description",
  status: "active",
  tags: ["math", "science"],
  leader_id: "u1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("GroupDetailView", () => {
  it("shows loading state when isLoading is true", () => {
    render(<GroupDetailView group={baseGroup} isLoading={true} />);
    expect(screen.getByText(/Loading group details/i)).toBeInTheDocument();
  });

  it("renders group name and description", () => {
    render(<GroupDetailView group={baseGroup} isLoading={false} />);
    expect(screen.getByText("Test Group")).toBeInTheDocument();
    expect(screen.getByText("A group description")).toBeInTheDocument();
  });

  it("renders group status", () => {
    render(<GroupDetailView group={baseGroup} isLoading={false} />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders tags when present", () => {
    render(<GroupDetailView group={baseGroup} isLoading={false} />);
    expect(screen.getByText("math")).toBeInTheDocument();
    expect(screen.getByText("science")).toBeInTheDocument();
  });

  it("does not render tags section when tags array is empty", () => {
    render(<GroupDetailView group={{ ...baseGroup, tags: [] }} isLoading={false} />);
    expect(screen.queryByText("math")).not.toBeInTheDocument();
  });

  it("renders member count when provided and greater than 0", () => {
    render(<GroupDetailView group={baseGroup} isLoading={false} memberCount={5} />);
    expect(screen.getByText("5 member(s)")).toBeInTheDocument();
  });

  it("does not render members section when memberCount is 0", () => {
    render(<GroupDetailView group={baseGroup} isLoading={false} memberCount={0} />);
    expect(screen.queryByText(/member\(s\)/i)).not.toBeInTheDocument();
  });

  it("renders Edit button when onEdit is provided", () => {
    const onEdit = vi.fn();
    render(<GroupDetailView group={baseGroup} isLoading={false} onEdit={onEdit} />);
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("calls onEdit when Edit button is clicked", () => {
    const onEdit = vi.fn();
    render(<GroupDetailView group={baseGroup} isLoading={false} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("does not render Edit button when onEdit is not provided", () => {
    render(<GroupDetailView group={baseGroup} isLoading={false} />);
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });
});
