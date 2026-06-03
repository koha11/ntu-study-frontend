import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { GroupKanbanBoard } from "./GroupKanbanBoard";
import type { Task } from "../types";

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSensor: vi.fn(),
  useSensors: () => [],
  PointerSensor: vi.fn(),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Translate: { toString: () => "" } },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const mockUpdateStatus = vi.fn();
const mockSubmitTask = vi.fn();
const mockApproveTask = vi.fn();
const mockCreateTask = vi.fn();
const mockUpdateTask = vi.fn();

vi.mock("../queries", () => ({
  useUpdateTaskStatusMutation: () => ({ mutate: mockUpdateStatus }),
  useSubmitTaskMutation: () => ({ mutate: mockSubmitTask }),
  useApproveTaskMutation: () => ({ mutate: mockApproveTask }),
  useCreateTaskMutation: () => ({ mutate: mockCreateTask, isPending: false }),
  useUpdateTaskMutation: () => ({ mutate: mockUpdateTask, isPending: false }),
}));

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: "t1",
  title: "Default Task",
  status: "todo",
  createdById: "u1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  subtasks: [],
  groupId: "g1",
  ...overrides,
});

const defaultProps = {
  tasks: [],
  isLeader: false,
  groupId: "g1",
  groupName: "Alpha Team",
  memberOptions: [],
};

describe("GroupKanbanBoard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders all five kanban columns", () => {
    render(<GroupKanbanBoard {...defaultProps} />);
    expect(screen.getByText("To do")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("shows Empty placeholder in columns with no tasks", () => {
    render(<GroupKanbanBoard {...defaultProps} />);
    const emptyItems = screen.getAllByText("Empty");
    expect(emptyItems.length).toBe(5);
  });

  it("renders a task card in the correct column", () => {
    const tasks = [makeTask({ id: "t1", title: "My Task", status: "todo" })];
    render(<GroupKanbanBoard {...defaultProps} tasks={tasks} />);
    expect(screen.getByText("My Task")).toBeInTheDocument();
  });

  it("renders a task in in_progress column", () => {
    const tasks = [makeTask({ id: "t2", title: "In Progress Task", status: "in_progress" })];
    render(<GroupKanbanBoard {...defaultProps} tasks={tasks} />);
    expect(screen.getByText("In Progress Task")).toBeInTheDocument();
  });

  it("renders multiple tasks across different columns", () => {
    const tasks = [
      makeTask({ id: "t1", title: "Todo Task", status: "todo" }),
      makeTask({ id: "t2", title: "Done Task", status: "done" }),
    ];
    render(<GroupKanbanBoard {...defaultProps} tasks={tasks} />);
    expect(screen.getByText("Todo Task")).toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();
  });

  it("renders context label (groupName) on task cards", () => {
    const tasks = [makeTask({ id: "t1", title: "Task with Label", status: "todo" })];
    render(<GroupKanbanBoard {...defaultProps} tasks={tasks} groupName="Alpha Team" />);
    expect(screen.getByText("Alpha Team")).toBeInTheDocument();
  });

  it("uses 'Group' as fallback when groupName is empty", () => {
    const tasks = [makeTask({ id: "t1", title: "Task", status: "todo" })];
    render(<GroupKanbanBoard {...defaultProps} tasks={tasks} groupName="" />);
    expect(screen.getByText("Group")).toBeInTheDocument();
  });

  it("shows edit button for leader on any task", () => {
    const tasks = [
      makeTask({ id: "t1", title: "My Task", status: "todo", createdById: "other-user" }),
    ];
    render(
      <GroupKanbanBoard
        {...defaultProps}
        tasks={tasks}
        isLeader
        currentUserId="leader-id"
      />,
    );
    expect(screen.getByLabelText("Edit task")).toBeInTheDocument();
  });

  it("shows edit button for task assignee", () => {
    const tasks = [
      makeTask({
        id: "t1",
        title: "My Task",
        status: "todo",
        assigneeId: "current-user",
        createdById: "other-user",
      }),
    ];
    render(
      <GroupKanbanBoard
        {...defaultProps}
        tasks={tasks}
        isLeader={false}
        currentUserId="current-user"
      />,
    );
    expect(screen.getByLabelText("Edit task")).toBeInTheDocument();
  });

  it("does not show edit button for non-assignee non-leader", () => {
    const tasks = [
      makeTask({
        id: "t1",
        title: "Other Person Task",
        status: "todo",
        assigneeId: "other-user",
        createdById: "another-user",
      }),
    ];
    render(
      <GroupKanbanBoard
        {...defaultProps}
        tasks={tasks}
        isLeader={false}
        currentUserId="current-user"
      />,
    );
    expect(screen.queryByLabelText("Edit task")).not.toBeInTheDocument();
  });

  it("renders subtask with parent task badge", () => {
    const parent = makeTask({ id: "parent-1", title: "Parent Task", status: "in_progress" });
    const subtask = makeTask({
      id: "sub-1",
      title: "Sub Task",
      status: "todo",
      parentTaskId: "parent-1",
      parentTaskTitle: "Parent Task",
      subtasks: [],
    });
    render(
      <GroupKanbanBoard {...defaultProps} tasks={[{ ...parent, subtasks: [subtask] }]} />,
    );
    expect(screen.getByText("Sub Task")).toBeInTheDocument();
  });

  it("shows assignee name on task card when provided", () => {
    const tasks = [
      makeTask({ id: "t1", title: "Task", status: "todo", assigneeName: "Alice Johnson" }),
    ];
    render(<GroupKanbanBoard {...defaultProps} tasks={tasks} />);
    expect(screen.getByText("Alice Johnson")).toBeInTheDocument();
  });

  it("shows 'Unassigned' when assigneeName is absent", () => {
    const tasks = [makeTask({ id: "t1", title: "Task", status: "todo", assigneeName: undefined })];
    render(<GroupKanbanBoard {...defaultProps} tasks={tasks} />);
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("renders drag handle button on each task card", () => {
    const tasks = [makeTask({ id: "t1", title: "Draggable Task", status: "todo" })];
    render(<GroupKanbanBoard {...defaultProps} tasks={tasks} />);
    expect(screen.getByLabelText("Drag task")).toBeInTheDocument();
  });
});
