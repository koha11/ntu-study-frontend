import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/test-utils";
import { TasksPage } from "./TasksPage";
import type { Task } from "@/domains/tasks";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.count !== undefined ? `${key}:${opts.count}` : key,
  }),
}));

vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, params }: { children: React.ReactNode; to: string; params?: Record<string, string> }) => (
    <a href={params ? `${to}/${params.groupId}` : to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/domains/groups", () => ({
  useGroupsList: () => ({ data: [], isLoading: false }),
}));

const mockUpdateTaskStatus = vi.fn();
const mockCreateTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();
const mockSubmitTask = vi.fn();
const mockUseTasksList = vi.fn();

vi.mock("@/domains/tasks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/domains/tasks")>();
  return {
    ...actual,
    useTasksList: (...args: unknown[]) => mockUseTasksList(...args),
    useUpdateTaskStatus: () => ({ mutate: mockUpdateTaskStatus }),
    useCreateTaskMutation: () => ({ mutate: mockCreateTask }),
    useUpdateTaskMutation: () => ({ mutate: mockUpdateTask }),
    useDeleteTaskMutation: () => ({ mutate: mockDeleteTask }),
    useSubmitTaskMutation: () => ({ mutate: mockSubmitTask }),
  };
});

const makeTask = (overrides: Partial<Task>): Task => ({
  id: "task-default",
  title: "Default Task",
  status: "todo",
  createdById: "u1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  subtasks: [],
  ...overrides,
});

const activeTask = makeTask({ id: "task-1", title: "Active Task", status: "todo" });
const doneTask = makeTask({ id: "task-2", title: "Done Task", status: "done" });
const anotherDoneTask = makeTask({ id: "task-3", title: "Another Done Task", status: "done" });

function setupMocks(personalTasks: Task[] = []) {
  mockUseTasksList.mockImplementation((opts?: { assignedInGroups?: boolean }) => {
    if (opts?.assignedInGroups) return { data: [], isLoading: false };
    return { data: personalTasks, isLoading: false };
  });
}

