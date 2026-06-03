import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { SubtaskItem } from "./SubtaskItem";
import type { SubTask } from "../types";

function makeSubtask(overrides: Partial<SubTask> = {}): SubTask {
  return {
    id: "sub-1",
    title: "Default Subtask",
    done: false,
    status: "todo",
    ...overrides,
  };
}

describe("SubtaskItem", () => {
  it("renders the subtask title", () => {
    render(<SubtaskItem subtask={makeSubtask({ title: "Write unit tests" })} />);
    expect(screen.getByText("Write unit tests")).toBeInTheDocument();
  });

  it("renders checkbox unchecked when done is false", () => {
    render(<SubtaskItem subtask={makeSubtask({ done: false })} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
  });

  it("renders checkbox checked when done is true", () => {
    render(<SubtaskItem subtask={makeSubtask({ done: true })} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("applies line-through style when done is true", () => {
    render(<SubtaskItem subtask={makeSubtask({ done: true, title: "Done task" })} />);
    const titleEl = screen.getByText("Done task");
    expect(titleEl.className).toContain("line-through");
  });

  it("does not apply line-through when done is false", () => {
    render(<SubtaskItem subtask={makeSubtask({ done: false, title: "Active task" })} />);
    const titleEl = screen.getByText("Active task");
    expect(titleEl.className).not.toContain("line-through");
  });

  it("calls onToggle with id and true when checkbox is checked", () => {
    const onToggle = vi.fn();
    render(<SubtaskItem subtask={makeSubtask({ id: "sub-5", done: false })} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("sub-5", true);
  });

  it("calls onToggle with id and false when checkbox is unchecked", () => {
    const onToggle = vi.fn();
    render(<SubtaskItem subtask={makeSubtask({ id: "sub-6", done: true })} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("sub-6", false);
  });

  it("does not crash when onToggle is not provided", () => {
    render(<SubtaskItem subtask={makeSubtask()} />);
    fireEvent.click(screen.getByRole("checkbox"));
    // no error
  });

  it("renders Edit button when onEdit is provided", () => {
    render(<SubtaskItem subtask={makeSubtask()} onEdit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("calls onEdit with subtask id when Edit is clicked", () => {
    const onEdit = vi.fn();
    render(<SubtaskItem subtask={makeSubtask({ id: "sub-7" })} onEdit={onEdit} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith("sub-7");
  });

  it("renders Delete button when onDelete is provided", () => {
    render(<SubtaskItem subtask={makeSubtask()} onDelete={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls onDelete with subtask id when Delete is clicked", () => {
    const onDelete = vi.fn();
    render(<SubtaskItem subtask={makeSubtask({ id: "sub-8" })} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("sub-8");
  });

  it("hides Edit and Delete buttons when handlers are not provided", () => {
    render(<SubtaskItem subtask={makeSubtask()} />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
