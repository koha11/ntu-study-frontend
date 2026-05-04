/**
 * TaskCard Component
 *
 * Displays a task summary card.
 * Shows title, status, due date, assignees.
 *
 * Phase 5 UI Redesign:
 * - Add status badge with visual indicators
 * - Show priority with color coding
 * - Add due date formatting
 */

import type { Task } from "../types";

interface TaskCardProps {
  task: Task;
  onSelect?: (id: string) => void;
  onToggle?: (id: string, status: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TaskCard({ task, onSelect, onToggle, onEdit, onDelete }: TaskCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-2 flex-1">{task.title}</h3>
          <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground whitespace-nowrap">
            {task.status}
          </span>
        </div>

        {task.dueDate && (
          <p className="text-xs text-muted-foreground">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}

        {task.assigneeId ? (
          <p className="text-xs text-muted-foreground">Assignee set</p>
        ) : null}

        <div className="flex gap-2 pt-2 flex-wrap">
          {onToggle && (
            <button
              onClick={() => onToggle(task.id, "done")}
              className="text-xs text-primary hover:underline"
            >
              Mark Done
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(task.id)}
              className="text-xs text-primary hover:underline"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs text-destructive hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
