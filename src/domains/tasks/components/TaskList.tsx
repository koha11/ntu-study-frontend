/**
 * TaskList Component
 *
 * Renders a list of tasks, grouped or filtered by status.
 * Handles loading, error, and empty states.
 *
 * Phase 5 UI Redesign:
 * - Add grouping by status (todo, in-progress, done columns)
 * - Add drag-and-drop for status changes
 * - Add inline editing
 */

import type { Task } from "../types";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: Task[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onSelectTask?: (id: string) => void;
  onToggleTask?: (id: string, status: string) => void;
  onEditTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
}

export function TaskList({
  tasks,
  isLoading,
  error,
  onSelectTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
}: TaskListProps) {
  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading tasks...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive">Error loading tasks: {error.message}</div>;
  }

  if (!tasks || tasks.length === 0) {
    return <div className="text-center text-muted-foreground">No tasks found</div>;
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onSelect={onSelectTask}
          onToggle={onToggleTask}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
        />
      ))}
    </div>
  );
}
