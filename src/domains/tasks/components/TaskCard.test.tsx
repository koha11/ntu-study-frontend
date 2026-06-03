import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { TaskCard } from "./TaskCard";
import type { Task } from "../types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Default Task",
    status: "todo",
    createdById: "u1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    subtasks: [],
    ...overrides,
  };
}

describe("TaskCard", () => {
  it("renders the task title", () => {
    render(<TaskCard task={makeTask({ title: "Build feature" })} />);
    expect(screen.getByText("Build feature")).toBeInTheDocument();
  });

  it("renders the task status badge", () => {
    render(<TaskCard task={makeTask({ status: "in_progress" })} />);
    expect(screen.getByText("in_progress")).toBeInTheDocument();
  });

  it("shows due date when provided", () => {
    render(<TaskCard task={makeTask({ dueDate: "2026-06-15T00:00:00.000Z" })} />);
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it("hides due date section when not provided", () => {
    render(<TaskCard task={makeTask({ dueDate: undefined })} />);
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  it("shows assignee hint when assigneeId is set", () => {
    render(<TaskCard task={makeTask({ assigneeId: "u2" })} />);
    expect(screen.getByText("Assignee set")).toBeInTheDocument();
  });

  it("hides assignee hint when assigneeId is not set", () => {
    render(<TaskCard task={makeTask({ assigneeId: undefined })} />);
    expect(screen.queryByText("Assignee set")).not.toBeInTheDocument();
  });

  it("renders Mark Done button when onToggle is provided", () => {
    render(<TaskCard task={makeTask()} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Mark Done" })).toBeInTheDocument();
  });

  it("hides Mark Done button when onToggle is not provided", () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.queryByRole("button", { name: "Mark Done" })).not.toBeInTheDocument();
  });

  it("calls onToggle with task id and 'done' when Mark Done is clicked", () => {
    const onToggle = vi.fn();
    render(<TaskCard task={makeTask({ id: "t42" })} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark Done" }));
    expect(onToggle).toHaveBeenCalledWith("t42", "done");
  });

  it("renders Edit button when onEdit is provided", () => {
    render(<TaskCard task={makeTask()} onEdit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("calls onEdit with task id when Edit is clicked", () => {
    const onEdit = vi.fn();
    render(<TaskCard task={makeTask({ id: "t7" })} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith("t7");
  });

  it("renders Delete button when onDelete is provided", () => {
    render(<TaskCard task={makeTask()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls onDelete with task id when Delete is clicked", () => {
    const onDelete = vi.fn();
    render(<TaskCard task={makeTask({ id: "t9" })} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("t9");
  });

  it("hides Edit and Delete when handlers are not provided", () => {
    render(<TaskCard task={makeTask()} />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});