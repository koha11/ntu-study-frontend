/**
 * GroupDetailView Component
 *
 * Displays detailed information about a group.
 */

import type { GroupDetail } from "../types";

interface GroupDetailViewProps {
  group: GroupDetail;
  memberCount?: number;
  isLoading: boolean;
  onEdit?: () => void;
}

export function GroupDetailView({
  group,
  memberCount,
  isLoading,
  onEdit,
}: GroupDetailViewProps) {
  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading group details...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{group.name}</h1>
        {group.description && <p className="mt-2 text-muted-foreground">{group.description}</p>}
      </div>

      <div className="grid gap-4">
        <div>
          <h2 className="font-semibold text-foreground">Status</h2>
          <p className="text-sm text-muted-foreground capitalize">{group.status}</p>
        </div>

        {group.tags && group.tags.length > 0 && (
          <div>
            <h2 className="font-semibold text-foreground">Tags</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {memberCount !== undefined && memberCount > 0 && (
          <div>
            <h2 className="font-semibold text-foreground">Members</h2>
            <p className="text-sm text-muted-foreground">{memberCount} member(s)</p>
          </div>
        )}
      </div>

      {onEdit && (
        <div className="flex gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
