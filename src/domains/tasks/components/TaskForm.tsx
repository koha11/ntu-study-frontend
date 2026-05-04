/**
 * TaskForm Component
 *
 * Form for creating/editing a task.
 * Uses react-hook-form and zod for validation.
 *
 * Phase 5 UI Redesign:
 * - Replace with shadcn/ui Form component
 * - Add rich text editor for description
 * - Add date picker for due date
 * - Add assignee selector
 */

import { useState } from "react";
import type { CreateTaskInput, UpdateTaskInput } from "../types";

function toDateInputValue(iso?: string): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export interface TaskFormMemberOption {
  userId: string;
  label: string;
}

interface TaskFormProps {
  initialData?: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    status?: string;
    assigneeId?: string;
  };
  /** When creating a task in a group context, sets `groupId` on submit */
  defaultGroupId?: string;
  /** Group members for assignee picker (group tasks) */
  memberOptions?: TaskFormMemberOption[];
  /** Default selected assignee (usually current user id) */
  defaultAssigneeId?: string;
  /** Create as subtask of this task (requires `defaultGroupId` for group tasks) */
  parentTaskId?: string;
  parentTaskTitle?: string;
  /** Update existing task (title, description, due date, assignee); omit status here — use board drag */
  isEdit?: boolean;
  isLoading?: boolean;
  onSubmit?: (data: CreateTaskInput) => void;
  onUpdate?: (data: UpdateTaskInput) => void;
  onCancel?: () => void;
}

export function TaskForm({
  initialData,
  defaultGroupId,
  memberOptions,
  defaultAssigneeId,
  parentTaskId,
  parentTaskTitle,
  isEdit = false,
  isLoading = false,
  onSubmit,
  onUpdate,
  onCancel,
}: TaskFormProps) {
  const initialAssignee =
    initialData?.assigneeId?.trim() ||
    defaultAssigneeId ||
    memberOptions?.[0]?.userId ||
    "";
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    dueDate: isEdit
      ? toDateInputValue(initialData?.dueDate)
      : initialData?.dueDate || "",
    status: initialData?.status || "todo",
    assigneeId: initialAssignee,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && onUpdate) {
      onUpdate({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        dueDate: formData.dueDate || "",
        assigneeId:
          defaultGroupId && memberOptions?.length
            ? formData.assigneeId || undefined
            : undefined,
      });
      return;
    }
    if (onSubmit) {
      onSubmit({
        title: formData.title,
        description: formData.description || undefined,
        dueDate: formData.dueDate || undefined,
        groupId: defaultGroupId,
        parentTaskId: parentTaskId || undefined,
        assigneeId:
          defaultGroupId && memberOptions?.length
            ? formData.assigneeId || undefined
            : undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEdit ? (
        <p className="text-xs text-muted-foreground">
          Status is changed from the board (drag columns or submit for review).
        </p>
      ) : null}
      {!isEdit && parentTaskId && parentTaskTitle ? (
        <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Subtask of{" "}
          <span className="font-semibold text-foreground">{parentTaskTitle}</span>
        </p>
      ) : null}
      <div>
        <label className="text-sm font-medium text-foreground">Task Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
          rows={3}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Due Date</label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className="mt-1 w-full rounded-md border border-border px-3 py-2"
        />
      </div>
      {defaultGroupId && memberOptions && memberOptions.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground">Assignee</label>
          <select
            value={formData.assigneeId}
            onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            required
          >
            {memberOptions.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {!defaultGroupId && !isEdit && (
        <div>
          <label className="text-sm font-medium text-foreground">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_review">Pending review</option>
            <option value="done">Done</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {isLoading ? "Saving..." : isEdit ? "Update task" : "Save"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-foreground"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
