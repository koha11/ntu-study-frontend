/**
 * Tasks Domain Types — aligned with backend Task entity / TaskStatus enum.
 */

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "pending_review"
  | "done"
  | "failed";

/** Legacy UI type for mock/local subtasks (not yet mapped to API subtasks) */
export interface SubTask {
  id: string;
  title: string;
  done: boolean;
  status: TaskStatus;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  groupId?: string;
  parentTaskId?: string;
  /** Loaded when API includes `parent_task` (e.g. subtasks) */
  parentTaskTitle?: string;
  assigneeId?: string;
  /** From nested `assignee` on API responses */
  assigneeName?: string;
  assigneeAvatarUrl?: string;
  createdById: string;
  dueDate?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedById?: string;
  subtasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  groupId?: string;
  assigneeId?: string;
  /** When set, creates a subtask of this task (one level only) */
  parentTaskId?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
  assigneeId?: string;
}

export interface ApproveTaskInput {
  status: Extract<TaskStatus, "done" | "failed">;
  comment?: string;
}
