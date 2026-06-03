import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { TaskList } from "./TaskList";
import type { Task } from "../types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Sample Task",
    status: "todo",
    createdById: "u1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    subtasks: [],
    ...overrides,
  };
}

describe("TaskList", () => {
  it("shows loading state", () => {
    render(<TaskList tasks={undefined} isLoading={true} error={null} />);
    expect(screen.getByText("Loading tasks...")).toBeInTheDocument();
  });

  it("shows error message when error is provided", () => {
    render(
      <TaskList
        tasks={undefined}
        isLoading={false}
        error={new Error("Network failure")}
      />,
    );
    expect(screen.getByText(/Network failure/)).toBeInTheDocument();
  });

  it("shows empty state when tasks array is empty", () => {
    render(<TaskList tasks={[]} isLoading={false} error={null} />);
    expect(screen.getByText("No tasks found")).toBeInTheDocument();
  });

  it("shows empty state when tasks is undefined and not loading", () => {
    render(<TaskList tasks={undefined} isLoading={false} error={null} />);
    expect(screen.getByText("No tasks found")).toBeInTheDocument();
  });

  it("renders task titles", () => {
    const tasks = [
      makeTask({ id: "t1", title: "First Task" }),
      makeTask({ id: "t2", title: "Second Task" }),
    ];
    render(<TaskList tasks={tasks} isLoading={false} error={null} />);
    expect(screen.getByText("First Task")).toBeInTheDocument();
    expect(screen.getByText("Second Task")).toBeInTheDocument();
  });

  it("passes onToggle to each TaskCard and calls it", () => {
    const onToggleTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: "t1" })]}
        isLoading={false}
        error={null}
        onToggleTask={onToggleTask}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Mark Done" }));
    expect(onToggleTask).toHaveBeenCalledWith("t1", "done");
  });

  it("passes onEditTask to each TaskCard and calls it", () => {
    const onEditTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: "t2" })]}
        isLoading={false}
        error={null}
        onEditTask={onEditTask}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEditTask).toHaveBeenCalledWith("t2");
  });

  it("passes onDeleteTask to each TaskCard and calls it", () => {
    const onDeleteTask = vi.fn();
    render(
      <TaskList
        tasks={[makeTask({ id: "t3" })]}
        isLoading={false}
        error={null}
        onDeleteTask={onDeleteTask}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDeleteTask).toHaveBeenCalledWith("t3");
  });
});
