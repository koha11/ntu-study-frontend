/**
 * SubtaskItem Component
 *
 * Displays and manages a single subtask.
 * Allows toggling completion status.
 *
 * Phase 5 UI Redesign:
 * - Add checkbox styling with transitions
 * - Add edit/delete inline actions
 * - Improve visual hierarchy
 */

import type { SubTask } from "../types";

interface SubtaskItemProps {
  subtask: SubTask;
  onToggle?: (id: string, done: boolean) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SubtaskItem({ subtask, onToggle, onEdit, onDelete }: SubtaskItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-md p-2 hover:bg-secondary/50">
      <input
        type="checkbox"
        checked={subtask.done}
        onChange={(e) => onToggle?.(subtask.id, e.target.checked)}
        className="rounded border-border"
      />
      <span
        className={`flex-1 text-sm ${
          subtask.done ? "line-through text-muted-foreground" : "text-foreground"
        }`}
      >
        {subtask.title}
      </span>
      <div className="flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(subtask.id)}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(subtask.id)}
            className="text-xs text-destructive hover:underline"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