describe("TasksPage – personal tasks done-task hiding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows active personal tasks in the main list", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);

    expect(screen.getByText("Active Task")).toBeInTheDocument();
  });

  it("hides done personal tasks from the main list", () => {
    setupMocks([activeTask, doneTask]);

    render(<TasksPage />);

    expect(screen.queryByText("Done Task")).not.toBeInTheDocument();
  });

  it("does not show the view-completed button when no done tasks exist", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);

    expect(screen.queryByTestId("view-completed-btn")).not.toBeInTheDocument();
  });

  it("shows the view-completed button when done tasks exist", () => {
    setupMocks([activeTask, doneTask]);

    render(<TasksPage />);

    expect(screen.getByTestId("view-completed-btn")).toBeInTheDocument();
  });

  it("view-completed button label includes the done-task count", () => {
    setupMocks([activeTask, doneTask, anotherDoneTask]);

    render(<TasksPage />);

    expect(screen.getByTestId("view-completed-btn")).toHaveTextContent("tasks.viewCompleted:2");
  });

  it("opens the completed-tasks dialog when button is clicked", () => {
    setupMocks([activeTask, doneTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("view-completed-btn"));

    expect(screen.getByTestId("completed-tasks-dialog")).toBeInTheDocument();
  });

  it("completed-tasks dialog shows done task titles", () => {
    setupMocks([activeTask, doneTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("view-completed-btn"));

    expect(screen.getByText("Done Task")).toBeInTheDocument();
  });

  it("calls updateTaskStatus with todo when unchecking a done task in the dialog", () => {
    setupMocks([doneTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("view-completed-btn"));

    const checkbox = screen.getByTestId("completed-task-checkbox-task-2");
    fireEvent.click(checkbox);

    expect(mockUpdateTaskStatus).toHaveBeenCalledWith({ id: "task-2", status: "todo" });
  });

  it("calls deleteTask when delete is clicked for a done task in the dialog", () => {
    setupMocks([doneTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("view-completed-btn"));

    const deleteBtn = screen.getByTestId("completed-task-delete-task-2");
    fireEvent.click(deleteBtn);

    expect(mockDeleteTask).toHaveBeenCalledWith("task-2");
  });
});

describe("TasksPage – subtasks in completed-tasks dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows subtask titles under their parent in the completed-tasks dialog", () => {
    const subtask = makeTask({ id: "sub-1", title: "Sub Task One", status: "done" });
    const doneWithSubs = makeTask({
      id: "task-done-subs",
      title: "Done With Subs",
      status: "done",
      subtasks: [subtask],
    });
    setupMocks([doneWithSubs]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("view-completed-btn"));

    expect(screen.getByTestId("completed-subtask-sub-1")).toBeInTheDocument();
    expect(screen.getByTestId("completed-subtask-sub-1")).toHaveTextContent("Sub Task One");
  });

  it("does not render a checkbox for subtasks in the completed-tasks dialog", () => {
    const subtask = makeTask({ id: "sub-2", title: "Read-only Sub", status: "done" });
    const doneWithSubs = makeTask({
      id: "task-done-s2",
      title: "Done S2",
      status: "done",
      subtasks: [subtask],
    });
    setupMocks([doneWithSubs]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("view-completed-btn"));

    expect(screen.queryByTestId("completed-task-checkbox-sub-2")).not.toBeInTheDocument();
  });

  it("does not render subtasks in the dialog when the done task has no subtasks", () => {
    setupMocks([doneTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("view-completed-btn"));

    expect(screen.queryByTestId(/^completed-subtask-/)).not.toBeInTheDocument();
  });
});

describe("TasksPage – inline title editing for personal tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the task title as a span initially", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);

    expect(screen.getByTestId("task-title-task-1")).toBeInTheDocument();
    expect(screen.queryByTestId("task-title-input-task-1")).not.toBeInTheDocument();
  });

  it("switches to an input when the task title span is clicked", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("task-title-task-1"));

    expect(screen.getByTestId("task-title-input-task-1")).toBeInTheDocument();
    expect(screen.queryByTestId("task-title-task-1")).not.toBeInTheDocument();
  });

  it("input is pre-filled with the current title", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("task-title-task-1"));

    expect(screen.getByTestId("task-title-input-task-1")).toHaveValue("Active Task");
  });

  it("calls patchTask with the new title on Enter", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("task-title-task-1"));

    const input = screen.getByTestId("task-title-input-task-1");
    fireEvent.change(input, { target: { value: "Renamed Task" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: "task-1",
      input: { title: "Renamed Task" },
    });
  });

  it("calls patchTask with the new title on blur", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("task-title-task-1"));

    const input = screen.getByTestId("task-title-input-task-1");
    fireEvent.change(input, { target: { value: "Blurred Title" } });
    fireEvent.blur(input);

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: "task-1",
      input: { title: "Blurred Title" },
    });
  });

  it("does not call patchTask when title is unchanged on blur", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("task-title-task-1"));

    const input = screen.getByTestId("task-title-input-task-1");
    fireEvent.blur(input);

    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it("cancels edit on Escape without calling patchTask", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("task-title-task-1"));

    const input = screen.getByTestId("task-title-input-task-1");
    fireEvent.change(input, { target: { value: "Discard Me" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(mockUpdateTask).not.toHaveBeenCalled();
    expect(screen.getByTestId("task-title-task-1")).toBeInTheDocument();
  });

  it("returns to span view after saving via Enter", () => {
    setupMocks([activeTask]);

    render(<TasksPage />);
    fireEvent.click(screen.getByTestId("task-title-task-1"));

    const input = screen.getByTestId("task-title-input-task-1");
    fireEvent.change(input, { target: { value: "Saved" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.queryByTestId("task-title-input-task-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("task-title-task-1")).toBeInTheDocument();
  });
});

describe("TasksPage – loading state", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("shows loading indicator when personal tasks are loading", () => {
    mockUseTasksList.mockImplementation((opts?: { assignedInGroups?: boolean }) => {
      if (opts?.assignedInGroups) return { data: [], isLoading: false };
      return { data: [], isLoading: true };
    });
    render(<TasksPage />);
    expect(screen.getByText("tasks.loading")).toBeInTheDocument();
  });

  it("shows loading indicator when group tasks are loading", () => {
    mockUseTasksList.mockImplementation((opts?: { assignedInGroups?: boolean }) => {
      if (opts?.assignedInGroups) return { data: [], isLoading: true };
      return { data: [], isLoading: false };
    });
    render(<TasksPage />);
    expect(screen.getByText("tasks.loading")).toBeInTheDocument();
  });
});

describe("TasksPage – add personal task", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks([]);
  });

  it("calls createTask with title on form submit", () => {
    render(<TasksPage />);
    const input = screen.getByPlaceholderText("tasks.addPersonalTask");
    fireEvent.change(input, { target: { value: "New Task" } });
    fireEvent.submit(input.closest("form")!);
    expect(mockCreateTask).toHaveBeenCalledWith({ title: "New Task", dueDate: undefined });
  });

  it("does not call createTask when title is empty", () => {
    render(<TasksPage />);
    const input = screen.getByPlaceholderText("tasks.addPersonalTask");
    fireEvent.submit(input.closest("form")!);
    expect(mockCreateTask).not.toHaveBeenCalled();
  });

  it("shows empty state when no active personal tasks", () => {
    render(<TasksPage />);
    expect(screen.getByText("tasks.noPersonalTasks")).toBeInTheDocument();
  });
});

