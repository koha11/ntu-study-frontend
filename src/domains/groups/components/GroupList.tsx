/**
 * GroupList Component
 *
 * Renders a list of groups using GroupCard components.
 * Handles loading, error, and empty states.
 *
 * Phase 5 UI Redesign:
 * - Convert to grid layout (responsive columns)
 * - Add filter/sort controls
 * - Add pagination
 */

import type { GroupSummary } from "../types";
import { GroupCard } from "./GroupCard";

interface GroupListProps {
  groups: GroupSummary[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onSelectGroup?: (id: string) => void;
  onEditGroup?: (id: string) => void;
  onDeleteGroup?: (id: string) => void;
}

export function GroupList({
  groups,
  isLoading,
  error,
  onSelectGroup,
  onEditGroup,
  onDeleteGroup,
}: GroupListProps) {
  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading groups...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-destructive">Error loading groups: {error.message}</div>
    );
  }

  if (!groups || groups.length === 0) {
    return <div className="text-center text-muted-foreground">No groups found</div>;
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onSelect={onSelectGroup}
          onEdit={onEditGroup}
          onDelete={onDeleteGroup}
        />
      ))}
    </div>
  );
}
