/**
 * GroupCard Component
 *
 * Displays a summary card for a group.
 * Shows name, description, status, member count.
 *
 * Phase 5 UI Redesign:
 * - Add icons for group status badges
 * - Improve visual hierarchy with better spacing
 * - Add hover effects and transitions
 */

import type { GroupSummary } from "../types";

interface GroupCardProps {
  group: GroupSummary;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function GroupCard({ group, onSelect, onEdit, onDelete }: GroupCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-2">{group.name}</h3>
        {group.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
        )}
        <div className="flex gap-2 pt-2">
          {onSelect && (
            <button
              onClick={() => onSelect(group.id)}
              className="text-xs text-primary hover:underline"
            >
              View
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(group.id)}
              className="text-xs text-primary hover:underline"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(group.id)}
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
