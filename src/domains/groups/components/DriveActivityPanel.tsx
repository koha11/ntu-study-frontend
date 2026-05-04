"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchGroupDriveActivity } from "../drive-api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface DriveActivityPanelProps {
  groupId: string;
  accessToken: string;
}

function formatActivityTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/** Short initials for avatar fallback (display name or fallback id). */
function initialsForActor(label: string): string {
  const t = label.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0];
    const b = parts[parts.length - 1][0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  const digits = t.replace(/\D/g, "");
  if (digits.length >= 2) {
    return digits.slice(-2);
  }
  return t.slice(0, 2).toUpperCase();
}

export function DriveActivityPanel({
  groupId,
  accessToken,
}: DriveActivityPanelProps) {
  const query = useInfiniteQuery({
    queryKey: ["drive-activity", groupId],
    queryFn: ({ pageParam }) =>
      fetchGroupDriveActivity(groupId, accessToken, {
        pageToken: pageParam,
        pageSize: 25,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.nextPageToken && last.nextPageToken !== ""
        ? last.nextPageToken
        : undefined,
    enabled: Boolean(groupId && accessToken),
  });

  const rows = React.useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data?.pages],
  );

  return (
    <div
      className="flex min-h-0 flex-col rounded-xl border border-border bg-muted/30 p-4"
      data-testid="drive-activity-panel"
    >
      <h4 className="mb-3 text-sm font-semibold">Recent activity</h4>
      {query.isPending ? (
        <p
          className="text-sm text-muted-foreground"
          data-testid="drive-activity-loading"
        >
          Loading activity…
        </p>
      ) : query.isError ? (
        <p
          className="text-sm text-destructive"
          data-testid="drive-activity-error"
          role="alert"
        >
          Could not load activity.
        </p>
      ) : rows.length === 0 ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="drive-activity-empty"
        >
          No recent activity yet. Changes may take a moment to appear;
          visibility depends on your Google account.
        </p>
      ) : (
        <ul
          className="max-h-[min(420px,50vh)] space-y-3 overflow-y-auto pr-1"
          role="list"
        >
          {rows.map((row, i) => {
            const actorName = row.actorDisplayName ?? row.actorLabel;
            return (
            <li
              key={`${row.occurredAt}-${row.fileName}-${row.action}-${i}`}
              className="border-b border-border/60 pb-3 last:border-0 last:pb-0"
            >
              <p className="text-xs font-medium leading-snug">{row.fileName}</p>
              <div className="mt-1 flex items-start gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage
                    src={row.actorPhotoUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback className="text-[10px] font-medium">
                    {initialsForActor(actorName)}
                  </AvatarFallback>
                </Avatar>
                <p className="min-w-0 flex-1 text-xs text-muted-foreground leading-snug">
                  <span className="font-medium text-foreground">{actorName}</span>
                  {" · "}
                  {row.action}
                  {" · "}
                  <time dateTime={row.occurredAt}>
                    {formatActivityTime(row.occurredAt)}
                  </time>
                </p>
              </div>
            </li>
            );
          })}
        </ul>
      )}
      {query.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
          data-testid="drive-activity-load-more"
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