describe("TasksPage – toggle personal task done", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls updateTaskStatus with done when checking an active task", () => {
    setupMocks([activeTask]);
    render(<TasksPage />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(mockUpdateTaskStatus).toHaveBeenCalledWith({ id: "task-1", status: "done" });
  });
});

describe("TasksPage – add subtask", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls createTask with parentTaskId when subtask is submitted", () => {
    setupMocks([activeTask]);
    render(<TasksPage />);
    const subtaskInput = screen.getByPlaceholderText("tasks.addSubtask");
    fireEvent.change(subtaskInput, { target: { value: "Sub item" } });
    fireEvent.submit(subtaskInput.closest("form")!);
    expect(mockCreateTask).toHaveBeenCalledWith({ title: "Sub item", parentTaskId: "task-1" });
  });

  it("does not call createTask when subtask title is empty", () => {
    setupMocks([activeTask]);
    render(<TasksPage />);
    const subtaskInput = screen.getByPlaceholderText("tasks.addSubtask");
    fireEvent.submit(subtaskInput.closest("form")!);
    expect(mockCreateTask).not.toHaveBeenCalled();
  });
});

describe("TasksPage – group tasks and filters", () => {
  const groupTask = makeTask({
    id: "gt-1",
    title: "Group Task One",
    status: "todo",
    groupId: "g1",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTasksList.mockImplementation((opts?: { assignedInGroups?: boolean }) => {
      if (opts?.assignedInGroups) return { data: [groupTask], isLoading: false };
      return { data: [], isLoading: false };
    });
  });

  it("shows group tasks in the group section", () => {
    render(<TasksPage />);
    expect(screen.getByText("Group Task One")).toBeInTheDocument();
  });

  it("shows empty state text when filter matches no group tasks", () => {
    render(<TasksPage />);
    fireEvent.click(screen.getByText("tasks.filters.done"));
    expect(screen.getByText("tasks.noTasksFilter")).toBeInTheDocument();
  });

  it("filters group tasks by status", () => {
    render(<TasksPage />);
    fireEvent.click(screen.getByText("tasks.filters.todo"));
    expect(screen.getByText("Group Task One")).toBeInTheDocument();
  });

  it("calls updateTaskStatus with in_progress when start working is clicked", () => {
    render(<TasksPage />);
    fireEvent.click(screen.getByText("tasks.startWorking"));
    expect(mockUpdateTaskStatus).toHaveBeenCalledWith({ id: "gt-1", status: "in_progress" });
  });
});

describe("TasksPage – group task submit for review", () => {
  const inProgressTask = makeTask({
    id: "gt-2",
    title: "In Progress Task",
    status: "in_progress",
    groupId: "g1",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTasksList.mockImplementation((opts?: { assignedInGroups?: boolean }) => {
      if (opts?.assignedInGroups) return { data: [inProgressTask], isLoading: false };
      return { data: [], isLoading: false };
    });
  });

  it("calls submitTask when submit for review is clicked", () => {
    render(<TasksPage />);
    fireEvent.click(screen.getByText("tasks.submitForReview"));
    expect(mockSubmitTask).toHaveBeenCalledWith("gt-2");
  });
});

describe("TasksPage – delete personal task", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls removeTask with task id when delete button is clicked", () => {
    setupMocks([activeTask]);
    render(<TasksPage />);
    const deleteBtn = screen.getByRole("button", { name: "tasks.deleteTask" });
    fireEvent.click(deleteBtn);
    expect(mockDeleteTask).toHaveBeenCalledWith("task-1");
  });
});
